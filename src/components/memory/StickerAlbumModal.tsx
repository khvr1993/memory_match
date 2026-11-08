import React, { useMemo } from 'react';
import { Modal } from './Modal';
import { getStickerKey } from './gameLogic';
import {
  getBadges,
  getLevelRecord,
  getRecommendedLevel,
  getThemeStars,
  getTotalStars,
  type Progress,
} from './progress';
import {
  DIFFICULTIES,
  THEMES,
  TOTAL_STARS,
  TOTAL_STICKERS,
  getDifficulty,
  getTheme,
} from './themesData';
import type { DifficultyId, StickerRecord, ThemeId } from './types';

interface StickerAlbumModalProps {
  stickers: StickerRecord[];
  progress: Progress;
  onClose: () => void;
  onPlayLevel: (themeId: ThemeId, difficultyId: DifficultyId) => void;
}

export const StickerAlbumModal: React.FC<StickerAlbumModalProps> = ({
  stickers,
  progress,
  onClose,
  onPlayLevel,
}) => {
  const earnedById = useMemo(() => {
    const map = new Map<string, StickerRecord>();
    for (const sticker of stickers) map.set(sticker.id, sticker);
    return map;
  }, [stickers]);

  const stickerCount = useMemo(
    () => stickers.filter((sticker) => THEMES.some((theme) => theme.id === sticker.themeId)).length,
    [stickers]
  );
  const totalStars = getTotalStars(progress);
  const stickerPercent = Math.round(
    (Math.min(stickerCount, TOTAL_STICKERS) / TOTAL_STICKERS) * 100
  );
  const starPercent = Math.round((Math.min(totalStars, TOTAL_STARS) / TOTAL_STARS) * 100);
  const badges = getBadges(progress, stickerCount);
  const earnedBadges = badges.filter((badge) => badge.earned).length;
  const recommended = getRecommendedLevel(progress);
  const recommendedTheme = recommended ? getTheme(recommended.themeId) : null;
  const recommendedDifficulty = recommended ? getDifficulty(recommended.difficultyId) : null;
  const grandCollector = stickerCount >= TOTAL_STICKERS;

  return (
    <Modal titleId="mm-album-title" onClose={onClose} className="mm-album">
      <div className="mm-modal-head">
        <div>
          <h2 id="mm-album-title">📖 My Sticker Book</h2>
          <p className="mm-modal-sub">
            {stickerCount} of {TOTAL_STICKERS} stickers · ⭐ {totalStars} of {TOTAL_STARS} stars
          </p>
        </div>
        <button
          type="button"
          className="mm-close-btn"
          onClick={onClose}
          aria-label="Close sticker book"
        >
          ✕
        </button>
      </div>

      <div className="mm-album-stats" aria-hidden="true">
        <div className="mm-album-stat">
          <span>Stickers</span>
          <strong>
            {stickerCount} / {TOTAL_STICKERS}
          </strong>
        </div>
        <div className="mm-album-stat">
          <span>Stars</span>
          <strong>
            {totalStars} / {TOTAL_STARS}
          </strong>
        </div>
        <div className="mm-album-stat">
          <span>Badges</span>
          <strong>
            {earnedBadges} / {badges.length}
          </strong>
        </div>
      </div>

      <div className="mm-progress" aria-hidden="true">
        <span style={{ width: `${stickerPercent}%` }} />
      </div>
      <div className="mm-progress mm-progress-stars" aria-hidden="true">
        <span style={{ width: `${starPercent}%` }} />
      </div>

      {recommended && recommendedTheme && recommendedDifficulty ? (
        <button
          type="button"
          className="mm-next-goal"
          onClick={() => onPlayLevel(recommended.themeId, recommended.difficultyId)}
        >
          <span className="mm-next-goal-emoji" aria-hidden="true">
            🎯
          </span>
          <span className="mm-next-goal-copy">
            <strong>Next goal</strong>
            <small>
              {recommendedTheme.icon} {recommendedTheme.name} · {recommendedDifficulty.name} ·{' '}
              {recommendedDifficulty.gridLabel}
            </small>
          </span>
          <span className="mm-next-goal-cta">Play</span>
        </button>
      ) : (
        <div className="mm-next-goal is-complete">
          <span className="mm-next-goal-emoji" aria-hidden="true">
            🌟
          </span>
          <span className="mm-next-goal-copy">
            <strong>Every level is a three-star triumph!</strong>
            <small>Pick any board to relive the magic.</small>
          </span>
        </div>
      )}

      {grandCollector && (
        <div className="mm-grand-banner" role="status">
          🎉 Grand Collector! You filled the whole sticker book.
        </div>
      )}

      <section className="mm-album-badges" aria-labelledby="mm-badges-title">
        <h3 id="mm-badges-title">
          <span aria-hidden="true">🏅</span> Badges
          <span className="mm-theme-progress">
            {earnedBadges} / {badges.length}
          </span>
        </h3>
        <div className="mm-badge-grid">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`mm-badge ${badge.earned ? 'is-earned' : 'is-locked'}`}
              aria-label={`${badge.name}, ${badge.earned ? 'earned' : 'locked'}`}
            >
              <span className="mm-badge-emoji" aria-hidden="true">
                {badge.earned ? badge.emoji : '🔒'}
              </span>
              <span className="mm-badge-name">{badge.name}</span>
              <span className="mm-badge-desc">{badge.description}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mm-album-body">
        {THEMES.map((theme) => {
          const themeEarned = DIFFICULTIES.filter((difficulty) =>
            earnedById.has(getStickerKey(theme.id, difficulty.id))
          ).length;
          const themeStars = getThemeStars(progress, theme.id);
          return (
            <section key={theme.id} className="mm-album-theme">
              <h3>
                <span>
                  <span aria-hidden="true">{theme.icon}</span> {theme.name}
                </span>
                <span className="mm-theme-progress">
                  {themeEarned}/{DIFFICULTIES.length} · ⭐ {themeStars}/{DIFFICULTIES.length * 3}
                </span>
              </h3>
              <div className="mm-album-grid">
                {DIFFICULTIES.map((difficulty) => {
                  const key = getStickerKey(theme.id, difficulty.id);
                  const earned = earnedById.get(key);
                  const record = getLevelRecord(progress, theme.id, difficulty.id);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`mm-sticker ${earned ? 'is-earned' : 'is-locked'}`}
                      onClick={() => onPlayLevel(theme.id, difficulty.id)}
                      aria-label={`Play ${theme.name}, ${difficulty.name}${record ? `, best ${record.bestMoves} moves` : ', not played yet'}${earned ? ', sticker earned' : ''}`}
                    >
                      <span className="mm-sticker-emoji" aria-hidden="true">
                        {earned ? earned.emoji : '🔒'}
                      </span>
                      <span className="mm-sticker-name">{difficulty.medalName}</span>
                      <span className="mm-sticker-sub">
                        {record ? `${record.bestMoves} moves` : difficulty.gridLabel}
                      </span>
                      {record && record.bestStars > 0 && (
                        <span className="mm-sticker-stars" aria-hidden="true">
                          {'⭐'.repeat(record.bestStars)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mm-modal-footer">
        <button type="button" className="mm-btn mm-btn-primary" onClick={onClose}>
          Back to the game
        </button>
      </div>
    </Modal>
  );
};
