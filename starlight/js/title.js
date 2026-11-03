/* Title screen (animated prototype) + mode menu. */
SL.Title = (() => {
  const { W, H } = SL;
  const img = new Image(); img.src = 'assets/title.jpg';
  let phase = 'press', T = 0, flashAt = -1, sel = 0, denyAt = -1;
  const stars = new SL.Starfield();
  const menu = [
    { id: 'survival', label: 'SURVIVAL', x: 512, y: 446, w: 300, h: 40, rgb: '255,80,220' },
    { id: 'story', label: 'STORY MODE', sub: 'COMING SOON', x: 512, y: 496, w: 300, h: 44, rgb: '70,160,255', disabled: true },
  ];

  // mask: where moving stars may appear (soft holes over title art)
  function hole(g, x, y, rx, ry, hard = 0.55) {
    g.save(); g.translate(x, y); g.scale(rx, ry);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, '#000'); gr.addColorStop(hard, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
  }
  const mask = SL.mkCanvas(); {
    const g = mask.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'destination-out';
    hole(g, 512, 150, 430, 115, .7); hole(g, 90, 30, 95, 26); hole(g, 890, 30, 135, 26);
    hole(g, 185, 410, 135, 215, .65); hole(g, 838, 410, 135, 215, .65); hole(g, 514, 335, 82, 95, .6);
    hole(g, 512, 470, 215, 62, .65); hole(g, 268, 322, 52, 52, .5); hole(g, 725, 322, 50, 50, .5); hole(g, 512, 566, 300, 22, .4);
  }
  const layer = SL.mkCanvas(), lg = layer.getContext('2d');
  const ast = [{ x: 268, y: 322, r: 47, dir: 1, sp: 0.12 }, { x: 725, y: 322, r: 45, dir: -1, sp: 0.10 }];
  const ac = SL.mkCanvas(128, 128), ag = ac.getContext('2d');
  const noise = t => Math.sin(t * 31.7) * .5 + Math.sin(t * 53.1 + 1.3) * .3 + Math.sin(t * 97.3 + 2.1) * .2;

  function drawAsteroid(g, A, t) {
    const R = A.r, k = img.naturalWidth / W;
    ag.setTransform(1, 0, 0, 1, 0, 0); ag.globalCompositeOperation = 'source-over'; ag.clearRect(0, 0, 128, 128);
    ag.translate(64, 64); ag.rotate(A.dir * A.sp * t);
    ag.drawImage(img, (A.x - R * 1.5) * k, (A.y - R * 1.5) * k, R * 3 * k, R * 3 * k, -R * 1.5, -R * 1.5, R * 3, R * 3);
    ag.setTransform(1, 0, 0, 1, 0, 0); ag.globalCompositeOperation = 'destination-in';
    const gr = ag.createRadialGradient(64, 64, 0, 64, 64, R); gr.addColorStop(0, '#000'); gr.addColorStop(.82, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ag.fillStyle = gr; ag.fillRect(0, 0, 128, 128);
    const bob = Math.sin(t * 0.9 + A.dir) * 1.2;
    g.drawImage(ac, A.x - 64, A.y - 64 + bob);
    SL.glow(g, A.x, A.y + bob, R * 1.05, R * 1.05, A.dir > 0 ? '255,80,220' : '70,140,255', 0.07 + 0.05 * Math.sin(t * 1.7 + A.dir));
  }
  function drawThruster(g, t) {
    const f = 0.75 + 0.25 * noise(t), x = 514, y0 = 362, len = 55 + 22 * f;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(0, y0, 0, y0 + len);
    gr.addColorStop(0, `rgba(255,235,255,${.55 * f})`); gr.addColorStop(.25, `rgba(255,90,220,${.45 * f})`); gr.addColorStop(1, 'rgba(255,40,180,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 13, y0); g.quadraticCurveTo(x - 9, y0 + len * .6, x, y0 + len); g.quadraticCurveTo(x + 9, y0 + len * .6, x + 13, y0); g.closePath(); g.fill();
    g.restore();
    SL.glow(g, x, y0 + 18, 34 + 6 * f, 48 + 10 * f, '255,60,210', 0.22 * f + 0.08);
    SL.glow(g, x, y0 + 4, 16, 10, '255,220,255', 0.35 * f);
  }
  function drawVisors(g, t) {
    SL.glow(g, 183, 293, 48, 16, '255,70,220', 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 2.2)));
    SL.glow(g, 840, 297, 48, 16, '70,150,255', 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 2.2 + 1.6)));
  }
  function drawHiScore(g) {
    g.fillStyle = 'rgba(2,1,8,0.96)'; g.fillRect(770, 12, 248, 38);
    SL.neonText(g, 'HI-SCORE ' + SL.pad(SL.getBest()), 998, 31, 21, '255,80,210', { align: 'right', blur: 10 });
  }
  function drawPress(g, t) {
    if ((t % 1.1) >= 0.7) SL.softRect(g, 512, 452, 195, 34, 'rgba(3,2,10,0.85)');
    else SL.glow(g, 512, 452, 200, 34, '255,90,220', 0.10);
  }
  function drawMenu(g, t) {
    // opaque panel over the baked PRESS START / TAP THE SCREEN text
    SL.softRect(g, 512, 476, 250, 90, 'rgba(3,1,12,0.9)', .7);
    g.save(); SL.roundRect(g, 322, 418, 380, 128, 12); g.fillStyle = 'rgba(4,2,14,0.97)'; g.fill();
    g.strokeStyle = 'rgba(170,90,255,0.35)'; g.lineWidth = 1; g.stroke(); g.restore();
    menu.forEach((b, i) => {
      const shake = (b.disabled && denyAt >= 0 && T - denyAt < 0.3) ? Math.sin((T - denyAt) * 80) * 4 : 0;
      SL.drawButton(g, Object.assign({}, b, { x: b.x + shake }), i === sel, t);
    });
    SL.neonText(g, SL.Input.touchMode ? 'TAP TO SELECT' : '↑↓ SELECT · ENTER START', 512, 536, 11, '160,200,255', { blur: 4, alpha: 0.7 });
  }
  function drawFlash(g) {
    if (flashAt < 0) return; const e = T - flashAt; if (e > 0.5) { flashAt = -1; return; }
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,220,255,${0.18 * (1 - e * 2)})`; g.fillRect(0, 0, W, H); g.restore();
  }

  function choose(i) {
    sel = i; const b = menu[i];
    if (b.disabled) { denyAt = T; SL.Audio.sfx.deny(); return; }
    SL.Audio.sfx.blip(880); SL.start('play');
  }
  return {
    enter(p = 'press') { phase = p; flashAt = -1; },
    get phase() { return phase; },
    update(dt) {
      T += dt; stars.update(dt);
      const I = SL.Input, downs = I.takeDowns();
      if (phase === 'press') {
        if (downs.length || I.confirm() || I.hitAny('KeyA', 'KeyS', 'KeyD', 'KeyW', 'ArrowUp', 'ArrowDown')) { phase = 'menu'; flashAt = T; SL.Audio.sfx.blip(); }
        return;
      }
      if (I.hitAny('ArrowUp', 'KeyW', 'ArrowDown', 'KeyS')) { sel = 1 - sel; SL.Audio.sfx.blip(520); }
      if (I.confirm()) choose(sel);
      for (const d of downs) menu.forEach((b, i) => { if (SL.inBtn(b, d)) choose(i); });
      if (I.hit('KeyM')) SL.Audio.toggleMute();
    },
    draw(g) {
      if (!img.complete || !img.naturalWidth) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
      g.drawImage(img, 0, 0, W, H);
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, W, H);
      lg.fillStyle = 'rgba(0,0,0,0.28)'; lg.fillRect(0, 0, W, H);
      stars.draw(lg, T); lg.globalCompositeOperation = 'destination-in'; lg.drawImage(mask, 0, 0);
      g.drawImage(layer, 0, 0);
      ast.forEach(A => drawAsteroid(g, A, T));
      drawThruster(g, T); drawVisors(g, T); drawHiScore(g);
      if (phase === 'press') drawPress(g, T); else drawMenu(g, T);
      drawFlash(g);
      SL.drawScanlines(g);
    },
  };
})();
