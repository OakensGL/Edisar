/* Story Mode (v0.4 part 1; radio chatter v0.4.5; current build v0.5.5, final level in final.js): numbered levels, level-clear recount, Dr. Nebula boss every 5 levels.
   Built on top of Survival via its hook methods: onKill, onUpdate, hitExtra, onBlast, onScreenClear,
   drawWorld, drawTop, hudCenter, scoreEntry. */
(() => {
const NEBULA = {
  name: 'Dr. Nebula',
  taunts: [   // kept for escape flavour / fallback; mid-fight uses jabs (v0.5.5)
    "Keep shooting, fool. You have no idea what you're breaking.",
    'Oh, Oakens. Still following orders like a good little dog?',
    'Destroy them all, puppet. See where that gets you.',
    'Run along, little boy. Edisar must be so proud.',
    "I'd explain it to you, Oakens, but clowns don't listen.",
    "Avrill, you're smarter than him. Why are you still flying with this imbecile?",
    'Two little dogs on one leash. Edisar trained you well.',
    'Ask Avrill what she really thinks about your orders, puppet.',
  ],
  jabs: ['Too slow!', 'Pathetic!', 'Is that all?', 'Stay down, fool!', 'Missed again!'],   // v0.5.5: short mid-fight lines
  onAssistCall: 'Calling for help? Cute.',
  afterAssist: 'Need her again? Pathetic.',
  escape: [
    "This isn't over, Oakens. Not even close.",
    "Enjoy your little victory, puppet. I'll be back with something bigger.",
    'You broke my toy. Next time, I break you.',
  ],
};
SL.NEBULA = NEBULA;

/* ---------- v0.4.5 radio chatter (normal Story levels only) ----------
   Exact lines by tier (levels 1-9 / 11-19 / 21-29). Shuffle-bag per speaker+tier, kept for the whole page
   session, so a line never repeats twice in a row. Speakers alternate across levels and within a level. */
const CHATTER = {
  edisar: [
    ['Good work, Oakens. Every rock you break keeps our world safe.', 'The Fleet is proud of you, pilot.', "Stay sharp. The belt doesn't forgive mistakes.", "Nebula is a traitor. Don't listen to a word he says."],
    ["Faster, Oakens. We're behind schedule.", "Ignore the radiation readings. They're within limits.", 'Destroy them all. No exceptions.', 'Avrill, stop asking questions and fly.'],
    ["I don't pay you to think, pilot.", 'Whatever Nebula told you... forget it.', 'The belt must fall. All of it.', "Don't make me remind you who's in charge."],
  ],
  avrill: [
    ['Nice shot, Oakens! Try to keep up.', "I've got your wing. Always.", 'Race you to the next sector!', "Don't get cocky, flyboy."],
    ['These readings are weird... the belt looks thinner.', "Did Nebula's words bother you too?", 'Something feels off about this mission.', "Stay close, Oakens. I don't like this."],
    ["I keep reading those files... I can't sleep.", 'If anything happens to me, keep flying.', "Edisar's orders don't make sense anymore.", "Whatever happens... I'm glad it was you on my wing."],
  ],
};
SL.Chatter = {
  lines: CHATTER, bags: {}, last: {}, nextWho: 'edisar',
  tier(L) { return L >= 1 && L <= 9 ? 0 : L >= 11 && L <= 19 ? 1 : L >= 21 && L <= 29 ? 2 : -1; },
  draw(who, tier) {
    const k = who + tier; let bag = this.bags[k];
    if (!bag || !bag.length) {
      bag = this.bags[k] = CHATTER[who][tier].slice();
      for (let i = bag.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag.length > 1 && bag[bag.length - 1] === this.last[k]) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];   // no repeat across refills
    }
    return (this.last[k] = bag.pop());
  },
  plan(L, dur) {        // [] for boss levels, the final level, or levels without a tier
    const tier = this.tier(L);
    if (tier < 0 || L % SL.CONFIG.story.boss.every === 0 || L >= SL.FINAL_LEVEL) return [];
    const a = this.nextWho, b = a === 'edisar' ? 'avrill' : 'edisar'; this.nextWho = b;
    return [{ at: dur * (0.2 + Math.random() * 0.15), who: a, tier }, { at: dur * (0.6 + Math.random() * 0.15), who: b, tier }];
  },
};
const SPK = {
  edisar: { name: 'CMDR. EDISAR', rgb: '90,160,255', side: 'right' },
  avrill: { name: 'AVRILL', rgb: '255,80,220', side: 'left' },
};
let edisarPor = null; const edisarImg = new Image(); edisarImg.src = 'assets/edisar.jpg';
function edisarPortrait() {
  if (edisarPor) return edisarPor; if (!edisarImg.complete || !edisarImg.naturalWidth) return null;
  const N = 128, c = SL.mkCanvas(N, N), x = c.getContext('2d');
  x.save(); SL.roundRect(x, 2, 2, N - 4, N - 4, 10); x.clip(); x.drawImage(edisarImg, 0, 0, N, N);
  x.fillStyle = 'rgba(0,0,0,0.16)'; for (let i = 0; i < N; i += 4) x.fillRect(0, i, N, 1.5); x.restore();
  x.strokeStyle = 'rgba(90,160,255,1)'; x.lineWidth = 4; x.shadowColor = 'rgba(90,160,255,1)'; x.shadowBlur = 10; SL.roundRect(x, 3, 3, N - 6, N - 6, 10); x.stroke();
  return (edisarPor = c);
}
const pick = l => l[(Math.random() * l.length) | 0];
const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const SC = () => SL.CONFIG.story;
const bossSpeed = (H, e) => (H.tierSpeed && H.tierSpeed[e]) || H.bulletBase + H.bulletPerEncounter * (e - 1);   // v0.5.4
const bossInterval = (H, e) => ((H.tierInterval && H.tierInterval[e]) || Math.max(H.attackMin, H.attackBase - H.attackPerEncounter * (e - 1))) * (H.intervalScale || 1);   // v0.5.5
const bulletK = (H, e) => (H.bulletScale && H.bulletScale[Math.min(H.bulletScale.length, Math.max(1, e)) - 1]) || 1;   // v0.5.3 per-tier bullet count scale

/* ---------- portraits (lazy, framed) ---------- */
const imgs = {};
['normal', 'angry'].forEach(k => { const i = new Image(); i.src = k === 'normal' ? 'assets/nebula.jpg' : 'assets/nebula-angry.jpg'; imgs[k] = i; });
const framed = {};
function portrait(mood) {
  if (framed[mood]) return framed[mood];
  const im = imgs[mood]; if (!im.complete || !im.naturalWidth) return null;
  const N = 192, c = SL.mkCanvas(N, N), x = c.getContext('2d');
  x.save(); SL.roundRect(x, 2, 2, N - 4, N - 4, 12); x.clip(); x.drawImage(im, 0, 0, N, N);
  x.fillStyle = 'rgba(0,0,0,0.16)'; for (let i = 0; i < N; i += 4) x.fillRect(0, i, N, 1.5); x.restore();
  x.strokeStyle = mood === 'angry' ? 'rgba(255,60,40,1)' : 'rgba(255,70,70,1)'; x.lineWidth = 4; x.shadowColor = 'rgba(255,40,40,1)'; x.shadowBlur = 14;
  SL.roundRect(x, 3, 3, N - 6, N - 6, 12); x.stroke();
  return (framed[mood] = c);
}
const wrap = (text, max = 30) => { const out = []; let line = ''; for (const w of text.split(' ')) { if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; };

/* ---------- mothership sprite (red & white prototype), cached ---------- */
let hullSprite = null;
function hull() {
  if (hullSprite) return hullSprite;
  const S = 2, W = 440, H = 170, c = SL.mkCanvas(W * S, H * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(W / 2, H / 2 - 8); g.lineJoin = 'round';
  const glowStroke = (rgb, w, blur) => { g.strokeStyle = `rgba(${rgb},1)`; g.lineWidth = w; g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = blur * S; g.stroke(); g.shadowBlur = 0; };
  // wings
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(sx * 120, -6); g.lineTo(sx * 212, 18); g.lineTo(sx * 200, 34); g.lineTo(sx * 110, 26); g.closePath();
    g.fillStyle = '#7a0f18'; g.fill(); glowStroke('255,60,60', 2, 10);
    g.beginPath(); g.moveTo(sx * 150, 8); g.lineTo(sx * 196, 22); g.strokeStyle = 'rgba(255,230,230,0.7)'; g.lineWidth = 1.5; g.stroke();
  }
  // main saucer (white)
  const gr = g.createLinearGradient(0, -40, 0, 50); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#c9cbd8'); gr.addColorStop(1, '#6b6f86');
  g.beginPath(); g.ellipse(0, 8, 160, 42, 0, 0, Math.PI * 2); g.fillStyle = gr; g.fill(); glowStroke('255,80,80', 2.5, 14);
  // red stripe band
  g.save(); g.beginPath(); g.ellipse(0, 8, 160, 42, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#d4142a'; g.fillRect(-170, 2, 340, 13); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(-170, 17, 340, 3);
  g.fillStyle = '#a00c1e'; g.fillRect(-170, 32, 340, 30); g.restore();
  // panel lines
  g.strokeStyle = 'rgba(60,10,20,0.45)'; g.lineWidth = 1;
  for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * 34, -18); g.lineTo(i * 40, 2); g.stroke(); }
  // dome
  const dg = g.createRadialGradient(-12, -40, 4, 0, -26, 64); dg.addColorStop(0, 'rgba(255,200,200,0.95)'); dg.addColorStop(0.5, 'rgba(230,40,60,0.85)'); dg.addColorStop(1, 'rgba(90,0,20,0.9)');
  g.beginPath(); g.ellipse(0, -20, 62, 36, 0, Math.PI, 0); g.closePath(); g.fillStyle = dg; g.fill(); glowStroke('255,90,90', 2, 12);
  // "N" emblem
  g.font = `bold 26px ${SL.CONFIG.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(255,60,60,1)'; g.shadowBlur = 10 * S; g.fillText('N', 0, -30); g.shadowBlur = 0;
  // bottom lights
  for (let i = -3; i <= 3; i++) { g.fillStyle = 'rgba(255,240,240,0.9)'; g.fillRect(i * 30 - 2, 44, 4, 3); }
  hullSprite = { c, W, H };
  return hullSprite;
}
SL.nebulaHull = () => hull(); SL.nebulaPortrait = m => portrait(m || 'normal');   // v0.5.0: Nebula assist in the final level

SL.Story = class extends SL.Survival {
  constructor(startLevel = 1, debug = false, session = null, opts = {}) {
    super();
    this.mode = 'story'; this.timeScore = false; this.debug = debug;
    // v0.4.1 session: points / kills / time carry across missions launched from the map until game over
    this.session0 = session || { score: 0, kills: 0, time: 0 };
    this.score = this.session0.score; this.stats.kills = this.session0.kills; this.t = this.session0.time;
    this.overBtns = [
      { id: 'map',   label: 'MAP',   x: 412, y: 532, w: 190, h: 40, rgb: '255,80,220' },
      { id: 'retry', label: 'RETRY', x: 632, y: 532, w: 190, h: 40, rgb: '70,160,255' },
    ];
    this.pauseBtns[2] = { id: 'map', label: 'MAP', x: 512, y: 360, w: 220, h: 46, rgb: '70,160,255' };
    this.clearBtns = [
      { id: 'continue', label: 'CONTINUE', x: 412, y: 520, w: 220, h: 40, rgb: '255,80,220' },
      { id: 'map',      label: 'MAP',        x: 632, y: 520, w: 190, h: 40, rgb: '70,160,255' },
    ];
    this.best = (SL.Scores.list('story')[0] || { score: 0 }).score;
    this.ebullets = []; this.dialogs = []; this.dialog = null; this.boss = null; this.clearData = null;
    if (SL.Story._off) SL.Story._off();
    SL.Story._off = SL.Events.on('assist', g => {
      if (g !== this) return;
      if (this.dialog && this.dialog.who !== 'nebula') this.dialog = null;     // radio chatter yields to the assist popup
      if (!this.boss || this.boss.phase !== 'fight' || this.final) return;   // final level: Nebula IS the assist
      this.say(NEBULA.onAssistCall, 'normal', 3.6); this.afterAssistT = 8.2;
    });
    // v0.4.2: scene 1 plays every time level 1 is started (map or ?level=1); retry skips it. SKIP always available.
    if (startLevel === 1 && opts.intro !== false && SL.Cutscene.has('intro')) {
      this.level = 1; this.lv = { boss: false, goal: 0, dur: 0, kills: 0, t: 0 };
      SL.Audio.playTrack('main');
      this.playCut('intro', () => this.startLevel(1));
    } else this.startLevel(startLevel);
  }
  playCut(id, then) {
    this.state = 'cutscene'; this.dialog = null; this.dialogs = [];
    this.cut = new SL.Cutscene(id, () => { this.cut = null; this.state = 'play'; SL.Input.takeDowns(); then(); });
  }

  /* ---------- levels ---------- */
  startLevel(L, opts = {}) {
    // v0.5.8: pre-mission brief (levels 3/7/12/17/22/27). Same every-start, skippable behaviour as pre-fight.
    // Radio chatter is only scheduled after the brief ends, so it never overlaps the portrait scene.
    const brief = 'brief' + L;
    if (opts.brief !== false && SL.Cutscene.has(brief)) {
      this.level = L; this.dialogs = []; this.dialog = null;
      SL.Audio.playTrack('main');
      this.playCut(brief, () => this.startLevel(L, { brief: false }));
      return;
    }
    const S = SC(), boss = L % S.boss.every === 0;
    this.level = L; this.state = 'play';
    this.lv = { boss, goal: boss ? 0 : S.goalBase + S.goalPerLevel * (L - 1), dur: boss ? 0 : SL.Story.levelDuration(L), kills: 0, t: 0, shots0: this.stats.shots, hits0: this.stats.bulletHits || 0,
      score0: this.score, maxMult: this.mult, done: false, doneT: 0 };
    this.asteroids.length = 0; this.bullets.length = 0; this.ebullets = []; this.pickups.length = 0; this.bombShots.length = 0; this.blasts.length = 0;
    this.weapon = null; SL.Features.clearBuffs(this); this.dialogs = []; this.dialog = null; this.clearData = null; this.escort = null;
    this.introT = S.introTime; this.spawnHold = S.introTime; this.spawnT = 0.3;
    this.goldBonus = S.goldPerLevel * L; this.redBonus = S.redPerLevel * (L - 1); this.redAfter = L >= S.redFromLevel ? -1 : 1e9;
    const sh = this.ship; Object.assign(sh, { x: SL.W / 2, y: this.C.ship.startY, vx: 0, vy: 0, alive: true });
    sh.invuln = Math.max(sh.invuln, 1.5);
    this.lives = this.C.ship.startLives;                     // every mission starts with full lives
    this.warpK = 0; this.warpT = 0; this._pops = {};
    this.chat = boss ? [] : SL.Chatter.plan(L, this.lv.dur);   // v0.4.5 radio chatter schedule
    this.theme = SL.Features.story.worldTheme(L);            // hook: palette change every 10 levels (not used yet)
    SL.Features.story.onLevelStart(this, L);
    this.boss = null;
    if (boss && L === SL.FINAL_LEVEL && this.startFinal) this.startFinal();   // v0.5.0 final level (final.js)
    else if (boss) { this.spawnBoss(L / S.boss.every); SL.Audio.playTrack('boss'); SL.Audio.sfx.alarm(); }
    else SL.Audio.playTrack('main');
    SL.Events.emit('levelStart', { level: L, boss });
  }
  get spawnInterval() {
    const S = SC(); if (this.lv && this.lv.boss) return S.boss.asteroidInterval;
    return Math.max(S.spawnMin, S.spawnBase - S.spawnPerLevel * (this.level - 1) - S.spawnInLevel * (this.lv ? this.lv.t : 0));
  }
  get fallSpeed() { const S = SC(); return Math.min(S.speedMax, S.speedBase + S.speedPerLevel * (this.level - 1) + S.speedInLevel * (this.lv ? this.lv.t : 0)); }
  /* Top 10 rule (v0.4.1): a run is submitted at game over (or when leaving the map with points).
     Ranked by SCORE = points earned in this session (carried across missions until game over / BACK).
     LEVEL (informational) = furthest level unlocked on this device (debug runs: the level played, never ranked). */
  scoreEntry() { return { score: Math.floor(this.score), level: this.debug ? this.level : Math.max(SL.Progress.unlocked, this.level), time: this.t, kills: this.stats.kills }; }
  sessionNow() { return { score: Math.floor(this.score), kills: this.stats.kills, time: this.t }; }

  onKill() { this.lv.kills++; }
  checkGoal() {
    const lv = this.lv;
    if (!lv.boss && !lv.done && lv.kills >= lv.goal) {   // v0.5.7: kill goal ends the mission immediately
      lv.done = true; lv.doneT = 1.2; lv.left = Math.max(0, lv.dur - lv.t); this.spawnHold = 99;
      this.ship.invuln = Math.max(this.ship.invuln, 2);
      this.popup('SECTOR CLEAR — WARP!', 512, 260, '255,220,90'); SL.Audio.sfx.ready();
    }
  }

  /* ---------- boss ---------- */
  spawnBoss(e) {
    const B = SC().boss, n = Math.min(B.weakMax, B.weakBase + e), hp = B.hpBase + B.hpPerEncounter * (e - 1);
    const pts = [];
    for (let i = 0; i < n; i++) { const k = n === 1 ? 0 : i / (n - 1) * 2 - 1; pts.push({ ox: k * 132, oy: 34 - Math.abs(k) * 10, hp, max: hp, flash: 0, r: 15 }); }
    this.boss = { e, x: 512, y: -170, t: 0, phase: 'enter', pts, maxHp: n * hp, atkT: 2.6, pi: 0, spiral: 0, spinA: 0, tauntT: 18, escT: 0, vy: 0, fx: 0 };
  }
  bossHp() { return this.boss ? this.boss.pts.reduce((s, p) => s + Math.max(0, p.hp), 0) : 0; }
  damagePoint(p, dmg) {
    const B = this.boss; if (!B || p.hp <= 0 || B.phase === 'escape') return;
    p.hp -= dmg; p.flash = 0.12;
    const x = B.x + p.ox, y = B.y + p.oy;
    if (p.hp <= 0) {
      p.hp = 0; const pts = SC().bonus.weakPointPerEncounter * B.e * this.mult; this.score += pts;
      this.popup(`WEAK POINT +${pts}`, x, y + 24, '255,220,90');
      this.fx.burst(x, y, '255,90,60', 50, 300, 0.9, 2.6); this.fx.ring(x, y, '255,255,255', 60, 0.4); this.shake(10); SL.Audio.sfx.explode(1.2);
      if (this.bossHp() <= 0) this.bossDefeated();
    } else { this.fx.burst(x, y, '255,200,120', 4, 100, 0.25, 1.6); SL.Audio.sfx.bossHit(); }
  }
  bossDefeated() {
    const B = this.boss; B.phase = 'escape'; B.escT = 0; this.ebullets = []; this.spawnHold = 99;
    this.dialogs = []; this.dialog = null; this.say(pick(NEBULA.escape), 'angry', 0.4);
    this.flash = Math.max(this.flash || 0, 0.5); this.flashRgb = '255,120,90'; this.shake(16);
    SL.Events.emit('bossEscaped', { encounter: B.e, level: this.level });
  }
  hitExtra(b) {
    const B = this.boss; if (!B || B.phase === 'escape' || B.y < -60) return false;
    for (const p of B.pts) {
      if (p.hp <= 0) continue;
      const dx = b.x - (B.x + p.ox), dy = b.y - (B.y + p.oy);
      if (dx * dx + dy * dy < (p.r + 8) * (p.r + 8)) {
        b.dead = true; this.countHit(b); this.damagePoint(p, 1);
        if (this.ricochet > 0 && !b.bounced && !b.pierce && SL.Features.retarget(this, b, p)) { b.dead = false; this.fx.burst(b.x, b.y, '255,180,80', 6, 120, 0.25, 2); }
        return true;
      }
    }
    const H = SC().boss, ex = (b.x - B.x) / H.halfW, ey = (b.y - B.y - 6) / (H.shotHalfH || H.halfH);
    if (ex * ex + ey * ey < 1) {
      if (this.ricochet > 0 && !b.bounced && !b.pierce && SL.Features.retarget(this, b)) { this.fx.burst(b.x, b.y, '255,180,80', 6, 120, 0.25, 2); return true; }
      b.dead = true; this.fx.burst(b.x, b.y, '255,255,255', 3, 80, 0.2, 1.4); return true;
    }
    return false;
  }
  onBlast(bl) {
    const B = this.boss; if (!B || B.phase !== 'fight') return;
    bl.bossHit = bl.bossHit || new Set();
    B.pts.forEach((p, i) => { if (p.hp > 0 && !bl.bossHit.has(i) && Math.hypot(B.x + p.ox - bl.x, B.y + p.oy - bl.y) < bl.r + p.r) { bl.bossHit.add(i); this.damagePoint(p, SC().boss.bombDamage); } });
  }
  onScreenClear() {
    const B = this.boss; if (!B || B.phase !== 'fight') return;
    this.ebullets = [];
    for (const p of B.pts) if (p.hp > 0) this.damagePoint(p, Math.ceil(p.max * SC().boss.assistDamage));
  }
  fireE(x, y, ang, sp) { this.ebullets.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp }); }
  bossAttack() {
    const B = this.boss, H = SC().boss, e = B.e, sp = bossSpeed(H, e);
    const live = B.pts.filter(p => p.hp > 0), s = this.ship, k = bulletK(H, e), f = (0.35 + 0.65 * live.length / B.pts.length) * k;   // v0.5.3: tier scale k
    const pats = e >= 3 ? ['aimed', 'fan', 'spiral', 'rain'] : e === 2 ? ['aimed', 'fan', 'spiral'] : ['aimed', 'fan'];
    const pat = pats[B.pi++ % pats.length];
    if (pat === 'aimed') {
      const p = pick(live), x = B.x + p.ox, y = B.y + p.oy, a = Math.atan2(s.y - y, s.x - x), n = Math.max(1, Math.round((2 + e) * f));
      for (let i = 0; i < n; i++) this.fireE(x, y, a + (i - (n - 1) / 2) * 0.13, sp * 1.1);
    } else if (pat === 'fan') {
      const n = Math.max(3, Math.round((7 + 2 * e) * f)); for (let i = 0; i < n; i++) this.fireE(B.x, B.y + 40, Math.PI / 2 + (i / (n - 1) - 0.5) * 1.5, sp);
    } else if (pat === 'spiral') { B.spiral = (1.2 + 0.3 * e) * f / k; }   // duration unchanged; density scaled via emit interval
    else if (pat === 'rain') { const ks = k < 0.5 ? [0] : k < 0.9 ? [-0.1, 0.1] : [-0.15, 0, 0.15]; for (const p of live) for (const a of ks) this.fireE(B.x + p.ox, B.y + p.oy, Math.PI / 2 + a, sp * 0.95); }
    SL.Audio.sfx.ebullet();
  }
  updateBoss(dt) {
    const B = this.boss, H = SC().boss, s = this.ship; B.t += dt;
    for (const p of B.pts) p.flash = Math.max(0, p.flash - dt);
    if (B.phase === 'enter') {
      B.y += (H.y - B.y) * Math.min(1, dt * 1.5);
      if (B.t > 2.6) {   // v0.5.5: pause for a short pre-fight portrait dialogue, then start attacking
        const id = 'pre' + this.level;
        if (SL.Cutscene.has(id)) { this.playCut(id, () => { B.phase = 'fight'; B.atkT = 1.4; SL.Input.takeDowns(); }); return; }
        else B.phase = 'fight';
      }
    } else if (B.phase === 'fight') {
      B.x = 512 + Math.sin(B.t * (0.35 + 0.06 * (B.e - 1))) * 210; B.y = H.y + Math.sin(B.t * 1.1) * 10;
      const dead = B.pts.filter(p => p.hp <= 0).length;
      B.atkT -= dt;
      if (B.atkT <= 0) { this.bossAttack(); B.atkT = bossInterval(H, B.e) * (1 + H.angerPerPoint * dead); }
      if (B.spiral > 0) { B.spiral -= dt; B.fx -= dt; if (B.fx <= 0) { B.fx = 0.07 / bulletK(H, B.e); B.spinA += 0.42 / bulletK(H, B.e); const sp = bossSpeed(H, B.e) * 0.85; this.fireE(B.x, B.y + 20, B.spinA, sp); this.fireE(B.x, B.y + 20, B.spinA + Math.PI, sp); } }
      B.tauntT -= dt; if (B.tauntT <= 0) { this.say(pick(NEBULA.jabs), 'normal'); B.tauntT = 16 + Math.random() * 10; }   // v0.5.5: rare short jabs
      if (this.afterAssistT > 0) { this.afterAssistT -= dt; if (this.afterAssistT <= 0) this.say(NEBULA.afterAssist, 'normal'); }
      // ramming the hull hurts
      const ex = (s.x - B.x) / H.halfW, ey = (s.y - B.y - 6) / H.halfH;
      if (s.alive && s.invuln <= 0 && ex * ex + ey * ey < 1) this.playerHit(null);
    } else if (B.phase === 'escape') {
      B.escT += dt;
      if (B.escT < 1.8) {
        B.x += Math.sin(B.escT * 60) * 1.5;
        B.fx -= dt; if (B.fx <= 0) { B.fx = 0.12; const x = B.x + (Math.random() - 0.5) * 300, y = B.y + (Math.random() - 0.3) * 60; this.fx.burst(x, y, Math.random() < 0.5 ? '255,90,60' : '255,255,255', 24, 200, 0.7, 2.2); SL.Audio.sfx.explode(0.6); this.shake(6); }
      } else {
        B.vy += 520 * dt; B.y -= B.vy * dt;
        this.fx.burst(B.x + (Math.random() - 0.5) * 120, B.y + 50, '160,160,170', 3, 60, 0.8, 3);
        if (B.y < -240 && !B.gone && (!this.dialog || B.escT > 5.5)) { B.gone = true; this.startWarp(); }
      }
    }
  }

  /* ---------- dialog (Dr. Nebula popup) ---------- */
  say(text, mood = 'normal', delay = 0, who = 'nebula') { this.dialogs.push({ text, mood, delay, who }); }
  updateDialog(dt) {
    const avrillBusy = this.assist.phase === 'active' && this.assist.t < SL.Features.POP_DUR;
    if (!this.dialog && this.dialogs.length) {
      const d = this.dialogs[0]; d.delay -= dt;
      if (d.delay <= 0 && !avrillBusy) { this.dialogs.shift(); this.dialog = { ...d, t: 0, lines: wrap(d.text, 28), dur: 2.0 + d.text.length / 24 }; SL.Events.emit(d.who === 'nebula' ? 'nebulaLine' : 'radioLine', { who: d.who, text: d.text }); }
    }
    if (this.dialog) { this.dialog.t += dt; if (this.dialog.t > this.dialog.dur) this.dialog = null; }
  }
  drawDialog(g) {
    // v0.4.1: compact, semi-transparent, top-right corner just below the boss health bar; fades out on its own
    const d = this.dialog; if (!d) return;
    if (d.who && d.who !== 'nebula') {
      const S = SPK[d.who];
      SL.dialogPopup(g, this, d.who, { side: S.side, t: d.t, dur: d.dur, name: S.name, lines: d.lines, typed: Math.floor((d.t - 0.2) * 40),
        rgb: S.rgb, por: d.who === 'edisar' ? edisarPortrait() : SL.Features.portrait() });
      return;
    }
    SL.dialogPopup(g, this, 'nebula', { side: 'right', t: d.t, dur: d.dur, name: NEBULA.name, lines: d.lines, typed: Math.floor((d.t - 0.2) * 40),
      rgb: d.mood === 'angry' ? '255,60,40' : '255,70,70', por: portrait(d.mood) });
  }

  /* ---------- warp exit (v0.4.1): ship shoots upward, stars stretch, whoosh ---------- */
  startWarp() {
    if (this.state !== 'play') return;
    for (const a of this.asteroids) if (!a.dead) this.destroy(a, false, { noSplit: true, quiet: true });
    this.state = 'warp'; this.warpT = 0; this.ebullets = []; this.pickups.length = 0; this.bullets.length = 0; this.dialog = null; this.dialogs = [];
    this.ship.invuln = 0; this.ship.vy = 0; this.whooshed = false;
    // v0.5.7: Avrill escorts Oakens out on levels 1–29 (she's gone after the level 30 strike)
    const withAv = this.level < SL.FINAL_LEVEL && !this.final;
    if (withAv) {
      const fromAssist = this.assist && this.assist.phase === 'active';
      const side = this.ship.x < 512 ? 1 : -1;
      this.escort = { t: 0, x: fromAssist ? this.assist.x : (side > 0 ? SL.W + 70 : -70), y: fromAssist ? this.assist.y : this.ship.y + 8, side, wave: 0, said: false,
        line: ['Nice flying, Oakens.', 'On your wing.', "Let's head home."][(Math.random() * 3) | 0] };
      if (fromAssist) this.assist.phase = 'idle';
    } else this.escort = null;
    SL.Events.emit('warp', { level: this.level });
  }
  updateWarp(dt) {
    const s = this.ship, escort = !!this.escort, W = escort ? 2.75 : SC().warpTime, t = (this.warpT += dt);
    const I = SL.Input, downs = I.takeDowns();
    SL.Vol.handle(downs); SL.Vol.tick();
    if (SL.Vol.keys(I) || SL.Vol.open) return;
    if (I.hit('KeyM')) SL.Audio.toggleMute();
    // tap / Enter skips the warp (and escort) and goes to the results
    if (t > 0.12 && (I.confirm() || downs.some(d => d.role !== 'ui'))) { this.startClear(); return; }
    const goAt = escort ? 1.15 : 0.45;
    s.x += (SL.W / 2 - s.x) * Math.min(1, dt * 3); s.vx = 0;
    if (this.escort) {
      const E = this.escort; E.t += dt;
      const tx = s.x + E.side * 52, ty = s.y + 4;
      const k = Math.min(1, E.t / 0.55);
      E.x += (tx - E.x) * Math.min(1, dt * (2.2 + 6 * k)); E.y += (ty - E.y) * Math.min(1, dt * (2.2 + 6 * k));
      if (E.t > 0.55 && E.t < 1.15) E.wave = Math.sin((E.t - 0.55) * 22) * 0.32;
      else E.wave = 0;
      if (!E.said && E.t > 0.45) { E.said = true; E.lineT = 0; }
      if (E.said) E.lineT = (E.lineT || 0) + dt;
    }
    if (t < goAt) { s.vy += (60 - s.vy) * Math.min(1, dt * 6); s.y += s.vy * dt; if (this.escort) this.escort.y += s.vy * dt * 0.35; }
    else {
      if (!this.whooshed) { this.whooshed = true; SL.Audio.sfx.whoosh(); this.fx.ring(s.x, s.y, '255,255,255', 80, 0.4); if (this.escort) this.fx.ring(this.escort.x, this.escort.y, '255,80,220', 60, 0.35); }
      s.vy -= 2600 * dt; s.y += s.vy * dt;
      if (this.escort) { this.escort.y += s.vy * dt; this.escort.x += (s.x + this.escort.side * 52 - this.escort.x) * Math.min(1, dt * 8); }
      if (Math.random() < 0.8) this.fx.burst(s.x, s.y + 22, '255,90,220', 3, 120, 0.4, 2);
      if (this.escort && Math.random() < 0.8) this.fx.burst(this.escort.x, this.escort.y + 22, '255,80,220', 3, 120, 0.4, 2);
    }
    this.warpK = Math.min(1, Math.max(0, (t - (escort ? 0.9 : 0.2)) / 0.7));
    this.stars.update(dt, 1 + this.warpK * 16); this.fx.update(dt);
    for (const p of this.popups) { p.life -= dt; p.y -= 40 * dt; } this.popups = this.popups.filter(p => p.life > 0);
    this.asteroids = this.asteroids.filter(a => !a.dead);
    if (t > W - 0.35) { this.flash = Math.max(this.flash || 0, (t - (W - 0.35)) / 0.35 * 0.8); this.flashRgb = '255,230,255'; }
    if (t >= W) {
      // v0.4.2: boss levels with a scene: escape line -> warp -> CUTSCENE -> recount -> CONTINUE / MAP
      if (this.lv.boss && SL.Cutscene.has(this.level)) { this.warpK = 0; this.flash = 0; SL.Audio.playTrack('clear'); this.playCut(this.level, () => { this.state = 'warp'; this.startClear(); }); }
      else this.startClear();
    }
  }

  /* ---------- level clear recount ---------- */
  startClear() {
    if (this.state !== 'play' && this.state !== 'warp') return;
    this.warpK = 0; this.flash = 0;
    if (!this.debug) SL.Progress.unlock(this.level + 1);       // map: next mission unlocked
    const lv = this.lv, Bn = SC().bonus, shots = this.stats.shots - lv.shots0, hits = (this.stats.bulletHits || 0) - lv.hits0;
    const acc = shots > 0 ? Math.min(1, hits / shots) : 0;
    const e = lv.boss ? this.level / SC().boss.every : 0;
    const left = lv.boss ? 0 : Math.max(0, lv.left != null ? lv.left : lv.dur - lv.t);
    const timeBonus = lv.boss ? Math.max(0, Math.round((50 + 15 * e - lv.t) * Bn.timePerSec)) : Math.round(left * Bn.timePerSec);
    const rows = [
      { label: 'ASTEROIDS DESTROYED', disp: String(lv.kills), bonus: lv.kills * Bn.perKill },
      { label: 'ACCURACY', disp: Math.round(acc * 100) + '%', bonus: Math.round(acc * acc * Bn.accuracy) },
      { label: 'TIME BONUS', disp: lv.boss ? fmt(lv.t) : fmt(left), bonus: timeBonus },
      { label: 'MAX COMBO', disp: 'x' + lv.maxMult, bonus: (lv.maxMult - 1) * Bn.comboStep },
    ];
    if (lv.boss) rows.push({ label: "DR. NEBULA REPELLED", disp: 'MK-' + roman(e), bonus: Bn.bossPerEncounter * e });
    rows.forEach(r => r.shown = 0);
    this.state = 'clear'; this.escort = null; this.ebullets = []; this.bullets.length = 0; this.dialog = null; this.dialogs = []; this.popups = [];
    for (const a of this.asteroids) a.dead = true;
    this.clearData = { rows, i: 0, t: 0, levelPts: Math.floor(this.score - lv.score0), total0: Math.floor(this.score), done: false, tick: 0, boss: lv.boss, sel: 0 };
    SL.Audio.playTrack('clear');
    SL.Events.emit('levelClear', { level: this.level });
  }
  updateClear(dt) {
    const c = this.clearData, I = SL.Input, downs = I.takeDowns();
    SL.Vol.handle(downs); SL.Vol.tick();
    if (SL.Vol.keys(I) || SL.Vol.open) return;
    const go = !c.done && (I.confirm() || downs.some(d => d.role !== 'ui'));
    c.t += dt;
    if (!c.done) {
      const r = c.rows[c.i], dur = 0.6;
      r.shown = Math.round(r.bonus * Math.min(1, c.t / dur));
      c.tick -= dt; if (c.tick <= 0 && r.shown < r.bonus) { c.tick = 0.045; SL.Audio.sfx.tick(); }
      if (c.t >= dur + 0.2 || go) {
        r.shown = r.bonus; c.i++; c.t = 0; SL.Audio.sfx.blip(700);
        if (c.i >= c.rows.length) { c.done = true; this.score = c.total0 + c.rows.reduce((s, r) => s + r.bonus, 0); SL.Audio.sfx.pickup(); }
      }
    } else if (c.t > 0.25) {
      if (I.hitAny('ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS')) { c.sel = (c.sel + 1) % this.clearBtns.length; SL.Audio.sfx.blip(520); }
      let pick = I.confirm() ? this.clearBtns[c.sel].id : null;
      for (const d of downs) { if (d.used) continue; const b = this.clearBtns.find(b => SL.inBtn(b, d)); if (b) pick = b.id; }
      if (I.hitAny('Escape', 'Backspace')) pick = 'map';
      if (pick === 'continue') this.nextLevel();
      else if (pick === 'map') { SL.Audio.sfx.blip(780); SL.start('map', { session: this.sessionNow(), sel: this.level + 1 }); return; }
    }
    this.stars.update(dt, 0.6); this.fx.update(dt);
  }
  static levelDuration(L) { const S = SC(); return Math.min(S.durMax, S.durBase + S.durPerLevel * (L - 1)); }
  nextLevel() {
    const from = this.level, to = from + 1;
    const cut = SL.Features.story.cutsceneBetween(from, to);   // hook: story clue cutscene (null for now)
    if (cut) { /* TODO: play cutscene, then continue */ }
    if (SL.Features.story.isFinalLevel(to)) { /* TODO: final level vs Commander Edisar Starlight */ }
    SL.Audio.sfx.blip(880);
    if (this.final || to > SL.FINAL_LEVEL) { this.toCredits(); return; }    // v0.5.0: after the final level -> end credits
    this.startLevel(to);
  }

  /* ---------- per-frame ---------- */
  update(dt) {
    if (this.state === 'clear') { this.T += dt; this.updateClear(dt); return; }
    if (this.state === 'warp') { this.T += dt; this.updateWarp(dt); return; }
    if (this.state === 'cutscene') { this.T += dt; this.cut.update(dt); return; }
    super.update(dt);
  }
  draw(g) { if (this.state === 'cutscene' && this.cut) return this.cut.draw(g); super.draw(g); }
  menuAction(id) {
    if (id === 'map') {
      SL.Audio.sfx.blip(780);
      // game over: session ends (already ranked). Pause -> MAP: mission abandoned, keep the session as it was at launch.
      const sess = this.state === 'over' ? null : this.session0;
      SL.start('map', { session: sess, sel: this.level });
    } else if (id === 'retry') { SL.Audio.sfx.blip(780); SL.startMission(this.level, this.debug, null, { intro: false }); }
    else super.menuAction(id);
  }
  onUpdate(dt) {
    if (this.state !== 'play') return;
    const lv = this.lv, s = this.ship;
    lv.t += dt; this.introT -= dt; lv.maxMult = Math.max(lv.maxMult, this.mult);
    this.checkGoal();
    if (lv.done) {
      let n = 0;
      for (const a of this.asteroids) if (!a.dead) { this.destroy(a, false, { noSplit: true, quiet: true }); if (++n >= 4) break; }
      this.ebullets = [];
      lv.doneT -= dt; if (lv.doneT <= 0) { this.startWarp(); return; }
    }
    const hdt = dt * SL.Features.hazardScale(this);
    if (this.boss) this.updateBoss(this.boss.phase === 'fight' || this.boss.phase === 'escape' ? hdt : dt);
    if (this.chat && this.chat.length && !lv.done && !lv.boss && this.chat[0].at <= lv.t && !this.dialog && !this.dialogs.length) {
      const c = this.chat.shift(); this.say(SL.Chatter.draw(c.who, c.tier), 'normal', 0, c.who);
    }
    for (const b of this.ebullets) {
      b.x += b.vx * hdt; b.y += b.vy * hdt;
      if (b.x < -20 || b.x > SL.W + 20 || b.y < -40 || b.y > SL.H + 20) b.dead = true;
      else if (s.alive && s.invuln <= 0 && Math.hypot(b.x - s.x, b.y - s.y) < 5 + this.C.ship.radius - 2) { b.dead = true; this.playerHit(null); }
    }
    this.ebullets = this.ebullets.filter(b => !b.dead);
    this.updateDialog(dt);
  }

  /* ---------- drawing ---------- */
  drawWorld(g) {
    const B = this.boss;
    if (B && !B.gone) {
      const h = hull();
      SL.glow(g, B.x, B.y, 260, 90, '255,40,60', 0.12);
      if (B.phase === 'escape' && B.escT > 1.8) { SL.glow(g, B.x, B.y + 60, 50, 80, '255,160,80', 0.5); }
      g.drawImage(h.c, B.x - h.W / 2, B.y - h.H / 2 + 8, h.W, h.H);
      for (const p of B.pts) {
        const x = B.x + p.ox, y = B.y + p.oy;
        if (p.hp > 0) {
          const pulse = 0.6 + 0.4 * Math.sin(this.T * 6 + p.ox), hot = p.flash > 0;
          SL.glow(g, x, y, 30, 30, hot ? '255,255,255' : '255,200,60', 0.35 + 0.25 * pulse);
          g.save(); g.beginPath(); g.arc(x, y, p.r, 0, Math.PI * 2); g.fillStyle = hot ? '#fff' : `rgba(255,${150 + 60 * pulse},40,0.95)`; g.fill();
          g.strokeStyle = '#fff'; g.lineWidth = 2; g.shadowColor = 'rgba(255,220,80,1)'; g.shadowBlur = 14 * SL.view.scale; g.stroke(); g.restore();
          g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x - 4, y - 4, 4, 0, Math.PI * 2); g.fill();
          const k = p.hp / p.max; g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x - 14, y + p.r + 4, 28, 3); g.fillStyle = 'rgba(255,220,90,0.95)'; g.fillRect(x - 14, y + p.r + 4, 28 * k, 3);
        } else {
          g.beginPath(); g.arc(x, y, p.r * 0.8, 0, Math.PI * 2); g.fillStyle = 'rgba(30,20,25,0.95)'; g.fill();
          if (Math.random() < 0.08) this.fx.burst(x, y, '120,120,130', 1, 30, 0.8, 3);
        }
      }
    }
    if (this.ebullets.length) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const b of this.ebullets) { g.fillStyle = 'rgba(255,40,60,0.35)'; g.beginPath(); g.arc(b.x, b.y, 9, 0, Math.PI * 2); g.fill(); }
      g.restore();
      g.fillStyle = '#fff'; for (const b of this.ebullets) { g.beginPath(); g.arc(b.x, b.y, 4, 0, Math.PI * 2); g.fill(); }
    }
  }
  hudCenter(g) {
    const lv = this.lv;
    if (lv.boss) { SL.neonText(g, `LEVEL ${this.level} · BOSS`, 512, 20, 16, '255,110,110', { blur: 8 }); return; }
    const left = Math.max(0, lv.dur - lv.t), need = Math.max(0, lv.goal - lv.kills);
    const tm = lv.done ? 'SECTOR CLEAR' : left > 0 ? fmt(Math.ceil(left)) : 'WARP READY';
    SL.neonText(g, `LEVEL ${this.level} · ${tm} · ${Math.min(lv.kills, lv.goal)}/${lv.goal}`, 512, 20, 16, lv.done ? '255,220,90' : left <= 0 && need > 0 ? '255,220,90' : '160,200,255', { blur: 8 });
    // sector progress bar (time)
    const k = lv.dur ? Math.min(1, lv.t / lv.dur) : 1;
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(432, 31, 160, 2); g.fillStyle = 'rgba(120,190,255,0.8)'; g.fillRect(432, 31, 160 * k, 2);
    if (left <= 0 && need > 0 && !lv.done) SL.neonText(g, `DESTROY ${need} MORE TO WARP`, 512, 70, 13, '255,220,90', { blur: 8, alpha: 0.6 + 0.4 * Math.sin(this.T * 6) });
  }
  drawTop(g) {
    const B = this.boss, W = SL.W;
    if (B && !B.gone && this.state !== 'clear') {
      const k = this.bossHp() / B.maxHp, x = 312, y = 96, w = 400;
      SL.neonText(g, `DR. NEBULA'S PROTOTYPE MK-${roman(B.e)}`, 512, y - 10, 12, '255,120,120', { blur: 6 });
      g.fillStyle = 'rgba(40,0,8,0.8)'; g.fillRect(x - 2, y - 2, w + 4, 12);
      g.save(); g.fillStyle = 'rgba(255,50,70,0.95)'; g.shadowColor = 'rgba(255,40,60,1)'; g.shadowBlur = 12 * SL.view.scale; g.fillRect(x, y, w * k, 8); g.restore();
      g.strokeStyle = 'rgba(255,220,220,0.8)'; g.lineWidth = 1; g.strokeRect(x - 2, y - 2, w + 4, 12);
      B.pts.forEach((p, i) => { const tx = x + (i + 1) * w / (B.pts.length + 1); g.fillStyle = p.hp > 0 ? 'rgba(255,220,90,0.95)' : 'rgba(80,60,60,0.9)'; g.fillRect(tx - 1, y + 12, 2, 4); });
    }
    if (this.state === 'play') {
      // level intro card
      if (this.introT > 0) {
        const t = SC().introTime - this.introT, a = Math.min(1, t / 0.3, this.introT / 0.4);
        g.fillStyle = `rgba(3,1,12,${0.45 * a})`; g.fillRect(0, 200, W, 150);
        if (this.lv.boss) {
          SL.neonText(g, 'WARNING', 512, 238, 44, '255,50,60', { blur: 22, alpha: a * (Math.floor(t * 4) % 2 ? 0.5 : 1) });
          SL.neonText(g, `LEVEL ${this.level} · DR. NEBULA APPROACHES`, 512, 292, 20, '255,200,200', { blur: 10, alpha: a });
          SL.neonText(g, 'DESTROY THE GLOWING WEAK POINTS', 512, 324, 14, '255,220,90', { blur: 6, alpha: a });
        } else {
          SL.neonText(g, `LEVEL ${this.level}`, 512, 246, 54, '255,80,220', { blur: 24, alpha: a });
          SL.neonText(g, `DESTROY ${this.lv.goal} ASTEROIDS · LEFTOVER TIME IS BONUS`, 512, 308, 20, '160,200,255', { blur: 10, alpha: a });
        }
      }
      this.drawDialog(g);
      if (this.lv.boss && B && B.t < 7) SL.neonText(g, 'Music: "HellDrake" by Centurion_of_war — CC-BY 4.0', 512, 571, 9, '220,200,230', { blur: 2, alpha: 0.7 });
    }
    if (this.state === 'warp' && this.escort && this.escort.said && this.escort.lineT < 2.2) {
      const E = this.escort;
      SL.dialogPopup(g, this, 'avrillEscort', { side: 'left', t: E.lineT, dur: 2.2, name: SL.CONFIG.assist.pilot, rgb: '255,80,220',
        lines: [E.line], typed: Math.floor((E.lineT - 0.1) * 40), por: SL.Features.portrait(), textRgb: '255,235,255' });
    }
    if (this.state === 'warp' && this.warpT > (this.escort ? 1.2 : 0.4)) {
      const t0 = this.escort ? 1.2 : 0.4;
      SL.neonText(g, 'WARP!', 512, 250, 46, '255,255,255', { blur: 26, alpha: Math.min(1, (this.warpT - t0) * 3) * (1 - Math.max(0, this.warpT - t0 - 1.2)) });
    }
    if (this.state === 'warp') SL.neonText(g, SL.Input.touchMode ? 'TAP TO SKIP' : 'ENTER TO SKIP', 512, 540, 12, '160,200,255', { blur: 4, alpha: 0.45 });
    if (this.state === 'clear') this.drawClear(g);
  }
  drawClear(g) {
    const c = this.clearData, W = SL.W;
    g.fillStyle = 'rgba(3,1,12,0.82)'; g.fillRect(0, 0, W, SL.H);
    SL.neonText(g, c.title || (c.boss ? 'DR. NEBULA ESCAPED!' : `LEVEL ${this.level} CLEAR!`), 512, 84, 42, c.final ? '120,220,255' : c.boss ? '255,90,90' : '255,80,220', { blur: 22 });
    if (c.boss && !c.final) SL.neonText(g, 'He always comes back stronger...', 512, 122, 14, '255,200,200', { blur: 6, alpha: 0.85 });
    let y = 170;
    c.rows.forEach((r, i) => {
      if (i > c.i) return;
      SL.neonText(g, r.label, 300, y, 17, '200,190,255', { align: 'left', blur: 6 });
      SL.neonText(g, r.disp, 590, y, 17, '255,235,255', { align: 'right', blur: 6 });
      SL.neonText(g, '+' + r.shown, 724, y, 18, '255,220,90', { align: 'right', blur: 8 });
      y += 34;
    });
    const sum = c.rows.reduce((s, r) => s + r.shown, 0);
    y = Math.max(y, 170 + 34 * 4) + 8;
    g.fillStyle = 'rgba(170,90,255,0.5)'; g.fillRect(300, y - 18, 424, 1);
    SL.neonText(g, 'LEVEL TOTAL', 300, y + 4, 19, '255,80,220', { align: 'left', blur: 10 });
    SL.neonText(g, SL.pad(c.levelPts + sum), 724, y + 4, 20, '255,235,255', { align: 'right', blur: 10 });
    SL.neonText(g, 'RUNNING TOTAL', 300, y + 40, 19, '70,160,255', { align: 'left', blur: 10 });
    SL.neonText(g, SL.pad(c.total0 + sum), 724, y + 40, 22, '255,255,255', { align: 'right', blur: 12 });
    if (c.done) this.clearBtns.forEach((b, i) => SL.drawButton(g, b, i === c.sel, this.T));
    else SL.neonText(g, SL.Input.touchMode ? 'TAP TO SKIP' : 'ENTER TO SKIP', 512, 520, 12, '160,200,255', { blur: 4, alpha: 0.5 });
    SL.neonText(g, 'Music: "The Last Encounter" mix by Matthew Pablo, Zefz & neocrey — CC-BY-SA 3.0', 512, 562, 10, '220,200,230', { blur: 2, alpha: 0.7 });
  }
};
})();
