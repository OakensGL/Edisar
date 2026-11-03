/* Music (HTMLAudio, looping) + synthesized SFX (WebAudio). Unlocked on first user gesture. */
SL.Audio = (() => {
  const music = new Audio('assets/angel-eyes-vision-ii.mp3');
  music.loop = true; music.preload = 'auto'; music.volume = 0.65;
  let ac = null, master = null, noiseBuf = null, started = false;
  let muted = SL.store.get(SL.CONFIG.storage.muted, '0') === '1';
  music.muted = muted;

  function unlock() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = muted ? 0 : 0.45; master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 1, ac.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    if (!started) { started = true; music.play().catch(() => { started = false; }); }
  }
  function setMuted(m) {
    muted = m; music.muted = m; SL.store.set(SL.CONFIG.storage.muted, m ? '1' : '0');
    if (master) master.gain.value = m ? 0 : 0.45;
  }
  const ok = () => ac && !muted;
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(type, f0, f1, dur, peak) {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, 0.005, peak, dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, f0, f1, peak, q = 0.8) {
    const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'lowpass'; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.004, peak, dur); s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  let lastShot = 0;
  const sfx = {
    shot() { if (!ok()) return; const t = ac.currentTime; if (t - lastShot < 0.05) return; lastShot = t;
      tone('square', 1400, 320, 0.07, 0.05); },
    explode(size = 1) { if (!ok()) return; noise(0.25 + size * 0.3, 2600, 80, 0.35 + size * 0.15); tone('sine', 140, 38, 0.2 + size * 0.2, 0.25 * size); },
    hit() { if (!ok()) return; tone('sawtooth', 420, 50, 0.45, 0.22); noise(0.5, 1800, 60, 0.5); },
    blip(f = 660) { if (!ok()) return; tone('triangle', f, f * 1.5, 0.08, 0.12); },
    deny() { if (!ok()) return; tone('square', 220, 160, 0.15, 0.08); },
    gameOver() { if (!ok()) return; [523, 392, 262].forEach((f, i) => setTimeout(() => ok() && tone('triangle', f, f * 0.98, 0.35, 0.15), i * 220)); },
  };
  return { unlock, setMuted, get muted() { return muted; }, toggleMute() { setMuted(!muted); }, sfx, music };
})();
