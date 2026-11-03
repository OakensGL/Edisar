/* v0.4.1 Story Mode MISSION MAP (Mario World style, Starlight neon space theme).
   Progress = highest unlocked level, saved in localStorage ('starlight.story.unlocked').
   Cleared levels = every level below it. Only unlocked levels can be launched. */
SL.Progress = {
  get unlocked() { return Math.max(1, Math.min(SL.FINAL_LEVEL, parseInt(SL.store.get(SL.CONFIG.storage.unlocked, '1'), 10) || 1)); },
  unlock(n) { if (n > this.unlocked) SL.store.set(SL.CONFIG.storage.unlocked, Math.min(SL.FINAL_LEVEL, n)); },
};
SL.Map = (() => {
  const { W, H } = SL, SC = () => SL.CONFIG.story;
  const STEP = 150, X0 = 130, Y0 = 292;
  const FIN = () => SL.FINAL_LEVEL, isFinal = L => L === FIN();
  const isBoss = L => L % SC().boss.every === 0 && !isFinal(L);
  const nodeX = L => X0 + (L - 1) * STEP, nodeY = L => Y0 + Math.sin((L - 1) * 0.9) * 92 + (isBoss(L) ? -6 : 0);
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
  let T = 0, sel = 1, camX = 0, camT = 0, drag = null, msg = null, phase = 'map', session = null, hiRank = -1;
  const stars = new SL.Starfield(0.8);
  const backBtn = { id: 'back', label: 'BACK', x: 72, y: 30, w: 116, h: 34, rgb: '70,160,255', size: 16 };
  const playBtn = { id: 'play', label: 'LAUNCH', x: 868, y: 512, w: 200, h: 46, rgb: '255,80,220' };
  // Nebula icon (downscaled portrait, round)
  const nimg = new Image(); nimg.src = 'assets/nebula.jpg'; let nIcon = null;
  function nebulaIcon() {
    if (nIcon) return nIcon; if (!nimg.complete || !nimg.naturalWidth) return null;
    const N = 64, c = SL.mkCanvas(N, N), x = c.getContext('2d');
    x.beginPath(); x.arc(N / 2, N / 2, N / 2 - 1, 0, Math.PI * 2); x.clip(); x.drawImage(nimg, 0, 0, N, N);
    return (nIcon = c);
  }
  // asteroid belt along the route (deterministic)
  let belt = null, beltN = 0;
  function buildBelt(n) {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const sprites = [];
    for (const r of [5, 8, 12]) SL.CONFIG.asteroid.colors.forEach(c => sprites.push(SL.Sprites.asteroid(r, c)));
    belt = []; beltN = n;
    const len = nodeX(n + 3) + 200;
    for (let x = -100; x < len; x += 9) {
      const L = (x - X0) / STEP + 1, cy = Y0 + Math.sin((L - 1) * 0.9) * 92;
      const side = rnd() < 0.5 ? -1 : 1, off = side * (48 + rnd() * 120);
      if (rnd() < 0.55) belt.push({ x: x + rnd() * 9, y: cy + off, sp: sprites[(rnd() * sprites.length) | 0], rot: rnd() * 6.28, spin: (rnd() - 0.5) * 0.6, a: 0.35 + rnd() * 0.4 });
    }
  }
  const count = () => { const u = SL.Progress.unlocked, nb = Math.ceil((u + 1) / 5) * 5; return Math.min(FIN(), Math.max(u + 4, nb, 10)); };
  const maxCam = () => Math.max(0, nodeX(count()) + 140 - W);
  const clampCam = x => Math.max(0, Math.min(maxCam(), x));
  const focus = L => { camT = clampCam(nodeX(L) - W * 0.42); };
  const info = L => {
    if (isFinal(L)) return 'FINAL MISSION';
    if (isBoss(L)) return `BOSS · DR. NEBULA'S PROTOTYPE MK-${roman(L / SC().boss.every)}`;
    return `DESTROY ${SC().goalBase + SC().goalPerLevel * (L - 1)} ASTEROIDS · HOLD THE SECTOR ${fmt(SL.Story.levelDuration(L))}`;
  };
  function select(L, say = true) {
    const u = SL.Progress.unlocked;
    if (L > u) { msg = { text: `LOCKED — CLEAR LEVEL ${L - 1} FIRST`, t: 0 }; SL.Audio.sfx.deny(); return false; }
    if (L !== sel && say) SL.Audio.sfx.blip(620);
    sel = Math.max(1, L); focus(sel); return true;
  }
  function launch() {
    if (sel > SL.Progress.unlocked) { SL.Audio.sfx.deny(); return; }
    if (isFinal(sel)) { msg = { text: 'FINAL MISSION — COMING IN A FUTURE UPDATE', t: 0 }; SL.Audio.sfx.deny(); return; }
    SL.Audio.sfx.launch(); SL.startMission(sel, false, session);
  }
  function leave() {
    // leaving the map ends the session: rank it if it qualifies
    const u = SL.Progress.unlocked, e = session && { score: session.score, level: u, time: session.time, kills: session.kills };
    if (e && e.score > 0 && SL.Scores.qualifies(e, 'story')) {
      phase = 'entry'; SL.NameEntry.open(SL.Scores.lastName, name => {
        SL.Scores.lastName = name; hiRank = SL.Scores.add({ name, ...e, date: new Date().toISOString() }, 'story'); session = null; phase = 'table'; T = 0;
      });
      return;
    }
    session = null; SL.Audio.sfx.blip(520); SL.start('menu');
  }
  // final node: big gold/white star node, label FINAL, no spoiler details
  function drawFinal(g, L, u, teaser) {
    const x = nodeX(L), y = nodeY(L), locked = L > u, r = 30, pulse = 0.5 + 0.5 * Math.sin(T * 3), rgb = '255,225,140';
    g.save(); g.globalAlpha = teaser ? 0.35 : locked ? 0.7 : 1;
    SL.glow(g, x, y, r * 3.2, r * 3.2, rgb, 0.16 + 0.1 * pulse);
    g.beginPath(); for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i * Math.PI / 8, rr = i % 2 ? r * 0.82 : r * 1.18; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath();
    g.fillStyle = 'rgba(40,28,6,0.95)'; g.fill(); g.strokeStyle = `rgba(${rgb},1)`; g.lineWidth = 3; g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = 16 * SL.view.scale; g.stroke();
    g.restore();
    SL.neonText(g, '★', x, y + 1, 26, rgb, { blur: 12, alpha: teaser ? 0.35 : 1 });
    SL.neonText(g, 'FINAL', x, y + r + 18, 13, rgb, { blur: 8, alpha: teaser ? 0.35 : 0.95 });
    if (locked && !teaser) { const bx = x + r * 0.85, by = y - r * 0.85; g.save(); g.fillStyle = 'rgba(230,210,160,0.95)'; g.fillRect(bx - 5, by - 1, 10, 8); g.strokeStyle = 'rgba(230,210,160,0.95)'; g.lineWidth = 1.8; g.beginPath(); g.arc(bx, by - 2, 3.5, Math.PI, 0); g.stroke(); g.restore(); }
  }
  function nodeAt(p) {
    for (let L = 1; L <= count(); L++) { const r = isBoss(L) || isFinal(L) ? 42 : 32; if (Math.hypot(p.x - (nodeX(L) - camX), p.y - nodeY(L)) < r) return L; }
    return 0;
  }
  function tap(p) {
    if (SL.inBtn(backBtn, p)) return leave();
    if (SL.inBtn(playBtn, p)) return launch();
    const L = nodeAt(p); if (!L) return;
    if (L === sel && L <= SL.Progress.unlocked) launch(); else select(L);
  }

  return {
    get phase() { return phase; }, get sel() { return sel; }, get camX() { return camX; }, get count() { return count(); },
    nodePos(L) { return { x: nodeX(L) - camX, y: nodeY(L) }; },     // for tests
    enter(o = {}) {
      phase = 'map'; msg = null; drag = null; hiRank = -1;
      if ('session' in o) session = o.session;
      const u = SL.Progress.unlocked; sel = Math.max(1, Math.min(u, o.sel || u));
      focus(sel); camX = camT;
      if (!belt || beltN < count()) buildBelt(count() + 6);
      SL.Audio.playTrack('main');
    },
    update(dt) {
      T += dt; stars.update(dt, 0.12);
      const I = SL.Input, downs = I.takeDowns();
      if (I.hit('KeyM')) SL.Audio.toggleMute();
      if (phase === 'entry') return;
      if (phase === 'table') {
        if (T > 0.4 && (I.confirm() || I.hitAny('Escape', 'Backspace') || downs.length)) { SL.Audio.sfx.blip(520); SL.start('menu'); }
        return;
      }
      if (msg) { msg.t += dt; if (msg.t > 2) msg = null; }
      const u = SL.Progress.unlocked;
      if (I.hitAny('ArrowRight', 'KeyD', 'ArrowUp', 'KeyW')) { if (sel < u) select(sel + 1); else select(sel + 1); }
      if (I.hitAny('ArrowLeft', 'KeyA', 'ArrowDown', 'KeyS')) { if (sel > 1) select(sel - 1); }
      if (I.hitAny('Enter', 'NumpadEnter', 'Space')) launch();
      if (I.hitAny('Escape', 'Backspace')) { leave(); return; }
      for (const d of downs) { if (!drag) drag = { p: d, lx: d.x, moved: 0, cam0: camX }; }
      if (drag) {
        const p = drag.p;
        if (I.pointers.has(p.id)) {
          const dx = p.x - drag.lx; drag.lx = p.x; drag.moved += Math.abs(dx);
          if (drag.moved > 10) { camX = clampCam(camX - dx); camT = camX; }
        } else { const was = drag; drag = null; if (was.moved <= 10) tap({ x: was.p.ox, y: was.p.oy }); if (SL.state !== 'map') return; }
      }
      if (!drag) camX += (camT - camX) * Math.min(1, dt * 7);
    },
    draw(g) {
      const u = SL.Progress.unlocked, N = count();
      SL.drawSpaceBg(g); stars.draw(g, T, 0.6);
      // distant nebula clouds (parallax)
      for (let i = 0; i < 8; i++) { const x = ((i * 520 + 200) - camX * 0.4) % 2600 - 300, y = 120 + (i * 137) % 340; SL.glow(g, x, y, 260, 140, ['200,40,180', '40,90,255', '140,60,255'][i % 3], 0.07); }
      g.save(); g.translate(-camX, 0);
      // asteroid belt dust band
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (const [w, a] of [[230, 0.025], [150, 0.03]]) { g.beginPath(); for (let x = -100; x < nodeX(N + 2); x += 20) { const L = (x - X0) / STEP + 1, y = Y0 + Math.sin((L - 1) * 0.9) * 92; x < -90 ? g.moveTo(x, y) : g.lineTo(x, y); } g.strokeStyle = `rgba(170,120,255,${a})`; g.lineWidth = w; g.stroke(); }
      g.restore();
      for (const b of belt) {
        if (b.x < camX - 30 || b.x > camX + W + 30) continue;
        const sz = b.sp.size; g.save(); g.globalAlpha = b.a; g.translate(b.x, b.y); g.rotate(b.rot + T * b.spin); g.drawImage(b.sp.c, -sz / 2, -sz / 2, sz, sz); g.restore();
      }
      // route line
      const seg = (a, b) => { g.beginPath(); g.moveTo(nodeX(a), nodeY(a)); const mx = (nodeX(a) + nodeX(b)) / 2; g.bezierCurveTo(mx, nodeY(a), mx, nodeY(b), nodeX(b), nodeY(b)); };
      const last = Math.min(N + 1, FIN());            // route ends at the final level
      for (let L = 1; L < last; L++) {
        const lit = L + 1 <= u, fade = L >= N ? 0.35 : 1;
        g.save(); g.globalAlpha = fade; g.lineCap = 'round';
        if (lit) {
          seg(L, L + 1); g.strokeStyle = 'rgba(255,80,220,0.25)'; g.lineWidth = 12; g.stroke();
          seg(L, L + 1); g.strokeStyle = 'rgba(255,120,235,0.95)'; g.lineWidth = 3.5; g.shadowColor = 'rgba(255,80,220,1)'; g.shadowBlur = 14 * SL.view.scale; g.stroke();
          seg(L, L + 1); g.setLineDash([4, 18]); g.lineDashOffset = -T * 40; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.shadowBlur = 0; g.stroke();
        } else { seg(L, L + 1); g.setLineDash([6, 10]); g.strokeStyle = 'rgba(140,110,220,0.45)'; g.lineWidth = 2.5; g.stroke(); }
        g.restore();
      }
      // nodes
      const icon = nebulaIcon();
      for (let L = 1; L <= last; L++) {
        if (isFinal(L)) { drawFinal(g, L, u, L > N); continue; }
        const x = nodeX(L), y = nodeY(L), boss = isBoss(L), cleared = L < u, next = L === u, locked = L > u, teaser = L > N;
        if (x < camX - 60 || x > camX + W + 60) continue;
        const pulse = 0.5 + 0.5 * Math.sin(T * 5), r = boss ? 26 : 15;
        const rgb = boss ? '255,60,70' : cleared ? '90,200,255' : next ? '255,220,90' : '150,130,200';
        g.save(); g.globalAlpha = teaser ? 0.3 : locked ? 0.55 : 1;
        SL.glow(g, x, y, r * (next ? 3 + pulse : 2.4), r * (next ? 3 + pulse : 2.4), rgb, locked ? 0.12 : next ? 0.3 + 0.2 * pulse : 0.25);
        g.beginPath(); g.arc(x, y, r + (next ? pulse * 3 : 0), 0, Math.PI * 2); g.fillStyle = locked ? 'rgba(20,14,40,0.95)' : boss ? 'rgba(90,6,16,0.95)' : 'rgba(10,20,50,0.95)'; g.fill();
        g.strokeStyle = `rgba(${rgb},${locked ? 0.6 : 1})`; g.lineWidth = boss ? 3 : 2.5; g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = (locked ? 4 : 14) * SL.view.scale; g.stroke();
        g.shadowBlur = 0;
        if (boss && icon) { g.save(); g.globalAlpha *= locked ? 0.5 : 1; g.drawImage(icon, x - r + 4, y - r + 4, 2 * r - 8, 2 * r - 8); g.restore(); }
        g.restore();
        const ta = teaser ? 0.3 : locked ? 0.6 : 1;
        if (!boss) SL.neonText(g, String(L), x, y + 1, L > 9 ? 13 : 15, locked ? '170,160,210' : '255,255,255', { blur: 6, alpha: ta });
        else SL.neonText(g, `LEVEL ${L}`, x, y + r + 14, 11, '255,120,120', { blur: 6, alpha: ta });
        // badge: check / lock
        const bx = x + r * 0.8, by = y - r * 0.8;
        if (cleared) {
          g.save(); g.beginPath(); g.arc(bx, by, 8, 0, Math.PI * 2); g.fillStyle = 'rgba(30,200,120,0.95)'; g.fill();
          g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - 4, by); g.lineTo(bx - 1, by + 3); g.lineTo(bx + 4, by - 3); g.stroke(); g.restore();
        } else if (locked) {
          g.save(); g.globalAlpha = ta; g.fillStyle = 'rgba(190,180,230,0.95)'; g.fillRect(bx - 5, by - 1, 10, 8);
          g.strokeStyle = 'rgba(190,180,230,0.95)'; g.lineWidth = 1.8; g.beginPath(); g.arc(bx, by - 2, 3.5, Math.PI, 0); g.stroke(); g.restore();
        } else if (next) SL.neonText(g, 'NEW', x, y - r - 16, 10, '255,220,90', { blur: 8, alpha: 0.6 + 0.4 * pulse });
      }
      // Oakens' ship hovering over the selected node
      const big = isBoss(sel) || isFinal(sel), sx = nodeX(sel), sy = nodeY(sel) - (big ? 56 : 40) + Math.sin(T * 3) * 4;
      if (!SL.Map._ship) SL.Map._ship = SL.Sprites.ship(SL.Features.store.shipColor());
      const sp = SL.Map._ship; SL.glow(g, sx, sy + 14, 10, 16, '255,60,210', 0.35); g.drawImage(sp.c, sx - 15, sy - 15, 30, 30);
      g.save(); g.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(T * 6)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(nodeX(sel), nodeY(sel), (isFinal(sel) ? 36 : isBoss(sel) ? 26 : 15) + 9, 0, Math.PI * 2); g.stroke(); g.restore();
      g.restore();
      // scroll hints
      if (camX > 4) SL.neonText(g, '◀', 18, Y0, 22, '255,120,235', { blur: 10, alpha: 0.5 + 0.3 * Math.sin(T * 4) });
      if (camX < maxCam() - 4) SL.neonText(g, '▶', W - 18, Y0, 22, '255,120,235', { blur: 10, alpha: 0.5 + 0.3 * Math.sin(T * 4) });
      // header
      g.fillStyle = 'rgba(3,1,12,0.6)'; g.fillRect(0, 0, W, 60);
      SL.neonText(g, 'MISSION MAP', 512, 24, 30, '255,80,220', { blur: 18 });
      SL.neonText(g, `STORY MODE · ${u - 1} CLEARED`, 512, 48, 11, '160,200,255', { blur: 4, alpha: 0.85 });
      SL.drawButton(g, backBtn, false, T);
      SL.neonText(g, 'SESSION', 1004, 20, 11, '160,200,255', { align: 'right', blur: 4 });
      SL.neonText(g, SL.pad(session ? session.score : 0), 1004, 40, 18, '255,235,255', { align: 'right', blur: 8 });
      // info panel
      g.save(); SL.roundRect(g, 14, 470, 996, 92, 12); g.fillStyle = 'rgba(4,2,14,0.85)'; g.fill(); g.strokeStyle = 'rgba(170,90,255,0.4)'; g.lineWidth = 1; g.stroke(); g.restore();
      const boss = isBoss(sel);
      SL.neonText(g, `LEVEL ${sel}` + (boss ? ' · DR. NEBULA' : ''), 34, 494, 22, isFinal(sel) ? '255,225,140' : boss ? '255,90,90' : '255,80,220', { align: 'left', blur: 12 });
      SL.neonText(g, info(sel), 34, 522, 14, '200,210,255', { align: 'left', blur: 5 });
      SL.neonText(g, sel < u ? '✓ CLEARED · REPLAY ANYTIME' : 'NEXT MISSION', 34, 546, 12, sel < u ? '90,230,150' : '255,220,90', { align: 'left', blur: 5 });
      SL.drawButton(g, playBtn, true, T);
      SL.neonText(g, SL.Input.touchMode ? 'TAP A MISSION · DRAG TO SCROLL' : '◀ ▶ SELECT · ENTER LAUNCH · ESC BACK', 620, 546, 10, '160,200,255', { blur: 3, alpha: 0.6 });
      if (msg) SL.neonText(g, msg.text, 512, 438, 16, '255,150,90', { blur: 10, alpha: Math.min(1, 2 - msg.t) });
      if (phase === 'entry' || phase === 'table') {
        g.fillStyle = 'rgba(3,1,12,0.9)'; g.fillRect(0, 0, W, H);
        if (phase === 'entry') {
          SL.neonText(g, 'RUN COMPLETE', 512, 96, 46, '255,70,210', { blur: 22 });
          SL.neonText(g, 'NEW STORY HIGH SCORE — ENTER YOUR NAME', 512, 158, 20, '255,220,90', { blur: 12, alpha: 0.75 + 0.25 * Math.sin(T * 7) });
          SL.neonText(g, `LEVEL ${u} · SCORE ${SL.pad(session ? session.score : 0)}`, 512, 194, 15, '255,235,255', { blur: 8 });
        } else {
          SL.neonText(g, 'STORY TOP 10', 512, 60, 30, '170,90,255', { blur: 16 });
          SL.drawScoreTable(g, SL.Scores.list('story'), 110, hiRank, T, 'story');
          SL.neonText(g, SL.Input.touchMode ? 'TAP TO CONTINUE' : 'PRESS ENTER', 512, 520, 16, '255,220,90', { blur: 10, alpha: 0.6 + 0.4 * Math.sin(T * 6) });
        }
      }
      SL.drawScanlines(g);
    },
  };
})();
