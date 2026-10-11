import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GamingMission, renderGaming, renderGamingAddress } from '../src/gaming.ts';
import { levels, parseSave } from '../src/game.ts';
test('third level starts on desktop and requires browser then X degree before searching', () => {
  const m = new GamingMission('install');
  assert.equal(m.page, 'desktop');
  assert.match(renderGaming(m), /data-action="gaming-open-browser"/);
  assert.ok(!renderGaming(m).includes('data-task="gaming-search"'));
  m.navigateAddress('xdu.com'); m.search('Steam'); m.visit('real');
  assert.equal(m.page, 'desktop'); assert.equal(m.query, '');
  m.openBrowser(); assert.equal(m.page, 'browser');
  assert.match(renderGaming(m), /aria-label="空白网页"/);
  assert.equal(m.address, 'about:blank');
  assert.ok(!renderGaming(m).includes('gaming-open-search'));
  assert.match(renderGamingAddress(m), /浏览器地址栏/);
  m.search('Steam'); assert.equal(m.page, 'browser');
  m.back(); assert.equal(m.page, 'browser');
  m.closeBrowser(); assert.equal(m.page, 'desktop');
  m.openBrowser(); m.navigateAddress('xdu.com'); assert.equal(m.page, 'search');
  assert.match(renderGaming(m), /X 度一下/);
  m.search('Steam'); m.visit('real'); assert.equal(m.page, 'site');
  m.back(); assert.equal(m.page, 'search'); assert.equal(m.query, 'Steam');
  m.reset(); assert.equal(m.page, 'desktop'); assert.equal(m.query, '');
  assert.equal(new GamingMission('purchase').page, 'search');
});
function ready(m: GamingMission) {
  m.search(m.target === 'steam' ? 'Steam' : '疾风加速器'); m.visit('real');
  assert.equal(m.download(false),false); m.tick(1500); m.openInstaller();
}

test('address entry checks hostnames and browser history restores searches without inventing results', () => {
  const m = new GamingMission('install'); m.openBrowser();
  m.navigateAddress('xdu.com.evil.example'); assert.equal(m.page, 'error');
  assert.equal(m.complete, false);
  m.navigateAddress(' HTTPS://WWW.XDU.COM/ '); assert.equal(m.page, 'search');
  assert.equal(m.query, ''); assert.ok(!renderGaming(m).includes('没有找到相关网页'));
  m.search('Steam'); m.visit('real');
  assert.equal(m.address, 'https://store.steampowered.com/about');
  m.back(); assert.equal(m.page, 'search'); assert.equal(m.query, 'Steam');
  m.forward(); assert.equal(m.page, 'site'); assert.equal(m.selected, 'real');
  m.back(); m.search('天气'); assert.equal(m.canForward, false);
  m.back(); assert.equal(m.query, 'Steam');
  m.back(); assert.equal(m.query, '');
  m.back(); assert.equal(m.page, 'error');
  m.back(); assert.equal(m.address, 'about:blank'); assert.equal(m.canBack, false);
  m.navigateAddress('javascript:alert(1)'); assert.equal(m.page, 'error');
  m.address = '\"><script>'; assert.ok(!renderGamingAddress(m).includes('<script>'));
  m.navigateAddress('https://xdu.com/s?wd=Steam');
  assert.equal(m.page, 'search'); assert.equal(m.query, 'Steam');
  m.navigateAddress('https://store.steampowered.com/about');
  assert.equal(m.page, 'site'); assert.equal(m.selected, 'real');
  m.reset(); assert.equal(m.canBack, false); assert.equal(m.canForward, false);
});

test('cancel installer keeps downloaded package available for reopening', () => {
  const m = new GamingMission('install'); m.openBrowser(); m.navigateAddress('xdu.com'); ready(m);
  m.install(); m.tick(500); m.back();
  assert.equal(m.page, 'download'); assert.equal(m.running, null); assert.equal(m.packageReady, true);
  assert.equal(m.complete, false); m.back(); assert.equal(m.page, 'site');
  assert.equal(m.packageReady, true); m.openInstaller(); m.install(); m.tick(1500);
  assert.equal(m.complete, true);
});
test('Steam needs real installer and installation completion, download alone cannot win', () => {
  const m = new GamingMission('install'); m.openBrowser(); m.navigateAddress('xdu.com'); m.search('Steam'); m.visit('fake');
  assert.equal(m.download(false),true); assert.equal(m.running,null); assert.equal(m.complete,false);
  m.back(); m.search('Steam'); m.visit('real'); assert.equal(m.download(true),true);
  m.download(false); m.openInstaller(); assert.equal(m.page,'download');
  m.tick(1499); assert.equal(m.packageReady,false); m.tick(1); assert.equal(m.complete,false);
  m.openInstaller(); assert.equal(m.install(),false); m.install(); m.tick(1499); assert.equal(m.complete,false);
  m.tick(1); assert.equal(m.complete,true); m.reset(); assert.equal(m.installed,false);
});
test('search accepts game motivation and filters unrelated queries safely', () => {
  const m = new GamingMission('install'); m.openBrowser(); m.navigateAddress('xdu.com'); m.search('白神话悟空怎么下载'); assert.ok(m.results.some(r=>r.id==='real'));
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
  const m = new GamingMission('install'); m.openBrowser(); m.navigateAddress('xdu.com'); m.search('Steam'); m.visit('real'); m.download(false); m.tick(600);
  m.back(); m.tick(5000); assert.equal(m.packageReady,false); assert.equal(m.complete,false);
  ready(m); m.install(); m.tick(600); m.reset(); m.tick(5000); assert.equal(m.complete,false); assert.equal(m.progress,0);
});
test('six levels and fifth completion survives save reload', () => {
  assert.equal(levels.length,6);
  const save = parseSave(JSON.stringify({version:1,best:{30:2000},completed:[30],reducedMotion:false}));
  assert.equal(save.best[30],2000); assert.deepEqual(save.completed,[30]);
});

test('both gaming missions retain packages on cancellation and install their recorded source', () => {
  const m = new GamingMission('purchase');
  m.search('Steam'); m.visit('real'); m.checkout(); m.pay('play2026', '6392'); m.findAccelerator();
  ready(m); m.bundled = false; m.install(); m.tick(500); m.back();
  assert.equal(m.page, 'download'); assert.equal(m.packageReady, true); assert.equal(m.accelerated, false);
  m.back(); assert.match(renderGaming(m), /打开已下载的 JifengSetup.exe/);
  m.back(); m.search('疾风'); m.visit('fake');
  assert.equal(m.domain, 'jlfeng.example');
  m.query = '天气'; assert.equal(m.domain, 'jlfeng.example');
  m.openInstaller(); assert.match(renderGaming(m), /来源：jifeng.example/);
  m.bundled = false; m.install(); m.tick(1500); assert.equal(m.complete, true);
  m.reset(); assert.equal(m.packageTarget, null); assert.equal(m.packageReady, false);
  m.search('Steam'); assert.match(renderGaming(m), /search-result/);
  assert.ok(!renderGaming(m).includes('>打开网页</button>'));
});
