import type { StorageLike } from './gameLogic';
import { DIFFICULTIES, THEMES } from './themesData';
import type { GameMode, GameSettings } from './types';

export const SETTINGS_STORAGE_KEY = 'memory_match_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  themeId: 'animals',
  difficultyId: 'explorer',
  mode: 'solo',
};

function resolveStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof localStorage === 'undefined') return undefined;
  return localStorage;
}

export function readSettings(storage?: StorageLike): GameSettings {
  const target = resolveStorage(storage);
  if (!target) return DEFAULT_SETTINGS;
  try {
    const raw = target.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const themeId = THEMES.some((theme) => theme.id === parsed.themeId)
      ? (parsed.themeId as GameSettings['themeId'])
      : DEFAULT_SETTINGS.themeId;
    const difficultyId = DIFFICULTIES.some((difficulty) => difficulty.id === parsed.difficultyId)
      ? (parsed.difficultyId as GameSettings['difficultyId'])
      : DEFAULT_SETTINGS.difficultyId;
    const mode: GameMode = parsed.mode === 'duo' ? 'duo' : 'solo';
    return { themeId, difficultyId, mode };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: GameSettings, storage?: StorageLike): void {
  const target = resolveStorage(storage);
  if (!target) return;
  try {
    target.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Preferences are a convenience; the game still works without storage.
  }
}
