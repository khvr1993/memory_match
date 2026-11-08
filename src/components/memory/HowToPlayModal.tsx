import React from 'react';
import { Modal } from './Modal';

interface HowToPlayModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    emoji: '🃏',
    title: 'Flip two cards',
    copy: 'Tap a card to turn it over, then tap one more.',
  },
  {
    emoji: '💞',
    title: 'Find the pairs',
    copy: 'Two matching cards stay face up. Find every pair to win.',
  },
  {
    emoji: '📖',
    title: 'Collect stickers',
    copy: 'Finish a board to earn a shiny sticker for your book.',
  },
  {
    emoji: '⭐',
    title: 'Beat your best',
    copy: 'Fewer moves earn more stars. Three stars is a perfect run!',
  },
];

const TIPS = [
  { emoji: '🪄', copy: 'Peek shows every card for a moment. You get two peeks each game.' },
  { emoji: '🌟', copy: 'On Legend and Mythic, match beside the Lucky Star to earn an extra peek.' },
  { emoji: '📅', copy: 'The Daily Challenge is the same board for everyone each day.' },
  { emoji: '🐻🐰', copy: 'In two-player mode, a match keeps your turn. A miss passes it on.' },
];

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => (
  <Modal
    titleId="mm-howto-title"
    onClose={onClose}
    className="mm-howto"
    initialFocusSelector=".mm-btn-primary"
  >
    <div className="mm-modal-head">
      <div>
        <h2 id="mm-howto-title">How to play</h2>
        <p className="mm-modal-sub">A quick guide for little memory superstars</p>
      </div>
      <button type="button" className="mm-close-btn" onClick={onClose} aria-label="Close how to play">
        ✕
      </button>
    </div>

    <div className="mm-howto-grid">
      {STEPS.map((step, index) => (
        <div key={step.title} className="mm-howto-step">
          <span className="mm-howto-index">{index + 1}</span>
          <span className="mm-howto-emoji" aria-hidden="true">
            {step.emoji}
          </span>
          <strong>{step.title}</strong>
          <span>{step.copy}</span>
        </div>
      ))}
    </div>

    <div className="mm-howto-tips">
      {TIPS.map((tip) => (
        <div key={tip.copy} className="mm-howto-tip">
          <span aria-hidden="true">{tip.emoji}</span>
          <span>{tip.copy}</span>
        </div>
      ))}
    </div>

    <div className="mm-modal-footer">
      <button type="button" className="mm-btn mm-btn-primary" onClick={onClose}>
        Let's play
      </button>
    </div>
  </Modal>
);
