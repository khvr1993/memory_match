import test from 'node:test';
import assert from 'node:assert/strict';
import type { StorageLike } from './gameLogic';
import {
  PROGRESS_STORAGE_KEY,
  createEmptyProgress,
  getBadges,
  getEffectiveStreak,
  getLevelRecord,
  getRecommendedLevel,
  getThemeStars,
  getTotalStars,
  normalizeProgress,
  readProgress,
  recordDailyCompletion,
  recordGameResult,
  writeProgress,
  type GameResultInput,
} from './progress';

class FakeStorage implements StorageLike {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function makeResult(overrides: Partial<GameResultInput> = {}): GameResultInput {
  return {
    themeId: 'animals',
    difficultyId: 'easy',
    mode: 'solo',
    moves: 10,
    stars: 3,
    pairs: 3,
    ...overrides,
  };
}

test('the first result creates a level record and a personal best', () => {
  const result = recordGameResult(createEmptyProgress(), makeResult());

  assert.equal(result.isNewBest, true);
  assert.equal(result.previousBest, null);
  assert.equal(result.progress.totals.games, 1);
  assert.equal(result.progress.totals.pairs, 3);

  const record = getLevelRecord(result.progress, 'animals', 'easy');
  assert.ok(record);
  assert.equal(record.bestMoves, 10);
  assert.equal(record.bestStars, 3);
  assert.equal(record.plays, 1);
  assert.ok(record.lastPlayedAt);
});

test('worse runs increase plays without replacing the best', () => {
  const first = recordGameResult(createEmptyProgress(), makeResult());
  const second = recordGameResult(first.progress, makeResult({ moves: 14, stars: 2 }));

  assert.equal(second.isNewBest, false);
  assert.equal(second.previousBest, 10);

  const record = getLevelRecord(second.progress, 'animals', 'easy');
  assert.ok(record);
  assert.equal(record.bestMoves, 10);
  assert.equal(record.bestStars, 3);
  assert.equal(record.plays, 2);
});

test('better runs replace the best moves and keep the highest stars', () => {
  const first = recordGameResult(createEmptyProgress(), makeResult({ moves: 10, stars: 2 }));
  const better = recordGameResult(first.progress, makeResult({ moves: 8, stars: 3 }));

  assert.equal(better.isNewBest, true);
  assert.equal(better.previousBest, 10);

  const record = getLevelRecord(better.progress, 'animals', 'easy');
  assert.ok(record);
  assert.equal(record.bestMoves, 8);
  assert.equal(record.bestStars, 3);
  assert.equal(record.plays, 2);
});

test('total and per-theme stars use the best result per level', () => {
  let progress = createEmptyProgress();
  progress = recordGameResult(progress, makeResult({ stars: 3 })).progress;
  progress = recordGameResult(progress, makeResult({ themeId: 'fruits', stars: 2 })).progress;
  progress = recordGameResult(progress, makeResult({ stars: 1 })).progress;

  assert.equal(getTotalStars(progress), 5);
  assert.equal(getThemeStars(progress, 'animals'), 3);
  assert.equal(getThemeStars(progress, 'fruits'), 2);
});

test('progress survives a storage round trip and corrupt storage is ignored', () => {
  const storage = new FakeStorage();
  const progress = recordGameResult(createEmptyProgress(), makeResult()).progress;

  writeProgress(progress, storage);
  assert.deepEqual(readProgress(storage), progress);

  storage.setItem(PROGRESS_STORAGE_KEY, '{not-json');
  assert.deepEqual(readProgress(storage), createEmptyProgress());
});

test('normalizeProgress drops malformed records and fields', () => {
  const normalized = normalizeProgress({
    levels: {
      bad: {
        themeId: 'unknown',
        difficultyId: 'easy',
        bestMoves: 8,
        bestStars: 3,
        plays: 1,
        lastPlayedAt: '2026-11-08T00:00:00.000Z',
      },
      good: {
        themeId: 'animals',
        difficultyId: 'easy',
        bestMoves: 9,
        bestStars: 2,
        plays: 2,
        lastPlayedAt: '2026-11-08T00:00:00.000Z',
      },
    },
    totals: { games: 'nope', pairs: -4 },
    dailyDates: [1, '2026-11-08', '2026-11-08', 'not-a-date'],
  });

  assert.equal(Object.keys(normalized.levels).length, 1);
  assert.ok(getLevelRecord(normalized, 'animals', 'easy'));
  assert.equal(normalized.totals.games, 0);
  assert.equal(normalized.totals.pairs, 0);
  assert.deepEqual(normalized.dailyDates, ['2026-11-08']);
});

test('daily completions dedupe and build streaks across consecutive days', () => {
  const first = recordDailyCompletion(createEmptyProgress(), '2026-11-06');
  assert.equal(first.isNew, true);
  assert.equal(first.streak, 1);

  const duplicate = recordDailyCompletion(first.progress, '2026-11-06');
  assert.equal(duplicate.isNew, false);
  assert.equal(duplicate.streak, 1);
  assert.equal(duplicate.progress, first.progress);

  const second = recordDailyCompletion(first.progress, '2026-11-07');
  assert.equal(second.streak, 2);

  const gap = recordDailyCompletion(second.progress, '2026-11-09');
  assert.equal(gap.streak, 1);
  assert.equal(gap.progress.streak.best, 2);
  assert.deepEqual(gap.progress.dailyDates, ['2026-11-06', '2026-11-07', '2026-11-09']);
});

test('effective streaks expire after a missed day', () => {
  const progress = recordDailyCompletion(createEmptyProgress(), '2026-11-09').progress;

  assert.equal(getEffectiveStreak(progress, '2026-11-09'), 1);
  assert.equal(getEffectiveStreak(progress, '2026-11-10'), 1);
  assert.equal(getEffectiveStreak(progress, '2026-11-11'), 0);
});

test('badges unlock from real progress thresholds', () => {
  const progress = recordGameResult(
    createEmptyProgress(),
    makeResult({ moves: 5, stars: 3, pairs: 3 })
  ).progress;

  const earned = new Map(getBadges(progress, 0).map((badge) => [badge.id, badge.earned]));
  assert.equal(earned.get('first-win'), true);
  assert.equal(earned.get('three-star'), true);
  assert.equal(earned.get('perfect-ten'), false);
  assert.equal(earned.get('grand-collector'), false);

  const collector = getBadges(progress, 42).find((badge) => badge.id === 'grand-collector');
  assert.equal(collector?.earned, true);
});

test('the recommended level starts at the first imperfect board', () => {
  const empty = createEmptyProgress();
  assert.deepEqual(getRecommendedLevel(empty), { themeId: 'animals', difficultyId: 'toddler' });

  const progress = recordGameResult(
    empty,
    makeResult({ themeId: 'animals', difficultyId: 'toddler', stars: 3 })
  ).progress;
  assert.deepEqual(getRecommendedLevel(progress), {
    themeId: 'animals',
    difficultyId: 'easy',
  });
});
