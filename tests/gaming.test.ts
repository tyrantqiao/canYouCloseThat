import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GamingMission, renderGaming } from '../src/gaming.ts';
import { levels, parseSave } from '../src/game.ts';
function ready(m: GamingMission) {
  m.search(m.target === 'steam' ? 'Steam' : '疾风加速器'); m.visit('real');
  assert.equal(m.download(false),false); m.tick(1500); m.openInstaller();
}
test('Steam needs real installer and installation completion, download alone cannot win', () => {
  const m = new GamingMission('install'); m.search('Steam'); m.visit('fake');
  assert.equal(m.download(false),true); assert.equal(m.running,null); assert.equal(m.complete,false);
  m.back(); m.search('Steam'); m.visit('real'); assert.equal(m.download(true),true);
  m.download(false); m.openInstaller(); assert.equal(m.page,'download');
  m.tick(1499); assert.equal(m.packageReady,false); m.tick(1); assert.equal(m.complete,false);
  m.openInstaller(); assert.equal(m.install(),false); m.install(); m.tick(1499); assert.equal(m.complete,false);
  m.tick(1); assert.equal(m.complete,true); m.reset(); assert.equal(m.installed,false);
});
test('search accepts game motivation and filters unrelated queries safely', () => {
  const m = new GamingMission('install'); m.search('白神话悟空怎么下载'); assert.ok(m.results.some(r=>r.id==='real'));
  m.search('天气'); assert.equal(m.results.length,0); m.visit('real'); assert.equal(m.page,'search');
  m.query='<script>'; assert.ok(!renderGaming(m).includes('<script>'));
});
test('payment validates credentials and false success never purchases a game', () => {
  const m = new GamingMission('purchase'); assert.equal(m.installed,true); assert.equal(m.complete,false);
  m.search('steam'); m.visit('fake'); m.checkout(); assert.ok(!renderGaming(m).includes('class="captcha"'));
  assert.equal(m.pay('fake-password',''),false); assert.equal(m.testedFake,true); assert.match(m.message,/付款成功/); assert.equal(m.purchased,false);
  assert.equal(m.pay('play2026',''),true);
  m.back(); m.search('steam'); m.visit('real'); m.checkout();
  assert.ok(renderGaming(m).includes('class="captcha"'));
  m.pay('wrong','6392'); assert.equal(m.purchased,false); m.pay('play2026','wrong'); assert.equal(m.purchased,false);
  m.pay('play2026','6392'); assert.equal(m.purchased,true); assert.equal(m.complete,false);
});
test('accelerator is gated by purchase and bundled components can be corrected', () => {
  const m = new GamingMission('purchase'); m.findAccelerator(); assert.equal(m.target,'steam');
  m.search('steam'); m.visit('real'); m.checkout(); m.pay('play2026','6392'); m.findAccelerator();
  assert.equal(m.target,'accelerator'); ready(m); assert.equal(m.bundled,true);
  assert.equal(m.install(),true); assert.equal(m.running,null); assert.equal(m.complete,false);
  m.bundled=false; assert.equal(m.install(),false); m.tick(1500); assert.equal(m.complete,true);
  m.reset(); assert.equal(m.purchased,false); assert.equal(m.accelerated,false); assert.equal(m.installed,true);
});
test('cancel interrupts pending work; retries discard installer progress', () => {
  const m = new GamingMission('install'); m.search('Steam'); m.visit('real'); m.download(false); m.tick(600);
  m.back(); m.tick(5000); assert.equal(m.packageReady,false); assert.equal(m.complete,false);
  ready(m); m.install(); m.tick(600); m.reset(); m.tick(5000); assert.equal(m.complete,false); assert.equal(m.progress,0);
});
test('five levels and fifth completion survives save reload', () => {
  assert.equal(levels.length,5);
  const save = parseSave(JSON.stringify({version:1,best:{30:2000},completed:[30],reducedMotion:false}));
  assert.equal(save.best[30],2000); assert.deepEqual(save.completed,[30]);
});
