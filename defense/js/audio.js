/* Music (HTMLAudio, crossfaded) + synthesized SFX (WebAudio). Unlocked on first user gesture. */
SD.Audio = (() => {
  let ac = null, master = null, noiseBuf = null, started = false;
  let muted = SD.store.get(SD.CONFIG.storage.muted, '0') === '1';
  let want = null;
  let fades = {};
  let lastTick = 0;

  const TRACKS = {
    title:  { src: 'assets/space-dimensions-retro.ogg', loop: true,  vol: 0.52 },
    crawl:  { src: 'assets/skyfire.ogg',                 loop: false, vol: 0.48, duration: 53.355 },
    fear:   { src: 'assets/without-fear.ogg',            loop: true,  vol: 0.24 },
    battle: { src: 'assets/battle-in-the-stars.ogg',     loop: true,  vol: 0.24 },
    boss:   { src: 'assets/deathmatch.ogg',              loop: true,  vol: 0.30 },
    score:  { src: 'assets/space-heroes.ogg',            loop: true,  vol: 0.42 },
    win:    { src: 'assets/victory-tune.ogg',            loop: false, vol: 0.50 },
    lose:   { src: 'assets/defeated.ogg',                loop: false, vol: 0.50 },
  };
  const players = {};
  function ensure(id) {
    if (players[id]) return players[id];
    const spec = TRACKS[id];
    const a = new Audio();
    a.preload = 'auto';
    a.src = spec.src;
    a.loop = !!spec.loop;
    a.volume = 0;
    players[id] = a;
    return a;
  }
  Object.keys(TRACKS).forEach(ensure);

  function now() { return performance.now(); }

  function unlock() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    started = true;
    applyMute();
    if (want && !muted) playMusic(want, { restart: false, dur: 0.4 });
  }

  function applyMute() {
    if (master) master.gain.value = muted ? 0 : 0.45;
    for (const id of Object.keys(players)) {
      const p = players[id];
      p.muted = muted;
      if (muted) {
        p.volume = 0;
        try { p.pause(); } catch (e) {}
      }
    }
    if (muted) fades = {};
  }

  function setMuted(m) {
    muted = !!m;
    SD.store.set(SD.CONFIG.storage.muted, muted ? '1' : '0');
    applyMute();
    if (!muted && started && want) playMusic(want, { restart: false, dur: 0.4 });
  }
  function toggleMute() { setMuted(!muted); }

  function fadeTo(id, target, dur) {
    const p = ensure(id);
    fades[id] = { from: p.volume, to: target, t0: now(), dur: Math.max(0.05, dur) * 1000 };
  }

  function playMusic(id, opt = {}) {
    want = id || null;
    if (!id) { stopMusic(opt); return; }
    if (!started || muted) return;
    const spec = TRACKS[id];
    const p = ensure(id);
    p.loop = !!spec.loop;
    const playing = !p.paused && !p.ended;
    if (opt.restart === true) {
      try { p.currentTime = 0; } catch (e) {}
    }
    // One-shot tracks (crawl, jingles) must never auto-restart when they end.
    if (p.ended && !spec.loop && opt.restart !== true) {
      /* leave it finished */
    } else if (!playing || opt.restart === true) {
      const playP = p.play();
      if (playP && playP.catch) playP.catch(() => {});
    }
    const dur = opt.dur ?? 1.0;
    for (const k of Object.keys(players)) {
      fadeTo(k, k === id ? spec.vol : 0, dur);
    }
  }

  function stopMusic(opt = {}) {
    want = null;
    if (!started) return;
    const dur = opt.dur ?? 0.8;
    for (const k of Object.keys(players)) fadeTo(k, 0, dur);
  }

  function playTitle() { playMusic('title'); }
  function stopTitle() { if (want === 'title' || !want) stopMusic(); }
  function playCrawl() { playMusic('crawl', { restart: true }); }
  function playWave(index) {
    if (index >= 9) playMusic('boss');
    else playMusic(index % 2 === 0 ? 'fear' : 'battle');
  }
  function playScore() { playMusic('score'); }
  function playWin() { playMusic('win', { restart: true, dur: 0.7 }); }
  function playLose() { playMusic('lose', { restart: true, dur: 0.7 }); }

  function tick() {
    const t = now();
    if (!lastTick) lastTick = t;
    lastTick = t;
    if (started && ac && ac.state === 'suspended' && !muted) ac.resume();
    if (muted) return;
    for (const id of Object.keys(fades)) {
      const f = fades[id], p = players[id];
      if (!p) { delete fades[id]; continue; }
      const u = Math.min(1, (t - f.t0) / f.dur);
      p.volume = Math.max(0, Math.min(1, f.from + (f.to - f.from) * u));
      if (u >= 1) {
        if (f.to <= 0.001) { p.volume = 0; try { if (!p.paused) p.pause(); } catch (e) {} }
        delete fades[id];
      }
    }
    if (started && want && !muted) {
      const spec = TRACKS[want], p = players[want];
      if (p && spec.loop && p.paused) {
        const playP = p.play();
        if (playP && playP.catch) playP.catch(() => {});
        if (p.volume < (spec.vol * 0.5) && !fades[want]) fadeTo(want, spec.vol, 0.4);
      }
    }
  }

  const ok = () => ac && started && !muted;
  function env(g, t0, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }
  function tone(type, f0, f1, dur, peak) {
    const t0 = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    env(g, t0, 0.006, peak, dur); o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, f0, f1, peak, q = 0.8) {
    const t0 = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = 'lowpass'; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    env(g, t0, 0.004, peak, dur); s.connect(f).connect(g).connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
  }

  let lastShot = 0;
  const sfx = {
    laser() { if (!ok()) return; const t0 = ac.currentTime; if (t0 - lastShot < 0.04) return; lastShot = t0; tone('square', 1600, 420, 0.06, 0.045); },
    missile() { if (!ok()) return; tone('sawtooth', 240, 880, 0.22, 0.08); },
    ice() { if (!ok()) return; tone('sine', 920, 1400, 0.10, 0.06); tone('triangle', 1400, 700, 0.12, 0.04); },
    explode(size = 1) { if (!ok()) return; noise(0.22 + size * 0.25, 2400, 70, 0.28 + size * 0.14); tone('sine', 150, 40, 0.18 + size * 0.15, 0.2 * size); },
    place() { if (!ok()) return; tone('triangle', 520, 880, 0.12, 0.10); },
    upgrade() { if (!ok()) return; [660, 880, 1175].forEach((f, i) => setTimeout(() => ok() && tone('triangle', f, f * 1.05, 0.1, 0.1), i * 60)); },
    sell() { if (!ok()) return; tone('triangle', 700, 280, 0.16, 0.09); },
    deny() { if (!ok()) return; tone('square', 180, 90, 0.16, 0.1); },
    click() { if (!ok()) return; tone('triangle', 880, 1100, 0.05, 0.08); },
    wave() { if (!ok()) return; tone('sawtooth', 220, 660, 0.35, 0.08); [523, 659, 784].forEach((f, i) => setTimeout(() => ok() && tone('square', f, f, 0.1, 0.05), 120 + i * 80)); },
    leak() { if (!ok()) return; tone('sawtooth', 360, 80, 0.4, 0.16); noise(0.35, 900, 80, 0.25); },
    boss() { if (!ok()) return; noise(1.1, 400, 50, 0.45, 0.5); tone('sine', 70, 32, 1.0, 0.35); },
    win() { if (!ok()) return; [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => ok() && tone('triangle', f, f * 1.02, 0.28, 0.12), i * 140)); },
    lose() { if (!ok()) return; tone('sawtooth', 300, 60, 0.8, 0.16); tone('sine', 140, 40, 0.9, 0.2); },
    coin() { if (!ok()) return; tone('triangle', 990, 1320, 0.07, 0.07); },
  };

  return {
    unlock, toggleMute, setMuted,
    playMusic, stopMusic, playTitle, stopTitle, playCrawl, playWave, playScore, playWin, playLose,
    trackDuration: (id) => (TRACKS[id] && TRACKS[id].duration) || 0,
    get muted() { return muted; },
    get started() { return started; },
    tick,
    ...sfx,
  };
})();
