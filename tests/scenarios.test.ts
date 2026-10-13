import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChatMission, DriveMission, renderChat, renderDrive } from '../src/scenarios.ts';
import { GameSession } from '../src/game.ts';
test('group search puts paid lookalikes first, the real group last, and respects exact numbers', () => {
  const m = new ChatMission(); m.open(); m.contacts = false;
  for (const query of ['胶片', '胶片摄影', '胶片摄影交流社']) {
    m.query = query;
    assert.equal(m.results.at(-1)?.id, 'real');
    assert.equal(m.results[0].promoted, true);
    const firstNatural = m.results.findIndex(group => !group.promoted);
    assert.ok(m.results.slice(firstNatural).every(group => !group.promoted));
    const html = renderChat(m);
    assert.match(html, /class="group-promotion" aria-label="推广">推<\/span>/);
    assert.ok(!html.includes('竞价排名'));
    assert.ok(!html.includes('group-search-note'));
    assert.ok(html.indexOf('data-id="copy"') < html.indexOf('data-id="real"'));
  }
  m.query = '73021680'; assert.deepEqual(m.results.map(group => group.id), ['real']);
  m.query = '没有这个群'; assert.deepEqual(m.results, []);
  m.query = ''; assert.deepEqual(m.results, []);
  assert.equal(m.complete, false);
});
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
  const m = new DriveMission(); m.launch('real'); m.download(); assert.equal(m.complete,false);
  m.open('real'); m.choose('pdf'); assert.equal(m.page,'share');
  m.unlock('bad'); assert.equal(m.page,'share'); m.unlock('xj06');
  m.choose('exe'); assert.equal(m.download(),true); assert.equal(m.complete,false);
  m.choose('zip'); assert.equal(m.download(),true);
  m.choose('pdf'); assert.equal(m.download(),false); assert.equal(m.complete,true);
  m.reset(); assert.equal(m.unlocked,false); assert.equal(m.complete,false);
  m.launch('real'); m.file = 'exe'; m.open('fake'); assert.equal(m.file, ''); m.unlock('xj06'); m.choose('pdf'); assert.equal(m.download(),true); assert.equal(m.complete,false);
});
test('scenario render escapes searches, and fourth level is untimed with one mission target', () => {
  const chat = new ChatMission(); chat.query='"><script>alert(1)</script>'; assert.ok(!renderChat(chat).includes('<script>'));
  const drive = new DriveMission(); drive.launch('real'); drive.query='<script>'; assert.ok(!renderDrive(drive).includes('<script>'));
  const game = new GameSession(3); game.start(); game.tick(90000); assert.equal(game.status,'playing');
  assert.equal(game.remaining,1); game.close('main'); game.tick(800); assert.equal(game.status,'won');
});

test('bear desktop launches contacts and preserves group state across minimization', () => {
  const m = new ChatMission();
  assert.match(renderChat(m),/bear-taskbar/); assert.ok(!renderChat(m).includes('bear-contact-list'));
  m.open(); assert.match(renderChat(m),/bear-contact-list/);
  m.join('real'); m.answer('银盐'); m.talk(); m.minimized = true;
  assert.ok(!renderChat(m).includes('bear-window-body'));
  m.open(); assert.equal(m.page,'chat'); assert.equal(m.chatting,true); assert.ok(m.joined.has('real'));
  m.reset(); assert.equal(m.opened,false); assert.equal(m.friendChat,false); assert.equal(m.unread,true);
});

test('conversation transcripts belong to their recipient and closing differs from minimizing', () => {
  const m = new ChatMission(); m.open(); m.showFriend('lin'); m.sentMessages.push('给林林');
  m.showFriend('star'); assert.deepEqual(m.sentMessages, []); assert.match(renderChat(m), /离线 · 可以留言/);
  m.sentMessages.push('离线留言'); m.showFriend('lin'); assert.deepEqual(m.sentMessages, ['给林林']);
  m.join('real'); m.answer('银盐'); m.sentMessages.push('大家好'); m.talk();
  assert.deepEqual(m.sentMessages, []); m.sentMessages.push('买一卷');
  m.join('copy'); m.answer('银盐'); assert.deepEqual(m.sentMessages, []);
  const html = renderChat(m); assert.match(html, /👑<\/span>群主·阿光<button/);
  m.join('real'); assert.deepEqual(m.sentMessages, ['大家好']); m.talk(); assert.deepEqual(m.sentMessages, ['买一卷']);
  m.close(); assert.equal(m.opened, false); assert.equal(m.minimized, false); m.open(); assert.equal(m.contacts, true);
  m.join('real'); assert.deepEqual(m.sentMessages, ['大家好']);
  m.reset(); m.join('real'); m.answer('银盐'); assert.deepEqual(m.sentMessages, []);
});

test('share extraction and group approval reject out-of-order and unknown actions', () => {
  const d = new DriveMission(); d.launch('real'); d.unlock('xj06'); assert.equal(d.unlocked, false);
  d.open('unknown'); assert.equal(d.page, 'search'); d.open('vip'); d.unlock('xj06');
  d.choose('unknown'); assert.equal(d.page, 'files'); d.choose('pdf'); assert.equal(d.download(), true);
  d.open('real'); assert.equal(d.file, ''); assert.equal(d.unlocked, false);
  const c = new ChatMission(); c.answer('银盐'); assert.equal(c.joined.size, 0);
  c.join('unknown'); assert.equal(c.opened, false);
});

test('drive search uses shared catalog and exact share numbers only return their owner', () => {
  const m = new DriveMission(); m.launch('real'); m.query = '周末摄影课'; assert.equal(m.results.length, 3);
  m.query = 'xc2006'; assert.deepEqual(m.results.map(([id]) => id), ['real']);
  assert.ok(!renderDrive(m).includes('资料搬运助手'));
  m.query = 'XC2060'; assert.deepEqual(m.results.map(([id]) => id), ['vip']);
  m.query = 'XC200'; assert.equal(m.results.length, 0);
});

 test('drive desktop gates downloads and preserves real workflow when windows change', () => {
 const m = new DriveMission(); assert.match(renderDrive(m), /drive-shortcuts/); assert.ok(!renderDrive(m).includes('data-task="drive-search"'));
 m.open('real'); assert.equal(m.selected, ''); m.launch('speed'); assert.equal(m.commitApp(), true); assert.equal(m.complete, false);
 m.launch('real'); m.open('real'); m.unlock('xj06'); m.choose('pdf'); m.minimized = true; assert.equal(m.download(), false);
 m.launch('real'); assert.equal(m.page, 'download'); m.closeApp(); m.launch('vip'); assert.equal(m.download(), false);
 m.launch('real'); assert.equal(m.download(), false); assert.equal(m.complete, true);
 m.reset(); assert.equal(m.activeApp, ''); assert.equal(m.file, ''); assert.equal(m.complete, false);
 });
test('chat questions produce contextual replies without switching conversations', () => {
  const m = new ChatMission(); m.join('real'); m.answer('银盐');
  m.send('大家好'); assert.equal(m.chatting, false); assert.match(m.replyFor(0)!, /老邮局/);
  m.talk(); m.send('周末扫街在哪集合？'); assert.match(m.replyFor(0)!, /14:00 老邮局/);
  m.send('冲洗扫描怎么算？'); assert.match(m.replyFor(1)!, /另计/);
  m.join('fast'); m.talk(); m.send('周末扫街在哪集合？'); assert.match(m.replyFor(0)!, /还没定/);
  m.join('real'); m.talk(); assert.match(m.replyFor(0)!, /14:00 老邮局/);
  m.showFriend('star'); m.send('离线留言'); assert.equal(m.replyFor(0), undefined);
  m.showFriend('lin'); m.send('<script>周末</script>'); assert.ok(!renderChat(m).includes('<script>'));
  m.reset(); m.join('real'); m.answer('银盐'); m.talk(); assert.equal(m.replyFor(0), undefined);
});

test('document previews reveal content without downloading or executing files', () => {
  const m = new DriveMission(); m.preview('pdf'); assert.equal(m.message, '');
  m.launch('real'); m.open('real'); m.unlock('xj06'); m.preview('exe');
  assert.match(m.message, /无法展示/); assert.equal(m.file, ''); assert.equal(m.complete, false);
  m.preview('pdf'); assert.match(m.message, /第 1 \/ 24 页/); assert.match(m.message, /曝光记录表/);
  assert.equal(m.page, 'files'); assert.match(renderDrive(m), /data-action="drive-preview-close"/);
  m.open('fake'); assert.equal(m.message, ''); m.unlock('xj06'); m.preview('pdf'); assert.match(m.message, /1 页/);
  m.open('real'); assert.equal(m.message, ''); m.unlock('xj06'); m.choose('pdf'); m.download(); assert.equal(m.complete, true);
});

test('closing a document preview preserves extraction and changing shares or retry clears it', () => {
  const m = new DriveMission(); m.launch('real'); m.open('real'); m.unlock('xj06');
  m.preview('pdf'); assert.equal(m.previewFile, 'pdf');
  assert.match(renderDrive(m), /曝光记录表（课堂填写）/);
  assert.ok(!renderDrive(m).includes('data-action="drive-file"'));
  m.closePreview(); assert.equal(m.previewFile, ''); assert.equal(m.unlocked, true);
  assert.match(renderDrive(m), /data-action="drive-file"/);
  m.preview('pdf'); m.open('fake'); assert.equal(m.previewFile, '');
  m.unlock('xj06'); m.preview('pdf'); assert.match(renderDrive(m), /资源助手使用说明/);
  assert.ok(!renderDrive(m).includes('曝光记录表（课堂填写）'));
  m.reset(); assert.equal(m.previewFile, ''); assert.equal(m.unlocked, false);
});
