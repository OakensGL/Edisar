/* Music (HTMLAudio, looping) + synthesized SFX (WebAudio). Unlocked on first user gesture. */
SL.Audio = (() => {
  // Music tracks (all files used unmodified; credits in CREDITS.txt)
  const TRACKS = { main: 'assets/angel-eyes-vision-ii.mp3', boss: 'assets/helldrake-extended.ogg', clear: 'assets/the-last-encounter-mix.ogg',
    // v0.5.0 final level + end credits
    finalIntro: 'assets/last-one-standing-6_initial_0.ogg', finalBoss: 'assets/last-one-standing-6low_0.ogg', credits: 'assets/full-moon-mix.ogg' };
  const BASE_VOL = 0.65;
  /* v0.4.1 music fix: ONE <audio> element for every track. Mobile browsers only let an element play once it has
     been started inside a user gesture; v0.4 used three elements, so the boss/clear elements (first played from the
     game loop) and the main element after a hand-back could be blocked silently. Now the single element is unlocked
     on the first tap/key and simply swaps src. A watchdog + gesture/visibility hooks resume it if anything pauses it,
     and tracks the browser can't decode (.ogg on older Safari) fall back to the main track. */
  let ac = null, master = null, noiseBuf = null, started = false, want = 'main', loaded = null;
  let muted = SL.store.get(SL.CONFIG.storage.muted, '0') === '1';
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const loadUser = k => { const v = parseFloat(SL.store.get(k, '100')); return clamp01((isNaN(v) ? 100 : v) / 100); };
  let musicUser = loadUser(SL.CONFIG.storage.music), sfxUser = loadUser(SL.CONFIG.storage.sfx), fade = 1;
  let musicOn = SL.store.get(SL.CONFIG.storage.musicOn, SL.store.get(SL.CONFIG.storage.muted, '0') === '1' ? '0' : '1') !== '0';
  const player = new Audio(); player.loop = true; player.preload = 'auto'; player.volume = BASE_VOL; player.muted = muted;
  const oggOK = !!player.canPlayType('audio/ogg; codecs="vorbis"');
  const bad = new Set();                          // tracks that failed to decode on this browser
  const resolve = k => (!TRACKS[k] || bad.has(k) || (!oggOK && /\.ogg$/.test(TRACKS[k]))) ? 'main' : k;
  let lastT = -1, stuck = 0;
  function load(k) {
    if (loaded === k) return;
    loaded = k; player.src = TRACKS[k];            // each track (re)starts from the top when it comes back
    lastT = -1; stuck = 0;
  }
  function ensure() {
    if (!started) return;
    const k = resolve(want); load(k);
    if (player.paused || player.ended) player.play().catch(() => {});
  }
  function playTrack(k) { want = k; ensure(); }
  player.addEventListener('error', () => { if (loaded && loaded !== 'main') { bad.add(loaded); loaded = null; ensure(); } });
  player.addEventListener('ended', () => { try { player.currentTime = 0; } catch (e) {} ensure(); });   // belt & braces if loop is ignored
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ensure(); });
  addEventListener('pageshow', ensure); addEventListener('focus', ensure);
  // watchdog: called from the main loop
  function tick(dt) {
    if (!started || document.hidden) return;
    if (player.paused || player.ended) { stuck += dt; if (stuck > 0.5) { stuck = 0; ensure(); } return; }
    if (player.readyState >= 3 && player.currentTime === lastT) { stuck += dt; if (stuck > 3) { stuck = 0; player.play().catch(() => {}); } }
    else stuck = 0;
    lastT = player.currentTime;
  }

  function unlock() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.connect(ac.destination); applyVol();
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 1, ac.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    loadSamples();
    started = true; ensure();        // every gesture re-asserts playback (also re-unlocks after a mobile tab switch)
  }
  function applyVol() {
    player.muted = false;                                   // music on/off is volume, never pause (watchdog stays happy)
    player.volume = fade * musicUser * (musicOn ? 1 : 0) * BASE_VOL;  // fade (level-30 silence) * slider * speaker
    if (master) master.gain.value = 0.45 * sfxUser;
  }
  function setMusicOn(on) { musicOn = !!on; SL.store.set(SL.CONFIG.storage.musicOn, musicOn ? '1' : '0'); applyVol(); }
  function toggleMusic() { setMusicOn(!musicOn); }
  function setMuted(m) { setMusicOn(!m); }                  // v0.5.5: mute/M = music on/off (SFX stays on the SFX slider)

  function setMusicUser(v) { musicUser = clamp01(v); SL.store.set(SL.CONFIG.storage.music, String(Math.round(musicUser * 100))); applyVol(); }
  function setSfxUser(v) { sfxUser = clamp01(v); SL.store.set(SL.CONFIG.storage.sfx, String(Math.round(sfxUser * 100))); applyVol(); }
  applyVol();
  const ok = () => ac && sfxUser > 0.001;
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(type, f0, f1, dur, peak) {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, 0.005, peak, dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, f0, f1, peak, q = 0.8) {
    const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = 'lowpass'; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.004, peak, dur); s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  /* v0.5.2 sampled SFX (assets/*.ogg, CC0, synthesized for Project Starlight). Decoded into the same WebAudio graph
     (master gain -> mute + iOS unlock path). If a file can't load (e.g. file://), the old synth version plays instead. */
  const SAMPLES = { avrillBoom: ['assets/avrill-explosion.ogg', 0.95], thunderBig: ['assets/thunder-strike.ogg', 0.9], thunderShort: ['assets/thunder-short.ogg', 0.42], rumble: ['assets/edisar-rumble.ogg', 0.88] };
  const bufs = {}; let sampLoading = false;
  function loadSamples() {
    if (sampLoading || !ac || !window.fetch) return; sampLoading = true;
    for (const [k, [url]] of Object.entries(SAMPLES)) {
      fetch(url).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(ab => new Promise((res, rej) => { const pr = ac.decodeAudioData(ab, res, rej); if (pr && pr.catch) pr.catch(rej); }))
        .then(b => { bufs[k] = b; }).catch(() => {});
    }
  }
  function sample(k) {
    const b = bufs[k]; if (!b) return false;
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; g.gain.value = SAMPLES[k][1];
    s.connect(g).connect(master); s.start(); return true;
  }
  let lastShot = 0, lastBolt = 0;
  const sfx = {
    shot() { if (!ok()) return; const t = ac.currentTime; if (t - lastShot < 0.05) return; lastShot = t;
      tone('square', 1400, 320, 0.07, 0.05); },
    explode(size = 1) { if (!ok()) return; noise(0.25 + size * 0.3, 2600, 80, 0.35 + size * 0.15); tone('sine', 140, 38, 0.2 + size * 0.2, 0.25 * size); },
    hit() { if (!ok()) return; tone('sawtooth', 420, 50, 0.45, 0.22); noise(0.5, 1800, 60, 0.5); },
    blip(f = 660) { if (!ok()) return; tone('triangle', f, f * 1.5, 0.08, 0.12); },
    pickup() { if (!ok()) return; [660, 880, 1320].forEach((f, i) => setTimeout(() => ok() && tone('triangle', f, f * 1.02, 0.09, 0.12), i * 55)); },
    launch() { if (!ok()) return; tone('sawtooth', 200, 900, 0.3, 0.1); },
    boom() { if (!ok()) return; noise(1.4, 3000, 40, 0.8, 0.5); tone('sine', 90, 25, 1.0, 0.5); },
    assist() { if (!ok()) return; tone('sawtooth', 220, 1760, 0.6, 0.08); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => ok() && tone('square', f, f, 0.12, 0.06), 150 + i * 90)); },
    ready() { if (!ok()) return; tone('triangle', 880, 1760, 0.25, 0.1); },
    tick() { if (!ok()) return; tone('square', 1800, 1700, 0.025, 0.04); },
    alarm() { if (!ok()) return; [0, 1, 2].forEach(i => setTimeout(() => ok() && tone('sawtooth', 440, 330, 0.25, 0.09), i * 320)); },
    bossHit() { if (!ok()) return; tone('square', 300, 180, 0.05, 0.05); },
    ebullet() { if (!ok()) return; tone('triangle', 520, 260, 0.08, 0.03); },
    zap() { if (!ok()) return; noise(0.35, 9000, 900, 0.6, 2); tone('sawtooth', 1800, 90, 0.3, 0.12); },
    thunder() { if (!ok()) return; noise(1.0, 6000, 200, 0.7, 1.2); setTimeout(() => ok() && noise(1.0, 900, 50, 0.6, 0.6), 160); tone('sine', 70, 28, 1.4, 0.45); },
    avrillBoom() { if (!ok()) return; if (!sample('avrillBoom')) { this.boom(); tone('sine', 60, 22, 2.2, 0.5); } },
    thunderBig() { if (!ok()) return; if (!sample('thunderBig')) { this.thunder(); this.zap(); } },
    thunderShort() { if (!ok()) return; const t = ac.currentTime; if (t - lastBolt < 0.25) return; lastBolt = t; if (!sample('thunderShort')) this.zap(); },
    rumble() { if (!ok()) return; if (!sample('rumble')) { noise(5.5, 180, 30, 0.7, 0.4); tone('sine', 36, 22, 5.5, 0.4); } },
    warn() { if (!ok()) return; tone('square', 1200, 1150, 0.08, 0.04); },
    whoosh() { if (!ok()) return; noise(1.3, 400, 5000, 0.45, 1.6); tone('sawtooth', 110, 1500, 1.0, 0.07); tone('sine', 60, 220, 0.9, 0.18); },
    deny() { if (!ok()) return; tone('square', 220, 160, 0.15, 0.08); },
    gameOver() { if (!ok()) return; [523, 392, 262].forEach((f, i) => setTimeout(() => ok() && tone('triangle', f, f * 0.98, 0.35, 0.15), i * 220)); },
  };
  return { unlock, setMuted, get muted() { return !musicOn; }, toggleMute() { toggleMusic(); }, sfx, playTrack,
    preload() {}, tick,
    /* fade: 0..1 dramatic silence / credits fade (independent of the user Music slider). Watchdog never pauses. */
    setMusicVolume(k) { fade = clamp01(k); applyVol(); }, get musicVolume() { return fade; },
    setMusicUser, setSfxUser, get musicUser() { return musicUser; }, get sfxUser() { return sfxUser; },
    setMusicOn, toggleMusic, get musicOn() { return musicOn; },
    get track() { return resolve(want); }, get samplesLoaded() { return Object.keys(bufs); }, get wanted() { return want; }, get music() { return player; } };
})();

/* v0.5.5: top-corner speaker (music on/off) + settings gear (Music/SFX sliders). Shared on title, map, and in-game. */
SL.Vol = (() => {
  let drag = null, open = false;
  const closeBtn = { label: 'CLOSE', x: 512, y: 412, w: 180, h: 40, rgb: '160,200,255', size: 16 };
  const panel = { x: 512, y: 300, w: 420, h: 280 };
  const bars = [
    { id: 'music', label: 'MUSIC', x: 512, y: 278, w: 300 },
    { id: 'sfx',   label: 'SFX',   x: 512, y: 338, w: 300 },
  ];
  function hidden() {
    if (SL.state === 'credits') return true;
    if (SL.game && (SL.game.state === 'cutscene' || SL.game.state === 'warp')) return true;
    if (SL.state === 'map' && SL.Map && (SL.Map.phase === 'entry' || SL.Map.phase === 'table')) return true;
    return false;
  }
  function inGame() { return !!(SL.game && SL.state !== 'title' && SL.state !== 'map' && SL.state !== 'credits'); }
  function speakerBtn() { return inGame() ? { x: 900, y: 26, w: 44, h: 36 } : { x: 948, y: 26, w: 44, h: 36 }; }
  function gearBtn()     { return inGame() ? { x: 948, y: 26, w: 44, h: 36 } : { x: 996, y: 26, w: 44, h: 36 }; }
  function value(id) { return id === 'music' ? SL.Audio.musicUser : SL.Audio.sfxUser; }
  function setv(id, v) { id === 'music' ? SL.Audio.setMusicUser(v) : SL.Audio.setSfxUser(v); }
  function hitBar(bar, p) { return Math.abs(p.x - bar.x) <= bar.w / 2 + 18 && Math.abs(p.y - bar.y) <= 22; }
  function setFromX(bar, x) { setv(bar.id, (x - (bar.x - bar.w / 2)) / bar.w); }
  function inPanel(p) { return Math.abs(p.x - panel.x) <= panel.w / 2 && Math.abs(p.y - panel.y) <= panel.h / 2; }
  function openPanel() {
    if (hidden()) return;
    open = true; drag = null; SL.Audio.sfx.blip(700);
    if (SL.game && SL.game.state === 'play') SL.game.pause(true);
  }
  function close() { if (!open) return; open = false; drag = null; SL.Audio.sfx.blip(520); }
  function handle(downs) {
    if (hidden()) return;
    for (const d of downs) {
      if (open) {
        if (SL.inBtn(closeBtn, d)) { close(); d.role = 'ui'; continue; }
        let onBar = false;
        for (const bar of bars) if (hitBar(bar, d)) { drag = { id: bar.id, pid: d.id }; setFromX(bar, d.x); d.role = 'ui'; onBar = true; }
        if (!onBar) { if (!inPanel(d)) close(); d.role = 'ui'; }
        continue;
      }
      if (SL.inBtn(speakerBtn(), d)) { SL.Audio.toggleMusic(); SL.Audio.sfx.blip(520); d.role = 'ui'; continue; }
      if (SL.inBtn(gearBtn(), d)) { openPanel(); d.role = 'ui'; }
    }
  }
  function tick() {
    if (!drag) return;
    let ptr = null; SL.Input.pointers.forEach(p => { if (p.id === drag.pid) ptr = p; });
    if (!ptr) { drag = null; return; }
    const bar = bars.find(b => b.id === drag.id); if (bar) setFromX(bar, ptr.x);
  }
  function keys(I) {
    if (I.hit('KeyM')) { SL.Audio.toggleMusic(); SL.Audio.sfx.blip(520); }
    if (open && I.hitAny('Escape', 'Backspace')) { close(); return true; }
    return open;
  }
  function iconBtn(g, b, hot) {
    g.save(); SL.roundRect(g, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 7); g.fillStyle = 'rgba(8,4,20,0.72)'; g.fill();
    g.strokeStyle = hot ? 'rgba(255,80,220,0.95)' : 'rgba(160,200,255,0.7)'; g.lineWidth = 1.5; g.stroke(); g.restore();
  }
  function drawSpeaker(g, b) {
    const on = SL.Audio.musicOn, mx = b.x - 4, my = b.y;
    iconBtn(g, b, false);
    g.save(); g.translate(0.5, 0);
    g.beginPath(); g.moveTo(mx - 10, my - 6); g.lineTo(mx - 4, my - 6); g.lineTo(mx + 4, my - 12); g.lineTo(mx + 4, my + 12); g.lineTo(mx - 4, my + 6); g.lineTo(mx - 10, my + 6); g.closePath();
    g.fillStyle = on ? 'rgba(220,235,255,0.95)' : 'rgba(255,120,150,0.95)'; g.fill();
    if (on) {
      g.strokeStyle = 'rgba(200,225,255,0.95)'; g.lineWidth = 1.8; g.lineCap = 'round';
      g.beginPath(); g.arc(mx + 5, my, 6, -0.85, 0.85); g.stroke();
      g.beginPath(); g.arc(mx + 5, my, 10, -0.85, 0.85); g.stroke();
    } else {
      g.strokeStyle = 'rgba(255,90,140,1)'; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(mx - 12, my - 11); g.lineTo(mx + 14, my + 11); g.stroke();
    }
    g.restore();
  }
  function drawGear(g, b) {
    iconBtn(g, b, open);
    const x = b.x, y = b.y, R = 9, r = 4.2, n = 8;
    g.save(); g.translate(x, y); if (open) g.rotate(0.2);
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n, a0 = a - 0.18, a1 = a + 0.18, a2 = a + Math.PI / n - 0.18, a3 = a + Math.PI / n + 0.18;
      const fn = (ang, rad, op) => g[op](Math.cos(ang) * rad, Math.sin(ang) * rad);
      fn(a0, R, i ? 'lineTo' : 'moveTo'); fn(a1, R, 'lineTo'); fn(a2, R * 0.72, 'lineTo'); fn(a3, R * 0.72, 'lineTo');
    }
    g.closePath(); g.fillStyle = open ? 'rgba(255,180,230,0.95)' : 'rgba(200,225,255,0.95)'; g.fill();
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = 'rgba(8,4,20,0.95)'; g.fill();
    g.restore();
  }
  function drawSlider(g, bar) {
    const x0 = bar.x - bar.w / 2, y = bar.y, v = value(bar.id), rgb = bar.id === 'music' ? '120,200,255' : '255,80,220';
    SL.neonText(g, bar.label, x0, y - 18, 13, rgb, { align: 'left', blur: 5, alpha: 0.95 });
    SL.neonText(g, Math.round(v * 100) + '%', x0 + bar.w, y - 18, 13, '220,230,255', { align: 'right', blur: 4, alpha: 0.85 });
    g.fillStyle = 'rgba(4,6,18,0.9)'; SL.roundRect(g, x0, y - 8, bar.w, 16, 8); g.fill();
    g.strokeStyle = `rgba(${rgb},0.55)`; g.lineWidth = 1; SL.roundRect(g, x0, y - 8, bar.w, 16, 8); g.stroke();
    if (v > 0.01) { g.fillStyle = `rgba(${rgb},0.9)`; g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = 8 * (SL.view ? SL.view.scale : 1); SL.roundRect(g, x0 + 1, y - 7, Math.max(8, (bar.w - 2) * v), 14, 7); g.fill(); g.shadowBlur = 0; }
    const kx = x0 + v * bar.w;
    g.beginPath(); g.arc(kx, y, 12, 0, Math.PI * 2); g.fillStyle = '#fff'; g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = 10 * (SL.view ? SL.view.scale : 1); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = `rgba(${rgb},1)`; g.lineWidth = 2; g.stroke();
  }
  function drawPanel(g, t) {
    g.fillStyle = 'rgba(3,1,12,0.45)'; g.fillRect(0, 0, SL.W, SL.H);
    const x = panel.x - panel.w / 2, y = panel.y - panel.h / 2;
    g.save(); SL.roundRect(g, x, y, panel.w, panel.h, 16); g.fillStyle = 'rgba(6,3,18,0.96)'; g.fill();
    g.strokeStyle = 'rgba(170,90,255,0.7)'; g.lineWidth = 2; g.shadowColor = 'rgba(170,90,255,0.8)'; g.shadowBlur = 14 * (SL.view ? SL.view.scale : 1); g.stroke(); g.restore();
    SL.neonText(g, 'SETTINGS', 512, y + 36, 26, '255,80,220', { blur: 16 });
    bars.forEach(bar => drawSlider(g, bar));
    SL.drawButton(g, closeBtn, false, t || 0);
  }
  function drawChrome(g, t) {
    if (hidden()) return;
    drawSpeaker(g, speakerBtn());
    drawGear(g, gearBtn());
    if (open) drawPanel(g, t);
  }
  return { handle, tick, keys, openPanel, close, drawChrome, get open() { return open; }, speakerBtn, gearBtn };
})();
