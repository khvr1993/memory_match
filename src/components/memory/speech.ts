class Speech {
  enabled = false;

  speak(text: string): void {
    if (!this.enabled || typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      utterance.lang = 'en-US';
      synth.speak(utterance);
    } catch {
      // Voice is a bonus, never a blocker.
    }
  }

  stop(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Nothing to cancel.
    }
  }
}

export const speech = new Speech();
