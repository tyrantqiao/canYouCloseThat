import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UninstallMission, renderUninstall } from '../src/uninstall.ts';
import { GameSession, levels, parseSave } from '../src/game.ts';

function click(m: UninstallMission, action: string, id = '') { m.tick(351); return m.act(action, id); }
function stop(m: UninstallMission, id: 'guard' | 'ad', recover = false) {
  click(m,'tasks'); click(m,'select-process',id); click(m,'end');
  if (id === 'ad') m.setOption('recover',recover);
  click(m,id === 'guard' ? 'guard-continue' : 'ad-continue'); return click(m,'system-confirm');
}
function remove(m: UninstallMission, id: string, keep = false, bundle = false) {
  click(m,'programs'); click(m,'select-program',id); click(m,'uninstall');
  if (id === 'main') { m.setOption('repair',false); click(m,'wizard-next'); click(m,'wizard-next'); m.setOption('keep',keep); }
  m.setOption('bundle',bundle); m.setOption('full',true); m.setOption('noReminder',true);
  const reason = click(m,'execute'); m.tick(1200); return reason;
}
function closeAds(m: UninstallMission) { for (const id of [...m.ads]) click(m,'ad-close',String(id)); }

test('sixth level, save migration and zero-mistake business route', () => {
  assert.equal(levels.length,6);
  assert.deepEqual(parseSave(JSON.stringify({version:1,completed:[40,30,999],best:{40:1200,999:1}})).completed,[40,30]);
  const m = new UninstallMission(); closeAds(m); stop(m,'guard'); stop(m,'ad'); closeAds(m);
  assert.equal(m.program('main')!.installed,true); assert.equal(m.clean,false);
  assert.equal(remove(m,'main'),null); m.setOption('bundle',false); click(m,'finish');
  assert.equal(m.clean,true); assert.equal(m.complete,false);
  click(m,'document'); click(m,'preview'); assert.equal(m.complete,true); assert.equal(m.achievement,'卸得干干净净');
});

test('wrong order restarts the ad via guard without a mistake; explicit recovery can be stopped', () => {
  const m = new UninstallMission(); stop(m,'ad'); assert.equal(m.ad,false); m.tick(2000);
  assert.equal(m.ad,true); assert.match(m.restored,/守护/); assert.equal(m.mistakes,0);
  stop(m,'guard'); assert.match(stop(m,'ad',true)!,/自动恢复/); m.tick(2000); assert.equal(m.ad,true);
  stop(m,'ad'); m.tick(2000); assert.equal(m.ad,false); assert.equal(m.mistakes,1);
});

test('modal gate prevents click-through, background actions and safe escape never commit', () => {
  const m = new UninstallMission(); click(m,'tasks'); click(m,'end');
  m.act('guard-continue'); assert.equal(m.dialog,'guard');
  click(m,'ad-quiet','1'); assert.equal(m.jobs.length,0);
  click(m,'dismiss'); assert.equal(m.dialog,null); assert.equal(m.guard,true); assert.equal(m.mistakes,0);
  m.act('end'); assert.equal(m.dialog,null);
  click(m,'end'); click(m,'guard-continue'); m.act('system-confirm'); assert.equal(m.guard,true);
  click(m,'system-confirm'); assert.equal(m.guard,false);
});

test('ad replenishment is bounded and stops with its source', () => {
  const m = new UninstallMission(); closeAds(m); m.tick(10000); assert.ok(m.ads.length <= 2);
  m.tick(100000); assert.equal(m.ads.length,2); stop(m,'guard'); stop(m,'ad'); closeAds(m);
  m.tick(100000); assert.equal(m.ads.length,0);
  const n = new UninstallMission(); click(n,'ad-close','1'); assert.match(renderUninstall(n),/不再接收此类推荐/);
});

test('downloads cancel, complete packages persist after cancel install and duplicate jobs do not penalize twice', () => {
  const m = new UninstallMission(); assert.match(click(m,'ad-quiet','1')!,/清静版/);
  assert.equal(click(m,'ad-apply','2'),null); assert.equal(m.jobs.length,1); assert.equal(m.mistakes,1);
  click(m,'cancel-job','quiet'); assert.equal(m.jobs.length,0); assert.equal(m.program('quiet')!.installed,false);
  m.reset(); click(m,'ad-quiet','1'); m.tick(2000); click(m,'cancel-install','quiet');
  assert.equal(m.jobs[0].phase,'package'); m.tick(60000); assert.equal(m.program('quiet')!.installed,false);
  click(m,'install-package','quiet'); m.tick(2000); assert.equal(m.program('quiet')!.installed,true);
  assert.equal(m.jobs.length,0); assert.equal(m.mistakes,1);
});

test('uninstall blocked by live process, repair is explicit, retained component prevents fake completion', () => {
  const m = new UninstallMission(); click(m,'programs'); click(m,'uninstall'); m.setOption('repair',false);
  click(m,'wizard-next'); click(m,'wizard-next'); click(m,'execute'); assert.equal(m.removing,null); assert.match(m.message,/占用/);
  m.reset(); click(m,'programs'); click(m,'uninstall'); click(m,'wizard-next'); click(m,'dismiss'); assert.equal(m.mistakes,0);
  click(m,'wizard-next'); click(m,'repair-confirm'); assert.equal(m.mistakes,1);
  m.reset(); stop(m,'guard'); stop(m,'ad'); assert.match(remove(m,'main',true)!,/保留/);
  m.setOption('bundle',false); click(m,'finish'); assert.equal(m.program('main')!.installed,false);
  assert.equal(m.program('message')!.installed,true); assert.equal(m.ad,true); assert.equal(m.clean,false);
  stop(m,'ad'); remove(m,'message'); closeAds(m); assert.equal(m.clean,true);
});

test('extra uninstall chain ends at calendar; reminder and shortcut removal do not complete uninstall', () => {
  const m = new UninstallMission(); click(m,'ad-quiet','1'); m.tick(2000); m.tick(2000);
  assert.match(remove(m,'quiet',false,true)!,/日历/); m.tick(2000); m.tick(2000);
  assert.equal(m.program('calendar')!.installed,true);
  click(m,'programs'); click(m,'select-program','calendar'); click(m,'uninstall'); click(m,'execute'); m.tick(1200);
  assert.equal(m.program('calendar')!.residual,true); assert.equal(m.mistakes,2);
  remove(m,'calendar'); assert.equal(m.program('calendar')!.installed,false); assert.equal(m.jobs.length,0);
  m.program('search')!.installed = true; click(m,'programs'); click(m,'select-program','search'); click(m,'uninstall'); click(m,'execute');
  assert.equal(m.program('search')!.installed,true); assert.equal(m.mistakes,2); remove(m,'search'); assert.equal(m.program('search')!.installed,false);
});

test('result recommendation installs independently; switching targets resets defaults', () => {
  const m = new UninstallMission(); stop(m,'guard'); stop(m,'ad'); remove(m,'main'); click(m,'finish');
  assert.equal(m.jobs[0].id,'search'); assert.equal(m.mistakes,1); m.tick(2000); m.tick(2000);
  remove(m,'search'); closeAds(m); assert.equal(m.clean,true);
  m.program('quiet')!.installed = true; click(m,'programs'); click(m,'select-program','quiet'); click(m,'uninstall');
  assert.equal(m.wizard!.bundle,true); m.setOption('bundle',false); click(m,'desktop'); click(m,'programs'); click(m,'uninstall'); assert.equal(m.wizard!.bundle,false);
});

test('real frame contract freezes all mission events when paused/lost and reset clears recoverable states', () => {
  const game = new GameSession(5); const m = new UninstallMission(); game.start(); click(m,'ad-quiet','1');
  const frame = (delta: number) => { game.tick(delta); if (game.status === 'playing') m.tick(delta); };
  frame(500); game.pause(); frame(60000); assert.equal(m.jobs[0].elapsed,500);
  game.resume(); frame(1500); assert.equal(m.jobs[0].phase,'install');
  game.trap('a'); game.trap('b'); game.trap('c'); frame(60000); assert.equal(m.program('quiet')!.installed,false);
  game.retry(); m.reset(); assert.equal(m.jobs.length,0); assert.equal(m.ads.length,2); assert.equal(m.guard,true); assert.equal(m.ad,true);
  assert.equal(m.dialog,null); assert.equal(m.wizard,null); assert.equal(m.program('main')!.installed,true);
});
