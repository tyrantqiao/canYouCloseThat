import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/game.ts';
import { RunRecord } from '../src/run-record.ts';
import { createRunCard, renderResultCard, resultCardFilename } from '../src/share-card.ts';

function win(game: GameSession) { game.close('main'); game.tick(800); }
function next(previous: GameSession) {
  const game = new GameSession(previous.levelIndex + 1);
  game.total = previous.total; game.mistakes = previous.mistakes;
  game.deaths = previous.deaths; game.retries = previous.retries; game.assisted = previous.assisted;
  game.start(); return game;
}
test('six consecutive victories aggregate without double-counting inherited totals', () => {
  const run = new RunRecord(); run.start(0); let game = new GameSession(0); game.start();
  for (let i = 0; i < 6; i++) {
    game.tick(1000); if (i === 2) game.trap('误点');
    win(game); run.record(game); run.record(game);
    if (i < 5) game = next(game);
  }
  const summary = run.summary!;
  assert.equal(summary.complete, true); assert.equal(summary.time, 10800); assert.equal(summary.mistakes, 1);
  assert.equal(summary.entries.length, 6); assert.equal(summary.entries.reduce((sum, e) => sum + e.time, 0), summary.time);
  assert.deepEqual(summary.entries.map(e => e.mistakes), [0, 0, 1, 0, 0, 0]);
  assert.match(createRunCard(summary).name, /连续六关/);
});
test('failed attempts and replayed wins replace one entry while retaining time and mistakes', () => {
  const run = new RunRecord(); run.start(3); const game = new GameSession(3); game.start();
  game.tick(1000); for (let i = 0; i < 3; i++) game.trap('误点'); run.record(game);
  assert.equal(run.summary, null); game.retry(false); game.tick(500); win(game); run.record(game);
  const snapshot = run.summary!;
  game.retry(); game.pause(); game.resume(); game.hint(); game.tick(200); win(game); run.record(game);
  assert.equal(snapshot.time, 2300); assert.equal(run.summary!.time, 3300);
  assert.equal(run.summary!.entries.length, 1); assert.equal(run.summary!.mistakes, 3);
  assert.equal(run.summary!.deaths, 1); assert.equal(run.summary!.retries, 1); assert.equal(run.summary!.assisted, true);
  assert.equal(createRunCard(run.summary!).mode, '使用辅助');
});
test('starting mid-game and choosing a new lobby entry cannot claim six-level completion', () => {
  const run = new RunRecord(); run.start(3); let game = new GameSession(3); game.start();
  for (let i = 3; i < 6; i++) { game.tick(1000); win(game); run.record(game); if (i < 5) game = next(game); }
  const card = createRunCard(run.summary!);
  assert.equal(run.summary!.complete, false); assert.equal(card.entries!.length, 3);
  assert.match(card.name, /分段/); assert.match(card.era, /3 \/ 6/); assert.match(resultCardFilename(card), /分段/);
  assert.ok(!renderResultCard(card).includes('连续六关通关'));
  run.start(5); assert.equal(run.summary, null);
  const last = new GameSession(5); last.start(); win(last); run.record(last);
  assert.equal(run.summary!.entries.length, 1); assert.equal(run.summary!.complete, false);
  assert.ok(Object.isFrozen(run.summary!.entries));
});
