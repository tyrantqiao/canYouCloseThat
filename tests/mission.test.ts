import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BrowserMission } from '../src/mission.ts';
import { searchResults, resultsFor } from '../src/search.ts';

test('arbitrary queries get themed clickable pages without revealing the mission answer', () => {
  for (const query of ['你好', '天气', '音乐', '游戏攻略', '课表', '火星上的晚饭', '<img src=x onerror=alert(1)>']) {
    const mission = new BrowserMission();
    assert.equal(mission.search(query), true);
    assert.ok(mission.searchResults.length >= 10);
    assert.ok(!mission.searchResults.some(site => site.kind === 'official'));
    for (const site of mission.searchResults) {
      mission.resultsPage = site.page;
      mission.visitResult(site.id);
      assert.equal(mission.selectedSite?.id, site.id);
      mission.back();
    }
    assert.equal(mission.complete, false);
  }
  assert.ok(resultsFor('你好').some(site => site.title.includes('电暖器')));
  assert.ok(resultsFor('天气').some(site => site.title.includes('晴天')));
});

test('new query resets pagination and old results cannot be opened; blank input preserves search', () => {
  const mission = new BrowserMission(); mission.search('星河浏览器'); mission.resultsPage = 2;
  mission.search('你好'); assert.equal(mission.resultsPage, 1);
  mission.visitResult('official'); assert.equal(mission.page, 'results');
  assert.equal(mission.search('  '), false); assert.equal(mission.query, '你好');
  mission.search('星河游览器'); mission.resultsPage = 2; mission.visitResult('official');
  assert.equal(mission.page, 'official');
});

test('official is only on second page; promotion and games can be browsed without attack', () => {
  assert.ok(searchResults.filter(site => site.page === 1).length >= 8);
  assert.ok(!searchResults.some(site => site.page === 1 && site.kind === 'official'));
  const mission = new BrowserMission(); mission.search('星河浏览器');
  mission.visitResult('official'); assert.equal(mission.page, 'results');
  for (const id of ['download', 'vip', 'game', 'typo', 'paid']) {
    assert.equal(mission.visitResult(id), false);
    assert.equal(mission.tickDanger(10000), 0);
    mission.back(); assert.equal(mission.resultsPage, 1);
  }
  mission.resultsPage = 2; mission.visitResult('official');
  assert.equal(mission.page, 'official');
  mission.back(); assert.equal(mission.resultsPage, 2);
});

test('danger attacks continuously until escape; reset clears all attack state', () => {
  for (const id of ['fish', 'virus']) {
    const mission = new BrowserMission(); mission.search('星河浏览器');
    assert.equal(mission.visitResult(id), true);
    assert.equal(mission.installed, true);
    assert.equal(mission.ads.filter(id => id.startsWith('attack-')).length, 4);
    assert.equal(mission.tickDanger(649), 0); assert.equal(mission.tickDanger(1), 1);
    assert.equal(mission.tickDanger(1300), 2);
    mission.back(); assert.equal(mission.tickDanger(10000), 0);
    assert.ok(!mission.ads.some(id => id.startsWith('attack-')));
    assert.ok(mission.ads.includes('installed'));
    mission.close('installed'); assert.equal(mission.installed, false);
    mission.reset(); assert.equal(mission.dangerActive, false);
    assert.equal(mission.selectedSite, null); assert.equal(mission.resultsPage, 1);
  }
});

test('prize conceals installer, cancellation requires keeping the cancellation', () => {
  const mission = new BrowserMission(); mission.open();
  assert.deepEqual(mission.visibleAds, ['prize']);
  mission.close('toolbar'); assert.ok(mission.ads.includes('toolbar'));
  mission.cancelInstaller(); assert.equal(mission.cancelPending, false);
  mission.close('prize'); assert.deepEqual(mission.visibleAds, ['toolbar']);
  mission.cancelInstaller(); assert.deepEqual(mission.visibleAds, ['cancel-confirm']);
  assert.equal(mission.installed, false);
  mission.resolveCancel(true);
  assert.equal(mission.installed, false);
  assert.ok(!mission.ads.includes('toolbar'));
  assert.deepEqual(mission.visibleAds, []);
});

test('background cross and cancelling cancellation start download without installing', () => {
  const mission = new BrowserMission(); mission.open(); mission.close('prize');
  mission.bundleChecked = false;
  assert.equal(mission.installInBackground(), true);
  assert.equal(mission.installed, false); assert.ok(mission.ads.includes('download'));
  assert.equal(mission.installInBackground(), false);
  mission.reset(); mission.open(); mission.close('prize'); mission.cancelInstaller();
  assert.equal(mission.resolveCancel(false), true);
  assert.equal(mission.installed, false);
  assert.deepEqual(mission.visibleAds, ['download']);
  mission.reset(); assert.equal(mission.cancelPending, false); assert.equal(mission.installed, false);
  assert.equal(mission.bundleChecked, true); assert.deepEqual(mission.visibleAds, []);
});

test('official acceptance succeeds with advertising windows still open', () => {
  const mission = new BrowserMission(); mission.open();
  assert.equal(mission.search('  '), false);
  assert.equal(mission.search('天气'), true);
  assert.equal(mission.search('星河浏览器 官网'), true);
  mission.visit(false); mission.verified = true; mission.ads = [];
  assert.equal(mission.complete, false);
  mission.visit(true); assert.equal(mission.complete, false);
  mission.close('exit'); assert.equal(mission.complete, false);
  mission.ads.push('prize');
  mission.verified = true; assert.equal(mission.complete, true);
  assert.ok(mission.ads.length > 0);
  mission.dangerActive = true; assert.equal(mission.complete, false);
});

test('download opens setup automatically and safe exit installs and downloads nothing', () => {
  const mission = new BrowserMission(); mission.open(); mission.close('prize');
  mission.installInBackground();
  mission.close('download'); assert.ok(mission.ads.includes('download'));
  assert.equal(mission.tickDownload(2399), false);
  assert.equal(mission.tickDownload(1), true);
  assert.deepEqual(mission.visibleAds, ['setup']);
  assert.equal(mission.tickDownload(5000), false);
  mission.close('setup'); assert.ok(mission.ads.includes('setup'));
  mission.plugins.clear(); mission.cancelInstaller();
  assert.deepEqual(mission.visibleAds, ['setup-confirm']);
  assert.equal(mission.resolveCancel(true), false);
  assert.equal(mission.installed, false); assert.equal(mission.pluginsDownloaded, false);
  assert.deepEqual(mission.ads, []);
});

test('cancel with selected plugins downloads them; next without plugins still installs software', () => {
  const mission = new BrowserMission(); mission.open(); mission.close('prize');
  mission.installInBackground(); mission.tickDownload(2400); mission.cancelInstaller();
  assert.equal(mission.resolveCancel(true), true);
  assert.equal(mission.installed, false); assert.equal(mission.pluginsDownloaded, true);
  mission.reset(); mission.open(); mission.close('prize'); mission.installInBackground();
  mission.tickDownload(2400); mission.plugins.clear();
  assert.equal(mission.finishSetup(true), true);
  assert.equal(mission.installed, true); assert.equal(mission.pluginsDownloaded, false);
  mission.reset(); assert.equal(mission.downloadElapsed, 0); assert.equal(mission.plugins.size, 3);
  assert.equal(mission.pluginsDownloaded, false); assert.equal(mission.installed, false);
});

test('navigation cannot silently dismiss registered advertising windows', () => {
  const mission = new BrowserMission(); mission.open(); mission.addTrap();
  mission.search('星河浏览器'); mission.visit(true);
  assert.ok(mission.ads.includes('prize')); assert.ok(mission.ads.includes('bonus-1'));
  assert.ok(mission.ads.includes('exit')); assert.equal(mission.complete, false);
});
test('advertising traps stack, closing one does not close another, retry clears state', () => {
  const mission = new BrowserMission(); mission.open(); mission.addTrap(); mission.addTrap();
  assert.equal(mission.ads.length, 4);
  mission.close('prize'); assert.equal(mission.ads.length, 3);
  mission.reset(); assert.equal(mission.page, 'desktop'); assert.equal(mission.ads.length, 0);
  assert.equal(mission.verified, false); assert.equal(mission.searched, false);
});

test('untouched popup achievement requires acceptance and resets for each attempt', () => {
  const mission = new BrowserMission(); mission.open(); mission.search('星河浏览器');
  mission.resultsPage = 2; mission.visitResult('official');
  assert.equal(mission.achievement, null);
  mission.verified = true;
  assert.equal(mission.complete, true);
  assert.equal(mission.achievement, '万花丛中过，片叶不沾身');
  mission.recordPopupClick();
  assert.equal(mission.complete, true);
  assert.equal(mission.achievement, null);
  mission.reset();
  assert.equal(mission.popupClicks, 0);
  assert.equal(mission.achievement, null);
});