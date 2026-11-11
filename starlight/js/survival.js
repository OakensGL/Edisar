/* Survival mode: endless asteroid field, vertical-shooter feel. */
SL.Survival = class {
  constructor() {
    const C = SL.CONFIG;
    this.C = C; this.Fx = SL.Features; this.ev = SL.Events;
    this.state = 'play';           // play | paused | dying | over  (+ 'clear' in Story)
    this.mode = 'survival'; this.timeScore = true; this.debug = false;
    this.t = 0; this.score = 0; this.lives = C.ship.startLives;
    this.streak = 0; this.mult = 1; this.best = SL.getBest(); this.newBest = false;
    this.stats = { kills: 0, splits: 0, hits: 0, shots: 0, spawned: 0 };
    this.ship = { x: SL.W / 2, y: C.ship.startY, vx: 0, vy: 0, cool: 0, invuln: 1.0, alive: true, gun: 0 };
    this.shipSprite = SL.Sprites.ship(this.Fx.store.shipColor());
    this.bullets = []; this.asteroids = []; this.popups = [];
    this.fx = new SL.Particles(); this.stars = new SL.Starfield();
    this.spawnT = 0.6; this.shakeAmt = 0; this.overT = 0; this.sel = 0; this.T = 0;
    this.joy = null; this.fireId = null;
    // UI layout (logical coords)
    this.btnPause = { x: 996, y: 26, w: 44, h: 36 };
    this.fireBtn = { x: 922, y: 478, r: 58 };
    this.bombBtn = { x: 806, y: 520, r: 32 };
    this.avrillBtn = { x: 842, y: 398, r: 32 };
    this.joyHome = { x: 118, y: 468, r: 58 };
    this.overBtns = [
      { id: 'again', label: 'PLAY AGAIN', x: 412, y: 532, w: 210, h: 40, rgb: '255,80,220' },
      { id: 'menu',  label: 'MENU',       x: 632, y: 532, w: 170, h: 40, rgb: '70,160,255' },
    ];
    this.pauseBtns = [
      { id: 'resume',   label: 'RESUME',   x: 512, y: 240, w: 220, h: 46, rgb: '255,80,220' },
      { id: 'settings', label: 'SETTINGS', x: 512, y: 300, w: 220, h: 46, rgb: '170,90,255' },
      { id: 'menu',     label: 'MENU',     x: 512, y: 360, w: 220, h: 46, rgb: '70,160,255' },
    ];
    // cache asteroid sprites: 3 variants per size/color
    this.spr = {};
    for (const k of Object.keys(C.asteroid.sizes)) C.asteroid.colors.forEach((col, ci) => {
      for (let v = 0; v < 3; v++) this.spr[`${k}${ci}${v}`] = SL.Sprites.asteroid(C.asteroid.sizes[k].r, col);
    });
    for (const sp of ['gold', 'red']) for (const k of ['L', 'M']) this.spr[`${sp}${k}`] = SL.Sprites.asteroid(C.asteroid.sizes[k].r, C.special[sp + 'Rgb']);
    SL.Features.reset(this);
    this.ev.emit('start', this);
  }

  /* ---------------- difficulty ---------------- */
  get spawnInterval() { const D = this.C.difficulty; return Math.max(D.spawnMin, D.spawnStart - D.spawnRamp * this.t); }
  get fallSpeed() { const D = this.C.difficulty; return Math.min(D.speedMax, D.speedStart + D.speedRamp * this.t); }

  spawn() {
    const D = this.C.difficulty, W = SL.W;
    const special = SL.Features.pickSpecial(this);
    const size = special === 'gold' ? 'M' : Math.random() < Math.min(0.35, this.t * D.mediumChanceRamp) ? 'M' : 'L';
    const r = this.C.asteroid.sizes[size].r, sp = this.fallSpeed * (0.7 + Math.random() * 0.6);
    let x, y, vx, vy;
    if (Math.random() < D.sideChance) {
      const left = Math.random() < 0.5; x = left ? -r : W + r; y = Math.random() * SL.H * 0.4;
      vx = (left ? 1 : -1) * sp * (0.5 + Math.random() * 0.4); vy = sp * (0.4 + Math.random() * 0.4);
    } else { x = r + Math.random() * (W - 2 * r); y = -r; vx = (Math.random() - 0.5) * 80; vy = sp; }
    this.addAsteroid(size, x, y, vx, vy, null, special);
  }
  addAsteroid(size, x, y, vx, vy, color, special = null) {
    const ci = color ?? ((Math.random() * 3) | 0);
    const a = { size, x, y, vx, vy, r: this.C.asteroid.sizes[size].r, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * (size === 'S' ? 3 : 1.6),
      ci, sprite: special ? this.spr[special + size] : this.spr[`${size}${ci}${(Math.random() * 3) | 0}`], special, entered: false, dead: false,
      rgb: special ? this.C.special[special + 'Rgb'] : this.C.asteroid.colors[ci] };
    if (special === 'gold') a.spin *= 2.5;
    this.asteroids.push(a); this.stats.spawned++; this.ev.emit('asteroidSpawned', a); return a;
  }

  /* ---------------- events ---------------- */
  destroy(a, byPlayer = true, opt = {}) {
    if (a.dead) return; a.dead = true;
    const S = this.C.asteroid.sizes[a.size] || this.C.asteroid.sizes.M, rgb = a.rgb;
    let pts = 0;
    if (byPlayer && this.state === 'play') {
      this.streak++; this.mult = Math.min(this.C.score.comboMax, 1 + Math.floor(this.streak / this.C.score.comboStep));
      pts = S.points * this.mult * (a.special === 'gold' ? this.C.special.goldMul : 1); this.score += pts; this.stats.kills++;
      this.onKill && this.onKill(a);
      if (!opt.quiet) this.popup(`+${pts}`, a.x, a.y, a.special === 'gold' ? '255,210,70' : this.mult > 1 ? '255,230,120' : rgb);
    }
    const k = a.r / 44;
    this.fx.burst(a.x, a.y, rgb, Math.round((opt.quiet ? 8 : 14) + 26 * k), 140 + 120 * k, 0.8, 2.2);
    this.fx.ring(a.x, a.y, rgb, a.r * 1.4, 0.35);
    if (!opt.quiet) { this.shake(2 + 4 * k); SL.Audio.sfx.explode(k); }
    SL.Features.onDestroyed(this, a, byPlayer && this.state === 'play');
    if (S.next && !a.special && !opt.noSplit) {
      this.stats.splits++;
      const base = Math.atan2(a.vy, a.vx), spd = Math.max(70, Math.hypot(a.vx, a.vy)) * 1.25;
      for (const s of [-1, 1]) {
        const ang = base + s * (0.45 + Math.random() * 0.4);
        const c = this.addAsteroid(S.next, a.x + s * a.r * 0.3, a.y, Math.cos(ang) * spd + s * 30, Math.max(25, Math.sin(ang) * spd), a.ci);
        c.entered = true; c.immune = opt.immune;
      }
    }
    this.ev.emit('asteroidDestroyed', { asteroid: a, points: pts, byPlayer });
    return pts;
  }
  playerHit(a) {
    const s = this.ship;
    if (SL.Features.absorbHit(this)) { if (a) this.destroy(a, false); return; }
    this.lives--; this.stats.hits++; this.streak = 0;
    if (this.mult > 1) this.popup('COMBO LOST', s.x, s.y - 40, '255,90,120');
    this.mult = 1;
    if (a) this.destroy(a, false);
    this.fx.burst(s.x, s.y, '80,170,255', 40, 260, 0.9, 2.5); this.fx.ring(s.x, s.y, '255,255,255', 70, 0.45);
    this.shake(12); SL.Audio.sfx.hit();
    this.ev.emit('playerHit', { lives: this.lives });
    if (this.lives <= 0) {
      s.alive = false; this.state = 'dying'; this.overT = 1.6;
      this.fx.burst(s.x, s.y, '255,80,220', 70, 340, 1.3, 3);
    } else s.invuln = this.C.ship.invuln;
  }
  gameOver() {
    this.state = 'over'; this.sel = 0; this.score = Math.floor(this.score); this.hiRank = -1;
    if (this.score > this.best) { this.best = this.score; this.newBest = true; }
    SL.Audio.sfx.gameOver();
    if (!this.debug && SL.Scores.qualifies(this.scoreEntry(), this.mode)) {
      this.overPhase = 'entry';
      SL.NameEntry.open(SL.Scores.lastName, name => this.saveScore(name));
    } else this.overPhase = 'table';
    this.ev.emit('gameOver', { score: this.score, best: this.best });
  }
  saveScore(name) {
    SL.Scores.lastName = name;
    this.hiRank = SL.Scores.add({ name, ...this.scoreEntry(), date: new Date().toISOString() }, this.mode);
    this.overPhase = 'table'; this.overT = Math.min(this.overT, -0.5);
  }
  scoreEntry() { return { score: Math.floor(this.score), time: this.t, kills: this.stats.kills }; }
  popup(txt, x, y, rgb) { this.popups.push({ txt, x, y, rgb, life: 0.9 }); }
  shake(n) { this.shakeAmt = Math.max(this.shakeAmt, n); }
  pause(on = true) { if (on && this.state === 'play') { this.state = 'paused'; this.sel = 0; } else if (!on && this.state === 'paused') this.state = 'play'; }

  /* ---------------- input ---------------- */
  handleInput() {
    const I = SL.Input, s = this.ship;
    let ax = 0, ay = 0, fire = false;
    const downs = I.takeDowns();
    SL.Vol.handle(downs); SL.Vol.tick();
    if (SL.Vol.keys(I)) return { ax: 0, ay: 0, fire: false };
    if (SL.Vol.open) return { ax: 0, ay: 0, fire: false };
    for (const d of downs) {
      if (d.role === 'ui') continue;
      if (SL.inBtn(this.btnPause, d)) { d.role = 'ui'; if (this.state === 'play') this.pause(true); else if (this.state === 'paused') this.pause(false); SL.Audio.sfx.blip(); continue; }
      const list = this.state === 'over' ? this.overBtns : this.state === 'paused' ? this.pauseBtns : null;
      if (list) { const b = list.find(b => SL.inBtn(b, d)); if (b) { d.role = 'ui'; if (this.state === 'paused' || (this.overT <= -0.5 && this.overPhase !== 'entry')) this.menuAction(b.id); continue; } }
      if (d.type === 'mouse') continue;           // mouse plays with keyboard; touch gets stick + fire
      const near = (b, p) => Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 10;
      if (this.state === 'play' && near(this.bombBtn, d)) { d.role = 'ui'; SL.Features.fireBomb(this); continue; }
      if (this.state === 'play' && near(this.avrillBtn, d)) { d.role = 'ui'; SL.Features.activateAssist(this); continue; }
      if (d.x > SL.W * 0.58) { d.role = 'fire'; this.fireId = d.id; }
      else if (d.y > 70) { d.role = 'joy'; this.joy = d; }
    }
    if (I.hitAny('KeyP', 'Escape')) { if (this.state === 'play') this.pause(true); else if (this.state === 'paused') this.pause(false); }
    if (this.state === 'over' || this.state === 'paused') {
      const list = this.state === 'over' ? this.overBtns : this.pauseBtns;
      if (I.hitAny('ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS')) { this.sel = (this.sel + list.length - 1) % list.length; SL.Audio.sfx.blip(520); }
      const ready = this.state === 'paused' || (this.overT <= -0.5 && this.overPhase !== 'entry');
      if (ready && (I.hitAny('Enter', 'NumpadEnter') || (this.state === 'over' && I.hit('Space')))) this.menuAction(list[this.sel].id);
      return { ax: 0, ay: 0, fire: false };
    }
    // keyboard
    const k = I.axis(); ax = k.x; ay = k.y; fire = I.down('Space') || I.down('KeyJ');
    if (this.state === 'play') {
      if (I.hit('KeyF')) SL.Features.fireBomb(this);
      if (I.hit('KeyR')) SL.Features.activateAssist(this);
    }
    // touch joystick
    if (this.joy && !I.pointers.has(this.joy.id)) this.joy = null;
    if (this.joy) {
      let dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy; const R = this.joyHome.r, L = Math.hypot(dx, dy);
      if (L > R) { this.joy.ox += dx - dx / L * R; this.joy.oy += dy - dy / L * R; dx = dx / L * R; dy = dy / L * R; } // floating base follows the thumb
      if (L > 6) { ax = dx / R; ay = dy / R; }
    }
    if (this.fireId !== null) { if (I.pointers.has(this.fireId)) fire = true; else this.fireId = null; }
    return { ax, ay, fire };
  }
  menuAction(id) {
    SL.Audio.sfx.blip(780);
    if (id === 'resume') this.pause(false);
    else if (id === 'settings') SL.Vol.openPanel();
    else if (id === 'again') SL.start(this.mode === 'story' ? 'story' : 'play');
    else if (id === 'menu') SL.start('menu');
  }

  /* ---------------- update ---------------- */
  update(dt) {
    this.T += dt;
    const inp = this.handleInput();
    if (this.state === 'paused') return;
    const C = this.C, s = this.ship, W = SL.W, H = SL.H;
    const live = this.state === 'play';
    if (live) {
      this.t += dt; if (this.timeScore) this.score += C.score.perSecond * dt;
      this.ev.emit('tick', dt);
    }
    SL.Features.update(this, dt);
    const hdt = dt * SL.Features.hazardScale(this);   // v0.5.7 slow-mo: asteroids / enemy shots; player stays at full speed
    // ship movement with light inertia
    if (s.alive) {
      const mag = Math.hypot(inp.ax, inp.ay), nx = mag > 1 ? inp.ax / mag : inp.ax, ny = mag > 1 ? inp.ay / mag : inp.ay;
      const k = Math.min(1, C.ship.response * dt);
      s.vx += (nx * C.ship.maxSpeed - s.vx) * k; s.vy += (ny * C.ship.maxSpeed - s.vy) * k;
      s.x = Math.max(24, Math.min(W - 24, s.x + s.vx * dt)); s.y = Math.max(80, Math.min(H - 26, s.y + s.vy * dt));
      s.invuln = Math.max(0, s.invuln - dt); s.cool -= dt;
      if (inp.fire && s.cool <= 0 && live) this.fire();
    }
    // bullets (player shots + missiles stay at full speed)
    for (const b of this.bullets) { if (b.seek) SL.Features.steer(this, b, dt); b.x += b.vx * dt; b.y += b.vy * dt; }
    this.bullets = this.bullets.filter(b => b.y > -20 && !b.dead && b.x > -20 && b.x < W + 20);
    // spawning
    if (live && this.spawnHold <= 0) { this.spawnT -= hdt; if (this.spawnT <= 0) { this.spawn(); this.spawnT = this.spawnInterval * (0.7 + Math.random() * 0.6); } }
    // asteroids
    for (const a of this.asteroids) {
      a.x += a.vx * hdt; a.y += a.vy * hdt; a.rot += a.spin * hdt;
      if (a.x > -a.r && a.x < W + a.r) a.entered = true;
      if (a.entered) { if (a.x < -a.r) a.x = W + a.r; else if (a.x > W + a.r) a.x = -a.r; }   // horizontal wrap, Asteroids-style
      if (a.y > H + a.r + 10) a.dead = true;
    }
    // collisions: bullets vs asteroids
    for (const b of this.bullets) {
      if (b.dead) continue;
      if (this.hitExtra && this.hitExtra(b)) continue;     // e.g. Story boss weak points / hull
      for (const a of this.asteroids) {
        if (a.dead || (b.pierce && a.immune === b)) continue;
        const dx = a.x - b.x, dy = a.y - b.y, rr = a.r * 0.92 + (b.pierce ? 6 : 3);
        if (dx * dx + dy * dy < rr * rr) {
          this.fx.burst(b.x, b.y, b.pierce ? '160,255,255' : '255,200,255', 4, 90, 0.25, 1.5);
          this.countHit(b);
          if (b.pierce) { this.destroy(a, true, { immune: b }); continue; }
          b.dead = true; this.destroy(a, true);
          if (this.ricochet > 0 && !b.bounced && SL.Features.retarget(this, b, a)) { b.dead = false; this.fx.burst(b.x, b.y, '255,180,80', 8, 140, 0.3, 2); }
          break;
        }
      }
    }
    // ship vs asteroids
    if (s.alive && s.invuln <= 0 && live) {
      for (const a of this.asteroids) {
        if (a.dead) continue;
        const dx = a.x - s.x, dy = a.y - s.y, rr = a.r * 0.8 + C.ship.radius;
        if (dx * dx + dy * dy < rr * rr) { this.playerHit(a); break; }
      }
    }
    this.onUpdate && this.onUpdate(dt);
    this.asteroids = this.asteroids.filter(a => !a.dead);
    this.bullets = this.bullets.filter(b => !b.dead);
    // fx
    this.stars.update(dt, 1 + Math.min(1.2, this.t / 90));
    this.fx.update(dt);
    for (const p of this.popups) { p.life -= dt; p.y -= 40 * dt; }
    this.popups = this.popups.filter(p => p.life > 0);
    this.shakeAmt = Math.max(0, this.shakeAmt - 30 * dt);
    if (this.state === 'dying') { this.overT -= dt; if (this.overT <= 0) this.gameOver(); }
    else if (this.state === 'over') this.overT -= dt;
  }
  countHit(b) { if (b.kind !== 'avrill' && b.kind !== 'missile' && !b.counted) { b.counted = true; this.stats.bulletHits = (this.stats.bulletHits || 0) + 1; } }
  fire() {
    const s = this.ship, C = this.C;
    s.gun = 1 - s.gun;
    let shots = [{ x: s.x + (s.gun ? 7 : -7), y: s.y - 12, vx: 0, vy: -C.ship.bulletSpeed }];
    shots = SL.Features.modifyFire(this, shots);
    this.bullets.push(...shots); this.stats.shots += shots.length;
    s.cool = C.ship.fireRate * SL.Features.fireRateMul(this);
    SL.Audio.sfx.shot(); this.ev.emit('fire', shots);
  }

  /* ---------------- draw ---------------- */
  draw(g) {
    const W = SL.W, H = SL.H, s = this.ship;
    g.save();
    if (this.shakeAmt > 0.1) g.translate((Math.random() - .5) * this.shakeAmt, (Math.random() - .5) * this.shakeAmt);
    SL.drawSpaceBg(g);
    this.stars.draw(g, this.T, 0.7 + Math.min(0.5, this.t / 180), this.warpK || 0);
    // asteroids
    for (const a of this.asteroids) {
      if (a.special) SL.glow(g, a.x, a.y, a.r * 1.6, a.r * 1.6, a.rgb, a.special === 'red' ? 0.18 + 0.14 * Math.sin(this.T * 9) : 0.22);
      const sz = a.sprite.size; g.save(); g.translate(a.x, a.y); g.rotate(a.rot); g.drawImage(a.sprite.c, -sz / 2, -sz / 2, sz, sz); g.restore();
    }
    this.drawWorld && this.drawWorld(g);
    // bullets
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const KINDS = { std: ['255,60,200', '255,110,230', 16], triple: ['255,120,40', '255,170,80', 16], laser: ['60,230,255', '150,255,255', 38], avrill: ['255,60,200', '255,140,240', 14], missile: ['255,110,40', '255,220,160', 18] };
    for (const kind in KINDS) {
      const [c1, c2, len] = KINDS[kind], list = this.bullets.filter(b => (b.kind || 'std') === kind);
      if (!list.length) continue;
      const bpath = () => { g.beginPath(); for (const b of list) { const n = Math.hypot(b.vx, b.vy) || 1; g.moveTo(b.x, b.y); g.lineTo(b.x - b.vx / n * len, b.y - b.vy / n * len); } };
      bpath(); g.strokeStyle = `rgba(${c1},0.25)`; g.lineWidth = kind === 'laser' ? 10 : 8; g.stroke();
      bpath(); g.strokeStyle = `rgba(${c2},0.9)`; g.lineWidth = 3; g.stroke();
      bpath(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2; g.stroke();
    }
    g.restore();
    SL.Features.draw(this, g);
    SL.Features.drawEscort(this, g);
    // ship
    if (s.alive && !(s.invuln > 0 && Math.floor(this.T * 14) % 2)) {
      const f = 0.75 + 0.25 * (Math.sin(this.T * 31.7) * .5 + Math.sin(this.T * 53.1) * .3 + Math.sin(this.T * 97.3) * .2);
      const len = 18 + 12 * f + Math.max(0, -s.vy) * 0.03, y0 = s.y + 14;
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(0, y0, 0, y0 + len);
      gr.addColorStop(0, `rgba(255,235,255,${.7 * f})`); gr.addColorStop(.3, `rgba(255,90,220,${.55 * f})`); gr.addColorStop(1, 'rgba(255,40,180,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(s.x - 5, y0); g.quadraticCurveTo(s.x - 4, y0 + len * .6, s.x, y0 + len); g.quadraticCurveTo(s.x + 4, y0 + len * .6, s.x + 5, y0); g.fill();
      g.restore();
      SL.glow(g, s.x, y0 + 8, 16 + 4 * f, 22 + 6 * f, '255,60,210', 0.25 * f + 0.08);
      const sz = this.shipSprite.size, tilt = Math.max(-0.2, Math.min(0.2, s.vx / 2000));
      g.save(); g.translate(s.x, s.y); g.rotate(tilt); g.drawImage(this.shipSprite.c, -sz / 2, -sz / 2 + 2, sz, sz); g.restore();
    }
    SL.Features.drawShield(this, g);
    this.fx.draw(g);
    for (const p of this.popups) SL.neonText(g, p.txt, p.x, p.y, 15, p.rgb, { alpha: Math.min(1, p.life * 2), blur: 8 });
    g.restore();
    SL.Features.drawOverlay(this, g);
    this.drawHUD(g);
    if (!SL.Input.touchMode && this.t < 6 && this.state === 'play') SL.neonText(g, SL.CONTROLS_HINT, 512, 556, 12, '160,200,255', { blur: 4, alpha: Math.min(0.85, (6 - this.t) / 1.5) });
    if (SL.Input.touchMode && this.state !== 'over' && this.state !== 'clear' && this.state !== 'warp') this.drawTouch(g);
    this.drawTop && this.drawTop(g);
    if (this.state === 'paused') this.drawPause(g);
    if (this.state === 'over') this.drawOver(g);
    SL.drawScanlines(g);
  }
  drawHUD(g) {
    SL.neonText(g, 'SCORE', 18, 22, 14, '255,80,210', { align: 'left', blur: 8 });
    SL.neonText(g, SL.pad(this.score), 84, 22, 20, '255,235,255', { align: 'left', blur: 10 });
    for (let i = 0; i < this.C.ship.startLives; i++) {
      const sz = 26; g.save(); g.globalAlpha = i < this.lives ? 1 : 0.18;
      g.drawImage(this.shipSprite.c, 18 + i * 28, 36, sz, sz); g.restore();
    }
    const m = Math.floor(this.t / 60), sec = Math.floor(this.t % 60);
    if (this.hudCenter) this.hudCenter(g);
    else SL.neonText(g, `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`, 512, 20, 16, '160,200,255', { blur: 8 });
    // combo meter
    if (this.mult > 1 || this.streak > 0) {
      const step = this.C.score.comboStep, prog = this.mult >= this.C.score.comboMax ? 1 : (this.streak % step) / step;
      const col = ['255,255,255', '255,80,220', '170,90,255', '255,220,90'][this.mult - 1];
      if (this.mult > 1) SL.neonText(g, `x${this.mult} COMBO`, 512, 44, 18 + Math.sin(this.T * 8) * 1.2, col, { blur: 14 });
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(452, 58, 120, 3);
      g.fillStyle = `rgba(${col},0.9)`; g.fillRect(452, 58, 120 * prog, 3);
    }
    SL.neonText(g, 'BEST ' + SL.pad(Math.max(this.best, Math.floor(this.score))), 872, 22, 14, '70,160,255', { align: 'right', blur: 8 });
    SL.Features.drawHUD(this, g);
    // pause icon (speaker + settings are drawn by SL.Vol.drawChrome)
    const b = this.btnPause;
    g.save(); SL.roundRect(g, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 7); g.fillStyle = 'rgba(8,4,20,0.72)'; g.fill();
    g.strokeStyle = 'rgba(160,200,255,0.7)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(200,225,255,0.95)';
    if (this.state === 'paused') { g.beginPath(); g.moveTo(b.x - 6, b.y - 10); g.lineTo(b.x + 10, b.y); g.lineTo(b.x - 6, b.y + 10); g.fill(); }
    else { g.fillRect(b.x - 8, b.y - 9, 5, 18); g.fillRect(b.x + 3, b.y - 9, 5, 18); }
    g.restore();
  }
  drawTouch(g) {
    const J = this.joyHome, j = this.joy;
    const bx = j ? j.ox : J.x, by = j ? j.oy : J.y;
    let kx = bx, ky = by; if (j) { kx = j.x; ky = j.y; const dx = kx - bx, dy = ky - by, L = Math.hypot(dx, dy); if (L > J.r) { kx = bx + dx / L * J.r; ky = by + dy / L * J.r; } }
    g.save();
    g.strokeStyle = `rgba(70,160,255,${j ? 0.75 : 0.4})`; g.lineWidth = 2; g.shadowColor = 'rgba(70,160,255,1)'; g.shadowBlur = 12 * SL.view.scale;
    g.beginPath(); g.arc(bx, by, J.r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(70,160,255,0.08)'; g.fill();
    g.beginPath(); g.arc(kx, ky, 24, 0, Math.PI * 2); g.fillStyle = `rgba(120,190,255,${j ? 0.55 : 0.3})`; g.fill(); g.stroke();
    const F = this.fireBtn, on = this.fireId !== null;
    g.strokeStyle = `rgba(255,80,220,${on ? 1 : 0.7})`; g.shadowColor = 'rgba(255,80,220,1)'; g.shadowBlur = (on ? 22 : 12) * SL.view.scale; g.lineWidth = on ? 3.5 : 2.5;
    g.beginPath(); g.arc(F.x, F.y, F.r, 0, Math.PI * 2); g.fillStyle = `rgba(255,80,220,${on ? 0.28 : 0.1})`; g.fill(); g.stroke();
    g.restore();
    SL.neonText(g, 'FIRE', F.x, F.y + 1, 22, '255,120,230', { blur: 12 });
    const round = (b, rgb, on, label, sub) => {
      g.save(); g.strokeStyle = `rgba(${rgb},${on ? 0.95 : 0.3})`; g.lineWidth = on ? 2.5 : 1.5;
      g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = (on ? 14 : 0) * SL.view.scale;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fillStyle = `rgba(${on ? rgb : '120,110,150'},${on ? 0.14 : 0.08})`; g.fill(); g.stroke(); g.restore();
      SL.neonText(g, label, b.x, b.y - (sub ? 5 : 0), 12, on ? rgb : '140,130,170', { blur: on ? 8 : 0, alpha: on ? 1 : 0.7 });
      if (sub) SL.neonText(g, sub, b.x, b.y + 10, 12, on ? '255,255,255' : '140,130,170', { blur: on ? 6 : 0, alpha: on ? 1 : 0.7 });
    };
    round(this.bombBtn, '255,90,150', this.bombs > 0, 'BOMB', '×' + this.bombs);
    const A = this.assist, rdy = A.ready && A.phase === 'idle';
    if (rdy) SL.glow(g, this.avrillBtn.x, this.avrillBtn.y, 52, 52, '255,80,220', 0.25 + 0.15 * Math.sin(this.T * 8));
    round(this.avrillBtn, '255,80,220', rdy, SL.Features.assistName(this), rdy ? 'READY' : Math.floor(A.energy) + '%');
  }
  drawPause(g) {
    g.fillStyle = 'rgba(3,1,12,0.65)'; g.fillRect(0, 0, SL.W, SL.H);
    SL.neonText(g, 'PAUSED', 512, 180, 48, '255,80,220', { blur: 22 });
    SL.neonText(g, SL.Input.touchMode ? 'STICK: MOVE · FIRE: HOLD · BOMB · AVRILL' : SL.CONTROLS_HINT, 512, 530, 13, '160,200,255', { blur: 5, alpha: 0.85 });
    this.pauseBtns.forEach((b, i) => SL.drawButton(g, b, i === this.sel, this.T));
  }
  drawOver(g) {
    const k = Math.min(1, (-this.overT + 0.01) * 3 + 0.3);
    g.fillStyle = `rgba(3,1,12,${0.78 * k})`; g.fillRect(0, 0, SL.W, SL.H);
    const m = Math.floor(this.t / 60), sec = Math.floor(this.t % 60);
    if (this.overPhase === 'entry') {
      SL.neonText(g, 'GAME OVER', 512, 96, 52, '255,70,210', { blur: 24, alpha: k });
      SL.neonText(g, 'NEW HIGH SCORE — ENTER YOUR NAME', 512, 160, 22, '255,220,90', { blur: 14, alpha: (0.75 + 0.25 * Math.sin(this.T * 7)) * k });
      SL.neonText(g, 'SCORE ' + SL.pad(this.score) + `   ·   TIME ${m}:${String(sec).padStart(2, '0')}   ·   KILLS ${this.stats.kills}`, 512, 196, 15, '255,235,255', { blur: 8, alpha: k });
      SL.neonText(g, SL.Input.touchMode ? 'TAP THE BOX TO TYPE  ·  A–Z 0–9  ·  MAX 10' : 'TYPE YOUR NAME  ·  ENTER TO CONFIRM', 512, 330, 13, '160,200,255', { blur: 5, alpha: 0.85 * k });
      return;
    }
    SL.neonText(g, 'GAME OVER', 512, 44, 40, '255,70,210', { blur: 22, alpha: k });
    SL.neonText(g, (this.mode === 'story' ? `LEVEL ${this.level}   ` : '') + 'SCORE ' + SL.pad(this.score) + `   TIME ${m}:${String(sec).padStart(2, '0')}   KILLS ${this.stats.kills}`, 512, 86, 17, '255,235,255', { blur: 8, alpha: k });
    if (this.debug) SL.neonText(g, 'DEBUG RUN (?level) — NOT RANKED', 512, 112, 13, '255,150,80', { blur: 6, alpha: k });
    else if (this.newBest) SL.neonText(g, '★ NEW #1 ★', 512, 112, 15, '255,220,90', { blur: 12, alpha: (0.6 + 0.4 * Math.sin(this.T * 7)) * k });
    SL.neonText(g, (this.mode === 'story' ? 'STORY' : 'SURVIVAL') + ' TOP 10', 512, 140, 16, '170,90,255', { blur: 10, alpha: k });
    SL.drawScoreTable(g, SL.Scores.list(this.mode), 168, this.hiRank, this.T, this.mode);
    this.overBtns.forEach((b, i) => SL.drawButton(g, b, i === this.sel, this.T));
  }

};
