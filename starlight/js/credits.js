/* v0.5.0 END CREDITS — canvas port of the approved preview (credits-preview/render.py).
   Laid out in the preview's 1280x720 space and scaled to the 1024x576 game canvas.
   Drifting neon star layers, flat upward crawl with edge fade, background art at 35% with a slow shared zoom,
   2.5 s eased crossfade to Avrill's memorial art at 55% when the "Supernova" dedication enters, music fades at the end. */
SL.Credits = (() => {
  const CW = 1280, CH = 720, FONT = '"DejaVu Sans", Verdana, Arial, Helvetica, sans-serif';
  const PARAS = [
    'After the fall of Commander Edisar Starlight, the truth reached every corner of the system.',
    'Dr. Frank Nebula, once called a madman, was finally heard.',
    'Together, Oakens and Nebula rebuilt the asteroid belt, the ancient shield that had always protected our world.',
    'The Starlight Fleet was disbanded. Its ships now guard the belt instead of breaking it.',
    'Oakens still flies the same route every night, with one empty wing beside him.',
    'This game is dedicated to the memory of Avrill "Supernova", who died defending what she believed in.',
    'Some stars burn brightest at the very end.',
  ];
  const MUSIC = [
    ['"Full Moon" (end credits)', 'Marcelo Fernández, migfus20 & ISAo  ·  mix by glitchart'],
    ['"Last One Standing" (final battle)', 'Centurion_of_war'],
    ['"Angel Eyes (Vision II)"', 'Kim Lightyear (KLY)'],
    ['"Neon Owl" (opening crawl)', 'Zodik'],
    ['"The Last Encounter"', 'Matthew Pablo, Zefz & neocrey  ·  mix by glitchart'],
    ['"HellDrake"', 'Centurion_of_war'],
  ];
  const SPEED = 30, T_START = 1.5, HOLD = 6, FADE = 3, XF = 2.5, AV_OP = 0.55, PH_OP = 0.35, ZR = 0.0018, LH = 58, PG = 70, MAXW = 860;
  const ph = new Image(); ph.src = 'assets/credits-nebula-oakens.jpg';
  const av = new Image(); av.src = 'assets/credits-avrill.jpg';
  let items = null, marks = {}, S_END = 0, DUR = 0, T_X = 0, t = 0, opt = {}, tiles = null, left = false;
  const font = (px, bold) => `${bold ? 'bold ' : ''}${px}px ${FONT}`;
  function layout() {
    const m = SL.mkCanvas(4, 4).getContext('2d');
    const wrap = (txt, f) => { m.font = f; const out = []; let cur = ''; for (const w of txt.split(/\s+/)) { const s = (cur + ' ' + w).trim(); if (m.measureText(s).width <= MAXW) cur = s; else { out.push(cur); cur = w; } } out.push(cur); return out; };
    items = []; marks = {}; let y = 0;
    const fb = font(36);
    PARAS.forEach((p, i) => { marks[i] = y; for (const ln of wrap(p, fb)) { items.push({ y, text: ln, font: fb, rgb: '225,250,255', size: 36 }); y += LH; } y += PG; });
    y += 200; marks.credits = y;
    items.push({ y, text: 'PROJECT STARLIGHT', font: font(64, true), rgb: '120,240,255', size: 64 }); y += 100;
    items.push({ y, text: 'A game by Juan Carlos Garcia (OakensGL)', font: font(30), rgb: '235,245,255', size: 30 }); y += 130;
    items.push({ y, text: 'MUSIC', font: font(30, true), rgb: '255,120,220', size: 30 }); y += 70;
    for (const [ti, au] of MUSIC) { items.push({ y, text: ti, font: font(26, true), rgb: '235,245,255', size: 26 }); y += 38; items.push({ y, text: au, font: font(24), rgb: '150,220,240', size: 24 }); y += 62; }
    y += 180; marks.thanks = y;
    items.push({ y, text: 'Thank you for playing', font: font(44, true), rgb: '255,170,230', size: 44 });
    S_END = CH + (marks.thanks + 25) - CH / 2;
    DUR = T_START + S_END / SPEED + HOLD;
    T_X = T_START + marks[5] / SPEED;
  }
  function starTile(n, sizes) {
    const c = SL.mkCanvas(CW, CH * 2), g = c.getContext('2d'), cols = ['120,230,255', '255,90,220', '255,150,200', '230,240,255', '230,240,255'];
    for (let i = 0; i < n; i++) {
      const x = Math.random() * CW, y = Math.random() * CH * 2, r = sizes[(Math.random() * sizes.length) | 0], b = 0.4 + Math.random() * 0.6, col = cols[(Math.random() * cols.length) | 0];
      for (const dy of [0, -CH * 2, CH * 2]) { g.beginPath(); g.arc(x, y + dy, r, 0, Math.PI * 2); g.fillStyle = `rgba(${col},${b})`; g.shadowColor = `rgba(${col},${b})`; g.shadowBlur = 8; g.fill(); }
    }
    return c;
  }
  const smooth = k => k * k * (3 - 2 * k);
  function drawZoomed(g, img, alpha) {
    if (!img.complete || !img.naturalWidth || alpha <= 0) return;
    const z = 1 + ZR * t, iw = img.naturalWidth, ih = img.naturalHeight, w = iw / z, h = ih / z;
    g.globalAlpha = alpha; g.drawImage(img, (iw - w) / 2, (ih - h) / 2, w, h, 0, 0, CW, CH); g.globalAlpha = 1;
  }
  function exit() {
    if (left) return; left = true;
    // hook: post-credits scene (e.g. the radio message, waiting on a real voice recording)
    const post = SL.Features.story.postCredits && SL.Features.story.postCredits(opt);
    if (post && post.play) return post.play(() => back());
    back();
  }
  function back() {
    SL.Audio.setMusicVolume(1);
    if (opt.session && !opt.debug) SL.start('map', { session: opt.session, sel: SL.FINAL_LEVEL, submit: true });   // rank the finished run
    else if (opt.debug) SL.start('menu');
    else SL.start('map', { session: null, sel: SL.FINAL_LEVEL });
  }
  const skipBtn = { label: 'SKIP ▶▶', x: 958, y: 548, w: 110, h: 30, rgb: '160,200,255', size: 13 };
  return {
    get t() { return t; }, get duration() { return DUR; }, get crossfadeAt() { return T_X; },
    seek(s) { t = s; },                                   // tests
    enter(o = {}) {
      opt = o; t = 0; left = false; if (!items) layout();
      if (!tiles) tiles = [starTile(380, [0.6, 0.8, 1.0]), starTile(70, [1.3, 1.8, 2.2])];
      SL.Audio.setMusicVolume(0); SL.Audio.playTrack('credits');
      SL.Events.emit('credits', o);
    },
    update(dt) {
      t += dt;
      const I = SL.Input, downs = I.takeDowns();
      if (I.hit('KeyM')) SL.Audio.toggleMute();
      const fin = 1 - Math.max(0, Math.min(1, (t - (DUR - FADE)) / FADE));
      SL.Audio.setMusicVolume(Math.min(1, t / 1.5) * fin);
      const any = downs.length || I.hitAny('Enter', 'Space', 'NumpadEnter', 'Escape', 'Backspace');
      if (t > 4 && downs.some(d => SL.inBtn(skipBtn, d))) return exit();
      if (t > 4 && I.hitAny('Escape')) return exit();
      if (t >= DUR - FADE && any) return exit();
      if (t >= DUR + 6) return exit();
    },
    draw(g) {
      const s0 = SL.W / CW;
      g.fillStyle = '#000'; g.fillRect(0, 0, SL.W, SL.H);
      g.save(); g.scale(s0, s0);
      // stars (two layers drifting down)
      g.save(); g.globalCompositeOperation = 'lighter';
      [[tiles[0], 12, 0.9], [tiles[1], 26, 1]].forEach(([tile, v, a]) => { const o = (t * v) % (CH * 2); g.globalAlpha = a; g.drawImage(tile, 0, o - CH * 2); g.drawImage(tile, 0, o); });
      g.restore();
      // background art: f*(1-op) + img*op, crossfade PH -> AV
      const k = smooth(Math.max(0, Math.min(1, (t - T_X) / XF))), op = (PH_OP + (AV_OP - PH_OP) * k) * Math.min(1, t / 2.5);
      g.fillStyle = `rgba(0,0,0,${op})`; g.fillRect(0, 0, CW, CH);
      g.save(); g.globalCompositeOperation = 'lighter'; drawZoomed(g, ph, op * (1 - k)); drawZoomed(g, av, op * k); g.restore();
      // crawl
      const s = Math.min(SPEED * Math.max(0, t - T_START), S_END);
      g.textAlign = 'center'; g.textBaseline = 'top';
      for (const it of items) {
        const y = CH + it.y - s; if (y < -80 || y > CH + 10) continue;
        const cy = y + it.size * 0.55, e = Math.max(0, Math.min(1, Math.min(cy / 90, (CH - cy) / 60))); if (e <= 0) continue;
        g.font = it.font;
        g.shadowColor = `rgba(${it.rgb},${0.9 * e})`; g.shadowBlur = 12 * SL.view.scale * s0;
        g.fillStyle = `rgba(${it.rgb},${e})`; g.fillText(it.text, CW / 2, y);
      }
      g.shadowBlur = 0;
      g.restore();
      const fin = 1 - Math.max(0, Math.min(1, (t - (DUR - FADE)) / FADE));
      if (fin < 1) { g.fillStyle = `rgba(0,0,0,${1 - fin})`; g.fillRect(0, 0, SL.W, SL.H); }
      if (t > 4 && t < DUR - FADE) SL.drawButton(g, skipBtn, false, t);
      if (t >= DUR - FADE) SL.neonText(g, SL.Input.touchMode ? 'TAP TO CONTINUE' : 'PRESS ANY KEY', 512, 520, 14, '160,200,255', { blur: 6, alpha: 0.5 + 0.4 * Math.sin(t * 4) });
    },
  };
})();
