import { levels } from './game.ts';
import type { GameSession } from './game.ts';

export interface LevelRecord {
  level: number; name: string; time: number; mistakes: number;
  deaths: number; retries: number; assisted: boolean;
}
interface Totals { time: number; mistakes: number; deaths: number; retries: number; }
export interface RunSummary extends Totals {
  complete: boolean; assisted: boolean; entries: readonly LevelRecord[];
}
/** One lobby selection starts one run. Only the explicit next-level route extends it. */
export class RunRecord {
  private startIndex = 0;
  private records = new Map<number, { entry: LevelRecord; totals: Totals }>();
  start(index: number) { this.startIndex = index; this.records.clear(); }
  record(game: GameSession) {
    if (game.status !== 'won') return;
    const previous = this.records.get(game.levelIndex - 1);
    if (game.levelIndex !== this.startIndex && !previous) return;
    const baseline = previous?.totals ?? { time: 0, mistakes: 0, deaths: 0, retries: 0 };
    const totals = { time: game.total, mistakes: game.mistakes, deaths: game.deaths, retries: game.retries };
    // Retrying a completed level replaces its entry, including all its attempts.
    this.records.set(game.levelIndex, { totals, entry: Object.freeze({
      level: game.levelIndex + 1, name: game.level.name, time: totals.time - baseline.time,
      mistakes: totals.mistakes - baseline.mistakes, deaths: totals.deaths - baseline.deaths,
      retries: totals.retries - baseline.retries, assisted: game.assisted,
    }) });
  }
  get summary(): RunSummary | null {
    const values = [...this.records.values()];
    if (!values.length) return null;
    const entries = Object.freeze(values.map(value => value.entry));
    return Object.freeze({ ...values.at(-1)!.totals, entries,
      assisted: values.some(value => value.entry.assisted),
      complete: this.startIndex === 0 && entries.length === levels.length && entries.every((entry, i) => entry.level === i + 1),
    });
  }
}
