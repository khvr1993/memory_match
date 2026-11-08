import { shiftDateKey } from './dates';
import type { StorageLike } from './gameLogic';
import { DIFFICULTIES, THEMES, TOTAL_STICKERS } from './themesData';
import type { BadgeId, DifficultyId, GameMode, ThemeId } from './types';

export const PROGRESS_STORAGE_KEY = 'memory_match_progress_v1';
export const PROGRESS_VERSION = 1;

const MAX_DAILY_DATES = 90;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface LevelRecord {
  themeId: ThemeId;
  difficultyId: DifficultyId;
  bestMoves: number;
  bestStars: number;
  plays: number;
  lastPlayedAt: string;
}

export interface Progress {
  version: 1;
  levels: Record<string, LevelRecord>;
  totals: { games: number; pairs: number };
  streak: { current: number; best: number; lastCompletedDate: string | null };
  dailyDates: string[];
  lastPlayed: {
    themeId: ThemeId;
    difficultyId: DifficultyId;
    mode: GameMode;
    at: string;
  } | null;
}

export interface GameResultInput {
  themeId: ThemeId;
  difficultyId: DifficultyId;
  mode: GameMode;
  moves: number;
  stars: number;
  pairs: number;
  playedAt?: string;
}

export interface DailyCompletion {
  progress: Progress;
  streak: number;
  isNew: boolean;
}

export interface Badge {
  id: BadgeId;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
}

export interface LevelRef {
  themeId: ThemeId;
  difficultyId: DifficultyId;
}

function resolveStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof localStorage === 'undefined') return undefined;
  return localStorage;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value) && THEMES.some((theme) => theme.id === value);
}

function isDifficultyId(value: string | null): value is DifficultyId {
  return Boolean(value) && DIFFICULTIES.some((difficulty) => difficulty.id === value);
}

export function levelKey(themeId: ThemeId, difficultyId: DifficultyId): string {
  return `${themeId}:${difficultyId}`;
}

export function createEmptyProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    levels: {},
    totals: { games: 0, pairs: 0 },
    streak: { current: 0, best: 0, lastCompletedDate: null },
    dailyDates: [],
    lastPlayed: null,
  };
}

export function normalizeProgress(raw: unknown): Progress {
  const progress = createEmptyProgress();
  if (!isObject(raw)) return progress;

  if (isObject(raw.levels)) {
    for (const value of Object.values(raw.levels)) {
      if (!isObject(value)) continue;
      const themeId = asString(value.themeId);
      const difficultyId = asString(value.difficultyId);
      if (!isThemeId(themeId) || !isDifficultyId(difficultyId)) continue;
      const bestMoves = Math.floor(asNumber(value.bestMoves, 0));
      if (bestMoves <= 0) continue;
      const bestStars = Math.min(3, Math.max(0, Math.floor(asNumber(value.bestStars, 0))));
      const plays = Math.max(1, Math.floor(asNumber(value.plays, 1)));
      const lastPlayedAt = asString(value.lastPlayedAt) ?? new Date(0).toISOString();
      progress.levels[levelKey(themeId, difficultyId)] = {
        themeId,
        difficultyId,
        bestMoves,
        bestStars,
        plays,
        lastPlayedAt,
      };
    }
  }

  if (isObject(raw.totals)) {
    progress.totals = {
      games: Math.max(0, Math.floor(asNumber(raw.totals.games, 0))),
      pairs: Math.max(0, Math.floor(asNumber(raw.totals.pairs, 0))),
    };
  }

  if (isObject(raw.streak)) {
    const current = Math.max(0, Math.floor(asNumber(raw.streak.current, 0)));
    const best = Math.max(current, Math.floor(asNumber(raw.streak.best, current)));
    const lastCompletedDate = asString(raw.streak.lastCompletedDate);
    progress.streak = {
      current,
      best,
      lastCompletedDate:
        lastCompletedDate && DATE_KEY_PATTERN.test(lastCompletedDate) ? lastCompletedDate : null,
    };
  }

  if (Array.isArray(raw.dailyDates)) {
    const dates = raw.dailyDates.filter(
      (date): date is string => typeof date === 'string' && DATE_KEY_PATTERN.test(date)
    );
    progress.dailyDates = Array.from(new Set(dates)).slice(-MAX_DAILY_DATES);
  }

  if (isObject(raw.lastPlayed)) {
    const themeId = asString(raw.lastPlayed.themeId);
    const difficultyId = asString(raw.lastPlayed.difficultyId);
    const mode = raw.lastPlayed.mode;
    const at = asString(raw.lastPlayed.at);
    if (isThemeId(themeId) && isDifficultyId(difficultyId) && (mode === 'solo' || mode === 'duo')) {
      progress.lastPlayed = { themeId, difficultyId, mode, at: at ?? new Date(0).toISOString() };
    }
  }

  return progress;
}

export function readProgress(storage?: StorageLike): Progress {
  const target = resolveStorage(storage);
  if (!target) return createEmptyProgress();
  try {
    const raw = target.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return createEmptyProgress();
  }
}

export function writeProgress(progress: Progress, storage?: StorageLike): void {
  const target = resolveStorage(storage);
  if (!target) return;
  try {
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Progress is a bonus; storage failures must never block play.
  }
}

export function getLevelRecord(
  progress: Progress,
  themeId: ThemeId,
  difficultyId: DifficultyId
): LevelRecord | undefined {
  return progress.levels[levelKey(themeId, difficultyId)];
}

export function recordGameResult(
  progress: Progress,
  result: GameResultInput
): { progress: Progress; isNewBest: boolean; previousBest: number | null } {
  const key = levelKey(result.themeId, result.difficultyId);
  const previous = progress.levels[key];
  const isNewBest = !previous || result.moves < previous.bestMoves;
  const playedAt = result.playedAt ?? new Date().toISOString();

  const record: LevelRecord = {
    themeId: result.themeId,
    difficultyId: result.difficultyId,
    bestMoves: isNewBest ? result.moves : previous.bestMoves,
    bestStars: Math.max(previous?.bestStars ?? 0, result.stars),
    plays: (previous?.plays ?? 0) + 1,
    lastPlayedAt: playedAt,
  };

  const next: Progress = {
    ...progress,
    levels: { ...progress.levels, [key]: record },
    totals: {
      games: progress.totals.games + 1,
      pairs: progress.totals.pairs + result.pairs,
    },
    lastPlayed: {
      themeId: result.themeId,
      difficultyId: result.difficultyId,
      mode: result.mode,
      at: playedAt,
    },
  };

  return { progress: next, isNewBest, previousBest: previous?.bestMoves ?? null };
}

export function getEffectiveStreak(progress: Progress, todayKey: string): number {
  const last = progress.streak.lastCompletedDate;
  if (!last) return 0;
  if (last === todayKey || last === shiftDateKey(todayKey, -1)) {
    return progress.streak.current;
  }
  return 0;
}

export function recordDailyCompletion(progress: Progress, dateKey: string): DailyCompletion {
  if (progress.dailyDates.includes(dateKey)) {
    return { progress, streak: getEffectiveStreak(progress, dateKey), isNew: false };
  }

  const continued = progress.streak.lastCompletedDate === shiftDateKey(dateKey, -1);
  const current = continued ? progress.streak.current + 1 : 1;
  const streak = {
    current,
    best: Math.max(progress.streak.best, current),
    lastCompletedDate: dateKey,
  };
  const dailyDates = [...progress.dailyDates, dateKey].slice(-MAX_DAILY_DATES);

  return {
    progress: { ...progress, streak, dailyDates },
    streak: current,
    isNew: true,
  };
}

export function getThemeStars(progress: Progress, themeId: ThemeId): number {
  return DIFFICULTIES.reduce((total, difficulty) => {
    const record = getLevelRecord(progress, themeId, difficulty.id);
    return total + (record?.bestStars ?? 0);
  }, 0);
}

export function getTotalStars(progress: Progress): number {
  return Object.values(progress.levels).reduce((total, record) => total + record.bestStars, 0);
}

export function getBadges(progress: Progress, stickerCount: number): Badge[] {
  const threeStarLevels = Object.values(progress.levels).filter(
    (record) => record.bestStars >= 3
  ).length;
  const themeMaster = THEMES.some((theme) =>
    DIFFICULTIES.every((difficulty) => getLevelRecord(progress, theme.id, difficulty.id))
  );
  const aroundTheWorld = THEMES.every((theme) =>
    DIFFICULTIES.some((difficulty) => getLevelRecord(progress, theme.id, difficulty.id))
  );

  const badges: Badge[] = [
    {
      id: 'first-win',
      name: 'First Win',
      emoji: '🎉',
      description: 'Finish your first board.',
      earned: progress.totals.games >= 1,
    },
    {
      id: 'three-star',
      name: 'Three Star',
      emoji: '⭐',
      description: 'Earn three stars on any board.',
      earned: threeStarLevels >= 1,
    },
    {
      id: 'perfect-ten',
      name: 'Perfect Ten',
      emoji: '🌟',
      description: 'Earn three stars on ten boards.',
      earned: threeStarLevels >= 10,
    },
    {
      id: 'theme-master',
      name: 'Theme Master',
      emoji: '🏆',
      description: 'Clear all seven sizes in one theme.',
      earned: themeMaster,
    },
    {
      id: 'around-the-world',
      name: 'Around the World',
      emoji: '🌍',
      description: 'Play at least one board in every theme.',
      earned: aroundTheWorld,
    },
    {
      id: 'grand-collector',
      name: 'Grand Collector',
      emoji: '📖',
      description: `Fill the sticker book (${TOTAL_STICKERS} stickers).`,
      earned: stickerCount >= TOTAL_STICKERS,
    },
    {
      id: 'daily-spark',
      name: 'Daily Spark',
      emoji: '🔥',
      description: 'Reach a three-day Daily streak.',
      earned: progress.streak.best >= 3,
    },
    {
      id: 'daily-flame',
      name: 'Daily Flame',
      emoji: '🌋',
      description: 'Reach a seven-day Daily streak.',
      earned: progress.streak.best >= 7,
    },
  ];

  return badges;
}

export function getRecommendedLevel(progress: Progress): LevelRef | null {
  for (const theme of THEMES) {
    for (const difficulty of DIFFICULTIES) {
      const record = getLevelRecord(progress, theme.id, difficulty.id);
      if (!record || record.bestStars < 3) {
        return { themeId: theme.id, difficultyId: difficulty.id };
      }
    }
  }
  return null;
}
