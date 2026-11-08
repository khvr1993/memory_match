import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryCardTile } from './MemoryCard';
import type { MemoryCard, MemorySymbol } from './types';
import {
  STICKER_STORAGE_KEY,
  buildDeck,
  canFlipCard,
  cardsMatch,
  computeStars,
  createSeededRandom,
  getCardGridIndex,
  getLuckyCellIndex,
  getThreeStarLimit,
  getWinner,
  isAdjacentToLuckyCell,
  nextPlayer,
  readStickers,
  shuffle,
  unlockSticker,
  type StorageLike,
} from './gameLogic';
import { DIFFICULTIES, THEMES, getStickerAward, getTheme } from './themesData';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

class FakeStorage implements StorageLike {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

test('shuffle keeps every item and does not mutate the input', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const snapshot = [...input];
  const shuffled = shuffle(input, seededRandom(7));

  assert.deepEqual(input, snapshot);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), snapshot);
});

test('buildDeck creates exactly two of every pair for every theme and size', () => {
  for (const theme of THEMES) {
    for (const difficulty of DIFFICULTIES) {
      const deck = buildDeck(theme, difficulty, seededRandom(theme.id.length + difficulty.pairs));
      assert.equal(deck.length, difficulty.pairs * 2);

      const counts = new Map<string, number>();
      for (const card of deck) {
        counts.set(card.pairId, (counts.get(card.pairId) || 0) + 1);
        assert.ok(theme.symbols.some((symbol) => symbol.id === card.pairId));
      }
      assert.equal(counts.size, difficulty.pairs);
      for (const count of counts.values()) assert.equal(count, 2);

      const uids = new Set(deck.map((card) => card.uid));
      assert.equal(uids.size, deck.length);
    }
  }
});

test('buildDeck is deterministic for a seeded random source', () => {
  const theme = getTheme('animals');
  const difficulty = DIFFICULTIES[2];
  const first = buildDeck(theme, difficulty, seededRandom(42));
  const second = buildDeck(theme, difficulty, seededRandom(42));
  assert.deepEqual(first.map((card) => card.uid), second.map((card) => card.uid));
});

test('cardsMatch only matches two different cards with the same pair id', () => {
  const deck = buildDeck(getTheme('fruits'), DIFFICULTIES[0], seededRandom(3));
  const first = deck[0];
  const second = deck.find((card) => card.pairId === first.pairId && card.uid !== first.uid);
  const other = deck.find((card) => card.pairId !== first.pairId);
  if (!second || !other) throw new Error('deck is missing expected cards');

  assert.equal(cardsMatch(first, second), true);
  assert.equal(cardsMatch(first, first), false);
  assert.equal(cardsMatch(first, other), false);
});

test('canFlipCard blocks matched and already-flipped cards', () => {
  const deck = buildDeck(getTheme('shapes'), DIFFICULTIES[0], seededRandom(5));
  const card = deck[0];
  assert.equal(canFlipCard(card, new Set(), []), true);
  assert.equal(canFlipCard(card, new Set([card.uid]), []), false);
  assert.equal(canFlipCard(card, new Set(), [card.uid]), false);
});

test('nextPlayer alternates between Teddy and Bunny', () => {
  assert.equal(nextPlayer('teddy'), 'bunny');
  assert.equal(nextPlayer('bunny'), 'teddy');
});

test('computeStars rewards efficient play and always gives at least one star', () => {
  assert.equal(computeStars(2, 2), 3);
  assert.equal(computeStars(6, 6), 3);
  assert.equal(computeStars(11, 6), 3);
  assert.equal(computeStars(14, 6), 2);
  assert.equal(computeStars(30, 6), 1);
  assert.equal(computeStars(100, 8), 1);
});

test('getWinner reports a winner or a tie', () => {
  assert.equal(getWinner({ teddy: 4, bunny: 2 }), 'teddy');
  assert.equal(getWinner({ teddy: 1, bunny: 3 }), 'bunny');
  assert.equal(getWinner({ teddy: 3, bunny: 3 }), 'tie');
});

test('sticker unlocks persist, deduplicate, and survive corrupt storage', () => {
  const storage = new FakeStorage();
  const award = getStickerAward('india', 'champion');

  const first = unlockSticker(award, storage);
  assert.equal(first.isNew, true);
  assert.equal(first.stickers.length, 1);
  assert.equal(first.sticker.id, 'india:champion');
  assert.ok(first.sticker.earnedAt);

  const second = unlockSticker(award, storage);
  assert.equal(second.isNew, false);
  assert.equal(second.stickers.length, 1);

  const persisted = readStickers(storage);
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].themeId, 'india');

  storage.setItem(STICKER_STORAGE_KEY, '{not-json');
  assert.deepEqual(readStickers(storage), []);
});

test('readStickers ignores malformed entries', () => {
  const storage = new FakeStorage();
  storage.setItem(
    STICKER_STORAGE_KEY,
    JSON.stringify([{ id: 'animals:toddler', themeId: 'animals' }, null, { nope: true }])
  );
  const stickers = readStickers(storage);
  assert.equal(stickers.length, 1);
  assert.equal(stickers[0].id, 'animals:toddler');
});

test('every theme has enough symbols for the largest board', () => {
  const maxPairs = Math.max(...DIFFICULTIES.map((difficulty) => difficulty.pairs));
  for (const theme of THEMES) {
    assert.ok(
      theme.symbols.length >= maxPairs,
      `${theme.id} needs at least ${maxPairs} symbols`
    );
    const ids = new Set(theme.symbols.map((symbol) => symbol.id));
    assert.equal(ids.size, theme.symbols.length, `${theme.id} has duplicate symbol ids`);
  }
});

test('the largest board is 6x6 and the 7x7 tier is gone', () => {
  const maxColumns = Math.max(...DIFFICULTIES.map((difficulty) => difficulty.columns));
  assert.equal(maxColumns, 6);
  assert.equal(DIFFICULTIES.some((difficulty) => difficulty.id === 'mythic'), false);
});

test('legend is a 5x5 board with 12 pairs and a lucky center cell', () => {
  const legend = DIFFICULTIES.find((difficulty) => difficulty.id === 'legend');
  if (!legend) throw new Error('legend difficulty is missing');
  assert.equal(legend.gridLabel, '5 × 5');
  assert.equal(legend.columns, 5);
  assert.equal(legend.pairs, 12);
  assert.equal(legend.centerStar, true);

  const deck = buildDeck(getTheme('animals'), legend, seededRandom(11));
  assert.equal(deck.length, 24);
  assert.equal(new Set(deck.map((card) => card.pairId)).size, 12);
});

test('master is a 6x6 board with 18 pairs and 36 cards', () => {
  const master = DIFFICULTIES.find((difficulty) => difficulty.id === 'master');
  if (!master) throw new Error('master difficulty is missing');
  assert.equal(master.gridLabel, '6 × 6');
  assert.equal(master.columns, 6);
  assert.equal(master.pairs, 18);
  assert.equal(Boolean(master.centerStar), false);

  const deck = buildDeck(getTheme('fruits'), master, seededRandom(19));
  assert.equal(deck.length, 36);
  assert.equal(new Set(deck.map((card) => card.pairId)).size, 18);
});

test('lucky cell sits at the visual center and maps card indexes around it', () => {
  assert.equal(getLuckyCellIndex(24), 12);
  assert.equal(getCardGridIndex(11, 12), 11);
  assert.equal(getCardGridIndex(12, 12), 13);
});

test('only the four cards beside the lucky cell earn the bonus on a 5x5 board', () => {
  for (const index of [7, 11, 12, 16]) {
    assert.equal(isAdjacentToLuckyCell(index, 24, 5), true, `index ${index} should be adjacent`);
  }
  for (const index of [0, 6, 8, 13, 17, 23]) {
    assert.equal(isAdjacentToLuckyCell(index, 24, 5), false, `index ${index} should not be adjacent`);
  }
});

test('createSeededRandom is deterministic and seed-sensitive', () => {
  const first = Array.from({ length: 8 }, createSeededRandom('daily-2026-11-08'));
  const second = Array.from({ length: 8 }, createSeededRandom('daily-2026-11-08'));
  const other = Array.from({ length: 8 }, createSeededRandom('daily-2026-11-09'));

  assert.deepEqual(first, second);
  assert.notDeepEqual(first, other);
  for (const value of first) {
    assert.ok(value >= 0 && value < 1);
  }
});

test('the three-star limit matches the star thresholds', () => {
  assert.equal(getThreeStarLimit(6), 11);
  assert.equal(computeStars(getThreeStarLimit(6), 6), 3);
  assert.equal(computeStars(getThreeStarLimit(6) + 1, 6), 2);
  assert.equal(getThreeStarLimit(8), 14);
  assert.equal(computeStars(14, 8), 3);
});

function renderCardMarkup(symbol: MemorySymbol, faceUp = true): string {
  const card: MemoryCard = { uid: `${symbol.id}-a`, pairId: symbol.id, symbol };
  return renderToStaticMarkup(
    React.createElement(MemoryCardTile, {
      card,
      faceUp,
      matched: false,
      wobbly: false,
      disabled: false,
      peeking: false,
      backIcon: '★',
      onFlip: () => undefined,
    })
  );
}

test('superhero cards keep the image portrait layout', () => {
  const hero = getTheme('superheroes').symbols.find((symbol) => symbol.image);
  if (!hero) throw new Error('superheroes theme has no image');
  const html = renderCardMarkup(hero);

  assert.ok(html.includes('mm-face mm-face-front is-photo'));
  assert.ok(html.includes('mm-card-portrait-wrap'));
  assert.ok(html.includes('<img'));
  assert.equal(html.includes('is-emoji'), false);
});

test('emoji cards use the full-bleed emoji tile', () => {
  const animal = getTheme('animals').symbols[0];
  const html = renderCardMarkup(animal);

  assert.ok(html.includes('mm-face mm-face-front is-photo'));
  assert.ok(html.includes('mm-card-portrait-wrap is-emoji'));
  assert.ok(html.includes('mm-card-emoji'));
  assert.ok(html.includes('aria-label="Lion, King of the jungle"'));
  assert.ok(html.includes('title="King of the jungle"'));
});

test('theme images are isolated by asset directory and exist', () => {
  const publicDir = resolve(process.cwd(), 'public');
  const seen = new Set<string>();

  for (const theme of THEMES) {
    for (const symbol of theme.symbols) {
      if (!symbol.image) continue;
      assert.ok(theme.assetDir, `${theme.id} has an image without assetDir`);
      assert.ok(
        symbol.image.startsWith(`${theme.assetDir}/`),
        `${symbol.image} is outside ${theme.assetDir}/`
      );
      assert.ok(
        existsSync(resolve(publicDir, symbol.image)),
        `${symbol.image} is missing from public/`
      );
      assert.ok(!seen.has(symbol.image), `${symbol.image} is used by another theme`);
      seen.add(symbol.image);
    }
  }
});

test('superheroes theme includes 24 Marvel and DC heroes with portrait images', () => {
  const heroes = getTheme('superheroes');
  assert.ok(heroes.symbols.length >= 24);
  const names = heroes.symbols.map((symbol) => symbol.name);
  for (const name of [
    'Spider-Man',
    'Batman',
    'Superman',
    'Wonder Woman',
    'Iron Man',
    'Captain America',
    'Wolverine',
    'Captain Marvel',
    'Green Lantern',
    'Scarlet Witch',
  ]) {
    assert.ok(names.includes(name), `${name} is missing from the superheroes theme`);
  }
  for (const symbol of heroes.symbols) {
    assert.ok(symbol.image, `${symbol.name} is missing a portrait image`);
  }
});
