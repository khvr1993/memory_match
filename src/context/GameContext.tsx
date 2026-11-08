import React, { createContext, useCallback, useContext, useState } from 'react';

const SOUND_STORAGE_KEY = 'memory_match_sound';
const VOICE_STORAGE_KEY = 'memory_match_voice';

interface GameContextValue {
  soundEnabled: boolean;
  toggleSound: () => void;
  voiceEnabled: boolean;
  toggleVoice: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // The toggle still works for this session when storage is unavailable.
  }
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => readFlag(SOUND_STORAGE_KEY, true));
  const [voiceEnabled, setVoiceEnabled] = useState(() => readFlag(VOICE_STORAGE_KEY, false));

  const toggleSound = useCallback(() => {
    setSoundEnabled((previous) => {
      const next = !previous;
      writeFlag(SOUND_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((previous) => {
      const next = !previous;
      writeFlag(VOICE_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <GameContext.Provider value={{ soundEnabled, toggleSound, voiceEnabled, toggleVoice }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
