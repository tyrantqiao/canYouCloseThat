let context: AudioContext | null = null;

// A short, synthesized desktop alert; no audio files or network requests.
export function ringPopupBell() {
  try {
    context ??= new AudioContext();
    const audio = context;
    const play = () => {
      if (audio.state !== 'running') return;
      const start = audio.currentTime;
      for (const [offset, frequency] of [[0, 880], [.14, 660]]) {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, start + offset);
        gain.gain.setValueAtTime(0, start + offset);
        gain.gain.linearRampToValueAtTime(.075, start + offset + .008);
        gain.gain.exponentialRampToValueAtTime(.001, start + offset + .28);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start + offset);
        oscillator.stop(start + offset + .3);
      }
    };
    if (audio.state === 'suspended') void audio.resume().then(play).catch(() => {});
    else play();
  } catch { /* Keep the game playable when browser audio is unavailable. */ }
}
