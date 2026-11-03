/* ==========================================================================
   v0.3 FEATURES: pickups (bombs + weapon power-ups + shield), bombs,
   Avrill assist, special asteroids. Survival calls these at fixed hook points;
   per-game state lives on the game object (reset() at game start).
   Story levels/bosses and store/skins remain stubs.
   ========================================================================== */
(() => {
const C = () => SL.CONFIG, rand = (a, b) => a + Math.random() * (b - a);
const pickOne = l => l[(Math.random() * l.length) | 0];
const WEAPONS = ['triple', 'laser', 'rapid'];

const F = SL.Features = {
  reset(g) {
    g.bombs = C().bombs.start; g.weapon = null; g.shield = false;
    g.pickups = []; g.bombShots = []; g.blasts = []; g.flash = 0; g.flashRgb = '255,200,255';
    g.dropT = rand(...C().pickups.driftEvery); g.spawnHold = 0;
    g.assist = { energy: 0, phase: 'idle', t: 0, ready: false, x: -80, y: 600, cool: 0, cleared: false };
  },

  /* ---------- pickups ---------- */
  drop(g, x, y, type) {
    const P = C().pickups;
    type = type || (Math.random() < P.bombShare ? 'bomb' : pickOne([...WEAPONS, 'shield']));
    g.pickups.push({ type, x: Math.max(30, Math.min(SL.W - 30, x)), y, t: 0, life: P.life });
  },
  collect(g, p) {
    const T = C().pickups.types[p.type], s = g.ship;
    if (p.type === 'bomb') {
      if (g.bombs < C().bombs.max) { g.bombs++; g.popup('+1 BOMB', s.x, s.y - 36, T.rgb); }
      else { g.score += C().bombs.fullInvBonus; g.popup(`BOMBS FULL +${C().bombs.fullInvBonus}`, s.x, s.y - 36, T.rgb); }
    } else if (p.type === 'shield') { g.shield = true; g.popup('SHIELD', s.x, s.y - 36, T.rgb); }
    else { g.weapon = { type: p.type, time: C().powerUps.duration }; g.popup(T.name, s.x, s.y - 36, T.rgb); }
    g.fx.burst(p.x, p.y, T.rgb, 18, 160, 0.5, 2); g.fx.ring(p.x, p.y, T.rgb, 40, 0.35);
    SL.Audio.sfx.pickup(); g.stats.pickups = (g.stats.pickups || 0) + 1;
    SL.Events.emit('pickup', p);
  },

  /* ---------- weapons ---------- */
  modifyFire(g, shots) {
    const s = g.ship, PU = C().powerUps, sp = C().ship.bulletSpeed, w = g.weapon && g.weapon.type;
    if (w === 'triple') return [-1, 0, 1].map(k => ({ x: s.x + k * 6, y: s.y - 12, vx: Math.sin(k * PU.tripleSpread) * sp, vy: -Math.cos(k * PU.tripleSpread) * sp, kind: 'triple' }));
    if (w === 'laser') return [{ x: s.x, y: s.y - 18, vx: 0, vy: -PU.laserSpeed, kind: 'laser', pierce: true }];
    return shots;
  },
  fireRateMul(g) {
    const w = g.weapon && g.weapon.type, PU = C().powerUps;
    return w === 'rapid' ? PU.rapidMul : w === 'laser' ? PU.laserRate / C().ship.fireRate : 1;
  },
  absorbHit(g) {
    if (!g.shield) return false;
    g.shield = false; g.ship.invuln = 1.0;
    g.fx.ring(g.ship.x, g.ship.y, '90,255,140', 80, 0.5); g.fx.burst(g.ship.x, g.ship.y, '90,255,140', 30, 220, 0.6, 2);
    g.popup('SHIELD DOWN', g.ship.x, g.ship.y - 40, '90,255,140'); g.shake(6); SL.Audio.sfx.hit();
    return true;
  },

  /* ---------- bombs ---------- */
  fireBomb(g) {
    if (g.bombs <= 0 || !g.ship.alive) { SL.Audio.sfx.deny(); return false; }
    g.bombs--; g.stats.bombs = (g.stats.bombs || 0) + 1;
    g.bombShots.push({ x: g.ship.x, y: g.ship.y - 20, t: 0 }); SL.Audio.sfx.launch();
    return true;
  },
  detonate(g, x, y, radius = C().bombs.radius, rgb = '255,90,200', dur = C().bombs.blastTime) {
    g.blasts.push({ x, y, r: 0, max: radius, t: 0, dur, rgb });
    g.flash = Math.max(g.flash, 0.7); g.flashRgb = '255,210,255'; g.shake(18);
    g.fx.burst(x, y, rgb, 80, 420, 1.1, 3); g.fx.burst(x, y, '255,255,255', 30, 300, 0.7, 2);
    g.fx.ring(x, y, '255,255,255', radius * 0.6, 0.35); SL.Audio.sfx.boom();
  },

  /* ---------- Avrill assist ---------- */
  activateAssist(g) {
    const A = g.assist;
    if (!A.ready || A.phase !== 'idle' || g.state !== 'play') { SL.Audio.sfx.deny(); return false; }
    Object.assign(A, { phase: 'active', t: 0, energy: 0, ready: false, x: -80, y: 640, cool: 0, cleared: false });
    g.stats.assists = (g.stats.assists || 0) + 1; SL.Audio.sfx.assist(); SL.Events.emit('assist', g);
    return true;
  },
  assistClear(g) {
    let n = 0, pts = 0;
    for (const a of g.asteroids) if (!a.dead) { n++; pts += g.destroy(a, true, { noSplit: true, quiet: true }) || 0; }
    g.blasts.push({ x: g.assist.x, y: g.assist.y, r: 0, max: 900, t: 0, dur: 0.8, rgb: '255,80,220', visualOnly: true });
    g.flash = 0.75; g.flashRgb = '255,120,230'; g.shake(24); g.onScreenClear && g.onScreenClear(); g.spawnHold = C().assist.clearHold;
    g.fx.burst(g.assist.x, g.assist.y, '255,80,220', 120, 600, 1.4, 3.5);
    g.popup(n ? `SCREEN CLEAR! ×${n}  +${pts}` : 'SCREEN CLEAR!', 512, 250, '255,120,230'); SL.Audio.sfx.boom();
  },

  /* ---------- special asteroids ---------- */
  pickSpecial(g) {
    const S = C().special, r = Math.random(), gc = S.goldChance + (g.goldBonus || 0), rc = S.redChance + (g.redBonus || 0);
    if (r < gc) return 'gold';
    if (g.t > (g.redAfter ?? S.redAfter) && r < gc + rc) return 'red';
    return null;
  },
  onDestroyed(g, a, byPlayer) {
    if (a.special === 'gold' && byPlayer) F.drop(g, a.x, a.y);
    else if (byPlayer && Math.random() < C().pickups.dropChance) F.drop(g, a.x, a.y);
    if (a.special === 'red') {
      const R = C().special.redRadius;
      g.blasts.push({ x: a.x, y: a.y, r: 0, max: R, t: 0, dur: 0.3, rgb: C().special.redRgb, visualOnly: true });
      g.fx.burst(a.x, a.y, '255,120,60', 50, 320, 0.9, 2.6); g.shake(12); g.flash = Math.max(g.flash, 0.25); g.flashRgb = '255,120,80';
      for (const b of g.asteroids) if (!b.dead && Math.hypot(b.x - a.x, b.y - a.y) < R + b.r * 0.5) g.destroy(b, byPlayer);
    }
    if (byPlayer && g.assist.phase === 'idle' && !g.assist.ready) {
      const A = C().assist; g.assist.energy = Math.min(A.max, g.assist.energy + A.perKill * (1 + A.comboBonus * (g.mult - 1)));
    }
  },

  /* ---------- per-frame ---------- */
  update(g, dt) {
    const P = C().pickups, s = g.ship, AC = C().assist, A = g.assist;
    g.flash = Math.max(0, g.flash - dt * 1.8); g.spawnHold = Math.max(0, g.spawnHold - dt);
    if (g.state !== 'play') return;
    // drift-in pickups
    g.dropT -= dt; if (g.dropT <= 0) { F.drop(g, rand(80, SL.W - 80), -20); g.dropT = rand(...P.driftEvery); }
    for (const p of g.pickups) {
      p.t += dt; p.y += P.fallSpeed * dt; p.x += Math.sin(p.t * 2) * 20 * dt;
      if (s.alive && Math.hypot(p.x - s.x, p.y - s.y) < P.catchRadius) { p.dead = true; F.collect(g, p); }
      if (p.t > p.life || p.y > SL.H + 30) p.dead = true;
    }
    g.pickups = g.pickups.filter(p => !p.dead);
    if (g.weapon) { g.weapon.time -= dt; if (g.weapon.time <= 0) g.weapon = null; }
    // bombs
    const B = C().bombs;
    for (const b of g.bombShots) {
      b.t += dt; b.y -= B.speed * dt;
      const hit = g.asteroids.some(a => !a.dead && Math.hypot(a.x - b.x, a.y - b.y) < a.r + 6);
      if (hit || b.t > B.fuse || b.y < 60) { b.dead = true; F.detonate(g, b.x, b.y); }
    }
    g.bombShots = g.bombShots.filter(b => !b.dead);
    for (const bl of g.blasts) {
      bl.t += dt; const k = Math.min(1, bl.t / bl.dur); bl.r = bl.max * (1 - (1 - k) * (1 - k));
      if (!bl.visualOnly) for (const a of g.asteroids) if (!a.dead && Math.hypot(a.x - bl.x, a.y - bl.y) < bl.r + a.r * 0.5) { bl.pts = (bl.pts || 0) + (g.destroy(a, true, { quiet: true }) || 0); bl.kills = (bl.kills || 0) + 1; }
      if (!bl.visualOnly && g.onBlast) g.onBlast(bl);
      if (!bl.visualOnly && !bl.told && bl.t >= bl.dur) { bl.told = true; if (bl.kills) g.popup(`BOMB ×${bl.kills}  +${bl.pts}`, bl.x, bl.y, '255,140,220'); }
    }
    g.blasts = g.blasts.filter(bl => bl.t < bl.dur + 0.25);
    // Avrill
    if (A.phase === 'idle') {
      if (!A.ready) { A.energy = Math.min(AC.max, A.energy + AC.perSecond * dt); if (A.energy >= AC.max) { A.ready = true; g.popup(F.assistName(g) + ' READY!', 512, 300, AC.color); SL.Audio.sfx.ready(); } }
    } else {
      if (g.assistKind === 'nebula') return F.updateNebulaAssist(g, dt);   // v0.5.0 final level
      A.t += dt; const t = A.t, T1 = 1.0, T2 = T1 + AC.sweepTime;
      if (t < T1) { A.x = -80 + (t / T1) * 200; A.y = 640 - (t / T1) * 240; }
      else if (t < T2) {
        const u = t - T1; A.x = 512 + Math.sin(u * 1.25 - Math.PI / 2 * 1.1) * 400; A.y = 400 + Math.sin(u * 2.5) * 40;
        if (u < 0.4) { const k = u / 0.4; A.x = 120 + (A.x - 120) * k; }
        A.cool -= dt;
        if (A.cool <= 0) { A.cool = AC.fireRate; const sp = C().ship.bulletSpeed; for (const k of [-1, 0, 1]) g.bullets.push({ x: A.x + k * 8, y: A.y - 14, vx: k * sp * 0.12, vy: -sp, kind: 'avrill' }); }
      } else if (t < T2 + 0.5) { const k = (t - T2) / 0.5; A.x += (512 - A.x) * Math.min(1, k * 2); A.y += (300 - A.y) * Math.min(1, k * 2); }
      else if (!A.cleared) { A.cleared = true; F.assistClear(g); }
      else if (t < T2 + 1.6) { A.y -= 700 * dt; }
      else A.phase = 'idle';
    }
  },

  /* ---------- drawing ---------- */
  draw(g, ctx) {
    const P = C().pickups;
    for (const p of g.pickups) {
      const T = P.types[p.type], blink = p.life - p.t < 3 && Math.floor(p.t * 8) % 2;
      if (blink) continue;
      const r = P.radius, rot = p.t * 1.5;
      SL.glow(ctx, p.x, p.y, r * 2.2, r * 2.2, T.rgb, 0.22 + 0.08 * Math.sin(p.t * 6));
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.strokeStyle = `rgba(${T.rgb},1)`; ctx.lineWidth = 2.2; ctx.shadowColor = `rgba(${T.rgb},1)`; ctx.shadowBlur = 12 * SL.view.scale;
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
      ctx.fillStyle = 'rgba(10,4,24,0.75)'; ctx.fill(); ctx.stroke(); ctx.restore();
      if (p.type === 'bomb') F.bombIcon(ctx, p.x, p.y + 1, 7, T.rgb);
      else SL.neonText(ctx, T.icon, p.x, p.y + 1, 15, T.rgb, { blur: 8 });
    }
    for (const b of g.bombShots) { SL.glow(ctx, b.x, b.y, 22, 22, '255,90,200', 0.5); F.bombIcon(ctx, b.x, b.y, 7, '255,140,220'); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const bl of g.blasts) {
      const k = Math.min(1, bl.t / bl.dur), a = Math.max(0, 1 - bl.t / (bl.dur + 0.25));
      const gr = ctx.createRadialGradient(bl.x, bl.y, bl.r * 0.2, bl.x, bl.y, Math.max(1, bl.r));
      const fa = bl.max > 500 ? 0.08 : 0.18;
      gr.addColorStop(0, `rgba(${bl.rgb},0)`); gr.addColorStop(0.75, `rgba(${bl.rgb},${fa * a})`); gr.addColorStop(1, `rgba(255,255,255,${0.5 * a})`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(bl.x, bl.y, Math.max(1, bl.r), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${bl.rgb},${0.9 * a})`; ctx.lineWidth = 6 * (1 - k) + 2; ctx.stroke();
    }
    ctx.restore();
    // Avrill's ship
    const A = g.assist;
    if (A.phase === 'active' && A.t > 0 && g.assistKind === 'nebula') F.drawNebulaAssist(g, ctx);
    else if (A.phase === 'active' && A.t > 0) {
      if (!F._avShip) F._avShip = SL.Sprites.ship(C().assist.color);
      const sz = F._avShip.size;
      SL.glow(ctx, A.x, A.y + 22, 16, 24, '255,60,210', 0.35);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,230,0.6)';
      ctx.beginPath(); ctx.moveTo(A.x - 5, A.y + 14); ctx.lineTo(A.x, A.y + 34 + Math.random() * 10); ctx.lineTo(A.x + 5, A.y + 14); ctx.fill(); ctx.restore();
      ctx.drawImage(F._avShip.c, A.x - sz / 2, A.y - sz / 2 + 2, sz, sz);
    }
  },
  bombIcon(ctx, x, y, r, rgb, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = `rgba(${rgb},1)`; ctx.fillStyle = `rgba(${rgb},0.25)`; ctx.lineWidth = 1.8;
    ctx.shadowColor = `rgba(${rgb},1)`; ctx.shadowBlur = 8 * SL.view.scale;
    ctx.beginPath(); ctx.arc(x, y + 1, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.55, y - r * 0.55); ctx.lineTo(x + r * 0.9, y - r * 1.05); ctx.quadraticCurveTo(x + r * 1.3, y - r * 1.5, x + r * 1.5, y - r * 1.2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,150,1)'; ctx.fillRect(x + r * 1.4, y - r * 1.4, 2.5, 2.5);
    ctx.restore();
  },
  drawShield(g, ctx) {
    if (!g.shield || !g.ship.alive) return;
    const s = g.ship, p = 0.6 + 0.4 * Math.sin(g.T * 5);
    SL.glow(ctx, s.x, s.y, 40, 40, '90,255,140', 0.12 * p);
    ctx.save(); ctx.strokeStyle = `rgba(90,255,140,${0.5 + 0.3 * p})`; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(90,255,140,1)'; ctx.shadowBlur = 14 * SL.view.scale;
    ctx.beginPath(); ctx.arc(s.x, s.y, 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  },
  drawOverlay(g, ctx) {
    if (g.flash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${g.flashRgb},${Math.min(0.55, g.flash * 0.55)})`; ctx.fillRect(0, 0, SL.W, SL.H); ctx.restore(); }
    const A = g.assist;
    if (A.phase !== 'active' || A.t > F.POP_DUR) return;
    if (g.assistKind === 'nebula') { SL.dialogPopup(ctx, g, 'nebulaAssist', { side: 'left', t: A.t, dur: F.POP_DUR + 0.6, name: 'Dr. Nebula', rgb: '255,70,70',
      lines: ["Don't make me regret this,", 'fool.'], typed: Math.floor((A.t - 0.2) * 40), por: SL.nebulaPortrait && SL.nebulaPortrait('normal') }); return; }
    // v0.4.1: compact semi-transparent popup, top-left corner (see SL.dialogPopup)
    const line = C().assist.line, cut = line.indexOf(',') + 1;
    SL.dialogPopup(ctx, g, 'avrill', { side: 'left', t: A.t, dur: F.POP_DUR, name: C().assist.pilot, rgb: '255,80,220',
      lines: [line.slice(0, cut), line.slice(cut).trim()], typed: Math.floor((A.t - 0.2) * 40), por: F.portrait(), textRgb: '255,235,255' });
  },
  POP_DUR: 2.6,
  assistName(g) { return g.assistKind === 'nebula' ? 'NEBULA' : 'AVRILL'; },
  /* v0.5.0: in the final level the assist is Dr. Nebula's mothership: flies in from the left, charges,
     fires a screen-wide laser upward (same effect as Avrill's screen clear: bullets gone, boss damage), leaves right. */
  updateNebulaAssist(g, dt) {
    const A = g.assist, t = (A.t += dt);
    if (t < 1.2) { const k = t / 1.2, e = 1 - Math.pow(1 - k, 3); A.x = -260 + (512 + 260) * e; A.y = 500; }
    else if (t < 1.9) { A.x = 512; if (!A.charged) { A.charged = true; SL.Audio.sfx.launch(); } }
    else if (t < 3.0) { if (!A.cleared) { A.cleared = true; F.assistClear(g); SL.Audio.sfx.zap(); } g.ebullets && (g.ebullets.length = 0); }
    else if (t < 4.2) { A.x += 900 * dt; }
    else { A.phase = 'idle'; A.cleared = false; A.charged = false; }
  },
  drawNebulaAssist(g, ctx) {
    const A = g.assist, t = A.t, h = SL.nebulaHull && SL.nebulaHull(); if (!h) return;
    if (t >= 1.2 && t < 1.9) SL.glow(ctx, A.x, A.y - 30, 60 + 80 * (t - 1.2), 60 + 80 * (t - 1.2), '255,80,90', 0.5);
    if (t >= 1.9 && t < 3.0) {
      const k = Math.min(1, (t - 1.9) / 0.25), fade = t > 2.7 ? (3.0 - t) / 0.3 : 1, w = 30 + (SL.W + 60) * k;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createLinearGradient(A.x - w / 2, 0, A.x + w / 2, 0);
      gr.addColorStop(0, 'rgba(255,40,60,0)'); gr.addColorStop(0.25, `rgba(255,60,80,${0.35 * fade})`); gr.addColorStop(0.5, `rgba(255,240,240,${0.8 * fade})`); gr.addColorStop(0.75, `rgba(255,60,80,${0.35 * fade})`); gr.addColorStop(1, 'rgba(255,40,60,0)');
      ctx.fillStyle = gr; ctx.fillRect(A.x - w / 2, 0, w, A.y - 20); ctx.restore();
    }
    ctx.save(); ctx.translate(A.x, A.y); ctx.scale(0.55, 0.55); ctx.drawImage(h.c, -h.W / 2, -h.H / 2, h.W, h.H); ctx.restore();
  },
  portrait() {
    if (F._por) return F._por;
    if (!F._img) { F._img = new Image(); F._img.src = 'assets/title.jpg'; }
    if (!F._img.complete || !F._img.naturalWidth) return null;
    const S = 2, N = 92 * S, c = SL.mkCanvas(N, N), x = c.getContext('2d'), [sx, sy, sw, sh] = C().assist.portrait;
    SL.roundRect(x, 2, 2, N - 4, N - 4, 12); x.save(); x.clip(); x.drawImage(F._img, sx, sy, sw, sh, 0, 0, N, N);
    const gr = x.createLinearGradient(0, 0, 0, N); gr.addColorStop(0, 'rgba(255,60,200,0.10)'); gr.addColorStop(1, 'rgba(60,0,80,0.35)');
    x.fillStyle = gr; x.fillRect(0, 0, N, N);
    x.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < N; i += 4) x.fillRect(0, i, N, 1.5);
    x.restore();
    x.strokeStyle = 'rgba(255,80,220,1)'; x.lineWidth = 4; x.shadowColor = 'rgba(255,80,220,1)'; x.shadowBlur = 14; SL.roundRect(x, 3, 3, N - 6, N - 6, 12); x.stroke();
    return (F._por = c);
  },
  drawHUD(g, ctx) {
    const AC = C().assist, A = g.assist;
    // weapon timer + shield (left, under lives)
    let y = 74;
    if (g.weapon) {
      const T = C().pickups.types[g.weapon.type], k = g.weapon.time / C().powerUps.duration;
      SL.neonText(ctx, T.name, 18, y, 11, T.rgb, { align: 'left', blur: 6 });
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(18, y + 9, 110, 4);
      ctx.fillStyle = `rgba(${T.rgb},${k < 0.25 && Math.floor(g.T * 8) % 2 ? 0.4 : 0.95})`; ctx.fillRect(18, y + 9, 110 * k, 4);
      y += 26;
    }
    if (g.shield) SL.neonText(ctx, '◯ SHIELD', 18, y, 11, '90,255,140', { align: 'left', blur: 6 });
    // bombs (right, under BEST)
    for (let i = 0; i < C().bombs.max; i++) F.bombIcon(ctx, 898 - i * 22, 52, 6.5, '255,90,150', i < g.bombs ? 1 : 0.2);
    SL.neonText(ctx, 'F', 818 - (C().bombs.max - 3) * 22, 52, 10, '255,150,200', { blur: 4, alpha: SL.Input.touchMode ? 0 : 0.6 });
    // Avrill energy bar
    const bx = 786, by = 72, bw = 120, k = A.phase === 'active' ? 0 : A.energy / AC.max;
    const pulse = A.ready ? 0.6 + 0.4 * Math.sin(g.T * 8) : 1;
    SL.neonText(ctx, A.ready ? F.assistName(g) + ' READY' + (SL.Input.touchMode ? '' : ' [R]') : A.phase === 'active' ? F.assistName(g) + ' ASSIST' : F.assistName(g), bx + bw, by - 1, 11, AC.color, { align: 'right', blur: A.ready ? 12 : 6, alpha: pulse });
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx, by + 9, bw, 5);
    ctx.save(); ctx.fillStyle = `rgba(${AC.color},${0.95 * pulse})`; if (A.ready) { ctx.shadowColor = `rgba(${AC.color},1)`; ctx.shadowBlur = 12 * SL.view.scale; }
    ctx.fillRect(bx, by + 9, bw * k, 5); ctx.restore();
  },
};

/* ---------- remaining stubs for later versions ---------- */
/* Story mode hooks (v0.4 builds levels + Nebula boss; these are the extension points for later). */
F.story = {
  bossEvery: 5,
  finalLevel: { enabled: true, level: 30, boss: 'Commander Edisar Starlight' },   // v0.5.0: built (final.js)
  energySystem: { enabled: false },                                              // TODO: ship energy instead of lives
  onLevelStart(game, level) {},                       // per-level setup hook (special waves, events)
  cutsceneBetween(fromLevel, toLevel) { return null; },  // TODO: story clue cutscenes; return {frames...} to play
  worldTheme(level) { return { index: Math.floor((level - 1) / 10), changed: level > 1 && (level - 1) % 10 === 0 }; }, // TODO: palette swap every 10 levels
  postCredits(opt) { return null; },                   // hook: post-credits scene (radio message, needs a voice recording); return { play(done) }
  isFinalLevel(level) { return this.finalLevel.enabled && level >= this.finalLevel.level; },
};
F.store = { enabled: false, current: 'default', skins: { default: { name: 'Oakens Blue', color: '80,170,255' } }, shipColor() { return this.skins[this.current].color; } };
})();
