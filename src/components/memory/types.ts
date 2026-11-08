export type ThemeId = 'animals' | 'fruits' | 'india' | 'shapes' | 'vehicles' | 'superheroes';

export type DifficultyId = 'toddler' | 'easy' | 'explorer' | 'champion' | 'legend' | 'master';

export type GameMode = 'solo' | 'duo';

export type PlayerId = 'teddy' | 'bunny';

export interface MemorySymbol {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  accent: string;
  hint?: string;
}

export interface MemoryTheme {
  id: ThemeId;
  name: string;
  shortName: string;
  tagline: string;
  icon: string;
  backIcon: string;
  assetDir?: string;
  symbols: MemorySymbol[];
}

export interface Difficulty {
  id: DifficultyId;
  name: string;
  gridLabel: string;
  pairs: number;
  columns: number;
  icon: string;
  medalEmoji: string;
  medalName: string;
  centerStar?: boolean;
}

export interface PlayerProfile {
  name: string;
  emoji: string;
  color: string;
}

export interface MemoryCard {
  uid: string;
  pairId: string;
  symbol: MemorySymbol;
}

export interface StickerRecord {
  id: string;
  themeId: ThemeId;
  difficultyId: DifficultyId;
  name: string;
  emoji: string;
  earnedAt: string;
}

export type StickerAward = Omit<StickerRecord, 'earnedAt'>;

export interface Scores {
  teddy: number;
  bunny: number;
}

export type Winner = PlayerId | 'tie' | null;

export interface GameSettings {
  themeId: ThemeId;
  difficultyId: DifficultyId;
  mode: GameMode;
}

export interface StartOptions {
  themeId?: ThemeId;
  difficultyId?: DifficultyId;
  mode?: GameMode;
  daily?: boolean;
}

export type BadgeId =
  | 'first-win'
  | 'three-star'
  | 'perfect-ten'
  | 'theme-master'
  | 'around-the-world'
  | 'grand-collector'
  | 'daily-spark'
  | 'daily-flame';

export interface DailyResultInfo {
  dateKey: string;
  streak: number;
  isNew: boolean;
}

export interface VictorySummary {
  stars: number;
  moves: number;
  winner: Winner;
  scores: Scores;
  sticker: StickerRecord;
  isNew: boolean;
  themeId: ThemeId;
  difficultyId: DifficultyId;
  mode: GameMode;
  moveCounts: Scores;
  isNewBest: boolean;
  previousBest: number | null;
  isDaily: boolean;
  daily: DailyResultInfo | null;
  newBadges: BadgeId[];
}
