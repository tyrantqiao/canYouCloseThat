import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameSession, parseSave } from '../src/game.ts';

test('clean state must last 800ms and pause freezes both clocks', () => {
  const game = new GameSession(1); game.start(); game.tick(1000); game.close('main');
  game.tick(400); assert.equal(game.status, 'clearing');
  game.pause(); game.tick(10000); assert.equal(game.elapsed, 1400);
  game.resume(); game.tick(400); assert.equal(game.status, 'won');
  assert.equal(game.assisted, true);
});
test('death resets the attempt but retains total time and statistics', () => {
  const game = new GameSession(1); game.start(); game.tick(2000);
  for (let i = 0; i < 3; i++) game.trap('trap');
  assert.equal(game.deaths, 1); assert.equal(game.status, 'lost');
  game.retry(false); assert.equal(game.elapsed, 0); assert.equal(game.total, 2000);
  assert.equal(game.patience, 3); assert.equal(game.retries, 0);
  game.tick(500); game.retry(); assert.equal(game.total, 2500); assert.equal(game.retries, 1);
});
test('save parser rejects corrupt and untrusted record fields', () => {
  assert.deepEqual(parseSave('{oops').best, {});
  const save = parseSave(JSON.stringify({ version: 1, best: { 1: -3, 4: 'fast', 10: 1200 }, completed: [1, 1, 99, 10], reducedMotion: 'yes' }));
  assert.deepEqual(save.best, { 10: 1200 }); assert.deepEqual(save.completed, [1, 10]);
  assert.equal(save.reducedMotion, false);
});

