import React from 'react';

export type ToastTone = 'info' | 'lucky' | 'best';

interface ToastProps {
  text: string;
  tone?: ToastTone;
}

export const Toast: React.FC<ToastProps> = ({ text, tone = 'info' }) => (
  <div className={`mm-toast mm-toast-${tone}`} role="status" aria-live="polite">
    {text}
  </div>
);
