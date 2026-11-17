/* GOTICO — gothic run-and-gun. Original characters and art. */
(() => {
  const W = 320, H = 180, GROUND = 156, TILE = 16;
  const LEVEL_W = 3480, ARENA_X = 3160, ARENA_W = 320;
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const wrap = document.getElementById('wrap');

  /* ---------------- canvas scale ---------------- */
  let scale = 2, ox = 0, oy = 0;
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.max(1, Math.floor(Math.min(vw / W, vh / H)));
    cv.style.width = (W * scale) + 'px';
    cv.style.height = (H * scale) + 'px';
    const r = cv.getBoundingClientRect();
    ox = r.left; oy = r.top;
  }
  addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200)); fit();

  /* ---------------- input ---------------- */
  const keys = Object.create(null), tapped = Object.create(null);
  const hold = { l: 0, r: 0, u: 0, d: 0, jump: 0, shoot: 0, bomb: 0, pause: 0, start: 0 };
  const just = { jump: 0, bomb: 0, pause: 0, start: 0, left: 0, right: 0 };
  function bind(map) {
    addEventListener('keydown', e => {
      if (map[e.code]) { e.preventDefault(); if (!keys[e.code]) tapped[e.code] = 1; keys[e.code] = 1; }
    });
    addEventListener('keyup', e => { if (map[e.code]) { e.preventDefault(); keys[e.code] = 0; } });
  }
  bind({
    ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1,
    KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1,
    KeyZ: 1, Space: 1, KeyX: 1, KeyJ: 1, ControlLeft: 1, ControlRight: 1,
    KeyC: 1, KeyK: 1, ShiftLeft: 1, ShiftRight: 1,
    KeyP: 1, Escape: 1, Enter: 1, NumpadEnter: 1,
  });
  function pollKeys() {
    hold.l = keys.ArrowLeft || keys.KeyA;
    hold.r = keys.ArrowRight || keys.KeyD;
    hold.u = keys.ArrowUp || keys.KeyW;
    hold.d = keys.ArrowDown || keys.KeyS;
    hold.jump = keys.KeyZ || keys.Space || keys.ArrowUp || keys.KeyW;
    hold.shoot = keys.KeyX || keys.KeyJ || keys.ControlLeft || keys.ControlRight;
    hold.bomb = keys.KeyC || keys.KeyK || keys.ShiftLeft || keys.ShiftRight;
    hold.pause = keys.KeyP || keys.Escape;
    hold.start = keys.Enter || keys.NumpadEnter || keys.Space || keys.KeyX || keys.KeyZ;
    just.bomb = just.bomb || tapped.KeyC || tapped.KeyK || tapped.ShiftLeft || tapped.ShiftRight;
    just.pause = just.pause || tapped.KeyP || tapped.Escape;
    just.start = just.start || tapped.Enter || tapped.NumpadEnter || tapped.Space || tapped.KeyX || tapped.KeyZ;
    just.left = just.left || tapped.ArrowLeft || tapped.KeyA;
    just.right = just.right || tapped.ArrowRight || tapped.KeyD;
    if (hold.shoot) just.jump = just.jump || tapped.KeyZ || tapped.Space;
    else just.jump = just.jump || tapped.KeyZ || tapped.Space || tapped.ArrowUp || tapped.KeyW;
    for (const k in tapped) tapped[k] = 0;
  }

  /* touch */
  const touchEl = document.getElementById('touch');
  let touchMode = false;
  const btn = {
    l: document.getElementById('btnL'),
    r: document.getElementById('btnR'),
    jump: document.getElementById('btnJump'),
    shoot: document.getElementById('btnShoot'),
    bomb: document.getElementById('btnBomb'),
    pause: document.getElementById('btnPause'),
  };
  const tHold = { l: 0, r: 0, jump: 0, shoot: 0, bomb: 0 };
  function setHeld(el, on) { el.classList.toggle('held', !!on); }
  function bindBtn(el, name, isJust) {
    const go = e => { e.preventDefault(); touchMode = true; touchEl.classList.add('on'); tHold[name] = 1; setHeld(el, 1); if (isJust) just[isJust] = 1; };
    const up = e => { e.preventDefault(); tHold[name] = 0; setHeld(el, 0); };
    el.addEventListener('pointerdown', go);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }
  bindBtn(btn.l, 'l'); bindBtn(btn.r, 'r');
  bindBtn(btn.jump, 'jump', 'jump');
  bindBtn(btn.shoot, 'shoot');
  bindBtn(btn.bomb, 'bomb', 'bomb');
  btn.pause.addEventListener('pointerdown', e => { e.preventDefault(); touchMode = true; touchEl.classList.add('on'); just.pause = 1; });
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') { touchMode = true; touchEl.classList.add('on'); }
  }, { once: false });
  // canvas tap = start / confirm when no button
  cv.addEventListener('pointerdown', e => {
    touchMode = touchMode || e.pointerType === 'touch'; if (touchMode) touchEl.classList.add('on');
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / scale, y = (e.clientY - r.top) / scale;
    if (state === 'title') {
      if (y > 100 && y < 168) {
        const next = x < W / 2 ? 0 : 1;
        if (sel === next) just.start = 1;
        else { sel = next; sfx.ui(); }
      } else just.start = 1;
      return;
    }
    just.start = 1;
  });
  function mergeTouch() {
    if (!touchMode) return;
    hold.l = hold.l || tHold.l; hold.r = hold.r || tHold.r;
    hold.jump = hold.jump || tHold.jump; hold.shoot = hold.shoot || tHold.shoot; hold.bomb = hold.bomb || tHold.bomb;
  }

  /* ---------------- audio (tiny synth) ---------------- */
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ac = null;
  function audio() { if (!ac) ac = new AudioCtx(); if (ac.state === 'suspended') ac.resume(); return ac; }
  addEventListener('pointerdown', () => audio(), { once: true });
  addEventListener('keydown', () => audio(), { once: true });
  function beep(freq, dur, type, vol, slide) {
    if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq) {
    if (!ac) return;
    const t = ac.currentTime, n = 2 * ac.sampleRate * dur | 0, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 800; f.Q.value = 0.6;
    const g = ac.createGain(); g.gain.setValueAtTime(vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t); src.stop(t + dur + 0.02);
  }
  const sfx = {
    shoot() { beep(880, 0.05, 'square', 0.05, 420); },
    heavy() { beep(220, 0.1, 'sawtooth', 0.07, 80); noise(0.08, 0.08, 400); },
    jump() { beep(280, 0.12, 'square', 0.06, 520); },
    land() { noise(0.05, 0.05, 200); },
    hit() { beep(140, 0.1, 'square', 0.07, 60); noise(0.08, 0.08, 300); },
    boom() { noise(0.28, 0.18, 180); beep(90, 0.25, 'sawtooth', 0.08, 40); },
    bone() { beep(520, 0.08, 'triangle', 0.05, 180); },
    bat() { beep(980, 0.07, 'square', 0.04, 1400); },
    rescue() { beep(520, 0.12, 'square', 0.07, 780); setTimeout(() => beep(780, 0.16, 'square', 0.07, 1040), 80); },
    pickup() { beep(660, 0.1, 'square', 0.06, 990); },
    die() { beep(200, 0.35, 'sawtooth', 0.08, 50); },
    slam() { noise(0.3, 0.2, 120); beep(60, 0.3, 'sine', 0.1, 30); },
    ui() { beep(620, 0.06, 'square', 0.05); },
    ok() { beep(520, 0.08, 'square', 0.06, 880); },
    hurtE() { beep(300, 0.06, 'square', 0.05, 140); },
    clear() { [0, 80, 160, 280].forEach((d, i) => setTimeout(() => beep(440 * (i + 1) / 2, 0.18, 'square', 0.07), d)); },
  };

  /* ---------------- tiny 5x7 font ---------------- */
  const GLYPH = {
    ' ': '00000000000000000000000000000000000',
    A: '01110100011000111111100011000110001',
    B: '11110100011111010001100011111000000',
    C: '01111100001000010000100000111100000',
    D: '11110100011000110001100011111000000',
    E: '11111100001111010000100001111100000',
    F: '11111100001111010000100001000000000',
    G: '01111100001000010011100010111100000',
    H: '10001100011111110001100011000100000',
    I: '11111001000010000100001000111110000',
    J: '00111000010000100001100010111000000',
    K: '10001100101110010010100101000100000',
    L: '10000100001000010000100001111100000',
    M: '10001110111010110001100011000100000',
    N: '10001110011010110011100011000100000',
    O: '01110100011000110001100010111000000',
    P: '11110100011111010000100001000000000',
    Q: '01110100011000110001100100111000001',
    R: '11110100011111010010100011000100000',
    S: '01111100000111000001000011111000000',
    T: '11111001000010000100001000010000000',
    U: '10001100011000110001100010111000000',
    V: '10001100011000101010010100010000000',
    W: '10001100011000110101110111000100000',
    X: '10001010100010001010010101000100000',
    Y: '10001010100010000100001000010000000',
    Z: '11111000010001000100010001111100000',
    0: '01110100011001110101110011011100000',
    1: '00100011000010000100001000111000000',
    2: '01110100010000100100010001111100000',
    3: '11110000010111000001000011111000000',
    4: '10001100011111100001000010000100000',
    5: '11111100001111000001000011111000000',
    6: '01111100001111010001100010111000000',
    7: '11111000010001000100010000100000000',
    8: '01110100010111010001100010111000000',
    9: '01110100011000101111000010111000000',
    ':': '00000001000000000100000000000000000',
    '.': '00000000000000000000001000000000000',
    '!': '00100001000010000100000000010000000',
    '?': '01110100010000100100000000010000000',
    '-': '00000000000111100000000000000000000',
    '/': '00001000100010001000100010000000000',
    "'": '00100001000000000000000000000000000',
    '*': '00000001010111000101000000000000000',
  };
  function text(g, s, x, y, c, sc = 1) {
    g.fillStyle = c || '#fff';
    s = String(s).toUpperCase();
    let cx = x;
    for (const ch of s) {
      const bits = GLYPH[ch] || GLYPH['?'];
      for (let i = 0; i < 35; i++) if (bits[i] === '1') g.fillRect(cx + (i % 5) * sc, y + ((i / 5) | 0) * sc, sc, sc);
      cx += 6 * sc;
    }
    return cx;
  }
  function textW(s, sc = 1) { return String(s).length * 6 * sc; }
  function textC(g, s, x, y, c, sc = 1) { text(g, s, x - textW(s, sc) / 2, y, c, sc); }

  /* ---------------- helpers ---------------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function mk(w, h, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g, w, h); return c;
  }
  function flipC(src) {
    return mk(src.width, src.height, g => { g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); });
  }

  /* ---------------- palettes & sprites ---------------- */
  const P = {
    night: '#120610', moon: '#e23b3b', moonD: '#9a181c', moonL: '#ff7a6a',
    fog: 'rgba(80,70,90,0.18)', stone: '#3a3a48', stoneL: '#5a5a6a', stoneD: '#1c1c24',
    grass: '#1c2418', dirt: '#2a1c14',
    av: { hat: '#1a1410', gold: '#d4b45a', hair: '#f0d090', hairD: '#c49248', skin: '#f0c8b0',
          coat: '#f3ece0', coatD: '#d4c8b4', pink: '#c44b6e', pinkD: '#8a2848', boot: '#2a1c14',
          shirt: '#fff6ea', eye: '#2a1c14' },
    ok: { coat: '#14141c', coatL: '#222230', cyan: '#3ec8e0', cyanD: '#1a7a8c', hair: '#3a2418',
          hairL: '#5a3824', skin: '#e8b898', brass: '#c4843a', gog: '#7fe8f0', boot: '#0c0c10', shirt: '#2a2a34' },
    skel: '#e8e0d0', skelD: '#b0a890', skelS: '#fffaf0', bone: '#d8d0c0',
    bat: '#2a1020', batL: '#5a2038',
    ghoul: '#4a6a3a', ghoulD: '#2a3a1c', ghoulS: '#8aaa58',
    host: '#c8a070', hostC: '#6a3040',
  };

  function drawAvrill(g, frame, pose) {
    // pose: 'idle'|'walk'|'jump'|'shoot'|'hurt'
    const A = P.av;
    const leg = pose === 'walk' ? (frame % 4) : pose === 'jump' ? 1 : 0;
    // hat (tricorn)
    g.fillStyle = A.hat; g.fillRect(3, 0, 12, 4); g.fillRect(1, 3, 16, 2); g.fillRect(4, 1, 10, 3);
    g.fillStyle = A.gold; g.fillRect(9, 2, 2, 2);
    // hair
    g.fillStyle = A.hair; g.fillRect(4, 4, 10, 6); g.fillRect(2, 6, 3, 8); g.fillRect(13, 6, 3, 9); g.fillRect(1, 10, 2, 6);
    g.fillStyle = A.hairD; g.fillRect(4, 8, 3, 2); g.fillRect(14, 10, 2, 4);
    // face
    g.fillStyle = A.skin; g.fillRect(6, 5, 7, 6);
    g.fillStyle = A.eye; g.fillRect(11, 7, 2, 2);
    g.fillStyle = A.pink; g.fillRect(11, 10, 2, 1);
    // collar / bodice
    g.fillStyle = A.shirt; g.fillRect(6, 11, 6, 3);
    g.fillStyle = A.pink; g.fillRect(6, 13, 6, 7); g.fillRect(5, 14, 8, 5);
    g.fillStyle = A.pinkD; g.fillRect(8, 14, 1, 6); g.fillRect(10, 15, 1, 5);
    // coat
    g.fillStyle = A.coat; g.fillRect(3, 12, 4, 10); g.fillRect(11, 12, 4, 10); g.fillRect(2, 18, 5, 6); g.fillRect(12, 18, 5, 6);
    g.fillStyle = A.coatD; g.fillRect(2, 22, 5, 2); g.fillRect(13, 22, 4, 2);
    // belt + holsters
    g.fillStyle = A.boot; g.fillRect(5, 19, 8, 2); g.fillRect(3, 18, 3, 4); g.fillRect(12, 18, 3, 4);
    g.fillStyle = A.gold; g.fillRect(8, 19, 2, 2);
    // legs
    g.fillStyle = '#2c2430';
    if (leg === 0) { g.fillRect(6, 21, 3, 6); g.fillRect(10, 21, 3, 6); }
    else if (leg === 1) { g.fillRect(5, 21, 3, 5); g.fillRect(11, 21, 3, 7); }
    else if (leg === 2) { g.fillRect(6, 21, 3, 6); g.fillRect(10, 21, 3, 6); }
    else { g.fillRect(4, 21, 3, 7); g.fillRect(11, 21, 3, 5); }
    g.fillStyle = A.boot;
    if (leg === 0 || leg === 2) { g.fillRect(6, 26, 3, 3); g.fillRect(10, 26, 3, 3); }
    else if (leg === 1) { g.fillRect(5, 25, 3, 3); g.fillRect(11, 27, 3, 3); }
    else { g.fillRect(4, 27, 3, 3); g.fillRect(11, 25, 3, 3); }
    // arm + revolver
    if (pose === 'shoot' || pose === 'idle' || pose === 'walk' || pose === 'jump') {
      g.fillStyle = A.coat; g.fillRect(13, 13, 3, 5);
      if (pose === 'shoot') {
        g.fillStyle = A.skin; g.fillRect(16, 14, 2, 2);
        g.fillStyle = '#2a2420'; g.fillRect(18, 13, 5, 3); g.fillRect(22, 12, 2, 2);
        g.fillStyle = A.gold; g.fillRect(19, 14, 1, 1);
      } else {
        g.fillStyle = A.skin; g.fillRect(14, 18, 2, 3);
        g.fillStyle = '#2a2420'; g.fillRect(16, 19, 3, 2);
      }
    }
    if (pose === 'hurt') { g.fillStyle = 'rgba(255,80,80,0.45)'; g.fillRect(2, 0, 16, 30); }
  }

  function drawOakens(g, frame, pose) {
    const A = P.ok;
    const leg = pose === 'walk' ? (frame % 4) : pose === 'jump' ? 1 : 0;
    // hair
    g.fillStyle = A.hair; g.fillRect(5, 0, 9, 6); g.fillRect(4, 2, 11, 5); g.fillRect(13, 4, 3, 5);
    g.fillStyle = A.hairL; g.fillRect(6, 1, 3, 2);
    // goggles
    g.fillStyle = A.brass; g.fillRect(6, 4, 10, 4);
    g.fillStyle = A.gog; g.fillRect(7, 5, 3, 3); g.fillRect(12, 5, 3, 3);
    g.fillStyle = A.cyan; g.fillRect(8, 6, 1, 1); g.fillRect(13, 6, 1, 1);
    // face
    g.fillStyle = A.skin; g.fillRect(7, 8, 7, 5);
    g.fillStyle = '#1a1010'; g.fillRect(12, 9, 2, 2);
    // coat body (taller)
    g.fillStyle = A.coat; g.fillRect(4, 13, 12, 12); g.fillRect(3, 15, 14, 12);
    g.fillStyle = A.cyan; g.fillRect(4, 13, 12, 1); g.fillRect(3, 15, 1, 12); g.fillRect(16, 15, 1, 12);
    g.fillStyle = A.shirt; g.fillRect(8, 13, 4, 6);
    g.fillStyle = A.cyan; g.fillRect(9, 14, 2, 4);
    // belt
    g.fillStyle = A.brass; g.fillRect(4, 22, 12, 2); g.fillRect(9, 22, 2, 3);
    // coat tails
    g.fillStyle = A.coat; g.fillRect(2, 24, 5, 8); g.fillRect(13, 24, 5, 8);
    g.fillStyle = A.cyanD; g.fillRect(2, 24, 1, 8); g.fillRect(17, 24, 1, 8);
    // holster
    g.fillStyle = '#5a3820'; g.fillRect(3, 21, 3, 5);
    // legs (slightly longer)
    g.fillStyle = A.coat;
    if (leg === 0) { g.fillRect(6, 26, 3, 7); g.fillRect(11, 26, 3, 7); }
    else if (leg === 1) { g.fillRect(5, 26, 3, 6); g.fillRect(12, 26, 3, 8); }
    else if (leg === 2) { g.fillRect(6, 26, 3, 7); g.fillRect(11, 26, 3, 7); }
    else { g.fillRect(4, 26, 3, 8); g.fillRect(12, 26, 3, 6); }
    g.fillStyle = A.boot;
    if (leg === 0 || leg === 2) { g.fillRect(6, 32, 3, 3); g.fillRect(11, 32, 3, 3); }
    else if (leg === 1) { g.fillRect(5, 31, 3, 3); g.fillRect(12, 33, 3, 3); }
    else { g.fillRect(4, 33, 3, 3); g.fillRect(12, 31, 3, 3); }
    // crossbow arm
    g.fillStyle = A.coat; g.fillRect(14, 15, 3, 6);
    g.fillStyle = A.skin; g.fillRect(16, 18, 2, 3);
    if (pose === 'shoot' || pose === 'idle' || pose === 'walk' || pose === 'jump') {
      g.fillStyle = A.brass; g.fillRect(17, 16, 8, 3); g.fillRect(23, 14, 2, 7); g.fillRect(18, 15, 6, 1);
      g.fillStyle = A.cyan; g.fillRect(25, 17, 3, 1);
    }
    if (pose === 'hurt') { g.fillStyle = 'rgba(255,80,80,0.45)'; g.fillRect(2, 0, 18, 36); }
  }

  const SPR = {};
  function bakeHero(draw, w, h, poses) {
    const out = { w, h, L: {}, R: {} };
    for (const pose of poses) {
      const n = pose === 'walk' ? 4 : 1;
      out.R[pose] = []; out.L[pose] = [];
      for (let f = 0; f < n; f++) {
        const c = mk(w, h, g => draw(g, f, pose));
        out.R[pose].push(c); out.L[pose].push(flipC(c));
      }
    }
    return out;
  }
  function bakeAll() {
    SPR.avrill = bakeHero(drawAvrill, 26, 30, ['idle', 'walk', 'jump', 'shoot', 'hurt']);
    SPR.oakens = bakeHero(drawOakens, 28, 36, ['idle', 'walk', 'jump', 'shoot', 'hurt']);
    // skeleton 16x24
    function skel(g, f, thrower) {
      const bob = f % 2;
      g.fillStyle = P.skel; g.fillRect(5, 0 + bob, 6, 6); g.fillRect(6, 6 + bob, 4, 2);
      g.fillStyle = P.skelS; g.fillRect(5, 0 + bob, 6, 1);
      g.fillStyle = '#1a1010'; g.fillRect(6, 2 + bob, 1, 2); g.fillRect(9, 2 + bob, 1, 2);
      g.fillStyle = P.skel; g.fillRect(6, 8 + bob, 4, 7);
      g.fillStyle = P.skelD; g.fillRect(7, 9 + bob, 2, 5);
      // arms
      g.fillStyle = P.skel;
      if (thrower && f >= 2) { g.fillRect(10, 8, 6, 2); g.fillRect(14, 6, 2, 3); }
      else { g.fillRect(3, 9 + bob, 3, 2); g.fillRect(10, 9 + bob, 3, 2); }
      // legs
      const lg = f % 4;
      if (lg === 0 || lg === 2) { g.fillRect(6, 15, 2, 8); g.fillRect(9, 15, 2, 8); }
      else if (lg === 1) { g.fillRect(5, 15, 2, 7); g.fillRect(10, 15, 2, 9); }
      else { g.fillRect(4, 15, 2, 9); g.fillRect(10, 15, 2, 7); }
    }
    SPR.skel = { R: [], L: [] };
    for (let f = 0; f < 4; f++) {
      const c = mk(18, 24, g => skel(g, f, 0)); SPR.skel.R.push(c); SPR.skel.L.push(flipC(c));
    }
    SPR.skelT = { R: [], L: [] };
    for (let f = 0; f < 4; f++) {
      const c = mk(18, 24, g => skel(g, f, 1)); SPR.skelT.R.push(c); SPR.skelT.L.push(flipC(c));
    }
    // bat 16x12
    SPR.bat = [];
    for (let f = 0; f < 3; f++) {
      SPR.bat.push(mk(20, 12, g => {
        const wing = f === 0 ? -3 : f === 1 ? 0 : 3;
        g.fillStyle = P.bat; g.fillRect(8, 4, 4, 4);
        g.fillStyle = '#e8a0b0'; g.fillRect(9, 5, 1, 1); g.fillRect(11, 5, 1, 1);
        g.fillStyle = P.batL;
        g.fillRect(0, 5 + wing, 8, 2); g.fillRect(1, 4 + wing, 6, 1); g.fillRect(2, 3 + wing, 4, 1);
        g.fillRect(12, 5 + wing, 8, 2); g.fillRect(13, 4 + wing, 6, 1); g.fillRect(14, 3 + wing, 4, 1);
      }));
    }
    // ghoul 18x26
    SPR.ghoul = { R: [], L: [] };
    for (let f = 0; f < 4; f++) {
      const c = mk(18, 26, g => {
        const bob = (f % 2);
        g.fillStyle = P.ghoulD; g.fillRect(5, 0 + bob, 8, 8);
        g.fillStyle = P.ghoulS; g.fillRect(6, 2 + bob, 2, 2); g.fillRect(10, 2 + bob, 2, 2);
        g.fillStyle = '#4a1020'; g.fillRect(7, 5 + bob, 4, 2);
        g.fillStyle = P.ghoul; g.fillRect(4, 8 + bob, 10, 10);
        g.fillStyle = P.ghoulD; g.fillRect(6, 10 + bob, 6, 4);
        const lg = f % 4;
        g.fillStyle = P.ghoul;
        if (lg < 2) { g.fillRect(5, 18, 3, 7); g.fillRect(10, 18, 3, 8); }
        else { g.fillRect(4, 18, 3, 8); g.fillRect(11, 18, 3, 7); }
        g.fillStyle = '#1a1410'; g.fillRect(5, 24, 3, 2); g.fillRect(10, 24, 3, 2);
      });
      SPR.ghoul.R.push(c); SPR.ghoul.L.push(flipC(c));
    }
    // hostage
    SPR.hostage = mk(16, 26, g => {
      g.fillStyle = '#e8c8a0'; g.fillRect(5, 2, 6, 6);
      g.fillStyle = '#3a2010'; g.fillRect(5, 1, 6, 3); g.fillRect(4, 3, 2, 5);
      g.fillStyle = '#1a1010'; g.fillRect(6, 4, 1, 1); g.fillRect(9, 4, 1, 1);
      g.fillStyle = P.hostC; g.fillRect(4, 8, 8, 10);
      g.fillStyle = '#c8b090'; g.fillRect(3, 8, 2, 8); g.fillRect(11, 8, 2, 8);
      g.fillStyle = '#5a3040'; g.fillRect(5, 18, 3, 7); g.fillRect(9, 18, 3, 7);
      g.fillStyle = '#d8c070'; g.fillRect(2, 12, 12, 2); g.fillRect(7, 8, 2, 10);
    });
    // tombstones / trees / crypts baked as stamps
    SPR.tomb = [
      mk(14, 20, g => { g.fillStyle = P.stoneD; g.fillRect(1, 5, 12, 15); g.fillStyle = P.stone; g.fillRect(2, 4, 10, 16); g.fillStyle = P.stoneL; g.fillRect(3, 5, 3, 2); g.fillRect(5, 8, 4, 1); g.fillRect(5, 11, 4, 1); }),
      mk(16, 26, g => { g.fillStyle = P.stoneD; g.fillRect(2, 6, 12, 20); g.fillStyle = P.stone; g.fillRect(3, 2, 10, 24); g.fillRect(5, 0, 6, 4); g.fillStyle = P.stoneL; g.fillRect(6, 8, 4, 6); g.fillRect(7, 9, 2, 4); }),
      mk(12, 16, g => { g.fillStyle = P.stone; g.fillRect(1, 3, 10, 13); g.fillStyle = P.stoneL; g.fillRect(2, 2, 8, 3); g.fillRect(4, 7, 4, 1); }),
    ];
    SPR.tree = mk(40, 50, g => {
      g.fillStyle = '#140c12';
      g.fillRect(18, 28, 5, 22);
      for (const [x, y, w, h] of [[6, 8, 8, 3], [4, 14, 14, 3], [20, 4, 16, 3], [22, 12, 14, 3], [10, 20, 18, 4], [2, 22, 10, 2], [28, 20, 10, 2]]) {
        g.fillRect(x, y, w, h);
      }
      g.fillRect(16, 16, 4, 16); g.fillRect(22, 10, 3, 18);
    });
    SPR.crypt = mk(36, 28, g => {
      g.fillStyle = P.stoneD; g.fillRect(0, 10, 36, 18);
      g.fillStyle = P.stone; g.fillRect(1, 8, 34, 20);
      g.fillStyle = '#2a1a22'; g.fillRect(0, 6, 36, 4); g.fillRect(4, 2, 28, 6); g.fillRect(8, 0, 20, 4);
      g.fillStyle = '#1a0a10'; g.fillRect(14, 14, 8, 14);
      g.fillStyle = '#6a1820'; g.fillRect(16, 16, 2, 4);
    });
    SPR.fence = mk(24, 16, g => {
      g.fillStyle = '#2a2220';
      for (let i = 0; i < 4; i++) g.fillRect(2 + i * 6, 0, 2, 16);
      g.fillRect(0, 4, 24, 2);
    });
    SPR.gate = mk(48, 40, g => {
      g.fillStyle = '#1c1418'; g.fillRect(0, 0, 8, 40); g.fillRect(40, 0, 8, 40); g.fillRect(0, 0, 48, 6);
      g.fillStyle = '#2a2024';
      for (let i = 0; i < 6; i++) g.fillRect(10 + i * 5, 6, 2, 34);
      g.fillRect(8, 16, 32, 2); g.fillStyle = '#8a1c28'; g.fillRect(21, 18, 6, 8);
    });
    // pickups
    SPR.bombPU = mk(10, 10, g => { g.fillStyle = '#2a2a30'; g.fillRect(2, 3, 6, 6); g.fillStyle = '#e8c040'; g.fillRect(4, 1, 2, 3); g.fillStyle = '#c04040'; g.fillRect(5, 0, 2, 2); });
    SPR.hpPU = mk(10, 10, g => { g.fillStyle = '#c03040'; g.fillRect(3, 1, 2, 8); g.fillRect(1, 3, 8, 2); g.fillStyle = '#f08090'; g.fillRect(3, 3, 2, 2); });
    SPR.heavyPU = mk(12, 8, g => { g.fillStyle = '#c4843a'; g.fillRect(0, 2, 12, 4); g.fillRect(8, 0, 3, 8); g.fillStyle = '#3ec8e0'; g.fillRect(11, 3, 2, 2); });
    SPR.moon = mk(48, 48, g => {
      g.fillStyle = P.moon; g.beginPath(); g.arc(24, 24, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = P.moonD; g.beginPath(); g.arc(16, 18, 5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(28, 30, 7, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(32, 16, 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = P.moonL; g.beginPath(); g.arc(30, 20, 2, 0, Math.PI * 2); g.fill();
    });
    // cathedral silhouette
    SPR.cath = mk(200, 80, g => {
      g.fillStyle = '#0c0610';
      g.fillRect(20, 40, 160, 40);
      // towers
      g.fillRect(20, 10, 28, 70); g.fillRect(152, 16, 28, 64);
      // spires
      g.fillRect(30, 0, 8, 16); g.fillRect(164, 4, 8, 16);
      g.fillRect(70, 20, 60, 60); g.fillRect(94, 4, 12, 24);
      // buttresses
      g.fillRect(54, 36, 16, 44); g.fillRect(130, 36, 16, 44);
      // windows
      g.fillStyle = '#6a1828';
      g.fillRect(28, 28, 6, 14); g.fillRect(36, 28, 6, 14);
      g.fillRect(160, 32, 6, 14); g.fillRect(168, 32, 6, 14);
      g.fillRect(82, 36, 8, 18); g.fillRect(98, 28, 10, 24); g.fillRect(116, 36, 8, 18);
    });
  }

  /* ---------------- background ---------------- */
  let stars = [], fogBits = [];
  function initBg() {
    stars = [];
    for (let i = 0; i < 50; i++) stars.push({ x: rnd(0, W), y: rnd(0, 90), a: rnd(0.2, 0.9), s: Math.random() < 0.2 ? 2 : 1 });
    fogBits = [];
    for (let i = 0; i < 10; i++) fogBits.push({ x: rnd(-40, LEVEL_W), y: rnd(100, 145), w: rnd(80, 160), h: rnd(16, 30), v: rnd(2, 8) });
  }
  function drawSky(g, cam, T) {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#1a0814'); gr.addColorStop(0.45, '#2a0c18'); gr.addColorStop(1, '#120810');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (const s of stars) { g.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(T * 2 + s.x)); g.fillStyle = '#f0e8d8'; g.fillRect(s.x, s.y, s.s, s.s); }
    g.globalAlpha = 1;
    // moon (slight parallax)
    const mx = 250 - cam * 0.02, my = 22;
    g.drawImage(SPR.moon, mx, my);
    g.fillStyle = 'rgba(180,30,40,0.18)'; g.beginPath(); g.arc(mx + 24, my + 24, 32, 0, Math.PI * 2); g.fill();
    // cathedral
    g.drawImage(SPR.cath, 40 - cam * 0.12, 70);
    g.drawImage(SPR.cath, 420 - cam * 0.12, 78);
    // far trees
    for (let i = 0; i < 16; i++) {
      const x = i * 140 - (cam * 0.35) % 140 - 40;
      g.drawImage(SPR.tree, x, 102);
    }
    // fog bank mid
    for (const f of fogBits) {
      const x = f.x - cam * 0.55 + Math.sin(T * 0.2 + f.x) * f.v;
      g.fillStyle = 'rgba(90,80,100,0.10)';
      g.beginPath(); g.ellipse(x, f.y, f.w, f.h, 0, 0, Math.PI * 2); g.fill();
    }
  }
  function drawGround(g, cam) {
    const x0 = Math.floor(cam / 16) * 16 - 16;
    for (let x = x0; x < cam + W + 16; x += 16) {
      g.fillStyle = '#161210'; g.fillRect(x, GROUND, 16, H - GROUND);
      g.fillStyle = '#2c2418'; g.fillRect(x, GROUND, 16, 5);
      g.fillStyle = '#3a3020'; g.fillRect(x, GROUND, 16, 1);
      g.fillStyle = '#14100c'; g.fillRect(x, GROUND + 8, 16, 2);
      if (((x / 16) | 0) % 2 === 0) { g.fillStyle = '#4a4030'; g.fillRect(x + 3, GROUND + 1, 2, 2); }
      if (((x / 16) | 0) % 5 === 0) { g.fillStyle = '#2a3020'; g.fillRect(x + 8, GROUND - 1, 3, 2); }
    }
    // dirt edge shadow
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(cam, GROUND - 1, W, 1);
  }

  /* ---------------- particles ---------------- */
  let parts = [];
  function burst(x, y, c, n, spd, life, sz) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(spd * 0.3, spd);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: life, life, c, s: rnd(sz * 0.5, sz) });
    }
  }
  function updateParts(dt) {
    for (const p of parts) { p.t -= dt; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vy += 4 * dt; }
    parts = parts.filter(p => p.t > 0);
  }
  function drawParts(g) {
    for (const p of parts) { g.globalAlpha = Math.max(0, p.t / p.life); g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, p.s, p.s); }
    g.globalAlpha = 1;
  }

  /* ---------------- game state ---------------- */
  let state = 'title', T = 0, cam = 0, heroId = 'avrill', sel = 0;
  let player, bullets, grenades, enemies, hostages, pickups, decos, platforms;
  let boss = null, locked = false, shake = 0, flash = 0;
  let score = 0, kills = 0, runT = 0, pauseSel = 0, overSel = 0, clearT = 0, deadT = 0;
  let titleT = 0;

  function heroSpec(id) {
    if (id === 'oakens') return { id, name: 'OAKENS', spr: SPR.oakens, w: 14, h: 32, stand: 32, hp: 5, rate: 0.22, dmg: 1.4, bullet: 3.6, gunnish: 'crossbow' };
    return { id, name: 'AVRILL', spr: SPR.avrill, w: 12, h: 28, stand: 28, hp: 4, rate: 0.12, dmg: 1, bullet: 4.2, gunnish: 'revolver' };
  }

  function placeDecos() {
    decos = [];
    const stamp = (kind, x, y) => decos.push({ kind, x, y });
    for (let x = 20; x < ARENA_X; x += rnd(28, 70)) {
      const r = Math.random();
      if (r < 0.5) stamp('tomb', x, GROUND - [20, 26, 16][(Math.random() * 3) | 0]);
      else if (r < 0.7) stamp('tree', x, GROUND - 50);
      else if (r < 0.82) stamp('fence', x, GROUND - 16);
      else if (r < 0.9) stamp('crypt', x, GROUND - 28);
    }
    stamp('gate', ARENA_X - 40, GROUND - 40);
    // a few platforms (crypt tops already solid via platforms)
    platforms = [
      { x: 420, y: GROUND - 36, w: 36, h: 8 },
      { x: 980, y: GROUND - 40, w: 36, h: 8 },
      { x: 1500, y: GROUND - 36, w: 48, h: 8 },
      { x: 1980, y: GROUND - 44, w: 36, h: 8 },
      { x: 2460, y: GROUND - 36, w: 40, h: 8 },
    ];
    stamp('crypt', 420, GROUND - 28);
    stamp('crypt', 980, GROUND - 28);
    stamp('crypt', 1500, GROUND - 28);
    stamp('crypt', 1980, GROUND - 28);
    stamp('crypt', 2460, GROUND - 28);
  }

  function spawnPlan() {
    enemies = []; hostages = []; pickups = [];
    const add = (kind, x, extra) => enemies.push(Object.assign({ kind, x, y: GROUND, vx: 0, vy: 0, t: 0, cool: 0, facing: -1, alive: 1, onG: 1 }, extra));
    // wave along the graveyard
    const skel = (x, thrower) => add('skel', x, { w: 12, h: 22, hp: thrower ? 3 : 2, thrower: !!thrower, y: GROUND - 22 });
    const bat = (x, y) => add('bat', x, { w: 14, h: 8, hp: 1, y: y || 70, baseY: y || 70, onG: 0 });
    const ghoul = (x) => add('ghoul', x, { w: 14, h: 24, hp: 5, y: GROUND - 24 });
    skel(360); skel(430);
    bat(520, 80); bat(560, 60);
    skel(700, 1); skel(780);
    ghoul(920);
    bat(1100, 70); bat(1160, 50); skel(1200); skel(1280, 1);
    skel(1480); ghoul(1600); bat(1680, 64);
    skel(1860, 1); skel(1940); bat(2000, 72);
    ghoul(2180); skel(2260); skel(2340, 1); bat(2400, 58); bat(2480, 80);
    skel(2680); ghoul(2760); skel(2860, 1); bat(2920, 66); skel(3000);
    hostages.push({ x: 640, y: GROUND - 26, w: 12, h: 26, freed: 0, drop: 'heavy' });
    hostages.push({ x: 2100, y: GROUND - 26, w: 12, h: 26, freed: 0, drop: 'bomb' });
    pickups.push({ kind: 'bomb', x: 880, y: GROUND - 14, w: 10, h: 10, t: 0 });
    pickups.push({ kind: 'hp', x: 1750, y: GROUND - 14, w: 10, h: 10, t: 0 });
    pickups.push({ kind: 'bomb', x: 2550, y: GROUND - 14, w: 10, h: 10, t: 0 });
  }

  function startRun(id) {
    heroId = id || heroId;
    const S = heroSpec(heroId);
    player = {
      x: 40, y: GROUND - S.h, vx: 0, vy: 0, w: S.w, h: S.h,
      facing: 1, aimX: 1, aimY: 0, onG: 1,
      hp: S.hp, hpMax: S.hp, lives: 3, inv: 1.2,
      weapon: 'base', weaponT: 0, grenades: 3, cool: 0, gcool: 0,
      anim: 0, pose: 'idle', dead: 0, flick: 0,
    };
    bullets = []; grenades = []; boss = null; locked = false; parts = [];
    cam = 0; score = 0; kills = 0; runT = 0; shake = 0; flash = 0; deadT = 0; clearT = 0;
    placeDecos(); spawnPlan();
    state = 'play';
    sfx.ok();
  }

  function restartLife() {
    const S = heroSpec(heroId);
    player.hp = S.hp; player.dead = 0; player.inv = 1.5; player.vx = 0; player.vy = 0;
    player.y = GROUND - S.h; player.weapon = 'base'; player.weaponT = 0;
    // nudge back slightly so they aren't in the same hit
    player.x = Math.max(20, player.x - 30);
    state = 'play';
  }

  /* ---------------- physics ---------------- */
  function standY(ent) {
    let y = GROUND - ent.h;
    for (const p of platforms) {
      if (ent.x + ent.w > p.x + 2 && ent.x < p.x + p.w - 2) {
        const top = p.y - ent.h;
        if (ent.y <= top + 6 && ent.vy >= 0 && top < y + 1) y = top;
      }
    }
    return y;
  }
  function grounded(ent) {
    return ent.y >= standY(ent) - 0.4;
  }

  function fire(p) {
    const S = heroSpec(heroId);
    const heavy = p.weapon === 'heavy';
    const rate = heavy ? 0.28 : S.rate;
    if (p.cool > 0) return;
    p.cool = rate;
    let ax = p.facing, ay = 0;
    if (hold.u) ay = -1;
    if (hold.d && !p.onG) ay = 1;
    if (!hold.l && !hold.r && hold.u) ax = 0;
    if (ax === 0 && ay === 0) ax = p.facing;
    const len = Math.hypot(ax, ay) || 1; ax /= len; ay /= len;
    p.aimX = ax; p.aimY = ay;
    const muzzleX = p.x + p.w / 2 + ax * 12;
    const muzzleY = p.y + p.h * 0.38 + ay * 6;
    const spd = heavy ? 3.2 : S.bullet;
    bullets.push({ x: muzzleX, y: muzzleY, vx: ax * spd, vy: ay * spd, r: heavy ? 3 : 1.5, dmg: heavy ? 2.2 : S.dmg, life: 1.1, heavy, from: 'p' });
    burst(muzzleX, muzzleY, heavy ? '#3ec8e0' : '#f0d080', 3, 1.2, 0.15, 1);
    heavy ? sfx.heavy() : sfx.shoot();
  }
  function tossBomb(p) {
    if (p.grenades <= 0 || p.gcool > 0) return;
    p.grenades--; p.gcool = 0.5;
    const dir = p.facing;
    grenades.push({ x: p.x + p.w / 2, y: p.y + 4, vx: dir * 2.2 + (hold.u ? 0.2 : 0), vy: hold.u ? -3.6 : -2.4, r: 3, fuse: 1.05, bounce: 0 });
    sfx.bone();
  }
  function explode(x, y, r, dmg) {
    burst(x, y, '#f0c040', 16, 2.4, 0.4, 2);
    burst(x, y, '#c03020', 10, 1.8, 0.3, 2);
    shake = Math.max(shake, 5); flash = 0.12; sfx.boom();
    for (const e of enemies) if (e.alive && Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) < r + 8) hurtEnemy(e, dmg);
    if (boss && boss.alive && Math.hypot(boss.x + boss.w / 2 - x, boss.y + boss.h / 2 - y) < r + 20) hurtBoss(dmg);
  }

  function hurtPlayer(n) {
    if (player.inv > 0 || player.dead) return;
    player.hp -= n || 1; player.inv = 1.0; shake = 4; sfx.hit();
    burst(player.x + player.w / 2, player.y + player.h / 2, '#f07070', 8, 1.6, 0.3, 1);
    if (player.hp <= 0) {
      player.dead = 1; player.hp = 0; player.lives--; deadT = 0; sfx.die();
    }
  }
  function hurtEnemy(e, dmg) {
    e.hp -= dmg; e.flick = 0.1; sfx.hurtE();
    burst(e.x + e.w / 2, e.y + e.h / 2, '#e8e0d0', 4, 1.4, 0.25, 1);
    if (e.hp <= 0) { e.alive = 0; kills++; score += e.kind === 'ghoul' ? 200 : e.kind === 'skel' ? 100 : 50; burst(e.x + 6, e.y + 8, '#d0c8b0', 10, 2, 0.4, 2); }
  }

  /* ---------------- bullets / bombs ---------------- */
  function updateShots(dt) {
    for (const b of bullets) { b.x += b.vx * dt * 60; b.y += b.vy * dt * 60; if (b.bone) b.vy += 0.14 * dt * 60; b.life -= dt; }
    bullets = bullets.filter(b => b.life > 0 && b.x > cam - 20 && b.x < cam + W + 20 && b.y > -10 && b.y < H + 10);
    for (const b of bullets) {
      if (b.from !== 'p') {
        if (aabb({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, player)) { b.life = 0; hurtPlayer(1); }
        continue;
      }
      for (const e of enemies) {
        if (!e.alive) continue;
        if (aabb({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, e)) { b.life = 0; hurtEnemy(e, b.dmg); }
      }
      if (boss && boss.alive && b.x > boss.x + 8 && b.x < boss.x + boss.w - 8 && b.y > boss.y + 10 && b.y < boss.y + boss.h) {
        b.life = 0; hurtBoss(b.dmg);
      }
    }
    bullets = bullets.filter(b => b.life > 0);
    for (const g of grenades) {
      g.x += g.vx * dt * 60; g.y += g.vy * dt * 60; g.vy += 0.18 * dt * 60; g.fuse -= dt;
      if (g.y > GROUND - 3) { g.y = GROUND - 3; g.vy *= -0.4; g.vx *= 0.8; if (Math.abs(g.vy) < 0.4) g.vy = 0; }
      if (g.fuse <= 0) { g.dead = 1; explode(g.x, g.y, 28, 4); }
    }
    grenades = grenades.filter(g => !g.dead);
  }

  /* ---------------- enemies ---------------- */
  function updateEnemies(dt) {
    const p = player;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.x > cam + W + 80 || e.x < cam - 80) continue;
      e.t += dt; if (e.flick) e.flick = Math.max(0, e.flick - dt);
      if (e.kind === 'skel') {
        if (e.onG) e.y = GROUND - e.h;
        const dir = p.x + p.w / 2 > e.x + e.w / 2 ? 1 : -1;
        e.facing = dir;
        if (e.thrower && Math.abs(p.x - e.x) < 140 && e.cool <= 0 && Math.abs(p.x - e.x) > 30) {
          e.cool = 1.6; e.pose = 'throw';
          const bx = e.x + (dir > 0 ? e.w : 0), by = e.y + 6;
          const vx = dir * 1.6, vy = -2.1;
          bullets.push({ x: bx, y: by, vx, vy: vy, r: 2, dmg: 1, life: 2, from: 'e', bone: 1 });
          sfx.bone();
        } else {
          e.vx = dir * 0.45;
          e.x += e.vx * dt * 60;
        }
        e.cool = Math.max(0, e.cool - dt);
      } else if (e.kind === 'bat') {
        const tx = p.x + p.w / 2, ty = p.y + 8;
        if (Math.abs(e.x - tx) < 160) {
          e.vx += Math.sign(tx - e.x) * 1.6 * dt;
          e.vy += Math.sign((ty + Math.sin(e.t * 3) * 10) - e.y) * 1.8 * dt;
          e.vx = clamp(e.vx, -1.3, 1.3); e.vy = clamp(e.vy, -1.2, 1.2);
        } else {
          e.vx = Math.sin(e.t * 1.2) * 0.6; e.vy = Math.cos(e.t * 2) * 0.4;
        }
        e.x += e.vx * dt * 60; e.y += e.vy * dt * 60;
        e.y = clamp(e.y, 30, GROUND - 20);
      } else if (e.kind === 'ghoul') {
        e.y = GROUND - e.h;
        const dir = p.x > e.x ? 1 : -1; e.facing = dir;
        if (Math.abs(p.x - e.x) < 28 && e.cool <= 0) { e.cool = 1.1; e.vx = dir * 2.2; }
        else e.vx += (dir * 0.5 - e.vx) * 2 * dt;
        e.x += e.vx * dt * 60; e.cool = Math.max(0, e.cool - dt);
        e.vx *= 0.9;
      }
      if (e.x < 8) e.x = 8;
      if (e.x > ARENA_X + ARENA_W - 20) e.x = ARENA_X + ARENA_W - 20;
      if (!p.dead && aabb(p, e)) hurtPlayer(1);
    }
    enemies = enemies.filter(e => e.alive || (e.flick && e.flick > 0));
  }

  /* ---------------- hostages / pickups ---------------- */
  function grantPickup(kind, x, y) {
    if (kind === 'heavy') { player.weapon = 'heavy'; player.weaponT = 14; sfx.pickup(); pop('HEAVY SHOT', x, y - 12, '#3ec8e0'); }
    else if (kind === 'bomb') { player.grenades = Math.min(5, player.grenades + 2); sfx.pickup(); pop('+2 BOMBS', x, y - 12, '#e8c040'); }
    else if (kind === 'hp') { player.hp = Math.min(player.hpMax, player.hp + 2); sfx.pickup(); pop('+HP', x, y - 12, '#c03040'); }
  }
  let pops = [];
  function pop(txt, x, y, c) { pops.push({ txt, x, y, c, t: 0.9 }); }
  function updatePickups(dt) {
    for (const h of hostages) {
      if (h.freed) continue;
      const near = aabb({ x: h.x - 6, y: h.y - 4, w: h.w + 12, h: h.h + 4 }, player);
      let shot = false;
      for (const b of bullets) if (b.from === 'p' && aabb({ x: b.x - 2, y: b.y - 2, w: 4, h: 4 }, h)) { shot = true; b.life = 0; }
      if (near || shot) {
        h.freed = 1; score += 300; sfx.rescue(); pop('RESCUED!', h.x, h.y - 10, '#f0e080');
        pickups.push({ kind: h.drop, x: h.x, y: h.y + 10, w: 10, h: 10, t: 0 });
      }
    }
    for (const u of pickups) {
      u.t += dt; u.y = (u.baseY || (u.baseY = u.y)) + Math.sin(u.t * 4) * 2;
      if (aabb(u, player)) { u.dead = 1; grantPickup(u.kind, u.x, u.y); }
    }
    pickups = pickups.filter(u => !u.dead);
    for (const q of pops) { q.t -= dt; q.y -= 16 * dt; }
    pops = pops.filter(q => q.t > 0);
  }

  /* ---------------- boss: THE GRAVE TITAN ---------------- */
  function startBoss() {
    if (boss) return;
    locked = true;
    boss = {
      x: ARENA_X + 200, y: GROUND - 96, w: 70, h: 96,
      hp: 48, max: 48, alive: 1, state: 'enter', t: 0, cool: 1.2,
      facing: -1, arm: 0, slamX: 0, deadT: 0, flick: 0,
    };
    sfx.slam(); shake = 6;
  }
  function hurtBoss(dmg) {
    if (!boss || !boss.alive || boss.state === 'enter' || boss.state === 'die') return;
    boss.hp -= dmg; boss.flick = 0.12; sfx.hurtE();
    burst(boss.x + 20, boss.y + 30, '#e8e0d0', 5, 1.6, 0.3, 2);
    if (boss.hp <= 0) { boss.hp = 0; boss.alive = 0; boss.state = 'die'; boss.deadT = 0; sfx.slam(); shake = 10; }
  }
  function updateBoss(dt) {
    if (!boss) return;
    const B = boss, p = player;
    B.t += dt; if (B.flick) B.flick = Math.max(0, B.flick - dt);
    if (B.state === 'enter') {
      B.x += (ARENA_X + 210 - B.x) * Math.min(1, dt * 1.5);
      if (B.t > 1.4) { B.state = 'idle'; B.t = 0; B.cool = 0.6; }
      return;
    }
    if (B.state === 'die') {
      B.deadT += dt; B.y = GROUND - 96 + Math.min(40, B.deadT * 18);
      if (Math.random() < 0.4) burst(B.x + rnd(0, B.w), B.y + rnd(0, B.h * 0.8), '#e8e0d0', 2, 1.2, 0.4, 2);
      if (B.deadT > 2.4 && state === 'play') { state = 'clear'; clearT = 0; sfx.clear(); score += 2000; }
      return;
    }
    // attacks
    B.cool -= dt;
    if (B.state === 'idle' && B.cool <= 0) {
      const r = Math.random();
      if (r < 0.34) { B.state = 'slamT'; B.t = 0; B.slamX = clamp(p.x - 10, ARENA_X + 10, ARENA_X + 150); }
      else if (r < 0.67) { B.state = 'bones'; B.t = 0; }
      else { B.state = 'skulls'; B.t = 0; }
    }
    if (B.state === 'slamT') {
      if (B.t > 0.7) { B.state = 'slam'; B.t = 0; sfx.slam(); shake = 8;
        explode(B.slamX + 16, GROUND - 2, 26, 0);
        if (Math.abs(p.x + p.w / 2 - (B.slamX + 16)) < 28 && p.y + p.h > GROUND - 20) hurtPlayer(1);
      }
    } else if (B.state === 'slam') {
      if (B.t > 0.45) { B.state = 'idle'; B.cool = B.hp < B.max * 0.45 ? 0.45 : 0.8; }
    } else if (B.state === 'bones') {
      if (B.t < 0.05 || (B.t > 0.25 && B.t < 0.3) || (B.t > 0.5 && B.t < 0.55)) {
        if (!B.shotAt || B.t - B.shotAt > 0.15) {
          B.shotAt = B.t;
          const dir = -1;
          bullets.push({ x: B.x + 8, y: B.y + 28, vx: dir * rnd(1.3, 2.0), vy: rnd(-2.8, -1.6), r: 2.5, dmg: 1, life: 2.5, from: 'e', bone: 1 });
          sfx.bone();
        }
      }
      if (B.t > 0.9) { B.state = 'idle'; B.cool = 0.7; B.shotAt = 0; }
    } else if (B.state === 'skulls') {
      if (B.t < 0.08) {
        if (!B.shotAt) {
          B.shotAt = B.t;
          for (let i = 0; i < 3; i++) {
            const ang = Math.atan2(p.y - (B.y + 16), p.x - B.x) + (i - 1) * 0.28;
            bullets.push({ x: B.x + 10, y: B.y + 16, vx: Math.cos(ang) * 1.7, vy: Math.sin(ang) * 1.7, r: 3, dmg: 1, life: 2.4, from: 'e', skull: 1 });
          }
          sfx.bat();
        }
      }
      if (B.t > 0.9) { B.state = 'idle'; B.cool = 0.75; B.shotAt = 0; }
    }
    // contact damage
    if (B.alive && aabb({ x: B.x + 12, y: B.y + 16, w: B.w - 20, h: B.h - 16 }, p)) hurtPlayer(1);
  }
  function drawBoss(g) {
    if (!boss) return;
    const B = boss, flick = B.flick > 0 && ((T * 20) | 0) % 2;
    g.save();
    if (flick) g.globalAlpha = 0.45;
    const x = B.x, y = B.y + (B.state === 'die' ? Math.sin(B.deadT * 20) * 2 : 0);
    const slamUp = B.state === 'slamT' ? Math.min(1, B.t / 0.5) : B.state === 'slam' ? Math.max(0, 1 - B.t / 0.15) : 0;
    // legs
    g.fillStyle = P.skelD;
    g.fillRect(x + 16, y + 62, 10, 34); g.fillRect(x + 40, y + 62, 10, 34);
    g.fillStyle = P.skel; g.fillRect(x + 17, y + 62, 8, 32); g.fillRect(x + 41, y + 62, 8, 32);
    // pelvis + spine
    g.fillStyle = P.skel; g.fillRect(x + 18, y + 50, 32, 14);
    g.fillRect(x + 30, y + 22, 8, 30);
    // ribs
    g.fillStyle = P.skelS;
    for (let i = 0; i < 5; i++) { g.fillRect(x + 16, y + 24 + i * 5, 36, 2); }
    g.fillStyle = P.skelD; g.fillRect(x + 32, y + 24, 4, 26);
    // head
    const hx = x + 22, hy = y + (B.state === 'die' ? 8 + B.deadT * 10 : 0);
    g.fillStyle = P.skelS; g.fillRect(hx, hy, 28, 24);
    g.fillStyle = P.skel; g.fillRect(hx + 2, hy + 2, 24, 20);
    g.fillStyle = B.state === 'slamT' || B.state === 'skulls' ? '#e23b3b' : '#1a0808';
    g.fillRect(hx + 6, hy + 8, 6, 5); g.fillRect(hx + 16, hy + 8, 6, 5);
    g.fillStyle = P.skelD; g.fillRect(hx + 10, hy + 16, 8, 3);
    // crown spikes
    g.fillStyle = P.skel; g.fillRect(hx + 4, hy - 6, 4, 8); g.fillRect(hx + 12, hy - 10, 4, 12); g.fillRect(hx + 20, hy - 6, 4, 8);
    // arms
    const armY = y + 26 - slamUp * 28;
    const fistY = B.state === 'slam' ? GROUND - 14 : armY + 30;
    const fistX = B.state === 'slamT' || B.state === 'slam' ? B.slamX : x - 8;
    g.fillStyle = P.skel;
    g.fillRect(x + 8, y + 26, 8, 8);
    if (B.state === 'slamT' || B.state === 'slam') {
      const ah = Math.max(10, fistY - armY);
      g.fillStyle = P.skel; g.fillRect(fistX + 6, armY, 6, ah);
      g.fillStyle = P.skelD;
      for (let i = 0; i < ah; i += 8) g.fillRect(fistX + 5, armY + i, 8, 2);
      g.fillStyle = P.skelS; g.fillRect(fistX, fistY - 2, 20, 14);
      g.fillRect(fistX - 3, fistY + 2, 6, 8); g.fillRect(fistX + 17, fistY + 2, 6, 8);
      if (B.state === 'slamT') { g.fillStyle = 'rgba(226,59,59,0.4)'; g.fillRect(fistX - 6, GROUND - 5, 32, 5); }
    } else {
      g.fillRect(x - 2, y + 28, 16, 6);
      g.fillRect(x - 6, y + 32, 6, 22);
      g.fillStyle = P.skelS; g.fillRect(x - 10, y + 52, 12, 8);
    }
    // other arm (holding / hanging)
    g.fillStyle = P.skel; g.fillRect(x + 50, y + 28, 16, 6); g.fillRect(x + 60, y + 32, 6, 24);
    g.restore();
    // telegraph
  }

  /* ---------------- player update ---------------- */
  function updatePlayer(dt) {
    const p = player, S = heroSpec(heroId);
    p.cool = Math.max(0, p.cool - dt);
    p.gcool = Math.max(0, p.gcool - dt);
    p.inv = Math.max(0, p.inv - dt);
    if (p.weapon === 'heavy') { p.weaponT -= dt; if (p.weaponT <= 0) p.weapon = 'base'; }
    p.anim += dt;
    if (p.dead) {
      p.vy += 0.25 * dt * 60; p.y += p.vy * dt * 60;
      if (p.y > GROUND - 8) p.y = GROUND - 8;
      deadT += dt;
      if (deadT > 1.4) {
        if (p.lives > 0) restartLife();
        else { state = 'over'; overSel = 0; }
      }
      return;
    }
    // move
    let ax = 0;
    if (hold.l) ax -= 1;
    if (hold.r) ax += 1;
    if (ax) p.facing = ax;
    p.vx = ax * 1.45;
    p.x += p.vx * dt * 60;
    // jump
    if (just.jump && p.onG) { p.vy = -3.85; p.onG = 0; sfx.jump(); }
    p.vy += 0.24 * dt * 60;
    if (!hold.jump && p.vy < -1.2) p.vy += 0.15 * dt * 60; // short hop
    p.y += p.vy * dt * 60;
    const sy = standY(p);
    if (p.vy >= 0 && p.y >= sy) { if (!p.onG) sfx.land(); p.y = sy; p.vy = 0; p.onG = 1; }
    else p.onG = 0;
    if (p.y > GROUND + 20) { p.y = GROUND - p.h; hurtPlayer(1); }
    const minX = locked ? ARENA_X + 6 : 8;
    const maxX = locked ? ARENA_X + ARENA_W - p.w - 8 : LEVEL_W - p.w - 8;
    p.x = clamp(p.x, minX, maxX);
    if (hold.shoot) fire(p);
    if (just.bomb) tossBomb(p);
    // pose
    if (!p.onG) p.pose = 'jump';
    else if (hold.shoot) p.pose = 'shoot';
    else if (Math.abs(p.vx) > 0.2) p.pose = 'walk';
    else p.pose = 'idle';
    // enter arena
    if (!locked && p.x > ARENA_X + 20) startBoss();
  }

  function updateCam(dt) {
    if (locked) cam += (ARENA_X - cam) * Math.min(1, dt * 4);
    else {
      const tx = clamp(player.x - 80, 0, ARENA_X);
      cam += (tx - cam) * Math.min(1, dt * 6);
    }
    cam = clamp(cam, 0, ARENA_X);
    if (shake > 0) shake = Math.max(0, shake - dt * 16);
    if (flash > 0) flash = Math.max(0, flash - dt);
  }

  /* ---------------- drawing world / player ---------------- */
  function drawDecos(g) {
    for (const d of decos) {
      const img = d.kind === 'tomb' ? SPR.tomb[(Math.abs(d.x / 16) | 0) % 3] : SPR[d.kind];
      if (img) g.drawImage(img, d.x, d.y);
    }
    // platforms already have crypt stamps
  }
  function drawHero(g, p) {
    if (p.dead && ((T * 10) | 0) % 2) return;
    if (p.inv > 0 && ((T * 16) | 0) % 2) return;
    const S = heroSpec(heroId);
    const spr = S.spr;
    const pose = p.pose === 'hurt' ? 'hurt' : p.pose;
    const frames = spr[p.facing < 0 ? 'L' : 'R'][pose] || spr[p.facing < 0 ? 'L' : 'R'].idle;
    const fi = pose === 'walk' ? ((p.anim * 8) | 0) % frames.length : 0;
    const im = frames[fi] || frames[0];
    g.drawImage(im, (p.x + (p.facing < 0 ? -8 : -4)) | 0, (p.y - (im.height - p.h)) | 0);
  }
  function drawEntities(g) {
    for (const h of hostages) {
      if (h.freed) continue;
      g.drawImage(SPR.hostage, h.x, h.y);
      if (Math.sin(T * 3) > 0.2) textC(g, 'HELP', h.x + 8, h.y - 10, '#f0e080', 1);
    }
    for (const e of enemies) {
      if (!e.alive && !e.flick) continue;
      if (e.flick && ((T * 20) | 0) % 2) g.globalAlpha = 0.4;
      if (e.kind === 'skel') {
        const set = e.thrower ? SPR.skelT : SPR.skel;
        const frames = e.facing < 0 ? set.L : set.R;
        g.drawImage(frames[((e.t * 6) | 0) % 4], e.x - 2, e.y);
      } else if (e.kind === 'bat') {
        g.drawImage(SPR.bat[((e.t * 8) | 0) % 3], e.x - 2, e.y - 2);
      } else if (e.kind === 'ghoul') {
        const frames = e.facing < 0 ? SPR.ghoul.L : SPR.ghoul.R;
        g.drawImage(frames[((e.t * 5) | 0) % 4], e.x - 2, e.y);
      }
      g.globalAlpha = 1;
    }
    for (const u of pickups) {
      const im = u.kind === 'bomb' ? SPR.bombPU : u.kind === 'hp' ? SPR.hpPU : SPR.heavyPU;
      g.drawImage(im, u.x, u.y);
    }
    for (const b of bullets) {
      if (b.bone) { g.fillStyle = P.bone; g.fillRect(b.x - 2, b.y - 1, 4, 2); g.fillRect(b.x - 1, b.y - 2, 2, 4); }
      else if (b.skull) {
        g.fillStyle = P.skelS; g.fillRect(b.x - 3, b.y - 3, 6, 6);
        g.fillStyle = '#e23b3b'; g.fillRect(b.x - 2, b.y - 1, 1, 1); g.fillRect(b.x + 1, b.y - 1, 1, 1);
      } else if (b.heavy) { g.fillStyle = '#3ec8e0'; g.fillRect(b.x - 3, b.y - 2, 6, 3); g.fillStyle = '#e8ffff'; g.fillRect(b.x - 1, b.y - 1, 2, 1); }
      else { g.fillStyle = heroId === 'oakens' ? '#7fe8f0' : '#f0d080'; g.fillRect(b.x - 2, b.y - 1, 4, 2); }
    }
    for (const gr of grenades) {
      g.fillStyle = '#2a2a30'; g.fillRect(gr.x - 2, gr.y - 2, 5, 5);
      g.fillStyle = '#e8c040'; g.fillRect(gr.x, gr.y - 4, 2, 3);
    }
    for (const q of pops) {
      g.globalAlpha = Math.min(1, q.t * 2); textC(g, q.txt, q.x, q.y, q.c, 1); g.globalAlpha = 1;
    }
  }

  /* ---------------- HUD ---------------- */
  function drawHUD(g) {
    g.fillStyle = 'rgba(8,2,8,0.62)'; g.fillRect(0, 0, W, 14);
    const S = heroSpec(heroId);
    text(g, S.name, 3, 3, '#f0e0c8', 1);
    for (let i = 0; i < S.hpMax; i++) {
      g.fillStyle = i < player.hp ? '#d03040' : '#3a1818';
      g.fillRect(52 + i * 8, 3, 7, 7);
      if (i < player.hp) { g.fillStyle = '#f09098'; g.fillRect(53 + i * 8, 4, 3, 2); }
    }
    g.fillStyle = '#2a2a30'; g.fillRect(100, 3, 6, 7); g.fillStyle = '#e8c040'; g.fillRect(102, 1, 2, 3);
    text(g, 'x' + player.grenades, 108, 3, '#e8c040', 1);
    if (player.weapon === 'heavy') text(g, 'HEAVY', 136, 3, '#3ec8e0', 1);
    text(g, 'x' + Math.max(0, player.lives), 200, 3, '#f0e0c8', 1);
    text(g, String(score).padStart(6, '0'), 268, 3, '#e0d0a0', 1);
    if (boss && (boss.alive || boss.state === 'die')) {
      textC(g, 'THE GRAVE TITAN', W / 2, 16, '#e23b3b', 1);
      const bw = 160, bx = (W - bw) / 2, k = Math.max(0, boss.hp / boss.max);
      g.fillStyle = '#2a1010'; g.fillRect(bx - 1, 24, bw + 2, 6);
      g.fillStyle = '#e23b3b'; g.fillRect(bx, 25, bw * k, 4);
      g.fillStyle = '#f08080'; g.fillRect(bx, 25, bw * k, 1);
    }
  }

  /* ---------------- screens ---------------- */
  function drawTitle(g) {
    drawSky(g, 80, titleT);
    // ground strip
    g.fillStyle = '#1a1614'; g.fillRect(0, GROUND, W, H - GROUND);
    g.fillStyle = '#2a2018'; g.fillRect(0, GROUND, W, 4);
    g.drawImage(SPR.tree, 10, 106);
    g.drawImage(SPR.tree, 250, 108);
    g.drawImage(SPR.tomb[1], 40, GROUND - 26);
    g.drawImage(SPR.tomb[0], 260, GROUND - 20);
    // fog
    g.fillStyle = 'rgba(90,80,100,0.22)';
    g.beginPath(); g.ellipse(80, 150, 120, 18, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(240, 155, 140, 16, 0, 0, Math.PI * 2); g.fill();
    // heroes
    const bob = Math.sin(titleT * 2) * 2;
    g.drawImage(SPR.avrill.R.idle[0], 90, GROUND - 30 + bob);
    g.drawImage(SPR.oakens.R.idle[0], 200, GROUND - 36 - bob);
    // title
    textC(g, 'GOTICO', W / 2, 16, '#e23b3b', 3);
    textC(g, 'HUNTERS OF THE RED MOON', W / 2, 42, '#f0d0c0', 1);
    // select
    const names = ['AVRILL', 'OAKENS'];
    const xs = [80, 196];
    for (let i = 0; i < 2; i++) {
      const on = sel === i;
      g.strokeStyle = on ? '#e23b3b' : 'rgba(200,200,220,0.3)';
      g.lineWidth = 1; g.strokeRect(xs[i] - 8, GROUND - 44, 48, 50);
      textC(g, names[i], xs[i] + 16, GROUND + 8, on ? '#fff' : '#a0a0b0', 1);
    }
    const hint = touchMode ? 'TAP A HUNTER  ·  TAP AGAIN TO START' : 'LEFT/RIGHT SELECT   ENTER START';
    textC(g, hint, W / 2, 62, '#c0b0c0', 1);
  }
  function drawPause(g) {
    g.fillStyle = 'rgba(6,2,8,0.7)'; g.fillRect(0, 0, W, H);
    textC(g, 'PAUSED', W / 2, 50, '#f0e0c8', 2);
    const items = ['RESUME', 'RETRY', 'TITLE'];
    items.forEach((it, i) => textC(g, (pauseSel === i ? '> ' : '  ') + it + (pauseSel === i ? ' <' : ''), W / 2, 86 + i * 16, pauseSel === i ? '#e23b3b' : '#d0d0e0', 1));
  }
  function drawOver(g) {
    g.fillStyle = 'rgba(6,2,8,0.75)'; g.fillRect(0, 0, W, H);
    textC(g, 'GAME OVER', W / 2, 50, '#e23b3b', 2);
    textC(g, 'SCORE ' + String(score).padStart(6, '0'), W / 2, 78, '#f0e0c8', 1);
    const items = ['RETRY', 'TITLE'];
    items.forEach((it, i) => textC(g, (overSel === i ? '> ' : '  ') + it + (overSel === i ? ' <' : ''), W / 2, 100 + i * 16, overSel === i ? '#e23b3b' : '#d0d0e0', 1));
  }
  function drawClear(g) {
    g.fillStyle = 'rgba(6,2,8,0.6)'; g.fillRect(0, 0, W, H);
    textC(g, 'LEVEL CLEAR', W / 2, 36, '#f0e080', 2);
    textC(g, 'THE GRAVE TITAN FALLS', W / 2, 58, '#e23b3b', 1);
    textC(g, 'SCORE  ' + score, W / 2, 80, '#f0e0c8', 1);
    textC(g, 'KILLS  ' + kills, W / 2, 94, '#f0e0c8', 1);
    textC(g, 'TIME   ' + Math.floor(runT / 60) + ':' + String(Math.floor(runT % 60)).padStart(2, '0'), W / 2, 108, '#f0e0c8', 1);
    const hint = touchMode ? 'TAP TO CONTINUE' : 'PRESS ENTER';
    if (clearT > 1.2) textC(g, hint, W / 2, 140, '#c0b0c0', 1);
  }

  /* ---------------- screens update ---------------- */
  function updateTitle() {
    titleT += 1 / 60;
    if (just.left || just.right) { sel = sel ^ 1; sfx.ui(); }
    // tap portraits
    // handled via start + x? simple: start confirms
    if (just.start) { startRun(sel === 0 ? 'avrill' : 'oakens'); }
  }
  function updatePause() {
    if (just.left || just.right || tapped.ArrowUp || tapped.KeyW || tapped.ArrowDown || tapped.KeyS) {
      if (just.left || tapped.ArrowUp || tapped.KeyW) pauseSel = (pauseSel + 2) % 3;
      else pauseSel = (pauseSel + 1) % 3;
      sfx.ui();
      tapped.ArrowUp = tapped.KeyW = tapped.ArrowDown = tapped.KeyS = 0;
    }
    if (just.start || just.jump) {
      if (pauseSel === 0) { state = 'play'; sfx.ok(); }
      else if (pauseSel === 1) startRun(heroId);
      else { state = 'title'; sfx.ui(); }
    }
    if (just.pause) { state = 'play'; }
  }
  function updateOver() {
    if (just.left || just.right) { overSel ^= 1; sfx.ui(); }
    if (just.start || just.jump) {
      if (overSel === 0) startRun(heroId);
      else { state = 'title'; sfx.ui(); }
    }
  }

  /* ---------------- main loop ---------------- */
  let last = 0;
  function update(dt) {
    pollKeys(); mergeTouch();
    T += dt;
    if (state === 'title') updateTitle();
    else if (state === 'pause') updatePause();
    else if (state === 'over') updateOver();
    else if (state === 'clear') {
      clearT += dt; updateParts(dt);
      if (clearT > 1.2 && (just.start || just.jump)) { state = 'title'; titleT = 0; }
    } else if (state === 'play') {
      if (just.pause) { state = 'pause'; pauseSel = 0; }
      else {
        runT += dt;
        updatePlayer(dt);
        updateShots(dt);
        updateEnemies(dt);
        updatePickups(dt);
        updateBoss(dt);
        updateParts(dt);
        updateCam(dt);
      }
    }
    for (const k of Object.keys(just)) just[k] = 0;
  }
  function draw() {
    const g = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;
    if (state === 'title') { drawTitle(g); return; }
    drawSky(g, cam, T);
    g.save();
    g.translate(-(cam | 0) + sx, sy);
    drawDecos(g);
    drawGround(g, cam);
    drawEntities(g);
    if (player) drawHero(g, player);
    drawBoss(g);
    drawParts(g);
    g.fillStyle = 'rgba(80,70,90,0.10)';
    g.fillRect(cam, GROUND - 18, W, 22);
    g.restore();
    if (player) drawHUD(g);
    if (flash > 0) { g.fillStyle = `rgba(255,230,220,${flash * 0.6})`; g.fillRect(0, 0, W, H); }
    if (state === 'pause') drawPause(g);
    if (state === 'over') drawOver(g);
    if (state === 'clear') drawClear(g);
  }
  function loop(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }

  bakeAll(); initBg();
  requestAnimationFrame(loop);

  /* debug hooks for screenshots (not advertised) */
  window.GT = {
    get state() { return state; },
    get player() { return player; },
    get boss() { return boss; },
    get cam() { return cam; },
    setCam(v) { cam = v; },
    start: startRun,
    seekArena() {
      if (state !== 'play') startRun(heroId);
      player.x = ARENA_X - 40; cam = ARENA_X - 200;
    },
    spawnBoss() { if (state !== 'play') startRun(heroId); player.x = ARENA_X + 40; cam = ARENA_X; startBoss(); },
    W, H, LEVEL_W, ARENA_X,
  };
})();
