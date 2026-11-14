/* v0.6.4 Story opening crawl — credits-style scrolling text over a Fleet-base observation deck.
   Plays every time the player starts Story Mode from the title (skippable). After it ends,
   a fresh story (unlocked is still L1) goes to the level-1 brief; otherwise the mission map.
   Backdrop is the painted observation-deck scene (Edisar, Avrill, Oakens at the window). */
SL.Intro = (() => {
  const { W, H } = SL;
  const FONT = '"DejaVu Sans", Verdana, Arial, Helvetica, sans-serif';
  const LINES = [
    'Year 2187. The asteroid belt threatens every colony in the system.',
    'The Starlight Fleet stands between humanity and the dark.',
    'At Fleet base, Commander Edisar calls in his two best pilots.',
    "Avrill, the Fleet's brightest star.",
    'And Oakens, a young prodigy.',
    '"A madman called Nebula is pushing the asteroids toward our colonies," he tells them.',
    '"He wants the belt for himself. Clear it, and stop him."',
    'Orders are orders.',
    'Pilots... to your ships.',
  ];
  // Large centered crawl across most of the width; a soft dark veil keeps it readable over the painting.
  const SPEED = 34, T_START = 1.6, HOLD = 4.2, FADE = 2.2, SIZE = 44, LH = 60, PG = 40, MAXW = 880;
  const TEXT_X = 512, TEXT_Y0 = 520, TEXT_TOP = 90, TEXT_BOT = 530, ZR = 0.0014;
  const skipBtn = { label: 'SKIP ▶▶', x: 940, y: 34, w: 140, h: 40, rgb: '160,200,255', size: 16 };
  const bg = new Image(); bg.src = 'assets/intro-deck.jpg';
  let items = null, S_END = 0, DUR = 0, t = 0, left = false, opt = {};

  const font = (px, bold) => `${bold ? 'bold ' : ''}${px}px ${FONT}`;
  function layout() {
    const m = SL.mkCanvas(4, 4).getContext('2d');
    const wrap = (txt, f) => {
      m.font = f; const out = []; let cur = '';
      for (const w of txt.split(/\s+/)) {
        const s = (cur + ' ' + w).trim();
        if (m.measureText(s).width <= MAXW) cur = s; else { out.push(cur); cur = w; }
      }
      if (cur) out.push(cur); return out;
    };
    items = []; let y = 0;
    const fb = font(SIZE, true);
    LINES.forEach(p => {
      const quote = p.charAt(0) === '"';
      for (const ln of wrap(p, fb)) {
        items.push({ y, text: ln, font: fb, rgb: quote ? '180,230,255' : '225,250,255', size: SIZE });
        y += LH;
      }
      y += PG;
    });
    S_END = TEXT_Y0 + y - TEXT_TOP;
    DUR = T_START + S_END / SPEED + HOLD;
  }
  function drawScene(g) {
    if (!bg.complete || !bg.naturalWidth) { g.fillStyle = '#05010c'; g.fillRect(0, 0, W, H); return; }
    const z = 1 + ZR * t, iw = bg.naturalWidth, ih = bg.naturalHeight, cw = iw / z, ch = ih / z;
    // Slight bias toward the belt so the slow zoom feels like looking out the window.
    const sx = (iw - cw) * 0.62, sy = (ih - ch) * 0.28;
    g.drawImage(bg, sx, sy, cw, ch, 0, 0, W, H);
  }
  function drawVeil(g) {
    const a = Math.min(1, t / 0.7) * fin();
    if (a <= 0) return;
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.10, `rgba(0,0,0,${0.28 * a})`);
    grd.addColorStop(0.28, `rgba(0,0,0,${0.58 * a})`);
    grd.addColorStop(0.72, `rgba(0,0,0,${0.58 * a})`);
    grd.addColorStop(0.90, `rgba(0,0,0,${0.28 * a})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
  }
  function drawCrawl(g) {
    const s = Math.min(SPEED * Math.max(0, t - T_START), S_END);
    g.textAlign = 'center'; g.textBaseline = 'top';
    const sc = SL.view.scale;
    for (const it of items) {
      const y = TEXT_Y0 + it.y - s; if (y < -80 || y > H + 10) continue;
      const cy = y + it.size * 0.55;
      const e = Math.max(0, Math.min(1, Math.min((cy - TEXT_TOP) / 70, (TEXT_BOT - cy) / 70)));
      if (e <= 0) continue;
      g.font = it.font;
      // Soft dark cushion + outline so the large type stays readable over the characters (and on mobile).
      g.shadowColor = `rgba(0,0,0,${0.9 * e})`; g.shadowBlur = 22 * sc;
      g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = `rgba(0,0,0,${0.55 * e})`;
      g.strokeText(it.text, TEXT_X, y);
      g.shadowColor = `rgba(${it.rgb},${0.85 * e})`; g.shadowBlur = 14 * sc;
      g.fillStyle = `rgba(${it.rgb},${e})`; g.fillText(it.text, TEXT_X, y);
    }
    g.shadowBlur = 0; g.lineWidth = 1;
  }
  function fin() { return 1 - Math.max(0, Math.min(1, (t - (DUR - FADE)) / FADE)); }
  function exit() {
    if (left) return; left = true;
    if (!opt.replay) SL.Progress.seeIntro();
    SL.Audio.setMusicVolume(1);
    const next = opt.then || (() => SL.startMission(1));
    next();
  }
  return {
    get t() { return t; }, get duration() { return DUR; }, get lines() { return LINES; },
    seek(s) { t = s; if (!items) layout(); },
    enter(o = {}) {
      opt = o; t = 0; left = false; if (!items) layout();
      SL.Audio.setMusicVolume(0); SL.Audio.playTrack('intro');
    },
    update(dt) {
      t += dt;
      const I = SL.Input, downs = I.takeDowns();
      if (I.hit('KeyM')) SL.Audio.toggleMute();
      SL.Audio.setMusicVolume(Math.min(1, t / 1.4) * fin());
      const grace = 0.45;
      const skipKey = I.hitAny('Enter', 'Space', 'NumpadEnter', 'Escape', 'Backspace');
      const skipTap = downs.some(d => d.role !== 'ui');
      if (t > grace && (skipKey || skipTap || downs.some(d => SL.inBtn(skipBtn, d)))) return exit();
      if (t >= DUR + 0.4) return exit();
    },
    draw(g) {
      drawScene(g);
      drawVeil(g);
      drawCrawl(g);
      const f = fin();
      if (f < 1) { g.fillStyle = `rgba(0,0,0,${1 - f})`; g.fillRect(0, 0, W, H); }
      if (t > 0.45 && f > 0.2) {
        SL.drawButton(g, skipBtn, false, t);
        SL.neonText(g, SL.Input.touchMode ? 'TAP TO SKIP' : 'ENTER · ESC · SPACE', 940, 70, 11, '160,200,255', { blur: 4, alpha: 0.55 + 0.25 * Math.sin(t * 3) });
      }
    },
  };
})();
