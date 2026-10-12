import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/game.ts';
import { createResultCard, renderResultCard, resultCardFilename } from '../src/share-card.ts';

test('result snapshots survive retries and keep cumulative metrics and assisted status honest', () => {
  const game = new GameSession(3); game.start(); game.tick(1200); game.trap('误点');
  game.retry(); game.tick(500); game.pause(); game.resume();
  const card = createResultCard(game, true);
  game.retry(); game.tick(9000);
  assert.equal(card.level, 4); assert.equal(card.elapsed, '0.5s'); assert.equal(card.total, '1.7s');
  assert.equal(card.mistakes, 1); assert.equal(card.retries, 1); assert.equal(card.mode, '使用辅助');
  assert.equal(card.headline, '踩过坑，也过了关。'); assert.ok(Object.isFrozen(card));
  assert.match(renderResultCard(card), /本轮累计误点/);
});

test('failure exports never invent a win or achievement and escape displayed text', () => {
  const game = new GameSession(5); game.start(); game.tick(2700);
  for (let i = 0; i < 3; i++) game.trap('陷阱');
  const card = createResultCard(game, false, '不应发放的称号');
  assert.equal(card.deaths, 1); assert.equal(card.mistakes, 3); assert.equal(card.achievement, '');
  assert.match(renderResultCard(card), /本次挑战失败/); assert.match(resultCardFilename(card), /挑战失败/);
  assert.ok(!renderResultCard({ ...card, name: '<script>', story: '"<img>' }).includes('<script>'));
});

test('each level supplies its real identity and zero mistakes is not an unassisted claim', () => {
  for (let i = 0; i < 6; i++) {
    const game = new GameSession(i, true); const card = createResultCard(game, true, i === 5 ? '卸得干干净净' : '');
    assert.equal(card.name, game.level.name); assert.equal(card.mode, '使用辅助');
    assert.ok(card.story); assert.ok(!renderResultCard(card).includes('击败'));
  }
});
