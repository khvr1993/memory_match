import { toDateKey } from './dates';
import { hashString } from './gameLogic';
import { THEMES } from './themesData';
import type { DifficultyId, ThemeId } from './types';

const DAILY_DIFFICULTY_IDS: DifficultyId[] = ['easy', 'explorer', 'champion', 'legend'];

export interface DailyChallenge {
  dateKey: string;
  themeId: ThemeId;
  difficultyId: DifficultyId;
  seed: number;
}

export function getDailyChallenge(now: Date = new Date()): DailyChallenge {
  const dateKey = toDateKey(now);
  const seed = hashString(`memory-match-daily:${dateKey}`);
  const theme = THEMES[seed % THEMES.length];
  const difficultySeed = hashString(`memory-match-daily-size:${dateKey}`);
  const difficultyId = DAILY_DIFFICULTY_IDS[difficultySeed % DAILY_DIFFICULTY_IDS.length];
  return { dateKey, themeId: theme.id, difficultyId, seed };
}
