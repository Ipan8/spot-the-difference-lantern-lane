// All sound is synthesised with the Web Audio API: no audio files, no network.
// A found difference gets a two-note chime, a miss a low thud, a cleared round a
// short arpeggio, and the last ten seconds a soft tick each second.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      try {
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        context = Ctor ? new Ctor() : null;
      } catch {
        context = null;
      }
    }
    if (context !== null && context.state === 'suspended') {
      context.resume().catch(() => {});
    }
    return context;
  }

  /** One oscillator note: frequency, start delay, length, shape, volume. */
  function note(freq, delay, length, type, volume) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    const when = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + length + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMuted() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    found() {
      note(659.25, 0, 0.16, 'sine', 0.22);
      note(880.0, 0.09, 0.28, 'sine', 0.22);
    },
    miss() {
      note(110, 0, 0.22, 'triangle', 0.2);
    },
    hint() {
      note(523.25, 0, 0.12, 'sine', 0.14);
    },
    tick() {
      note(1046.5, 0, 0.05, 'square', 0.05);
    },
    roundClear() {
      note(523.25, 0, 0.14, 'sine', 0.2);
      note(659.25, 0.11, 0.14, 'sine', 0.2);
      note(783.99, 0.22, 0.14, 'sine', 0.2);
      note(1046.5, 0.33, 0.3, 'sine', 0.22);
    },
    gameOver() {
      note(392.0, 0, 0.2, 'sine', 0.18);
      note(329.63, 0.16, 0.34, 'sine', 0.18);
    },
  };
}
