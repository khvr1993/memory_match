import test from 'node:test';
import assert from 'node:assert/strict';
import { getDailyChallenge } from './daily';
import { shiftDateKey, toDateKey } from './dates';
import { buildDeck, createSeededRandom } from './gameLogic';
import { getDifficulty, getTheme } from './themesData';

test('date keys are local and zero-padded', () => {
  assert.equal(toDateKey(new Date(2026, 10, 8, 23, 59)), '2026-11-08');
  assert.equal(toDateKey(new Date(2026, 0, 2, 0, 1)), '2026-01-02');
});

test('shiftDateKey crosses month and year boundaries', () => {
  assert.equal(shiftDateKey('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDateKey('2026-12-31', 1), '2027-01-01');
});

test('the same local day produces the same challenge and deck order', () => {
  const morning = getDailyChallenge(new Date(2026, 10, 8, 8, 0));
  const evening = getDailyChallenge(new Date(2026, 10, 8, 21, 30));

  assert.deepEqual(morning, evening);

  const first = buildDeck(
    getTheme(morning.themeId),
    getDifficulty(morning.difficultyId),
    createSeededRandom(morning.seed)
  );
  const second = buildDeck(
    getTheme(evening.themeId),
    getDifficulty(evening.difficultyId),
    createSeededRandom(evening.seed)
  );
  assert.deepEqual(
    first.map((card) => card.uid),
    second.map((card) => card.uid)
  );
});

test('different days use different seeds', () => {
  const first = getDailyChallenge(new Date(2026, 10, 8));
  const second = getDailyChallenge(new Date(2026, 10, 9));
  assert.notEqual(first.seed, second.seed);
});

test('sixty days always produce valid, varied challenges', () => {
  const themes = new Set<string>();
  const difficulties = new Set<string>();

  for (let index = 0; index < 60; index += 1) {
    const challenge = getDailyChallenge(new Date(2026, 0, 1 + index));
    const theme = getTheme(challenge.themeId);
    const difficulty = getDifficulty(challenge.difficultyId);

    assert.equal(theme.id, challenge.themeId);
    assert.equal(difficulty.id, challenge.difficultyId);
    assert.ok(theme.symbols.length >= difficulty.pairs);

    themes.add(challenge.themeId);
    difficulties.add(challenge.difficultyId);
  }

  assert.ok(themes.size >= 3, `expected at least 3 themes, got ${themes.size}`);
  assert.ok(difficulties.size >= 2, `expected at least 2 sizes, got ${difficulties.size}`);
});
