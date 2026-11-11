/* v0.5.5 FINAL LEVEL (Story level 30): in-engine opening (Oakens + Avrill, lightning strike), dialogue scenes,
   Commander Edisar Starlight's flagship (3 phases), Dr. Nebula as the assist, then recount -> END CREDITS.
   Hooks into SL.Story through startFinal() (called by startLevel) and by wrapping a few prototype methods. */
(() => {
const P = SL.Story.prototype, orig = {};
['updateBoss', 'bossDefeated', 'damagePoint', 'bossHp', 'drawWorld', 'drawTop', 'hudCenter', 'startClear', 'hitExtra'].forEach(k => orig[k] = P[k]);
const pick = l => l[(Math.random() * l.length) | 0];
const W = SL.W, H = SL.H;
const EDISAR_TAUNTS = [   // v0.5.5: short mid-fight jabs only (story lines live in the pre-fight entrance)
  'Too slow!', 'Pathetic!', 'Is that all?', 'Kneel, pilot!', 'I trained you!',
];
SL.EDISAR_TAUNTS = EDISAR_TAUNTS;
const FB = { y: 158, turretHp: 50, coreHp: 180, phase3At: 0.45, bullet: [240, 250, 255], interval: [0.38, 0.55, 0.80],
  lightningEvery: [0, 3.4, 2.4], warn: [0, 1.1, 0.9], boltHalfW: 24, bonus: 25000 };
/* v0.5.5: turrets at the wing tips and mid-wing so shots come from across the full flagship width */
const TURRETS = [{ ox: -240, oy: -14 }, { ox: -108, oy: 26 }, { ox: 108, oy: 26 }, { ox: 240, oy: -14 }];
/* v0.5.5 hitboxes matching the dreadnought silhouette (local offsets from B.x, B.y). */
function inFlagship(dx, dy, shot) {
  const wingLo = 74 - Math.abs(dx) * 0.30, wingHi = -40 - Math.abs(dx) * 0.02;
  if (Math.abs(dx) < 258 && dy < wingLo && dy > wingHi) return true;   // turrets/core are tested first, so the hull can be solid
  if (Math.abs(dx) < 80 && dy > -130 && dy < (shot ? 6 : 92)) return true;          // tower + belly
  if (Math.abs(dx) < 130 && dy > -90 && dy < -16) return true;                      // engine banks / cheeks
  return false;
}

SL.CONFIG.story.final = FB;

/* ---------- Starlight Fleet flagship sprite (white / gold / cyan, fleet emblem), cached ---------- */
let flag = null;
function flagship() {
  if (flag) return flag;
  const S = 2, FW = 640, FH = 280, c = SL.mkCanvas(FW * S, FH * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(FW / 2, FH / 2 - 10); g.lineJoin = 'round'; g.lineCap = 'round';
  const glow = (rgb, w, blur) => { g.strokeStyle = `rgba(${rgb},1)`; g.lineWidth = w; g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = blur * S; g.stroke(); g.shadowBlur = 0; };
  const fillGlow = (rgb, blur) => { g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = blur * S; g.fill(); g.shadowBlur = 0; };
  // ---------- underside shadow (gives the hull mass) ----------
  g.beginPath(); g.moveTo(-258, -20); g.lineTo(0, 96); g.lineTo(258, -20); g.lineTo(230, 8); g.lineTo(0, 86); g.lineTo(-230, 8); g.closePath();
  g.fillStyle = 'rgba(8,10,24,0.55)'; g.fill();
  // ---------- lower armor plate (darker under-hull) ----------
  const plate = (inset, lift, col) => {
    g.beginPath();
    g.moveTo(-250 + inset, -30 + lift * 0.2); g.lineTo(0, 36 + lift); g.lineTo(250 - inset, -30 + lift * 0.2);
    g.lineTo(232 - inset * 0.6, 2 + lift * 0.4); g.lineTo(0, 78 + lift * 0.55); g.lineTo(-232 + inset * 0.6, 2 + lift * 0.4);
    g.closePath(); g.fillStyle = col; g.fill();
  };
  plate(0, 6, '#3a4058');
  plate(8, 0, '#9aa3b8');
  // main chevron with a vertical metal gradient
  const wing = () => { g.beginPath(); g.moveTo(-250, -36); g.lineTo(0, 32); g.lineTo(250, -36); g.lineTo(234, -2); g.lineTo(0, 74); g.lineTo(-234, -2); g.closePath(); };
  const gr = g.createLinearGradient(0, -50, 0, 80); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#e8edf6'); gr.addColorStop(0.7, '#b0b7c9'); gr.addColorStop(1, '#6c7388');
  wing(); g.fillStyle = gr; g.fill(); glow('90,220,255', 2.8, 16);
  // layered hull plates (panel cuts)
  g.save(); wing(); g.clip();
  g.strokeStyle = 'rgba(30,36,60,0.45)'; g.lineWidth = 1.2;
  for (let i = 1; i <= 8; i++) for (const sx of [-1, 1]) {
    const x = sx * i * 26; g.beginPath(); g.moveTo(x, -34); g.lineTo(x, 40 - Math.abs(x) * 0.26); g.stroke();
  }
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1;
  for (const k of [0.22, 0.45, 0.68]) {
    g.beginPath(); g.moveTo(-230, -28 + k * 40); g.lineTo(0, 20 + k * 50); g.lineTo(230, -28 + k * 40); g.stroke();
  }
  // gold leading-edge plate
  g.beginPath(); g.moveTo(-236, -4); g.lineTo(0, 74); g.lineTo(236, -4); g.lineTo(222, 2); g.lineTo(0, 62); g.lineTo(-222, 2); g.closePath();
  g.fillStyle = 'rgba(255,205,90,0.18)'; g.fill();
  g.restore();
  // gold trim + cyan light rails
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(sx * 236, -4); g.lineTo(0, 74); g.strokeStyle = 'rgba(255,205,90,1)'; g.lineWidth = 3.2; g.stroke();
    g.beginPath(); g.moveTo(sx * 228, -24); g.lineTo(sx * 28, 38); g.strokeStyle = 'rgba(120,240,255,0.95)'; g.lineWidth = 2.2; g.shadowColor = 'rgba(80,220,255,1)'; g.shadowBlur = 12 * S; g.stroke(); g.shadowBlur = 0;
    g.beginPath(); g.moveTo(sx * 210, -30); g.lineTo(sx * 18, 22); g.strokeStyle = 'rgba(255,220,140,0.35)'; g.lineWidth = 1; g.stroke();
  }
  // ---------- engine banks (rear / top of the screen) ----------
  const engineBank = (side) => {
    const x0 = side * 118, y0 = -72;
    // housing
    g.beginPath(); SL.roundRect(g, x0 - 52, y0 - 18, 104, 36, 8);
    const eg = g.createLinearGradient(x0, y0 - 18, x0, y0 + 18); eg.addColorStop(0, '#dfe6f4'); eg.addColorStop(1, '#6a7388');
    g.fillStyle = eg; g.fill(); glow('255,205,90', 1.6, 6);
    // five nozzles
    for (let i = -2; i <= 2; i++) {
      const nx = x0 + i * 18, ny = y0;
      SL.roundRect(g, nx - 7, ny - 11, 14, 22, 4);
      g.fillStyle = '#141a2c'; g.fill();
      g.strokeStyle = 'rgba(255,205,90,0.9)'; g.lineWidth = 1.2; g.stroke();
      g.beginPath(); g.ellipse(nx, ny, 5, 8, 0, 0, Math.PI * 2);
      g.fillStyle = 'rgba(140,240,255,0.95)'; fillGlow('80,220,255', 10);
      g.beginPath(); g.ellipse(nx, ny, 2.2, 4, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
    }
    // gold cap strip
    g.fillStyle = 'rgba(255,205,90,1)'; g.fillRect(x0 - 50, y0 + 12, 100, 3);
  };
  engineBank(-1); engineBank(1);
  // ---------- central spine + command tower (dreadnought 'citadel') ----------
  // spine
  const sg = g.createLinearGradient(-40, 0, 40, 0); sg.addColorStop(0, '#8b93a8'); sg.addColorStop(0.5, '#f4f7ff'); sg.addColorStop(1, '#8b93a8');
  SL.roundRect(g, -36, -88, 72, 150, 8); g.fillStyle = sg; g.fill(); glow('90,220,255', 1.4, 6);
  // tower body, stepped
  const tg = g.createLinearGradient(0, -118, 0, 20); tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.5, '#c5ccd9'); tg.addColorStop(1, '#7d86a0');
  SL.roundRect(g, -78, -116, 156, 128, 14); g.fillStyle = tg; g.fill(); glow('255,205,90', 2.6, 9);
  // stepped crown / upper deck
  SL.roundRect(g, -54, -128, 108, 28, 8); g.fillStyle = '#eef2fa'; g.fill(); glow('90,220,255', 1.4, 6);
  g.fillStyle = 'rgba(255,205,90,1)'; g.fillRect(-78, -18, 156, 5); g.fillRect(-54, -108, 108, 3);
  // antenna fin
  g.beginPath(); g.moveTo(-6, -128); g.lineTo(0, -158); g.lineTo(6, -128); g.closePath(); g.fillStyle = '#cfd6e6'; g.fill(); glow('120,240,255', 1.2, 6);
  g.beginPath(); g.arc(0, -158, 3.2, 0, Math.PI * 2); g.fillStyle = 'rgba(120,240,255,1)'; fillGlow('80,220,255', 8);
  // bridge visor bank (menacing cyan slit array)
  g.beginPath(); g.moveTo(-64, -92); g.lineTo(0, -70); g.lineTo(64, -92); g.lineTo(60, -80); g.lineTo(0, -58); g.lineTo(-60, -80); g.closePath();
  g.fillStyle = 'rgba(20,30,50,0.95)'; g.fill();
  g.beginPath(); g.moveTo(-58, -88); g.lineTo(0, -68); g.lineTo(58, -88); g.lineTo(54, -80); g.lineTo(0, -62); g.lineTo(-54, -80); g.closePath();
  g.fillStyle = 'rgba(120,240,255,0.95)'; fillGlow('80,220,255', 14);
  // visor slit lines
  g.strokeStyle = 'rgba(10,20,40,0.45)'; g.lineWidth = 1;
  for (const sx of [-0.6, -0.3, 0, 0.3, 0.6]) { g.beginPath(); g.moveTo(sx * 50, -86); g.lineTo(sx * 8, -66); g.stroke(); }
  // side armor cheeks
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(sx * 78, -100); g.lineTo(sx * 118, -70); g.lineTo(sx * 110, -20); g.lineTo(sx * 78, -10); g.closePath();
    const cg = g.createLinearGradient(sx * 78, -100, sx * 118, -20); cg.addColorStop(0, '#f3f6fb'); cg.addColorStop(1, '#8a91a6');
    g.fillStyle = cg; g.fill(); glow('255,205,90', 1.3, 4);
  }
  // fleet emblem
  g.beginPath(); g.arc(0, -36, 17, 0, Math.PI * 2); g.fillStyle = '#121a3a'; g.fill(); g.strokeStyle = 'rgba(255,205,90,1)'; g.lineWidth = 2.2; g.stroke();
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 13; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -36 + Math.sin(a) * r); } g.closePath(); g.fillStyle = '#ffd25a'; g.fill();
  // ---------- turret mounts at the spread positions (tips ±240, mid ±108) ----------
  const mount = (mx, my, scale = 1) => {
    g.save(); g.translate(mx, my); g.scale(scale, scale);
    g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fillStyle = '#1a2034'; g.fill();
    g.beginPath(); g.arc(0, 0, 16, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,205,90,1)'; g.lineWidth = 2.5; g.stroke();
    g.beginPath(); g.arc(0, 0, 11, 0, Math.PI * 2); g.fillStyle = '#3a4258'; g.fill(); g.strokeStyle = 'rgba(120,240,255,0.7)'; g.lineWidth = 1.2; g.stroke();
    // barrel housing pointing down
    SL.roundRect(g, -5, 8, 10, 16, 2); g.fillStyle = '#2a3044'; g.fill(); g.strokeStyle = 'rgba(255,205,90,0.8)'; g.lineWidth = 1; g.stroke();
    g.restore();
  };
  mount(-240, -14, 1.05); mount(240, -14, 1.05); mount(-108, 26, 1); mount(108, 26, 1);
  // ---------- menacing core housing ----------
  g.beginPath(); g.arc(0, 40, 36, 0, Math.PI * 2); g.fillStyle = '#151a2c'; g.fill();
  g.beginPath(); g.arc(0, 40, 34, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,205,90,1)'; g.lineWidth = 3.5; glow('255,205,90', 3.5, 8);
  g.beginPath(); g.arc(0, 40, 26, 0, Math.PI * 2); g.fillStyle = '#0a0d18'; g.fill();
  // inner ring
  g.beginPath(); g.arc(0, 40, 22, 0, Math.PI * 2); g.strokeStyle = 'rgba(120,240,255,0.55)'; g.lineWidth = 2; g.stroke();
  // dormant core glow (drawn brighter live when shutters open)
  g.beginPath(); g.arc(0, 40, 10, 0, Math.PI * 2); g.fillStyle = 'rgba(80,160,220,0.45)'; fillGlow('80,220,255', 8);
  flag = { c, W: FW, H: FH };
  return flag;
}

SL.edisarFlagship = flagship;
function drawFlagship(g, x, y, T, opts = {}) {
  const f = flagship(), pulse = 0.55 + 0.45 * Math.sin(T * 5.5);
  SL.glow(g, x, y - 20, 380, 170, '80,200,255', 0.14);
  SL.glow(g, x, y + 40, 100, 80, '120,240,255', 0.16 + 0.10 * Math.sin(T * 3));
  // engine wash (animated, behind the sprite slightly by drawing over the banks)
  g.drawImage(f.c, x - f.W / 2, y - f.H / 2 + 10, f.W, f.H);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const sx of [-1, 1]) {
    const ex = x + sx * 118, ey = y - 72;
    SL.glow(g, ex, ey, 70, 36, '120,240,255', 0.18 * pulse);
    SL.glow(g, ex, ey, 36, 22, '255,255,255', 0.12 * pulse);
  }
  g.restore();
  if (opts.shutters !== false) {          // closed core shutters (phase 1)
    g.save(); g.beginPath(); g.arc(x, y + 40, 28, 0, Math.PI * 2); g.fillStyle = '#c9a24a'; g.fill();
    g.strokeStyle = 'rgba(80,60,20,0.85)'; g.lineWidth = 2.2;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.4; g.beginPath(); g.moveTo(x, y + 40); g.lineTo(x + Math.cos(a) * 28, y + 40 + Math.sin(a) * 28); g.stroke(); }
    g.beginPath(); g.arc(x, y + 40, 28, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,205,90,0.95)'; g.lineWidth = 2; g.stroke();
    g.restore();
  } else {
    SL.glow(g, x, y + 40, 70, 70, '120,240,255', 0.28 + 0.14 * Math.sin(T * 4));
    g.beginPath(); g.arc(x, y + 40, 14, 0, Math.PI * 2); g.fillStyle = `rgba(180,245,255,${0.55 + 0.25 * Math.sin(T * 5)})`; g.fill();
  }
}
/* jagged lightning bolt */
function drawBolt(g, x0, y0, x1, y1, a = 1, width = 1) {
  const n = 12, pts = [[x0, y0]];
  for (let i = 1; i < n; i++) { const k = i / n; pts.push([x0 + (x1 - x0) * k + (Math.random() - 0.5) * 46, y0 + (y1 - y0) * k + (Math.random() - 0.5) * 12]); }
  pts.push([x1, y1]);
  const path = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'round';
  path(); g.strokeStyle = `rgba(120,170,255,${0.35 * a})`; g.lineWidth = 18 * width; g.stroke();
  path(); g.strokeStyle = `rgba(190,220,255,${0.8 * a})`; g.lineWidth = 6 * width; g.stroke();
  path(); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 2.2 * width; g.stroke();
  // branches
  for (let b = 0; b < 3; b++) { const [bx, by] = pts[2 + ((Math.random() * (n - 4)) | 0)]; g.beginPath(); g.moveTo(bx, by); let x = bx, y = by; for (let i = 0; i < 4; i++) { x += (Math.random() - 0.5) * 50; y += 14 + Math.random() * 16; g.lineTo(x, y); } g.strokeStyle = `rgba(200,225,255,${0.6 * a})`; g.lineWidth = 1.6 * width; g.stroke(); }
  g.restore();
}
SL.drawBolt = drawBolt;

/* ---------- in-engine opening ---------- */
class FinalOpening {
  constructor(game, done) {
    this.g = game; this.onDone = done; this.T = 0; this.T2 = 0; this.step = 'fly'; this.sub = null; this.over = false;
    this.fx = new SL.Particles(); this.stars = new SL.Starfield(1); this.flash = 0; this.shakeAmt = 0; this.slow = 1;
    this.oak = SL.Sprites.ship(SL.Features.store.shipColor()); this.avShip = SL.Sprites.ship('255,80,220');
    this.av = { x: 590, y: 420, alive: true }; this.bolt = -1; this.flagY = -260; this.ev = {};
    this.skipBtn = { label: 'SKIP ▶▶', x: 940, y: 74, w: 140, h: 36, rgb: '160,200,255', size: 15 };
    this.popGame = { ship: null, asteroids: [], bullets: [], _pops: {} };
  }
  once(k) { if (this.ev[k]) return false; return (this.ev[k] = true); }
  finish() { if (this.over) return; this.over = true; this.onDone(); }   // v0.5.1: music comes back only in beginFinalFight (new track, full volume)
  update(dt) {
    if (this.sub) { this.sub.update(dt); return; }
    const I = SL.Input, downs = I.takeDowns();
    if (I.hit('KeyM')) SL.Audio.toggleMute();
    if (I.hitAny('Escape', 'Backspace') || downs.some(d => SL.inBtn(this.skipBtn, d))) { SL.Audio.sfx.blip(520); return this.finish(); }
    const sdt = dt * this.slow;
    this.stars.update(sdt, this.step === 'fly' ? 1.6 : 0.6); this.fx.update(sdt);
    this.flash = Math.max(0, this.flash - dt * 1.6); this.shakeAmt = Math.max(0, this.shakeAmt - 20 * dt);
    if (this.step === 'fly') {
      const T = (this.T += dt);
      if (T > 6.6 && T < 7.2 && Math.random() < 0.15) { this.flash = Math.max(this.flash, 0.15); }       // crackle in the clouds
      if (T >= 6.7 && this.once('warn')) SL.Audio.sfx.warn();
      if (T >= 7.2 && this.once('strike')) {
        this.bolt = 0; this.flash = 1; this.shakeAmt = 20; SL.Audio.sfx.thunderBig(); SL.Audio.setMusicVolume(0); this.slow = 0.3;   // v0.5.1: total music silence from here until the fight starts
      }
      if (this.bolt >= 0) this.bolt += dt;
      if (T >= 7.4 && this.once('boom')) {
        const { x, y } = this.av; this.av.alive = false; SL.Audio.sfx.avrillBoom();
        this.fx.burst(x, y, '255,80,220', 140, 420, 2.2, 3.4); this.fx.burst(x, y, '255,255,255', 60, 260, 1.4, 2.4); this.fx.burst(x, y, '40,10,40', 50, 200, 2.6, 4);
        this.fx.ring(x, y, '255,120,230', 140, 0.9); this.fx.ring(x, y, '255,255,255', 70, 0.5);
      }
      if (T >= 9.6) this.slow = Math.min(1, this.slow + dt * 0.8);
      if (T >= 10.8) { this.sub = new SL.Cutscene('finalNebula', () => { const sk = this.sub.skipped; this.sub = null; if (sk) return this.finish(); this.step = 'edisar'; SL.Input.takeDowns(); }); }
    } else {
      const T = (this.T2 += dt), DUR = 6.2;
      if (this.once('rumble')) SL.Audio.sfx.rumble();
      const k = Math.min(1, T / DUR), e = 1 - Math.pow(1 - k, 2.15);
      this.flagY = -360 + (FB.y + 360) * e;
      if (k < 1) this.shakeAmt = Math.max(this.shakeAmt, 2 + 8 * k * k);          // building, moderate
      if (k >= 1 && this.once('dock')) { this.shakeAmt = 15; this.flash = 0.38; SL.Audio.sfx.boom(); }  // heavier stop, soft flash (no strobe)
      if (T >= DUR + 0.55) this.sub = new SL.Cutscene('finalEdisar', () => this.finish());
    }
  }
  draw(g) {
    if (this.sub) return this.sub.draw(g);
    const T = this.step === 'fly' ? this.T : this.T2;
    g.save(); if (this.shakeAmt > 0.1) g.translate((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt);
    SL.drawSpaceBg(g); this.stars.draw(g, T, 1.2);
    const ship = (sp, x, y, rgb) => { SL.glow(g, x, y + 22, 12, 22, rgb, 0.4); const sz = sp.size; g.drawImage(sp.c, x - sz / 2, y - sz / 2, sz, sz); };
    if (this.step === 'fly') {
      const ox = 440 + Math.sin(T * 0.9) * 24, oy = 430 + Math.sin(T * 1.7) * 8;
      if (this.av.alive) { this.av.x = 590 + Math.sin(T * 0.9 + 0.8) * 24; this.av.y = 412 + Math.sin(T * 1.5 + 1) * 8; ship(this.avShip, this.av.x, this.av.y, '255,60,210'); }
      ship(this.oak, ox, oy, '255,60,210');
      if (this.bolt >= 0 && this.bolt < 0.6) drawBolt(g, this.av.x + 30, -10, this.av.x, this.av.y, 1 - this.bolt / 0.6, 1.4);
    } else {
      const glowA = 0.10 + 0.10 * Math.min(1, T / 6.2);
      SL.glow(g, 512, Math.max(0, this.flagY - 40), 700, 260, '80,200,255', glowA);
      SL.glow(g, 512, 0, 700, 240, '255,40,60', 0.06 + 0.07 * Math.min(1, T / 6.2) * (0.6 + 0.4 * Math.sin(T * 3)));
      drawFlagship(g, 512, this.flagY, T);
      ship(this.oak, 512, 450, '255,60,210');
    }
    this.fx.draw(g);
    g.restore();
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, this.flash)})`; g.fillRect(0, 0, W, H); }
    // cinema bars
    g.fillStyle = '#000'; g.fillRect(0, 0, W, 52); g.fillRect(0, H - 52, W, 52);
    if (this.step === 'fly') {
      if (T < 5) SL.neonText(g, 'LEVEL 30 · FINAL SECTOR', 512, 26, 20, '255,80,220', { blur: 12, alpha: Math.min(1, T, 5 - T) });
      if (T < 6.5) SL.neonText(g, 'Music: "Last One Standing" by Centurion_of_war — CC0', 512, H - 26, 10, '220,200,230', { blur: 2, alpha: 0.7 });
      if (T >= 1.6 && T < 1.6 + 4) SL.dialogPopup(g, this.popGame, 'avrill', { side: 'left', t: T - 1.6, dur: 4, name: 'AVRILL', rgb: '255,80,220',
        lines: ['Last sector, Oakens.', "Let's go home."], typed: Math.floor((T - 1.8) * 40), por: SL.Features.portrait(), textRgb: '255,235,255' });
    } else SL.neonText(g, 'COMMANDER EDISAR STARLIGHT', 512, H - 26, 16, '120,220,255', { blur: 10, alpha: Math.min(1, T / 1.5) });
    SL.drawButton(g, this.skipBtn, false, T);
    SL.drawScanlines(g);
  }
}
SL.FinalOpening = FinalOpening;

/* ---------- Story hooks ---------- */
P.startFinal = function () {
  this.final = true; this.assistKind = 'nebula'; this.boss = null; this.bolts = [];
  this.lv.final = true; this.introT = 0; this.spawnHold = 99; this.chat = [];
  SL.Audio.playTrack('finalIntro');
  this.state = 'cutscene';
  this.cut = new FinalOpening(this, () => { this.cut = null; this.state = 'play'; SL.Input.takeDowns(); this.beginFinalFight(); });
};
P.beginFinalFight = function () {
  const S = SL.CONFIG.story, pts = TURRETS.map(t => ({ ox: t.ox, oy: t.oy, hp: FB.turretHp, max: FB.turretHp, flash: 0, r: 15 }));
  this.boss = { final: true, e: 6, x: 512, y: -200, t: 0, phase: 'enter', stage: 1, pts, maxHp: 4 * FB.turretHp + FB.coreHp, atkT: 2.2, pi: 0, spiral: 0, spinA: 0, tauntT: 16, fx: 0, lightT: 2.5, gun: 0 };
  this.bolts = []; this.introT = S.introTime; this.spawnHold = S.introTime; this.lv.t = 0;
  SL.Audio.setMusicVolume(1); SL.Audio.playTrack('finalBoss'); SL.Audio.sfx.alarm();
  SL.Events.emit('finalFight', {});
};
P.bossHp = function () {
  const B = this.boss; if (!B || !B.final) return orig.bossHp.call(this);
  return B.pts.reduce((s, p) => s + Math.max(0, p.hp), 0) + (B.stage === 1 ? FB.coreHp : 0);
};
P.damagePoint = function (p, dmg) {
  orig.damagePoint.call(this, p, dmg);
  const B = this.boss; if (!B || !B.final || B.phase !== 'fight') return;
  if (B.stage === 1 && B.pts.every(q => q.hp <= 0)) {
    B.stage = 2; B.core = { ox: 0, oy: 40, hp: FB.coreHp, max: FB.coreHp, flash: 0, r: 24, core: true }; B.pts.push(B.core);
    this.popup('CORE EXPOSED!', 512, 300, '120,240,255'); this.flash = 0.5; this.flashRgb = '160,230,255'; this.shake(12); SL.Audio.sfx.alarm();
    B.lightT = 1.5; B.atkT = 2; this.say('I am the Fleet!', 'normal', 0.6, 'edisar');
  } else if (B.stage === 2 && B.core && B.core.hp > 0 && B.core.hp <= B.core.max * FB.phase3At) {
    B.stage = 3; this.popup('DESPERATION MODE!', 512, 300, '255,90,90'); this.flash = 0.5; this.flashRgb = '255,120,120'; this.shake(14); SL.Audio.sfx.alarm();
    B.lightT = 1.2; this.say("I'll burn this sector!", 'angry', 0.4, 'edisar');
  }
};
P.bossDefeated = function () {
  const B = this.boss; if (!B || !B.final) return orig.bossDefeated.call(this);
  B.phase = 'dying'; B.dieT = 0; this.ebullets = []; this.bolts = []; this.spawnHold = 99; this.dialogs = []; this.dialog = null;
  this.flash = 0.6; this.flashRgb = '255,255,255'; this.shake(18);
  SL.Events.emit('edisarDefeated', { level: this.level });
};
P.updateBoss = function (dt) {
  const B = this.boss; if (!B.final) return orig.updateBoss.call(this, dt);
  const s = this.ship, st = B.stage - 1; B.t += dt;
  for (const p of B.pts) p.flash = Math.max(0, p.flash - dt);
  this.updateBolts(dt);
  if (B.phase === 'enter') { B.y += (FB.y - B.y) * Math.min(1, dt * 1.6); if (B.t > 2.4) B.phase = 'fight'; return; }
  if (B.phase === 'dying') {
    B.dieT += dt; B.fx -= dt;
    if (B.dieT < 3.4 && B.fx <= 0) {
      B.fx = Math.max(0.05, 0.16 - B.dieT * 0.03);
      const x = B.x + (Math.random() - 0.5) * 460, y = B.y + (Math.random() - 0.5) * 110;
      this.fx.burst(x, y, pick(['255,255,255', '255,205,90', '120,240,255']), 30, 260, 0.8, 2.6); SL.Audio.sfx.explode(0.7); this.shake(7);
    }
    for (const k of [1.2, 2.4]) if (B.dieT >= k && !B['boom' + k]) { B['boom' + k] = true; this.fx.ring(B.x, B.y, '255,255,255', 180, 0.6); this.flash = 0.45; this.flashRgb = '255,230,180'; this.shake(16); SL.Audio.sfx.boom(); }
    if (B.dieT >= 3.4 && !B.gone) {
      B.gone = true; this.flash = 1; this.flashRgb = '255,255,255'; this.shake(26); SL.Audio.sfx.avrillBoom();
      this.fx.burst(B.x, B.y, '255,255,255', 160, 620, 1.8, 3.6); this.fx.burst(B.x, B.y, '255,205,90', 120, 480, 2.0, 3.2); this.fx.burst(B.x, B.y, '120,240,255', 120, 520, 2.0, 3.2);
      this.fx.ring(B.x, B.y, '255,255,255', 320, 0.9); this.fx.ring(B.x, B.y, '120,240,255', 220, 0.7);
    }
    if (B.gone && B.dieT >= 4.6) this.startWarp();
    return;
  }
  // fight
  const w = [0.3, 0.38, 0.5][st], A = [170, 190, 200][st];
  B.x = 512 + Math.sin(B.t * w) * A; B.y = FB.y + Math.sin(B.t * 1.3) * 12;
  if (B.spiral <= 0) B.atkT -= dt;   // v0.5.5: spiral finishes before the next volley clock starts
  if (B.atkT <= 0 && B.spiral <= 0) { this.finalAttack(); B.atkT = FB.interval[st]; }
  if (B.spiral > 0) { B.spiral -= dt; B.fx -= dt; if (B.fx <= 0) { B.fx = 0.09; B.spinA += 0.37; const sp = FB.bullet[2] * 0.8; for (let k = 0; k < 3; k++) this.fireE(B.x, B.y + 40, B.spinA + k * Math.PI * 2 / 3, sp); } }
  if (B.stage >= 2) { B.lightT -= dt; if (B.lightT <= 0) { B.lightT = FB.lightningEvery[st]; this.callLightning(); } }
  B.tauntT -= dt; if (B.tauntT <= 0 && !this.dialog && !this.dialogs.length) { this.say(pick(EDISAR_TAUNTS), 'normal', 0, 'edisar'); B.tauntT = 18 + Math.random() * 8; }
  if (s.alive && s.invuln <= 0 && inFlagship(s.x - B.x, s.y - B.y, false)) this.playerHit(null);
};
P.hitExtra = function (b) {
  const B = this.boss; if (!B || !B.final) return orig.hitExtra.call(this, b);
  if (B.phase === 'dying' || B.gone || B.y < -80) return false;
  for (const p of B.pts) {
    if (p.hp <= 0) continue;
    const dx = b.x - (B.x + p.ox), dy = b.y - (B.y + p.oy);
    if (dx * dx + dy * dy < (p.r + 8) * (p.r + 8)) { b.dead = true; this.countHit(b); this.damagePoint(p, 1); return true; }
  }
  if (inFlagship(b.x - B.x, b.y - B.y, true)) { b.dead = true; this.fx.burst(b.x, b.y, '255,255,255', 3, 80, 0.2, 1.4); return true; }
  return false;
};
P.finalAttack = function () {
  const B = this.boss, s = this.ship, st = B.stage - 1, sp = FB.bullet[st];
  const hard = B.pts.filter(p => !p.core);                          // fire points across the wing (even after a turret dies, later phases still use the hardpoint)
  const live = hard.filter(p => p.hp > 0);
  const at = (p, a, v) => this.fireE(B.x + p.ox, B.y + p.oy, a, v);
  const aimed = (p, n) => { const x = B.x + p.ox, y = B.y + p.oy, a = Math.atan2(s.y - y, s.x - x); for (let i = 0; i < n; i++) at(p, a + (i - (n - 1) / 2) * 0.12, sp * 1.05); };
  if (B.stage === 1) {
    if (!live.length) return;
    const f = 0.35 + 0.65 * live.length / 4;                        // destroyed turrets -> fewer bullets
    const n = Math.max(2, Math.round(4 * f));
    const pat = ['single', 'cross', 'single', 'wings'][B.pi++ % 4];
    if (pat === 'single') aimed(live[(B.gun++) % live.length], n);  // rotate through turrets
    else if (pat === 'cross') {                                     // left + right at once = crossfire
      const L = live.filter(p => p.ox < 0), R = live.filter(p => p.ox > 0);
      if (L.length) aimed(L[B.gun % L.length], Math.max(2, n - 1));
      if (R.length) aimed(R[(B.gun + 1) % R.length], Math.max(2, n - 1));
      B.gun++;
    } else {                                                        // both wing tips (or whatever is still live outboard)
      const tips = live.filter(p => Math.abs(p.ox) > 180);
      for (const p of (tips.length ? tips : live)) {
        const k = Math.max(2, Math.round(4 * f));
        const bias = p.ox < 0 ? -0.28 : 0.28;
        for (let i = 0; i < k; i++) at(p, Math.PI / 2 + bias + (i - (k - 1) / 2) * 0.16, sp);
      }
    }
  } else if (B.stage === 2) {
    const x = B.x, y = B.y + 40, a = Math.atan2(s.y - y, s.x - x), pat = B.pi++ % 4;
    if (pat === 0) { for (let i = 0; i < 5; i++) this.fireE(x, y, a + (i - 2) * 0.14, sp); }
    else if (pat === 1) {                                           // wing-tip crossfire from the hardpoints
      for (const p of hard.filter(p => Math.abs(p.ox) > 180)) aimed(p, 3);
    } else if (pat === 2) { for (let i = 0; i < 12; i++) this.fireE(x, y, i / 12 * Math.PI * 2 + B.t, sp * 0.85); }
    else { for (const p of hard.filter(p => Math.abs(p.ox) < 180)) for (const k of [-0.22, 0, 0.22]) at(p, Math.PI / 2 + k, sp * 0.9); }
  } else {
    const pat = ['spiral', 'ring', 'rain'][B.pi++ % 3];
    if (pat === 'spiral') B.spiral = 1.6;
    else if (pat === 'ring') { for (let i = 0; i < 14; i++) this.fireE(B.x, B.y + 40, i / 14 * Math.PI * 2 + B.t * 0.7, sp * 0.9); }
    else { this.fireE(B.x, B.y + 40, Math.PI / 2, sp); for (const p of hard) at(p, Math.PI / 2 + p.ox * 0.0005, sp); }
  }
  SL.Audio.sfx.ebullet();
};
P.callLightning = function () {
  const B = this.boss, st = B.stage - 1, s = this.ship, warn = FB.warn[st];
  const xs = [Math.max(40, Math.min(W - 40, s.x))];
  if (B.stage === 3) xs.push(Math.max(40, Math.min(W - 40, s.x + (Math.random() < 0.5 ? -1 : 1) * (130 + Math.random() * 60))));
  for (const x of xs) this.bolts.push({ x, t: 0, warn, struck: false, tick: 0 });
};
P.updateBolts = function (dt) {
  if (!this.bolts || !this.bolts.length) return;
  const s = this.ship;
  for (const b of this.bolts) {
    b.t += dt;
    if (b.t < b.warn) { b.tick -= dt; if (b.tick <= 0) { b.tick = 0.25; SL.Audio.sfx.warn(); } }
    else {
      if (!b.struck) { b.struck = true; SL.Audio.sfx.thunderShort(); this.shake(8); this.flash = Math.max(this.flash || 0, 0.25); this.flashRgb = '200,220,255'; }
      if (b.t < b.warn + 0.3 && s.alive && s.invuln <= 0 && Math.abs(s.x - b.x) < FB.boltHalfW) this.playerHit(null);
    }
  }
  this.bolts = this.bolts.filter(b => b.t < b.warn + 0.45);
};
P.drawWorld = function (g) {
  const B = this.boss;
  if (!B || !B.final) return orig.drawWorld.call(this, g);
  if (!B.gone) {
    g.save();
    if (B.phase === 'dying') { g.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6); g.globalAlpha = Math.max(0.3, 1 - B.dieT / 4); }
    drawFlagship(g, B.x, B.y, this.T, { shutters: B.stage === 1 });
    for (const p of B.pts) {
      const x = B.x + p.ox, y = B.y + p.oy;
      if (p.hp > 0) {
        const pulse = 0.6 + 0.4 * Math.sin(this.T * 6 + p.ox), hot = p.flash > 0, rgb = p.core ? '120,240,255' : '255,205,90';
        SL.glow(g, x, y, p.r * 2.2, p.r * 2.2, hot ? '255,255,255' : rgb, 0.35 + 0.25 * pulse);
        g.beginPath(); g.arc(x, y, p.r, 0, Math.PI * 2); g.fillStyle = hot ? '#fff' : p.core ? `rgba(120,${200 + 40 * pulse},255,0.95)` : `rgba(255,${170 + 50 * pulse},60,0.95)`; g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
        if (!p.core) { g.fillStyle = 'rgba(40,30,10,0.9)'; g.fillRect(x - 3, y + 4, 6, 14); }      // turret barrel
        const k = p.hp / p.max; g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x - 16, y + p.r + 5, 32, 3); g.fillStyle = `rgba(${rgb},0.95)`; g.fillRect(x - 16, y + p.r + 5, 32 * k, 3);
      } else if (!p.core) { g.beginPath(); g.arc(x, y, p.r * 0.8, 0, Math.PI * 2); g.fillStyle = 'rgba(30,25,20,0.95)'; g.fill(); if (Math.random() < 0.08) this.fx.burst(x, y, '120,120,130', 1, 30, 0.8, 3); }
    }
    g.restore();
  }
  // lightning: telegraph line, then the strike
  for (const b of this.bolts || []) {
    if (b.t < b.warn) {
      const a = 0.35 + 0.35 * (Math.floor(b.t * 10) % 2);
      g.save(); g.setLineDash([10, 8]); g.lineDashOffset = -b.t * 120; g.strokeStyle = `rgba(255,90,90,${a})`; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x, 0); g.lineTo(b.x, H); g.stroke(); g.restore();
      g.fillStyle = `rgba(255,60,60,${0.06 + 0.06 * (b.t / b.warn)})`; g.fillRect(b.x - FB.boltHalfW, 0, FB.boltHalfW * 2, H);
      SL.neonText(g, '⚡', b.x, 70, 18, '255,220,120', { blur: 10, alpha: a + 0.3 });
    } else drawBolt(g, b.x + (Math.random() - 0.5) * 20, B ? B.y + 30 : 0, b.x, H + 10, 1 - (b.t - b.warn) / 0.45, 1.5);
  }
  const keep = this.boss; this.boss = null; orig.drawWorld.call(this, g); this.boss = keep;   // enemy bullets
};
P.hudCenter = function (g) {
  if (!this.final) return orig.hudCenter.call(this, g);
  SL.neonText(g, `LEVEL ${this.level} · FINAL`, 512, 20, 16, '120,220,255', { blur: 8 });
};
P.drawTop = function (g) {
  if (!this.final || this.state !== 'play') return orig.drawTop.call(this, g);
  const B = this.boss;
  if (B && !B.gone) {
    const k = this.bossHp() / B.maxHp, x = 312, y = 50, w = 400;
    SL.neonText(g, 'COMMANDER EDISAR STARLIGHT', 512, y - 10, 12, '120,220,255', { blur: 6 });
    g.fillStyle = 'rgba(0,10,30,0.8)'; g.fillRect(x - 2, y - 2, w + 4, 12);
    g.save(); const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,205,90,0.95)'); gr.addColorStop(1, 'rgba(120,240,255,0.95)');
    g.fillStyle = gr; g.shadowColor = 'rgba(120,220,255,1)'; g.shadowBlur = 12 * SL.view.scale; g.fillRect(x, y, w * k, 8); g.restore();
    g.strokeStyle = 'rgba(230,240,255,0.8)'; g.lineWidth = 1; g.strokeRect(x - 2, y - 2, w + 4, 12);
    const turrets = 4 * FB.turretHp; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x + w * (1 - turrets / B.maxHp) - 1, y - 4, 2, 16);   // phase marker
    SL.neonText(g, 'PHASE ' + ['I', 'II', 'III'][B.stage - 1], x + w + 12, y + 4, 11, B.stage === 3 ? '255,110,110' : '255,220,140', { align: 'left', blur: 6 });
  }
  if (this.introT > 0) {
    const t = SL.CONFIG.story.introTime - this.introT, a = Math.min(1, t / 0.3, this.introT / 0.4);
    g.fillStyle = `rgba(3,1,12,${0.45 * a})`; g.fillRect(0, 200, W, 150);
    SL.neonText(g, 'FINAL BATTLE', 512, 238, 44, '120,220,255', { blur: 22, alpha: a });
    SL.neonText(g, 'COMMANDER EDISAR STARLIGHT', 512, 292, 20, '255,230,180', { blur: 10, alpha: a });
    SL.neonText(g, 'DESTROY THE TURRETS, THEN THE CORE', 512, 324, 14, '255,220,90', { blur: 6, alpha: a });
  }
  this.drawDialog(g);
  if (B && B.t < 7) SL.neonText(g, 'Music: "Last One Standing" by Centurion_of_war — CC0', 512, 571, 9, '220,200,230', { blur: 2, alpha: 0.7 });
};
P.startClear = function () {
  orig.startClear.call(this);
  if (!this.final || !this.clearData) return;
  const c = this.clearData, rows = c.rows, last = rows[rows.length - 1];
  if (last && /NEBULA/.test(last.label)) rows.pop();
  rows.push({ label: 'COMMANDER EDISAR DEFEATED', disp: '★', bonus: FB.bonus, shown: 0 });
  c.title = 'COMMANDER EDISAR DEFEATED!'; c.final = true;
  this.clearBtns = [{ id: 'continue', label: 'END CREDITS', x: 512, y: 520, w: 280, h: 40, rgb: '120,220,255' }]; c.sel = 0;
  if (!this.debug) SL.Progress.complete();
  SL.Events.emit('storyComplete', { score: Math.floor(this.score) });
};
P.toCredits = function () {
  SL.Audio.sfx.blip(880);
  SL.start('credits', { session: this.debug ? null : this.sessionNow(), debug: this.debug });
};
})();
