import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChatMission, DriveMission, renderChat, renderDrive } from '../src/scenarios.ts';
import { GameSession } from '../src/game.ts';
test('correct group requires an answer, conversation, product review and validated payment', () => {
  const m = new ChatMission(); m.query = '胶片摄影'; assert.ok(m.results.length >= 10);
  m.join('real'); assert.equal(m.page, 'question'); m.answer('铜'); assert.equal(m.page, 'question');
  m.answer('银盐'); assert.equal(m.page, 'chat'); m.openShop(); assert.equal(m.page, 'chat');
  m.talk(); m.openShop(); assert.equal(m.page, 'shop');
  m.pay('film2006','4826'); assert.equal(m.complete,false);
  m.checkout = true; m.pay('wrong','4826'); assert.equal(m.complete,false);
  m.pay('film2006','wrong'); assert.equal(m.complete,false);
  m.pay('film2006','4826'); assert.equal(m.complete,true);
});
test('fake group admits immediately and false payment success never completes the task', () => {
  const m = new ChatMission(); m.join('fast'); assert.equal(m.page,'chat');
  m.talk(); m.openShop(); m.checkout = true;
  assert.ok(!renderChat(m).includes('class="captcha"'));
  assert.equal(m.pay('fake-password',''),true); assert.equal(m.testedFake,true);
  assert.equal(m.complete,false); assert.match(m.message,/支付成功/);
  m.join('real'); m.answer('银盐'); m.talk(); m.openShop(); m.checkout=true;
  assert.ok(renderChat(m).includes('class="captcha"'));
  m.pay('film2006','4826'); assert.equal(m.complete,true);
  m.reset(); assert.equal(m.complete,false); assert.equal(m.testedFake,false); assert.equal(m.joined.size,0);
});
test('lookalike group also has approval and same name, so approval alone is insufficient', () => {
  const m = new ChatMission(); m.join('copy'); assert.equal(m.page,'question');
  m.answer('银盐'); m.talk(); m.openShop(); m.checkout=true; m.pay('film2006','');
  assert.equal(m.complete,false); assert.match(renderChat(m), /film-c1ub/);
});
test('drive requires right share, extraction, file type and ordinary download', () => {
  const m = new DriveMission(); m.download(); assert.equal(m.complete,false);
  m.open('real'); m.choose('pdf'); assert.equal(m.page,'share');
  m.unlock('bad'); assert.equal(m.page,'share'); m.unlock('xj06');
  m.choose('exe'); assert.equal(m.download(),true); assert.equal(m.complete,false);
  m.choose('zip'); assert.equal(m.download(),true);
  m.choose('pdf'); assert.equal(m.download(),false); assert.equal(m.complete,true);
  m.reset(); assert.equal(m.unlocked,false); assert.equal(m.complete,false);
  m.open('fake'); m.unlock('xj06'); m.choose('pdf'); assert.equal(m.download(),true); assert.equal(m.complete,false);
});
test('scenario render escapes searches, and fourth level is untimed with one mission target', () => {
  const chat = new ChatMission(); chat.query='"><script>alert(1)</script>'; assert.ok(!renderChat(chat).includes('<script>'));
  const drive = new DriveMission(); drive.query='<script>'; assert.ok(!renderDrive(drive).includes('<script>'));
  const game = new GameSession(3); game.start(); game.tick(90000); assert.equal(game.status,'playing');
  assert.equal(game.remaining,1); game.close('main'); game.tick(800); assert.equal(game.status,'won');
});
