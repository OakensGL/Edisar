/* v0.5.0 FINAL LEVEL (Story level 30): in-engine opening (Oakens + Avrill, lightning strike), dialogue scenes,
   Commander Edisar Starlight's flagship (3 phases), Dr. Nebula as the assist, then recount -> END CREDITS.
   Hooks into SL.Story through startFinal() (called by startLevel) and by wrapping a few prototype methods. */
(() => {
const P = SL.Story.prototype, orig = {};
['updateBoss', 'bossDefeated', 'damagePoint', 'bossHp', 'drawWorld', 'drawTop', 'hudCenter', 'startClear'].forEach(k => orig[k] = P[k]);
const pick = l => l[(Math.random() * l.length) | 0];
const W = SL.W, H = SL.H;
const EDISAR_TAUNTS = [
  "You're nothing without my orders.",
  'I made you, Oakens. I can unmake you.',
  'Avrill asked too many questions. Learn from her.',
  'The belt falls. With or without you.',
  'You fly like a cadet. Pathetic.',
  "Kneel, pilot. That's an order.",
];
SL.EDISAR_TAUNTS = EDISAR_TAUNTS;
const FB = { y: 158, turretHp: 50, coreHp: 180, phase3At: 0.45, bullet: [190, 205, 220], interval: [1.6, 2.0, 1.45],
  lightningEvery: [0, 3.4, 2.4], warn: [0, 1.1, 0.9], boltHalfW: 24, bonus: 25000 };
SL.CONFIG.story.final = FB;

/* ---------- Starlight Fleet flagship sprite (white / gold / cyan, fleet emblem), cached ---------- */
let flag = null;
function flagship() {
  if (flag) return flag;
  const S = 2, FW = 520, FH = 200, c = SL.mkCanvas(FW * S, FH * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(FW / 2, FH / 2 - 10); g.lineJoin = 'round';
  const glow = (rgb, w, blur) => { g.strokeStyle = `rgba(${rgb},1)`; g.lineWidth = w; g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = blur * S; g.stroke(); g.shadowBlur = 0; };
  // engines (top)
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 92, -58, 16, 10, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(140,240,255,0.9)'; g.shadowColor = 'rgba(80,220,255,1)'; g.shadowBlur = 18 * S; g.fill(); g.shadowBlur = 0; }
  // main chevron wing (visor-shaped)
  const wing = () => { g.beginPath(); g.moveTo(-250, -34); g.lineTo(0, 34); g.lineTo(250, -34); g.lineTo(236, -4); g.lineTo(0, 74); g.lineTo(-236, -4); g.closePath(); };
  const gr = g.createLinearGradient(0, -40, 0, 74); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#d6dbe8'); gr.addColorStop(1, '#7d86a3');
  wing(); g.fillStyle = gr; g.fill(); glow('90,220,255', 2.5, 14);
  // gold trim + cyan light strips along the wing
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(sx * 236, -4); g.lineTo(0, 74); g.strokeStyle = 'rgba(255,205,90,1)'; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.moveTo(sx * 225, -22); g.lineTo(sx * 30, 36); g.strokeStyle = 'rgba(120,240,255,0.95)'; g.lineWidth = 2; g.shadowColor = 'rgba(80,220,255,1)'; g.shadowBlur = 10 * S; g.stroke(); g.shadowBlur = 0;
  }
  // panel lines
  g.strokeStyle = 'rgba(40,50,80,0.35)'; g.lineWidth = 1;
  for (let i = 1; i < 7; i++) for (const sx of [-1, 1]) { const x = sx * i * 32; g.beginPath(); g.moveTo(x, -30 + i * 9 * 0 + Math.abs(x) * -0.0); g.lineTo(x, 34 - Math.abs(x) * 0.27 + 0); g.stroke(); }
  // central tower
  const tg = g.createLinearGradient(0, -70, 0, 40); tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, '#9aa3bd');
  SL.roundRect(g, -62, -72, 124, 104, 18); g.fillStyle = tg; g.fill(); glow('255,205,90', 2.5, 8);
  g.fillStyle = 'rgba(255,205,90,1)'; g.fillRect(-62, -8, 124, 6);
  // bridge windows (cyan visor)
  g.beginPath(); g.moveTo(-48, -60); g.lineTo(0, -44); g.lineTo(48, -60); g.lineTo(44, -52); g.lineTo(0, -36); g.lineTo(-44, -52); g.closePath();
  g.fillStyle = 'rgba(120,240,255,0.95)'; g.shadowColor = 'rgba(80,220,255,1)'; g.shadowBlur = 12 * S; g.fill(); g.shadowBlur = 0;
  // fleet emblem: gold star in a navy disc
  g.beginPath(); g.arc(0, -20, 15, 0, Math.PI * 2); g.fillStyle = '#16245a'; g.fill(); g.strokeStyle = 'rgba(255,205,90,1)'; g.lineWidth = 2; g.stroke();
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.5 : 11; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -20 + Math.sin(a) * r); } g.closePath(); g.fillStyle = '#ffd25a'; g.fill();
  // core housing ring
  g.beginPath(); g.arc(0, 40, 30, 0, Math.PI * 2); g.fillStyle = '#2a3150'; g.fill(); g.strokeStyle = 'rgba(255,205,90,1)'; g.lineWidth = 3; g.stroke();
  flag = { c, W: FW, H: FH };
  return flag;
}
SL.edisarFlagship = flagship;
function drawFlagship(g, x, y, T, opts = {}) {
  const f = flagship();
  SL.glow(g, x, y, 300, 110, '80,200,255', 0.12);
  SL.glow(g, x, y + 40, 80, 60, '120,240,255', 0.15 + 0.08 * Math.sin(T * 3));
  g.drawImage(f.c, x - f.W / 2, y - f.H / 2 + 10, f.W, f.H);
  if (opts.shutters !== false) {          // closed core shutters (phase 1)
    g.save(); g.beginPath(); g.arc(x, y + 40, 26, 0, Math.PI * 2); g.fillStyle = '#c9a24a'; g.fill();
    g.strokeStyle = 'rgba(80,60,20,0.8)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; g.beginPath(); g.moveTo(x, y + 40); g.lineTo(x + Math.cos(a) * 26, y + 40 + Math.sin(a) * 26); g.stroke(); }
    g.restore();
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
  finish() { if (this.over) return; this.over = true; SL.Audio.setMusicVolume(1); this.onDone(); }
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
        this.bolt = 0; this.flash = 1; this.shakeAmt = 20; SL.Audio.sfx.thunder(); SL.Audio.sfx.zap(); SL.Audio.setMusicVolume(0.04); this.slow = 0.3;
      }
      if (this.bolt >= 0) this.bolt += dt;
      if (T >= 7.4 && this.once('boom')) {
        const { x, y } = this.av; this.av.alive = false; SL.Audio.sfx.boom();
        this.fx.burst(x, y, '255,80,220', 140, 420, 2.2, 3.4); this.fx.burst(x, y, '255,255,255', 60, 260, 1.4, 2.4); this.fx.burst(x, y, '40,10,40', 50, 200, 2.6, 4);
        this.fx.ring(x, y, '255,120,230', 140, 0.9); this.fx.ring(x, y, '255,255,255', 70, 0.5);
      }
      if (T >= 9.6) this.slow = Math.min(1, this.slow + dt * 0.8);
      if (T >= 9.4) SL.Audio.setMusicVolume(Math.min(1, 0.04 + (T - 9.4) / 1.4));
      if (T >= 10.8) { this.sub = new SL.Cutscene('finalNebula', () => { const sk = this.sub.skipped; this.sub = null; if (sk) return this.finish(); this.step = 'edisar'; SL.Input.takeDowns(); }); }
    } else {
      const T = (this.T2 += dt);
      if (this.once('alarm')) SL.Audio.sfx.alarm();
      const k = Math.min(1, T / 4.2), e = 1 - Math.pow(1 - k, 3); this.flagY = -260 + (FB.y + 260) * e;
      if (k < 1) this.shakeAmt = Math.max(this.shakeAmt, 3);
      if (T >= 4.8) this.sub = new SL.Cutscene('finalEdisar', () => this.finish());
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
      SL.glow(g, 512, 0, 600, 200, '255,40,60', 0.08 + 0.06 * Math.sin(T * 4));
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
  const S = SL.CONFIG.story, pts = [-200, -105, 105, 200].map(ox => ({ ox, oy: Math.abs(ox) > 150 ? -8 : 22, hp: FB.turretHp, max: FB.turretHp, flash: 0, r: 15 }));
  this.boss = { final: true, e: 6, x: 512, y: -200, t: 0, phase: 'enter', stage: 1, pts, maxHp: 4 * FB.turretHp + FB.coreHp, atkT: 2.2, pi: 0, spiral: 0, spinA: 0, tauntT: 9, fx: 0, lightT: 2.5 };
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
    B.lightT = 1.5; B.atkT = 2; this.say("You think that hurts me? I am the Fleet.", 'normal', 0.6, 'edisar');
  } else if (B.stage === 2 && B.core && B.core.hp > 0 && B.core.hp <= B.core.max * FB.phase3At) {
    B.stage = 3; this.popup('DESPERATION MODE!', 512, 300, '255,90,90'); this.flash = 0.5; this.flashRgb = '255,120,120'; this.shake(14); SL.Audio.sfx.alarm();
    B.lightT = 1.2; this.say('Enough! I will burn this whole sector!', 'angry', 0.4, 'edisar');
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
      B.gone = true; this.flash = 1; this.flashRgb = '255,255,255'; this.shake(26); SL.Audio.sfx.boom(); SL.Audio.sfx.thunder();
      this.fx.burst(B.x, B.y, '255,255,255', 160, 620, 1.8, 3.6); this.fx.burst(B.x, B.y, '255,205,90', 120, 480, 2.0, 3.2); this.fx.burst(B.x, B.y, '120,240,255', 120, 520, 2.0, 3.2);
      this.fx.ring(B.x, B.y, '255,255,255', 320, 0.9); this.fx.ring(B.x, B.y, '120,240,255', 220, 0.7);
    }
    if (B.gone && B.dieT >= 4.6) this.startWarp();
    return;
  }
  // fight
  const w = [0.3, 0.38, 0.5][st], A = [170, 190, 200][st];
  B.x = 512 + Math.sin(B.t * w) * A; B.y = FB.y + Math.sin(B.t * 1.3) * 12;
  B.atkT -= dt;
  if (B.atkT <= 0) { this.finalAttack(); B.atkT = FB.interval[st]; }
  if (B.spiral > 0) { B.spiral -= dt; B.fx -= dt; if (B.fx <= 0) { B.fx = 0.09; B.spinA += 0.37; const sp = FB.bullet[2] * 0.8; for (let k = 0; k < 3; k++) this.fireE(B.x, B.y + 40, B.spinA + k * Math.PI * 2 / 3, sp); } }
  if (B.stage >= 2) { B.lightT -= dt; if (B.lightT <= 0) { B.lightT = FB.lightningEvery[st]; this.callLightning(); } }
  B.tauntT -= dt; if (B.tauntT <= 0 && !this.dialog && !this.dialogs.length) { this.say(pick(EDISAR_TAUNTS), 'normal', 0, 'edisar'); B.tauntT = 13 + Math.random() * 6; }
  const H2 = SL.CONFIG.story.boss, ex = (s.x - B.x) / (H2.halfW + 30), ey = (s.y - B.y - 6) / H2.halfH;
  if (s.alive && s.invuln <= 0 && ex * ex + ey * ey < 1) this.playerHit(null);
};
P.finalAttack = function () {
  const B = this.boss, s = this.ship, st = B.stage - 1, sp = FB.bullet[st];
  if (B.stage === 1) {
    const live = B.pts.filter(p => p.hp > 0); if (!live.length) return;
    const f = 0.35 + 0.65 * live.length / 4;                      // destroyed turrets -> fewer bullets
    const pat = ['aimed', 'fan', 'aimed', 'sweep'][B.pi++ % 4];
    if (pat === 'aimed') for (const p of live) { const x = B.x + p.ox, y = B.y + p.oy, a = Math.atan2(s.y - y, s.x - x); this.fireE(x, y, a, sp * 1.05); if (f > 0.8) this.fireE(x, y, a + 0.12, sp); }
    else if (pat === 'fan') { const n = Math.max(3, Math.round(11 * f)); for (let i = 0; i < n; i++) this.fireE(B.x, B.y + 40, Math.PI / 2 + (i / (n - 1) - 0.5) * 1.6, sp); }
    else for (const p of live) for (const k of [-0.25, 0, 0.25]) this.fireE(B.x + p.ox, B.y + p.oy, Math.PI / 2 + k + (p.ox < 0 ? 0.15 : -0.15), sp * 0.9);
  } else if (B.stage === 2) {
    const x = B.x, y = B.y + 40, a = Math.atan2(s.y - y, s.x - x);
    if (B.pi++ % 2) { for (let i = 0; i < 5; i++) this.fireE(x, y, a + (i - 2) * 0.14, sp); }
    else { for (let i = 0; i < 12; i++) this.fireE(x, y, i / 12 * Math.PI * 2 + B.t, sp * 0.85); }
  } else {
    const pat = ['spiral', 'ring', 'rain'][B.pi++ % 3];
    if (pat === 'spiral') B.spiral = 1.6;
    else if (pat === 'ring') { for (let i = 0; i < 16; i++) this.fireE(B.x, B.y + 40, i / 16 * Math.PI * 2 + B.t * 0.7, sp * 0.9); }
    else { for (let i = -3; i <= 3; i++) this.fireE(B.x + i * 60, B.y + 30 - Math.abs(i) * 8, Math.PI / 2 + i * 0.04, sp); }
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
      if (!b.struck) { b.struck = true; SL.Audio.sfx.zap(); this.shake(8); this.flash = Math.max(this.flash || 0, 0.25); this.flashRgb = '200,220,255'; }
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
    const k = this.bossHp() / B.maxHp, x = 312, y = 96, w = 400;
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
