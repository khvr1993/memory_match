import React from 'react';
import { useGame } from './context/GameContext';
import { MemoryMatchGame } from './components/memory/MemoryMatchGame';
import './components/memory/memory.css';

export default function App() {
  const { soundEnabled, toggleSound } = useGame();

  return (
    <div className="mm-app">
      <header className="mm-app-bar">
        <div className="mm-brand">
          <span className="mm-brand-badge" aria-hidden="true">
            🃏
          </span>
          <span className="mm-brand-copy">
            <strong>Memory Match</strong>
            <small>Kids Corner</small>
          </span>
        </div>
        <button
          type="button"
          className="mm-sound-btn"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
        >
          <span aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
          <span className="mm-sound-label">{soundEnabled ? 'Sound on' : 'Sound off'}</span>
        </button>
      </header>

      <main className="mm-main">
        <MemoryMatchGame />
      </main>

      <footer className="mm-footer">
        <span>Made for little memory superstars ✨</span>
      </footer>
    </div>
  );
}
