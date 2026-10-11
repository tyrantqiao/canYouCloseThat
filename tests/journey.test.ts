import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/game.ts';
import { BrowserMission } from '../src/mission.ts';
import { ChatMission, DriveMission } from '../src/scenarios.ts';
import { GamingMission } from '../src/gaming.ts';
import { UninstallMission } from '../src/uninstall.ts';

test('all six missions recover from wrong choices and finish their business goals', () => {
  const game = new GameSession();
  const browser = new BrowserMission();
  const chat = new ChatMission();
  const steam = new GamingMission('install');
  const drive = new DriveMission(); drive.launch('real');
  const gaming = new GamingMission('purchase');
  const finish = (complete: boolean) => {
    assert.equal(complete, true);
    game.close('main'); game.tick(800);
    assert.equal(game.status, 'won');
  };
  game.start(); browser.open(); browser.search('星河浏览器');
  browser.visitResult('fish'); game.tick(10000);
  assert.equal(browser.tickDanger(10000), 0); assert.equal(game.patience, 3);
  browser.back(); browser.resultsPage = 2; browser.visitResult('official'); browser.verified = true;
  finish(browser.complete); assert.ok(browser.ads.length > 0);

  game.next(); game.start(); chat.join('fast'); chat.talk(); chat.openShop(); chat.checkout = true;
  chat.pay('probe', ''); assert.equal(chat.complete, false);
  if (chat.pay('film2006', '')) game.trap('假收款页');
  chat.join('real'); chat.answer('银盐'); chat.talk(); chat.openShop(); chat.checkout = true;
  chat.pay('film2006', '4826'); finish(chat.complete);

  game.next(); game.start(); steam.openBrowser(); steam.navigateAddress('xdu.com'); steam.search('Steam'); steam.visit('mirror');
  if (steam.download(false)) game.trap('下载助手');
  steam.back(); steam.search('Steam'); steam.visit('real'); steam.download(false);
  steam.tick(1500); assert.equal(steam.complete, false); steam.openInstaller(); steam.install();
  steam.tick(1500); finish(steam.complete);

  game.next(); game.start(); drive.open('real'); drive.unlock('bad');
  assert.equal(drive.unlocked, false); drive.unlock('xj06'); drive.choose('exe');
  if (drive.download()) game.trap('双扩展名程序');
  drive.choose('pdf'); drive.download(); finish(drive.complete);

  game.next(); game.start(); gaming.search('Steam'); gaming.visit('fake'); gaming.checkout();
  gaming.pay('probe', ''); assert.equal(gaming.purchased, false);
  gaming.back(); gaming.search('Steam'); gaming.visit('real'); gaming.checkout(); gaming.pay('play2026', '6392');
  assert.equal(gaming.complete, false); gaming.findAccelerator(); gaming.search('疾风加速器'); gaming.visit('real');
  gaming.download(false); gaming.tick(1500); gaming.openInstaller();
  if (gaming.install()) game.trap('推荐组件');
  gaming.bundled = false; gaming.install(); gaming.tick(1500); finish(gaming.complete);
  assert.equal(game.next(), true); game.start();
  const uninstall = new UninstallMission();
  const act = (action: string, id = '') => { uninstall.tick(351); const reason = uninstall.act(action,id); if (reason) game.trap(reason); };
  act('tasks'); act('select-process','ad'); act('end'); uninstall.setOption('recover',false); act('ad-continue'); act('system-confirm');
  uninstall.tick(2000); assert.equal(uninstall.ad,true);
  act('select-process','guard'); act('end'); act('guard-continue'); act('system-confirm');
  act('select-process','ad'); act('end'); uninstall.setOption('recover',false); act('ad-continue'); act('system-confirm');
  for (const id of [...uninstall.ads]) act('ad-close',String(id));
  act('programs'); act('uninstall'); uninstall.setOption('repair',false); act('wizard-next'); act('wizard-next');
  uninstall.setOption('keep',false); uninstall.setOption('bundle',false); act('execute'); uninstall.tick(1200);
  uninstall.setOption('bundle',false); act('finish'); act('document'); act('preview'); finish(uninstall.complete);
  assert.equal(game.next(), false);
});

test('paused download and install do not advance; retry discards partial work', () => {
  for (const phase of ['download', 'install']) {
    const game = new GameSession(2); const mission = new GamingMission('install');
    game.start(); mission.openBrowser(); mission.navigateAddress('xdu.com'); mission.search('Steam'); mission.visit('real'); mission.download(false);
    if (phase === 'install') { mission.tick(1500); mission.openInstaller(); mission.install(); }
    mission.tick(500); game.pause();
    // 使用界面帧循环相同的状态门禁。
    const frame = (delta: number) => { game.tick(delta); if (game.status === 'playing') mission.tick(delta); };
    frame(60000); assert.equal(mission.progress, 500); assert.equal(game.elapsed, 0);
    game.resume(); frame(1000);
    assert.equal(phase === 'download' ? mission.packageReady : mission.installed, true);
    game.retry(); mission.reset(); frame(60000);
    assert.equal(mission.complete, false); assert.equal(mission.progress, 0); assert.equal(game.patience, 3);
  }
});
