import React, { createContext, useCallback, useContext, useState } from 'react';

interface GameContextValue {
  soundEnabled: boolean;
  toggleSound: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

function readSoundPreference(): boolean {
  try {
    return localStorage.getItem('memory_match_sound') !== 'false';
  } catch {
    return true;
  }
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(readSoundPreference);

  const toggleSound = useCallback(() => {
    setSoundEnabled((previous) => {
      const next = !previous;
      try {
        localStorage.setItem('memory_match_sound', String(next));
      } catch {
        // Sound still toggles for this session when storage is unavailable.
      }
      return next;
    });
  }, []);

  return (
    <GameContext.Provider value={{ soundEnabled, toggleSound }}>{children}</GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
