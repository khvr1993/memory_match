import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { HowToPlayModal } from './HowToPlayModal';
import { MemoryCardTile } from './MemoryCard';
import { Modal } from './Modal';
import { StickerAlbumModal } from './StickerAlbumModal';
import { Toast, type ToastTone } from './Toast';
import { getDailyChallenge, type DailyChallenge } from './daily';
import { toDateKey } from './dates';
import {
  buildDeck,
  cardsMatch,
  computeStars,
  createSeededRandom,
  getWinner,
  isAdjacentToLuckyCell,
  readStickers,
  unlockSticker,
} from './gameLogic';
import {
  getBadges,
  getEffectiveStreak,
  getLevelRecord,
  readProgress,
  recordDailyCompletion,
  recordGameResult,
  writeProgress,
  type Progress,
} from './progress';
import { readSettings, writeSettings } from './settings';
import { memorySounds } from './soundEffects';
import { speech } from './speech';
import {
  DIFFICULTIES,
  PLAYERS,
  THEMES,
  TOTAL_STICKERS,
  getDifficulty,
  getStickerAward,
  getTheme,
  preloadThemeImages,
} from './themesData';
import type {
  DifficultyId,
  GameMode,
  GameSettings,
  MemoryCard,
  PlayerId,
  Scores,
  StartOptions,
  StickerRecord,
  ThemeId,
  VictorySummary,
} from './types';

const CONFETTI_COLORS = ['#F97316', '#F43F5E', '#8B5CF6', '#06B6D4', '#22C55E', '#FACC15', '#EC4899'];
const HERO_DARK_KEY = 'memory_match_hero_dark';
const ONBOARDED_KEY = 'memory_match_onboarded_v1';
const MAX_PEEKS = 5;
const THEME_IDS = new Set<string>(THEMES.map((theme) => theme.id));

function countStickers(list: StickerRecord[]): number {
  return list.filter((sticker) => THEME_IDS.has(sticker.themeId)).length;
}

const readHeroDark = () => {
  try {
    return window.localStorage.getItem(HERO_DARK_KEY) === 'true';
  } catch {
    return false;
  }
};

export const MemoryMatchGame: React.FC = () => {
  const { soundEnabled, voiceEnabled } = useGame();

  const initialSettings = useMemo<GameSettings>(() => readSettings(), []);
  const [themeId, setThemeId] = useState<ThemeId>(initialSettings.themeId);
  const [difficultyId, setDifficultyId] = useState<DifficultyId>(initialSettings.difficultyId);
  const [mode, setMode] = useState<GameMode>(initialSettings.mode);
  const [cards, setCards] = useState<MemoryCard[]>(() =>
    buildDeck(getTheme(initialSettings.themeId), getDifficulty(initialSettings.difficultyId))
  );
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [moves, setMoves] = useState(0);
  const [moveCounts, setMoveCounts] = useState<Scores>({ teddy: 0, bunny: 0 });
  const [scores, setScores] = useState<Scores>({ teddy: 0, bunny: 0 });
  const [turn, setTurn] = useState<PlayerId>('teddy');
  const [phase, setPhase] = useState<'playing' | 'won'>('playing');
  const [locked, setLocked] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [peeksLeft, setPeeksLeft] = useState(2);
  const [wobble, setWobble] = useState<string[]>([]);
  const [victory, setVictory] = useState<VictorySummary | null>(null);
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [stickers, setStickers] = useState<StickerRecord[]>(() => readStickers());
  const [progress, setProgress] = useState<Progress>(() => readProgress());
  const [heroDark, setHeroDark] = useState(() => readHeroDark());
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [pendingStart, setPendingStart] = useState<StartOptions | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string; tone: ToastTone } | null>(null);
  const [announcement, setAnnouncement] = useState({ id: 0, text: '' });
  const [luckyPulse, setLuckyPulse] = useState(false);
  const [todayKey, setTodayKey] = useState(() => toDateKey());

  const flippedRef = useRef<string[]>([]);
  const matchedRef = useRef<Set<string>>(new Set());
  const movesRef = useRef(0);
  const moveCountsRef = useRef<Scores>({ teddy: 0, bunny: 0 });
  const scoresRef = useRef<Scores>({ teddy: 0, bunny: 0 });
  const turnRef = useRef<PlayerId>('teddy');
  const lockedRef = useRef(false);
  const peekingRef = useRef(false);
  const phaseRef = useRef<'playing' | 'won'>('playing');
  const settingsRef = useRef<GameSettings>(initialSettings);
  const dailyRef = useRef<DailyChallenge | null>(null);
  const progressRef = useRef<Progress>(progress);
  const peeksLeftRef = useRef(2);
  const timersRef = useRef<number[]>([]);
  const toastIdRef = useRef(0);

  const theme = getTheme(themeId);
  const difficulty = getDifficulty(difficultyId);
  const isDuo = mode === 'duo';
  const isHeroDark = themeId === 'superheroes' && heroDark;
  const pairsFound = matched.size / 2;
  const collectedCount = countStickers(stickers);
  const bestRecord = getLevelRecord(progress, themeId, difficultyId);
  const todayChallenge = useMemo(() => getDailyChallenge(new Date()), [todayKey]);
  const dailyDoneToday = progress.dailyDates.includes(todayChallenge.dateKey);
  const activeStreak = getEffectiveStreak(progress, todayChallenge.dateKey);
  const todayTheme = getTheme(todayChallenge.themeId);
  const todayDifficulty = getDifficulty(todayChallenge.difficultyId);
  const activeDailyTheme = dailyChallenge ? getTheme(dailyChallenge.themeId) : null;

  const later = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const announce = useCallback((text: string) => {
    setAnnouncement((previous) => ({ id: previous.id + 1, text }));
  }, []);

  const showToast = useCallback(
    (text: string, tone: ToastTone = 'info', duration = 2400) => {
      toastIdRef.current += 1;
      const id = toastIdRef.current;
      setToast({ id, text, tone });
      later(() => {
        setToast((current) => (current && current.id === id ? null : current));
      }, duration);
    },
    [later]
  );

  const setFlippedBoth = (next: string[]) => {
    flippedRef.current = next;
    setFlipped(next);
  };

  const setMatchedBoth = (next: Set<string>) => {
    matchedRef.current = next;
    setMatched(next);
  };

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    memorySounds.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    speech.enabled = voiceEnabled;
    if (!voiceEnabled) speech.stop();
  }, [voiceEnabled]);

  useEffect(() => {
    preloadThemeImages(theme);
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HERO_DARK_KEY, String(heroDark));
    } catch {
      // Storage can be unavailable in private browsing; the toggle still works for the session.
    }
  }, [heroDark]);

  useEffect(() => {
    const id = window.setInterval(() => setTodayKey(toDateKey()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress.totals.games > 0 || stickers.length > 0) return;
    try {
      if (window.localStorage.getItem(ONBOARDED_KEY)) return;
    } catch {
      // Fall through and show the guide when storage is unavailable.
    }
    setShowHowTo(true);
  }, []);

  useEffect(
    () => () => {
      clearTimers();
      speech.stop();
    },
    [clearTimers]
  );

  useEffect(() => {
    if (!showConfetti) return;
    const id = window.setTimeout(() => setShowConfetti(false), 4800);
    return () => window.clearTimeout(id);
  }, [showConfetti]);

  const startGame = (next?: StartOptions) => {
    clearTimers();
    const daily = next?.daily ? getDailyChallenge() : null;
    const nextTheme = next?.themeId ?? daily?.themeId ?? settingsRef.current.themeId;
    const nextDifficulty = next?.difficultyId ?? daily?.difficultyId ?? settingsRef.current.difficultyId;
    const nextMode = next?.mode ?? settingsRef.current.mode;
    const nextSettings: GameSettings = {
      themeId: nextTheme,
      difficultyId: nextDifficulty,
      mode: nextMode,
    };

    settingsRef.current = nextSettings;
    writeSettings(nextSettings);
    dailyRef.current = daily;
    setDailyChallenge(daily);

    setThemeId(nextTheme);
    setDifficultyId(nextDifficulty);
    setMode(nextMode);
    setCards(
      buildDeck(
        getTheme(nextTheme),
        getDifficulty(nextDifficulty),
        daily ? createSeededRandom(daily.seed) : Math.random
      )
    );
    setFlippedBoth([]);
    setMatchedBoth(new Set());
    movesRef.current = 0;
    setMoves(0);
    moveCountsRef.current = { teddy: 0, bunny: 0 };
    setMoveCounts({ teddy: 0, bunny: 0 });
    scoresRef.current = { teddy: 0, bunny: 0 };
    setScores({ teddy: 0, bunny: 0 });
    turnRef.current = 'teddy';
    setTurn('teddy');
    lockedRef.current = false;
    setLocked(false);
    peekingRef.current = false;
    setPeeking(false);
    peeksLeftRef.current = 2;
    setPeeksLeft(2);
    setWobble([]);
    phaseRef.current = 'playing';
    setPhase('playing');
    setVictory(null);
    setVictoryOpen(false);
    setShowConfetti(false);
    setAlbumOpen(false);
    setPendingStart(null);
    setToast(null);
    setLuckyPulse(false);
    speech.stop();
  };

  const requestStart = (next?: StartOptions) => {
    const hasProgress =
      phaseRef.current === 'playing' && (movesRef.current > 0 || matchedRef.current.size > 0);
    if (!hasProgress) {
      startGame(next);
      return;
    }
    setPendingStart(next ?? {});
  };

  const confirmPendingStart = () => {
    if (pendingStart === null) return;
    startGame(pendingStart);
  };

  const finishGame = (finalMoves: number, finalScores: Scores) => {
    phaseRef.current = 'won';
    setPhase('won');
    memorySounds.victory();

    const settings = settingsRef.current;
    const finalDifficulty = getDifficulty(settings.difficultyId);
    const stars = computeStars(finalMoves, finalDifficulty.pairs);
    const winner = settings.mode === 'duo' ? getWinner(finalScores) : null;
    const award = getStickerAward(settings.themeId, settings.difficultyId);
    const stickerResult = unlockSticker(award);
    setStickers(stickerResult.stickers);

    const beforeBadges = getBadges(progressRef.current, countStickers(stickers));
    const record = recordGameResult(progressRef.current, {
      themeId: settings.themeId,
      difficultyId: settings.difficultyId,
      mode: settings.mode,
      moves: finalMoves,
      stars,
      pairs: finalDifficulty.pairs,
    });

    let nextProgress = record.progress;
    let dailyInfo: VictorySummary['daily'] = null;
    const daily = dailyRef.current;
    if (daily) {
      const completion = recordDailyCompletion(nextProgress, daily.dateKey);
      nextProgress = completion.progress;
      dailyInfo = { dateKey: daily.dateKey, streak: completion.streak, isNew: completion.isNew };
    }

    const afterBadges = getBadges(nextProgress, countStickers(stickerResult.stickers));
    const newBadges = afterBadges
      .filter(
        (badge) =>
          badge.earned && !beforeBadges.some((before) => before.id === badge.id && before.earned)
      )
      .map((badge) => badge.id);

    progressRef.current = nextProgress;
    setProgress(nextProgress);
    writeProgress(nextProgress);

    setVictory({
      stars,
      moves: finalMoves,
      winner,
      scores: finalScores,
      sticker: stickerResult.sticker,
      isNew: stickerResult.isNew,
      themeId: settings.themeId,
      difficultyId: settings.difficultyId,
      mode: settings.mode,
      moveCounts: moveCountsRef.current,
      isNewBest: record.isNewBest,
      previousBest: record.previousBest,
      isDaily: Boolean(daily),
      daily: dailyInfo,
      newBadges,
    });
    setVictoryOpen(true);
    setShowConfetti(true);

    if (record.isNewBest && finalMoves > 0) {
      showToast(`New best: ${finalMoves} moves!`, 'best');
    } else if (newBadges.length > 0) {
      showToast('New badge unlocked!', 'best');
    }
  };

  const handleFlip = (uid: string) => {
    if (phaseRef.current !== 'playing' || lockedRef.current || peekingRef.current) return;
    const card = cards.find((item) => item.uid === uid);
    if (!card) return;
    if (matchedRef.current.has(uid) || flippedRef.current.includes(uid)) return;

    const currentFlipped = flippedRef.current;
    memorySounds.flip();

    if (currentFlipped.length === 0) {
      setFlippedBoth([uid]);
      return;
    }

    if (currentFlipped.length !== 1) return;
    const first = cards.find((item) => item.uid === currentFlipped[0]);
    if (!first) {
      setFlippedBoth([uid]);
      return;
    }

    setFlippedBoth([first.uid, uid]);
    lockedRef.current = true;
    setLocked(true);

    const nextMoves = movesRef.current + 1;
    movesRef.current = nextMoves;
    setMoves(nextMoves);

    if (settingsRef.current.mode === 'duo') {
      const player = turnRef.current;
      const nextCounts = {
        ...moveCountsRef.current,
        [player]: moveCountsRef.current[player] + 1,
      };
      moveCountsRef.current = nextCounts;
      setMoveCounts(nextCounts);
    }

    if (cardsMatch(first, card)) {
      later(() => {
        const nextMatched = new Set(matchedRef.current);
        nextMatched.add(first.uid);
        nextMatched.add(uid);
        setMatchedBoth(nextMatched);
        setFlippedBoth([]);
        const isFinalPair = nextMatched.size >= cards.length;
        lockedRef.current = isFinalPair;
        setLocked(isFinalPair);
        memorySounds.match();
        speech.speak(card.symbol.name);

        let luckyBonus = false;
        const activeDifficulty = getDifficulty(settingsRef.current.difficultyId);
        if (activeDifficulty.centerStar) {
          const firstIndex = cards.findIndex((item) => item.uid === first.uid);
          const secondIndex = cards.findIndex((item) => item.uid === uid);
          const nextToLucky =
            isAdjacentToLuckyCell(firstIndex, cards.length, activeDifficulty.columns) ||
            isAdjacentToLuckyCell(secondIndex, cards.length, activeDifficulty.columns);
          if (nextToLucky) {
            luckyBonus = true;
            setLuckyPulse(true);
            later(() => setLuckyPulse(false), 1000);
            if (peeksLeftRef.current < MAX_PEEKS) {
              const nextPeeks = peeksLeftRef.current + 1;
              peeksLeftRef.current = nextPeeks;
              setPeeksLeft(nextPeeks);
              showToast('Lucky Star! +1 peek', 'lucky');
            } else {
              showToast('Lucky Star! Peek is full', 'lucky');
            }
          }
        }

        announce(
          luckyBonus
            ? `${card.symbol.name} matched! Lucky Star, one extra peek`
            : `${card.symbol.name} matched`
        );

        let resolvedScores = scoresRef.current;
        if (settingsRef.current.mode === 'duo') {
          resolvedScores = {
            ...resolvedScores,
            [turnRef.current]: resolvedScores[turnRef.current] + 1,
          };
          scoresRef.current = resolvedScores;
          setScores(resolvedScores);
        }

        if (isFinalPair) {
          later(() => finishGame(nextMoves, resolvedScores), 700);
        }
      }, 480);
      return;
    }

    later(() => {
      memorySounds.mismatch();
      setWobble([first.uid, uid]);
      announce('Not a match');
    }, 380);

    later(() => {
      setFlippedBoth([]);
      setWobble([]);
      lockedRef.current = false;
      setLocked(false);
      if (settingsRef.current.mode === 'duo') {
        const next = turnRef.current === 'teddy' ? 'bunny' : 'teddy';
        turnRef.current = next;
        setTurn(next);
        announce(`${PLAYERS[next].name}'s turn`);
      }
    }, 1050);
  };

  const handlePeek = () => {
    if (
      phaseRef.current !== 'playing' ||
      peekingRef.current ||
      lockedRef.current ||
      peeksLeftRef.current <= 0
    ) {
      return;
    }
    peekingRef.current = true;
    setPeeking(true);
    peeksLeftRef.current -= 1;
    setPeeksLeft(peeksLeftRef.current);
    memorySounds.peek();
    announce('All cards revealed');

    const activeDifficulty = getDifficulty(settingsRef.current.difficultyId);
    const peekDuration =
      activeDifficulty.columns >= 7 ? 3500 : activeDifficulty.columns >= 6 ? 3000 : 2000;
    later(() => {
      peekingRef.current = false;
      setPeeking(false);
    }, peekDuration);
  };

  const closeAlbum = useCallback(() => setAlbumOpen(false), []);

  const closeVictory = useCallback(() => {
    setVictoryOpen(false);
    setShowConfetti(false);
  }, []);

  const dismissHowTo = useCallback(() => {
    setShowHowTo(false);
    try {
      window.localStorage.setItem(ONBOARDED_KEY, 'true');
    } catch {
      // The guide stays dismissed for this session.
    }
  }, []);

  const handlePlayLevel = (nextTheme: ThemeId, nextDifficulty: DifficultyId) => {
    setAlbumOpen(false);
    requestStart({ themeId: nextTheme, difficultyId: nextDifficulty });
  };

  const toggleHeroDark = () => setHeroDark((previous) => !previous);

  const confetti = useMemo(() => {
    if (!showConfetti) return [];
    return Array.from({ length: 46 }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 2.1 + Math.random() * 1.5,
      size: 7 + Math.random() * 8,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      tilt: Math.random() * 360,
    }));
  }, [showConfetti, victory]);

  const victoryDifficultyIndex = victory
    ? DIFFICULTIES.findIndex((item) => item.id === victory.difficultyId)
    : -1;
  const victoryNextLevel =
    victory && !victory.isDaily && victory.stars >= 2 && victoryDifficultyIndex >= 0
      ? DIFFICULTIES[victoryDifficultyIndex + 1]
      : undefined;

  return (
    <div className={`memory-game theme-${themeId} ${isHeroDark ? 'is-hero-dark' : ''}`}>
      <div className="mm-sr-only" aria-live="polite" aria-atomic="true">
        {announcement.text}
      </div>

      <section className="mm-hero">
        <div className="mm-hero-mascots" aria-hidden="true">
          <span>🐻</span>
          <span>🪄</span>
          <span>🐰</span>
        </div>
        <div className="mm-hero-copy">
          <span className="mm-kicker">Kids Corner · Ages 4+</span>
          <h1>
            Memory Match <span className="mm-hero-spark" aria-hidden="true">✨</span>
          </h1>
          <p>{theme.tagline}</p>
        </div>
        <div className="mm-hero-actions">
          <button type="button" className="mm-btn mm-btn-sticker" onClick={() => setAlbumOpen(true)}>
            <span aria-hidden="true">📖</span> Sticker Book
            <span className="mm-count-badge">
              {collectedCount}/{TOTAL_STICKERS}
            </span>
          </button>
          <button
            type="button"
            className={`mm-btn mm-btn-daily ${dailyDoneToday ? 'is-done' : ''}`}
            onClick={() => requestStart({ daily: true })}
            title={`Today: ${todayTheme.shortName} · ${todayDifficulty.name}`}
          >
            <span aria-hidden="true">📅</span> Daily
            <span className="mm-count-badge">
              {dailyDoneToday ? '✅' : activeStreak > 0 ? `🔥 ${activeStreak}` : 'New'}
            </span>
          </button>
          <button type="button" className="mm-btn mm-btn-ghost" onClick={() => requestStart()}>
            <span aria-hidden="true">🔄</span> New Game
          </button>
          <button type="button" className="mm-btn mm-btn-ghost" onClick={() => setShowHowTo(true)}>
            <span aria-hidden="true">❓</span> How to play
          </button>
          {themeId === 'superheroes' && (
            <button
              type="button"
              className={`mm-btn mm-btn-ghost mm-dark-toggle ${heroDark ? 'is-active' : ''}`}
              onClick={toggleHeroDark}
              aria-pressed={heroDark}
              aria-label={heroDark ? 'Switch superheroes to light mode' : 'Switch superheroes to dark mode'}
            >
              <span aria-hidden="true">{heroDark ? '☀️' : '🌙'}</span>
              {heroDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          )}
        </div>
      </section>

      <section className="mm-controls">
        <div className="mm-control-block">
          <span className="mm-section-label">1 · Pick a theme</span>
          <div className="mm-theme-ribbon" role="group" aria-label="Choose a theme">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`mm-theme-pill ${themeId === item.id ? 'is-active' : ''}`}
                onClick={() => requestStart({ themeId: item.id })}
                aria-pressed={themeId === item.id}
              >
                <span className="mm-theme-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mm-controls-row">
          <div className="mm-control-block">
            <span className="mm-section-label">2 · Choose a size</span>
            <div className="mm-pill-row" role="group" aria-label="Choose difficulty">
              {DIFFICULTIES.map((item) => {
                const record = getLevelRecord(progress, themeId, item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={[
                      'mm-pill',
                      difficultyId === item.id ? 'is-active' : '',
                      record ? 'has-best' : '',
                      record?.bestStars === 3 ? 'is-perfect' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => requestStart({ difficultyId: item.id })}
                    aria-pressed={difficultyId === item.id}
                    aria-label={`${item.name}, ${item.gridLabel}${
                      record
                        ? `, best ${record.bestMoves} moves and ${record.bestStars} stars`
                        : ', not played yet'
                    }`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.name}</span>
                    <span className="mm-pill-grid">{item.gridLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mm-control-block">
            <span className="mm-section-label">3 · Who is playing?</span>
            <div className="mm-mode-switch" role="group" aria-label="Choose players">
              <button
                type="button"
                className={mode === 'solo' ? 'is-active' : ''}
                onClick={() => requestStart({ mode: 'solo' })}
                aria-pressed={mode === 'solo'}
              >
                <span aria-hidden="true">🧒</span> Solo
              </button>
              <button
                type="button"
                className={mode === 'duo' ? 'is-active' : ''}
                onClick={() => requestStart({ mode: 'duo' })}
                aria-pressed={mode === 'duo'}
              >
                <span aria-hidden="true">🐻🐰</span> Two players
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mm-scoreboard" aria-label="Game status">
        <div className="mm-score-main">
          {isDuo ? (
            <div className="mm-players">
              {(['teddy', 'bunny'] as PlayerId[]).map((playerId) => (
                <div
                  key={playerId}
                  className={`mm-player-chip ${
                    turn === playerId && phase === 'playing' ? 'is-turn' : ''
                  }`}
                  style={{ '--player-color': PLAYERS[playerId].color } as React.CSSProperties}
                >
                  <span className="mm-player-emoji" aria-hidden="true">
                    {PLAYERS[playerId].emoji}
                  </span>
                  <span className="mm-player-info">
                    <strong>{PLAYERS[playerId].name}</strong>
                    <span>{scores[playerId]} pairs</span>
                  </span>
                  {turn === playerId && phase === 'playing' && (
                    <span className="mm-turn-tag">{PLAYERS[playerId].name}'s turn</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mm-stat-bubbles">
              <div className="mm-stat-bubble">
                <span>Moves</span>
                <strong>{moves}</strong>
              </div>
              <div className="mm-stat-bubble">
                <span>Pairs</span>
                <strong>
                  {pairsFound} / {difficulty.pairs}
                </strong>
              </div>
              <div
                className="mm-stat-bubble mm-best-bubble"
                title={
                  bestRecord
                    ? `Best: ${bestRecord.bestMoves} moves, ${bestRecord.bestStars} stars`
                    : 'No best yet'
                }
              >
                <span>Best</span>
                <strong>{bestRecord ? bestRecord.bestMoves : '—'}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="mm-score-actions">
          {dailyChallenge && activeDailyTheme && (
            <span className="mm-daily-flag">
              📅 Daily · {activeDailyTheme.shortName}
            </span>
          )}
          {isDuo && (
            <span className="mm-duo-pairs">
              {pairsFound} / {difficulty.pairs} pairs
            </span>
          )}
          <button
            type="button"
            className={`mm-wand ${peeking ? 'is-active' : ''}`}
            onClick={handlePeek}
            disabled={peeksLeft <= 0 || locked || peeking || phase !== 'playing'}
            aria-label={`Magic peek helper, ${peeksLeft} peeks left`}
            title="Show every card for a moment"
          >
            <span className="mm-wand-icon" aria-hidden="true">🪄</span>
            <span className="mm-wand-label">Peek</span>
            <span className="mm-wand-count">{peeksLeft}</span>
          </button>
        </div>
      </section>

      <section className={`mm-board-wrap ${peeking ? 'is-peeking' : ''}`}>
        {peeking && (
          <div className="mm-peek-banner" aria-hidden="true">
            ✨ Magic peek! ✨
          </div>
        )}
        <div
          className={[
            'mm-board',
            difficulty.columns >= 5 ? 'is-dense' : '',
            difficulty.columns >= 6 ? 'is-ultra-dense' : '',
            difficulty.columns >= 7 ? 'is-mega-dense' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ '--mm-cols': difficulty.columns } as React.CSSProperties}
        >
          {cards.map((card, index) => (
            <React.Fragment key={card.uid}>
              {difficulty.centerStar && index === cards.length / 2 && (
                <div
                  className={`mm-lucky-cell ${luckyPulse ? 'is-triggered' : ''}`}
                  aria-hidden="true"
                >
                  <span className="mm-lucky-star">⭐</span>
                  <span className="mm-lucky-label">Lucky Star</span>
                </div>
              )}
              <MemoryCardTile
                card={card}
                faceUp={peeking || flipped.includes(card.uid) || matched.has(card.uid)}
                matched={matched.has(card.uid)}
                wobbly={wobble.includes(card.uid)}
                disabled={locked || phase !== 'playing' || peeking}
                peeking={peeking}
                backIcon={theme.backIcon}
                onFlip={handleFlip}
              />
            </React.Fragment>
          ))}
        </div>
      </section>

      {difficulty.centerStar && (
        <p className="mm-lucky-hint">
          Match a card beside the ⭐ Lucky Star to earn an extra peek.
        </p>
      )}

      {victory && !victoryOpen && (
        <div className="mm-complete-bar" role="status">
          <span className="mm-complete-text">
            Board cleared · {'⭐'.repeat(victory.stars)}
          </span>
          <div className="mm-complete-actions">
            <button type="button" className="mm-btn mm-btn-ghost" onClick={() => setVictoryOpen(true)}>
              Results
            </button>
            <button
              type="button"
              className="mm-btn mm-btn-primary"
              onClick={() => startGame(victory.isDaily ? { daily: true } : undefined)}
            >
              Play again
            </button>
          </div>
        </div>
      )}

      {victory && victoryOpen && (
        <Modal
          titleId="mm-victory-title"
          onClose={closeVictory}
          className="mm-victory"
          closeOnBackdrop={false}
          initialFocusSelector=".mm-btn-primary"
          backdropChildren={
            showConfetti ? (
              <div className="mm-confetti" aria-hidden="true">
                {confetti.map((piece) => (
                  <span
                    key={piece.id}
                    className="mm-confetti-piece"
                    style={{
                      left: `${piece.left}%`,
                      width: `${piece.size}px`,
                      height: `${piece.size * 1.6}px`,
                      backgroundColor: piece.color,
                      animationDelay: `${piece.delay}s`,
                      animationDuration: `${piece.duration}s`,
                      transform: `rotate(${piece.tilt}deg)`,
                    }}
                  />
                ))}
              </div>
            ) : null
          }
        >
          <button
            type="button"
            className="mm-close-btn mm-modal-close"
            onClick={closeVictory}
            aria-label="Close results"
          >
            ✕
          </button>

          <div className="mm-stars" aria-label={`${victory.stars} of 3 stars`}>
            {[1, 2, 3].map((star) => (
              <span key={star} className={star <= victory.stars ? 'is-on' : ''} aria-hidden="true">
                ⭐
              </span>
            ))}
          </div>

          <h2 id="mm-victory-title">
            {victory.isDaily && !victory.winner
              ? 'Daily Challenge complete!'
              : victory.winner === 'tie'
                ? "It's a tie!"
                : victory.winner
                  ? `${PLAYERS[victory.winner].emoji} ${PLAYERS[victory.winner].name} wins!`
                  : 'Board cleared!'}
          </h2>
          <p className="mm-victory-line">
            All {getDifficulty(victory.difficultyId).pairs} pairs found.
          </p>

          {victory.isDaily && victory.daily && (
            <p className={`mm-victory-daily ${victory.daily.isNew ? 'is-new' : ''}`}>
              {victory.daily.isNew
                ? `📅 Daily complete · 🔥 ${victory.daily.streak}-day streak`
                : '📅 Already counted today · Practice makes perfect'}
            </p>
          )}

          {victory.isNewBest && <span className="mm-victory-best">New personal best!</span>}

          <div className="mm-victory-sticker">
            <span className="mm-victory-sticker-emoji" aria-hidden="true">
              {victory.sticker.emoji}
            </span>
            <div className="mm-victory-sticker-copy">
              <strong>{victory.sticker.name}</strong>
              <span>{victory.isNew ? 'New sticker unlocked!' : 'Sticker already in your book'}</span>
            </div>
            {victory.isNew && <span className="mm-new-badge">NEW</span>}
          </div>

          {victory.newBadges.length > 0 && (
            <p className="mm-victory-badge-line">🏅 New badge unlocked!</p>
          )}

          <div className="mm-victory-stats">
            {victory.mode === 'duo' ? (
              <>
                <div>
                  <span>Moves</span>
                  <strong>{victory.moves}</strong>
                </div>
                <div>
                  <span>Teddy</span>
                  <strong>{victory.moveCounts.teddy}</strong>
                </div>
                <div>
                  <span>Bunny</span>
                  <strong>{victory.moveCounts.bunny}</strong>
                </div>
                <div>
                  <span>Score</span>
                  <strong>
                    {victory.scores.teddy} – {victory.scores.bunny}
                  </strong>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span>Moves</span>
                  <strong>{victory.moves}</strong>
                </div>
                <div>
                  <span>Pairs</span>
                  <strong>{getDifficulty(victory.difficultyId).pairs}</strong>
                </div>
                <div>
                  <span>Best</span>
                  <strong>{victory.isNewBest ? 'New!' : victory.previousBest ?? '—'}</strong>
                </div>
              </>
            )}
          </div>

          <div className="mm-modal-footer mm-victory-actions">
            <button type="button" className="mm-btn mm-btn-ghost" onClick={() => setAlbumOpen(true)}>
              <span aria-hidden="true">📖</span> Sticker Book
            </button>
            {victoryNextLevel && (
              <button
                type="button"
                className="mm-btn mm-btn-ghost"
                onClick={() => startGame({ difficultyId: victoryNextLevel.id })}
              >
                Next: {victoryNextLevel.name}
              </button>
            )}
            <button
              type="button"
              className="mm-btn mm-btn-primary"
              onClick={() => startGame(victory.isDaily ? { daily: true } : undefined)}
            >
              {victory.isDaily ? 'Practice again' : 'Play again'} <span aria-hidden="true">🎉</span>
            </button>
          </div>
        </Modal>
      )}

      {pendingStart !== null && (
        <Modal
          titleId="mm-restart-title"
          onClose={() => setPendingStart(null)}
          className="mm-restart"
          closeOnBackdrop={false}
          initialFocusSelector=".mm-btn-ghost"
        >
          <div className="mm-modal-head">
            <div>
              <h2 id="mm-restart-title">Start a new game?</h2>
              <p className="mm-modal-sub">
                You have found {pairsFound} of {difficulty.pairs} pairs.
              </p>
            </div>
            <button
              type="button"
              className="mm-close-btn"
              onClick={() => setPendingStart(null)}
              aria-label="Keep playing"
            >
              ✕
            </button>
          </div>
          <p className="mm-restart-copy">
            {pendingStart.daily
              ? "This will replace your current board with today's Daily Challenge."
              : 'Starting over will lose this board.'}
          </p>
          <div className="mm-modal-footer">
            <button type="button" className="mm-btn mm-btn-ghost" onClick={() => setPendingStart(null)}>
              Keep playing
            </button>
            <button type="button" className="mm-btn mm-btn-primary" onClick={confirmPendingStart}>
              Start new game
            </button>
          </div>
        </Modal>
      )}

      {showHowTo && <HowToPlayModal onClose={dismissHowTo} />}

      {albumOpen && (
        <StickerAlbumModal
          stickers={stickers}
          progress={progress}
          onClose={closeAlbum}
          onPlayLevel={handlePlayLevel}
        />
      )}

      {toast && <Toast key={toast.id} text={toast.text} tone={toast.tone} />}
    </div>
  );
};
