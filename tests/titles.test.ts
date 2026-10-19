import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/game.ts';
import { BrowserMission } from '../src/mission.ts';
import { ChatMission, DriveMission } from '../src/scenarios.ts';
import { GamingMission } from '../src/gaming.ts';
import { UninstallMission } from '../src/uninstall.ts';
import { TitleTrail, titleDesigns } from '../src/titles.ts';
import { createResultCard, createRunCard, renderResultCard } from '../src/share-card.ts';
import { RunRecord } from '../src/run-record.ts';

function setup(index: number) {
  const game = new GameSession(index); game.start();
  const missions = { browser: new BrowserMission(), chat: new ChatMission(), drive: new DriveMission(), steam: new GamingMission('install'), gaming: new GamingMission('purchase'), uninstall: new UninstallMission() };
  const trail = new TitleTrail(); trail.start(game);
  const observe = () => { trail.observe(game, missions); return trail.snapshot(game); };
  return { game, missions, trail, observe };
}

test('all six title chains observe real business routes and never complete a mission themselves', () => {
  for (let i = 0; i < 6; i++) {
    const { game, missions: m, trail, observe } = setup(i);
    const initial = observe(); assert.equal(initial.steps.length, 0);
    const done = () => { observe(); game.close('main'); game.tick(800); };
    if (i === 0) {
      m.browser.open(); observe(); m.browser.search('星河浏览器'); observe();
      m.browser.resultsPage = 2; observe(); m.browser.visitResult('official'); observe(); m.browser.verified = true; done();
    } else if (i === 1) {
      const c = m.chat; c.query = '胶片摄影'; observe(); c.join('real'); c.answer('银盐'); observe();
      c.talk(); observe(); c.openShop(); observe(); c.checkout = true; c.pay('film2006', '4826'); done();
    } else if (i === 2) {
      const s = m.steam; s.openBrowser(); observe(); s.navigateAddress('xdu.com'); observe(); s.search('Steam'); s.visit('real'); observe();
      s.download(false); s.tick(1500); observe(); s.openInstaller(); observe(); s.install(); s.tick(1500); done();
    } else if (i === 3) {
      const d = m.drive; d.launch('real'); observe(); d.open('real'); observe(); d.unlock('xj06'); observe();
      d.preview('pdf'); observe(); d.closePreview(); d.choose('pdf'); observe(); d.download(); done();
    } else if (i === 4) {
      const g = m.gaming; g.search('Steam'); g.visit('real'); g.checkout(); g.pay('play2026', '6392'); observe();
      g.openLibrary(); observe(); g.findAccelerator(); g.search('疾风'); g.visit('real'); g.download(false); g.tick(1500);
      g.openInstaller(); g.bundled = false; g.install(); g.tick(1500); observe();
      g.selectRoute('east'); g.testRoute(); g.tick(1500); observe(); g.joinVoice(); done();
    } else {
      const u = m.uninstall;
      const act = (action: string, id = '') => { u.tick(351); u.act(action, id); observe(); };
      for (const id of ['guard', 'ad']) {
        act('tasks'); act('select-process', id); act('end'); if (id === 'ad') u.setOption('recover', false);
        act(id === 'guard' ? 'guard-continue' : 'ad-continue'); act('system-confirm');
      }
      for (const id of [...u.ads]) act('ad-close', String(id));
      act('programs'); act('uninstall'); u.setOption('repair', false); act('wizard-next'); act('wizard-next');
      u.setOption('keep', false); u.setOption('bundle', false); act('execute'); u.tick(1200); observe();
      u.setOption('bundle', false); act('finish'); act('document'); act('preview'); done();
    }
    const title = observe();
    assert.equal(game.status, 'won'); assert.equal(title.steps.length, titleDesigns[game.level.id].stages.length);
    assert.match(title.story, /^你是一个.+的人。$/);
    assert.match(title.progress, /本关零误点/);
    const card = createResultCard(game, true, '', trail.snapshot(game));
    assert.equal(card.headline, title.headline); assert.ok(renderResultCard(card).includes(title.steps[0].title));
    assert.equal(initial.steps.length, 0, 'previous snapshots remain frozen');
  }
});

test('failure retains the last reached stage, navigation preserves history, retry clears it and pause cannot add steps', () => {
  const { game, missions: { steam }, trail, observe } = setup(2);
  steam.openBrowser(); observe(); steam.navigateAddress('xdu.com'); observe(); steam.search('Steam'); steam.visit('real'); observe();
  steam.back(); observe(); steam.closeBrowser();
  assert.equal(observe().headline, '正版入口守门员');
  game.pause(); steam.openBrowser(); steam.navigateAddress('xdu.com');
  steam.search('Steam'); steam.visit('real'); steam.download(false); steam.tick(1500);
  const frozen = observe(); assert.equal(frozen.steps.length, 3);
  game.resume(); for (let i = 0; i < 3; i++) game.trap('下载助手');
  assert.equal(observe().headline, '安装包验货员'); assert.match(observe().progress, /任务未完成/);
  const card = createResultCard(game, false, '不应发放', trail.snapshot(game));
  assert.equal(card.achievement, ''); assert.equal(card.won, false);
  game.retry(false); steam.reset(); trail.retry();
  assert.equal(observe().steps.length, 0); assert.equal(observe().headline, titleDesigns[4].start[0]);
  assert.equal(frozen.steps.length, 3);
});

test('fake shares and false payment success cannot earn real business step titles', () => {
  const a = setup(3); const d = a.missions.drive;
  d.launch('real'); d.open('fake'); d.unlock('xj06'); d.preview('pdf'); d.choose('pdf'); d.download();
  assert.deepEqual(a.observe().steps.map(s => s.id), ['app']);
  const b = setup(1); const c = b.missions.chat;
  c.join('fast'); c.talk(); c.openShop(); c.checkout = true; c.pay('probe', '');
  assert.equal(b.observe().steps.length, 0); assert.equal(c.complete, false);
  c.join('real'); c.answer('银盐'); c.talk(); c.openShop(); c.checkout = true; c.pay('film2006', '4826'); b.observe();
  assert.equal(b.trail.snapshot(b.game, true).headline, '假付款页面测谎仪');
});

test('per-level zero-mistake titles ignore previous levels but retain mistakes across retries', () => {
  const { game, trail, observe } = setup(2);
  game.mistakes = 7; trail.start(game);
  assert.equal(trail.snapshot(game, true).headline, titleDesigns[4].clean[0]);
  game.trap('下载助手');
  game.retry(); trail.retry(); observe();
  assert.equal(trail.snapshot(game, true).headline, titleDesigns[4].recovered[0]);
  game.hint(); assert.equal(trail.snapshot(game, true).headline, titleDesigns[4].recovered[0]);
  assert.equal(createResultCard(game, true, '', trail.snapshot(game, true)).mode, '使用辅助');
});

test('optional preview is remembered after close and never becomes a completion requirement', () => {
  for (const preview of [false, true]) {
    const { game, missions: { drive }, trail, observe } = setup(3);
    drive.launch('real'); drive.open('real'); drive.unlock('xj06');
    if (preview) { drive.preview('pdf'); observe(); drive.closePreview(); }
    drive.choose('pdf'); drive.download(); observe();
    assert.equal(drive.complete, true);
    assert.equal(trail.snapshot(game, true).headline, preview ? '先验货再收货大师' : '文件后缀显微镜');
  }
});

test('run completion counts and per-level titles survive aggregation without claiming six wins early', () => {
  const run = new RunRecord(); run.start(0);
  for (let i = 0; i < 6; i++) {
    const game = new GameSession(i); game.start(); game.close('main'); game.tick(800);
    run.record(game, titleDesigns[game.level.id].clean[0]);
    const card = createRunCard(run.summary!);
    assert.equal(card.entries!.length, i + 1);
    assert.ok(renderResultCard(card).includes(titleDesigns[game.level.id].clean[0]));
    if (i < 5) assert.ok(!card.headline.includes('免疫体'));
  }
  assert.equal(createRunCard(run.summary!).headline, '互联网套路免疫体');
});
