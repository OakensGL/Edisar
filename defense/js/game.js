/* Title screen + the tower-defense match. */
(() => {
const { W, H, TILE } = SD;
const C = () => SD.CONFIG;
const KINDS = ['laser', 'missile', 'ice', 'railgun', 'tesla', 'pulse'];
const SHOP = KINDS.concat('nebula');

function tileCenter(tx, ty) { return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }; }
function tileAt(x, y) { return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) }; }

function buildPath(tiles) {
  tiles = tiles || SD.CONFIG.levels[0].path;
  const pts = tiles.map(([tx, ty]) => tileCenter(tx, ty));
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    seg.push({ a: pts[i], b: pts[i + 1], len, start: total });
    total += len;
  }
  const blocked = new Set();
  const mark = (tx, ty) => blocked.add(tx + ',' + ty);
  for (let i = 0; i < tiles.length - 1; i++) {
    const [x0, y0] = tiles[i], [x1, y1] = tiles[i + 1];
    if (x0 === x1) {
      const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
      for (let y = lo; y <= hi; y++) mark(x0, y);
    } else {
      const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
      for (let x = lo; x <= hi; x++) mark(x, y0);
    }
  }
  return { pts, seg, total, blocked, spawn: pts[0], base: pts[pts.length - 1] };
}

function posOnPath(path, dist) {
  const d = Math.max(0, Math.min(path.total, dist));
  for (let i = 0; i < path.seg.length; i++) {
    const s = path.seg[i];
    if (d <= s.start + s.len || i === path.seg.length - 1) {
      const t = s.len ? (d - s.start) / s.len : 1;
      return {
        x: s.a.x + (s.b.x - s.a.x) * t,
        y: s.a.y + (s.b.y - s.a.y) * t,
        ang: Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x),
      };
    }
  }
  return { x: path.base.x, y: path.base.y, ang: 0 };
}

function inHud(p) {
  return p.y < C().hud.top || p.y > H - C().hud.bottom;
}

/* ================================================================== Title */
SD.Title = class {
  constructor() {
    this.T = 0;
    this.stars = new SD.Starfield(1.1);
    this.bg = null;
    this.bgReady = false;
    this.help = false;
    this.play = { x: W / 2 - 132, y: 182, w: 200, h: 48, label: 'PLAY', rgb: '80,170,255', size: 22, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.helpBtn = { x: W / 2 + 132, y: 182, w: 220, h: 48, label: 'HOW TO PLAY', rgb: '180,210,255', size: 18, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.story = { x: W / 2 - 90, y: 236, w: 150, h: 28, label: 'STORY', rgb: '255,210,90', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.creditsBtn = { x: W / 2 + 90, y: 236, w: 150, h: 28, label: 'CREDITS', rgb: '200,210,230', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.mute = { x: W - 58, y: 28, w: 96, h: 32, label: SD.Audio.muted ? 'SOUND OFF' : 'SOUND ON', rgb: '180,200,255', size: 13 };
    this.closeHelp = { x: W / 2, y: 500, w: 180, h: 42, label: 'CLOSE', rgb: '80,170,255', size: 18 };
    this.showCredits = false;
    this.loadBg();
    this.prepAmbient();
  }

  loadBg() {
    const tryLoad = (src, next) => {
      const img = new Image();
      img.onload = () => { this.bg = img; this.bgReady = true; };
      img.onerror = () => { if (next) next(); };
      img.src = src;
    };
    tryLoad('assets/title-bg.jpg', () => tryLoad('assets/title-bg.webp', () => tryLoad('assets/title-bg.png')));
  }

  prepAmbient() {
    try {
      this.spr = {
        scout: SD.Sprites.scout(),
        fighter: SD.Sprites.fighter(),
        armored: SD.Sprites.armored(),
        flagship: SD.Sprites.flagship(),
        turret: {
          laser: { base: SD.Sprites.turretBase('laser', 2), head: SD.Sprites.turretHead('laser', 2) },
          missile: { base: SD.Sprites.turretBase('missile', 1), head: SD.Sprites.turretHead('missile', 1) },
          ice: { base: SD.Sprites.turretBase('ice', 2), head: SD.Sprites.turretHead('ice', 2) },
        },
      };
    } catch (e) { this.spr = null; }
  }

  update(dt) {
    this.T += dt;
    if (!this.bgReady) this.stars.update(dt);
    this.mute.label = SD.Audio.muted ? 'SOUND OFF' : 'SOUND ON';
    if (SD.Input.hit('KeyM')) { SD.Audio.toggleMute(); SD.Audio.click(); }
    if (this.help || this.showCredits) {
      if (SD.Input.hit('Escape') || SD.Input.confirm()) {
        this.help = false; this.showCredits = false; SD.Audio.click();
      }
      for (const p of SD.Input.takeClicks()) {
        if (SD.inBtn(this.closeHelp, p) || !this.inHelpPanel(p)) {
          this.help = false; this.showCredits = false; SD.Audio.click();
        }
      }
      return;
    }
    if (SD.Input.confirm()) { SD.Audio.click(); SD.start('levels'); return; }
    if (SD.Input.hit('Escape') || SD.Input.hit('KeyH')) { this.help = true; SD.Audio.click(); }
    if (SD.Input.hit('KeyC')) { this.showCredits = true; SD.Audio.click(); }
    for (const p of SD.Input.takeClicks()) {
      if (SD.inBtn(this.mute, p)) { SD.Audio.toggleMute(); SD.Audio.click(); }
      else if (SD.inBtn(this.play, p)) { SD.Audio.click(); SD.start('levels'); }
      else if (SD.inBtn(this.story, p)) { SD.Audio.click(); SD.start('crawl'); }
      else if (SD.inBtn(this.creditsBtn, p)) { this.showCredits = true; SD.Audio.click(); }
      else if (SD.inBtn(this.helpBtn, p)) { this.help = true; SD.Audio.click(); }
    }
  }

  inHelpPanel(p) {
    return Math.abs(p.x - W / 2) <= 360 && p.y >= 70 && p.y <= 530;
  }

  draw(g) {
    if (this.bgReady) {
      g.drawImage(this.bg, 0, 0, W, H);
      // top vignette so the title stays readable over the sky
      const top = g.createLinearGradient(0, 0, 0, 230);
      top.addColorStop(0, 'rgba(3,2,12,0.58)');
      top.addColorStop(0.55, 'rgba(3,2,12,0.28)');
      top.addColorStop(1, 'rgba(3,2,12,0)');
      g.fillStyle = top; g.fillRect(0, 0, W, 236);
      // thin bottom band for the music credit, keeps feet mostly visible
      const bot = g.createLinearGradient(0, H - 70, 0, H);
      bot.addColorStop(0, 'rgba(3,2,12,0)');
      bot.addColorStop(1, 'rgba(3,2,12,0.72)');
      g.fillStyle = bot; g.fillRect(0, H - 70, W, 70);
    } else {
      SD.drawSpaceBg(g);
      this.stars.draw(g, this.T);
      this.drawAmbient(g);
    }

    SD.neonText(g, 'STARLIGHT', W / 2, 62, 44, '210,230,255', { blur: 18 });
    g.save();
    g.strokeStyle = 'rgba(220,230,255,0.45)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(W / 2 - 168, 86);
    g.lineTo(W / 2 + 168, 86);
    g.stroke();
    g.restore();
    SD.neonText(g, 'LAST STATION', W / 2, 114, 30, '255,220,140', { blur: 14 });

    const mouse = SD.Input.mouse;
    SD.drawButton(g, this.play, mouse.over && SD.inBtn(this.play, mouse), this.T);
    SD.drawButton(g, this.helpBtn, mouse.over && SD.inBtn(this.helpBtn, mouse), this.T);
    SD.drawButton(g, this.story, mouse.over && SD.inBtn(this.story, mouse), this.T);
    SD.drawButton(g, this.creditsBtn, mouse.over && SD.inBtn(this.creditsBtn, mouse), this.T);
    SD.drawButton(g, this.mute, SD.Audio.muted || (mouse.over && SD.inBtn(this.mute, mouse)), this.T);

    SD.neonText(g, 'v' + SD.VERSION, 44, 28, 12, '200,210,230', { blur: 4, alpha: 0.8 });

    if (this.help) this.drawHelp(g);
    if (this.showCredits) this.drawCredits(g);
    SD.drawScanlines(g);
  }

  drawAmbient(g) {
    if (!this.spr) return;
    const fly = [
      { spr: this.spr.scout, x: (this.T * 40) % (W + 160) - 80, y: 230, ang: 0, sc: 1.1 },
      { spr: this.spr.fighter, x: W - ((this.T * 28 + 200) % (W + 200) - 80), y: 300, ang: Math.PI, sc: 1.0 },
      { spr: this.spr.armored, x: (this.T * 18 + 400) % (W + 220) - 100, y: 390, ang: 0, sc: 0.95 },
    ];
    for (const s of fly) SD.blit(g, s.spr, s.x, s.y, s.ang, s.sc);
    const pads = [
      { k: 'laser', x: 90, y: 500, ang: -0.8 },
      { k: 'missile', x: 180, y: 515, ang: -0.5 },
      { k: 'ice', x: W - 90, y: 500, ang: Math.PI + 0.8 },
    ];
    for (const p of pads) {
      const t = this.spr.turret[p.k];
      SD.blit(g, t.base, p.x, p.y, 0, 1.05);
      SD.blit(g, t.head, p.x, p.y, p.ang + Math.PI / 2, 1.05);
    }
  }

  drawHelp(g) {
    g.save(); g.fillStyle = 'rgba(4,2,12,0.62)'; g.fillRect(0, 0, W, H); g.restore();
    const x = W / 2 - 340, y = 90, w = 680, h = 440;
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = 'rgba(8,10,20,0.92)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.4)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'HOW TO PLAY', W / 2, 148, 28, '200,230,255', { blur: 12 });
    const lines = [
      'Three levels, ten waves each. Credits and turrets reset every level.',
      'LASER  ·  fast beam.  MISSILES  ·  slow splash.  ICE  ·  slows ships.',
      'RAILGUN  ·  long-range pierce.  TESLA  ·  chaining arc.  PULSE  ·  shield-breaking shockwave.',
      'NEBULA  ·  Level 3 only, one per map. A heavy dark-energy beam that ignores shields and resists.',
      'Upgrade twice: MK III adds a special (twin beams, cluster, freeze, full pierce, longer chains, a brief pulse stun).',
      'Scouts resist missiles and fear lasers. Armored resist lasers and fear missiles and the railgun.',
      'Shielded ships shrug off most fire until Tesla or Pulse pops the bubble.',
      'Cryo-engine ships are immune to ice. Interceptors are very fast and weak to lasers and Tesla; ice slows them hard.',
      'Juggernauts are slow, heavy tanks. Railguns and missiles work; ice only slows them partially.',
      'Tap a ship to see its HP, weaknesses and resistances.',
      'About 3 seconds after a wave starts, you can send the next one and fight several at once.',
      'Early-send bonus scales with time saved. A timer still starts when the field is clear.',
      'The HUD speed button (or F) cycles x1 / x2 / x3. It only speeds the battle, not the music.',
      '',
      SD.Input.touchMode
        ? 'PHONE  ·  TAP A TURRET, THEN A PAD  ·  SPEED AND SEND WAVE ARE ON THE HUD  ·  LANDSCAPE'
        : 'DESKTOP  ·  1–7 SELECT  ·  U UPGRADE  ·  X SELL  ·  F SPEED  ·  P PAUSE  ·  M MUTE',
    ];
    lines.forEach((ln, i) => {
      const small = i >= lines.length - 1;
      SD.neonText(g, ln, W / 2, 174 + i * 18, small ? 12 : 13, small ? '180,210,255' : '220,230,245', { blur: 5, alpha: 0.92 });
    });
    SD.drawButton(g, this.closeHelp, SD.Input.mouse.over && SD.inBtn(this.closeHelp, SD.Input.mouse), this.T);
  }

  drawCredits(g) {
    g.save(); g.fillStyle = 'rgba(4,2,12,0.62)'; g.fillRect(0, 0, W, H); g.restore();
    const x = W / 2 - 360, y = 56, w = 720, h = 464;
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = 'rgba(8,10,20,0.94)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.4)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'CREDITS', W / 2, 88, 26, '200,230,255', { blur: 12 });
    const lines = [
      ['Game design, art direction', '180,210,255', 13],
      ['Juan Carlos Garcia', '230,235,245', 16],
      ['', '', 8],
      ['Title music', '180,210,255', 13],
      ['"Space Dimensions (8bit/Retro Version)"', '230,235,245', 15],
      ['by Matthew Pablo  —  CC-BY 3.0', '230,235,245', 15],
      ['www.matthewpablo.com', '200,210,230', 13],
      ['', '', 8],
      ['Game music  ·  Space Shooter Music pack', '180,210,255', 13],
      ['Music by Oblidivm  —  oblidivmmusic.blogspot.com', '230,235,245', 15],
      ['CC-BY 3.0', '230,235,245', 15],
      ['SkyFire  ·  Without Fear  ·  Battle in the Stars', '200,210,230', 13],
      ['Space Heroes  ·  DeathMatch  ·  Victory Tune  ·  Defeated', '200,210,230', 13],
      ['', '', 8],
      ['Sound effects are synthesized in-game.', '180,200,220', 13],
    ];
    let y0 = 120;
    for (const [ln, rgb, sz] of lines) {
      if (ln) SD.neonText(g, ln, W / 2, y0, sz, rgb, { blur: 5, alpha: 0.95 });
      y0 += sz === 8 ? 10 : 20;
    }
    SD.drawButton(g, this.closeHelp, SD.Input.mouse.over && SD.inBtn(this.closeHelp, SD.Input.mouse), this.T);
  }

};


/* ============================================================== Crawl */
SD.Crawl = class {
  constructor(opt = {}) {
    this.T = 0;
    this.stars = new SD.Starfield(1.35);
    this.bg = null;
    this.bgReady = false;
    this.shot = !!opt.shot;
    this.leaving = null;
    this.FONT = SD.CONFIG.crawlFont;
    this.SIZE = 44;
    this.LH = 60;
    this.PG = 40;
    this.MAXW = 880;
    this.TEXT_X = 512;
    this.TEXT_Y0 = 520;
    this.TEXT_TOP = 90;
    this.TEXT_BOT = 530;
    this.T_START = 1.6;
    this.HOLD = 0.35;
    this.FADE = 2.2;
    this.items = [];
    this.S_END = 0;
    this.DUR = SD.CONFIG.crawlTrack || 53.355;
    this.SPEED = 34;
    this.layout();
    this.loadBg();
    if (this.shot) {
      // mid-crawl still: title + first paragraphs readable
      this.T = this.T_START + (this.items[3] ? (this.TEXT_Y0 + this.items[3].y - 210) / this.SPEED : 8);
    }
  }

  loadBg() {
    const tryLoad = (src, next) => {
      const img = new Image();
      img.onload = () => { this.bg = img; this.bgReady = true; };
      img.onerror = () => { if (next) next(); };
      img.src = src;
    };
    tryLoad('assets/crawl-bg.jpg', () => tryLoad('assets/crawl-bg.webp', () => tryLoad('assets/crawl-bg.png')));
  }

  font(px) { return `bold ${px}px ${this.FONT}`; }

  wrap(g, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  layout() {
    const dummy = SD.mkCanvas(16, 16).getContext('2d');
    dummy.font = this.font(this.SIZE);
    const title = 'THE RETURN OF EDISAR STARLIGHT';
    const paras = [
      "The war was supposed to be over. Avrill's sacrifice broke Edisar's fleet, and his flagship fell at the edge of the solar system.",
      'But Edisar Starlight survived.',
      'From the shadows of deep space, he has rebuilt his fleet, stronger than ever, and now it marches straight for Earth.',
      'With no fleet left to stop him, Oakens and Dr. Nebula have put their differences aside. Together they have turned the last orbital station into a fortress bristling with turrets.',
      'Every ship that falls brings them closer to victory. Every ship that passes brings Earth closer to its end.',
      'The defense of humanity begins now...',
    ];
    const items = [];
    let y = 0;
    dummy.font = this.font(40);
    for (const ln of this.wrap(dummy, title, this.MAXW)) {
      items.push({ y, text: ln, font: this.font(40), rgb: '225,250,255', size: 40 });
      y += 54;
    }
    y += 28;
    dummy.font = this.font(this.SIZE);
    paras.forEach((p, i) => {
      const rgb = i === 1 || i === paras.length - 1 ? '235,252,255' : '225,250,255';
      for (const ln of this.wrap(dummy, p, this.MAXW)) {
        items.push({ y, text: ln, font: this.font(this.SIZE), rgb, size: this.SIZE });
        y += this.LH;
      }
      y += this.PG;
    });
    this.items = items;
    this.S_END = this.TEXT_Y0 + y - this.TEXT_TOP;
    // Sync to SkyFire: last line fades as the track ends. Never loop or restart.
    const track = SD.CONFIG.crawlTrack || 53.355;
    const usable = Math.max(8, track - this.T_START - this.HOLD);
    this.SPEED = this.S_END / usable;
    this.DUR = track;
  }

  finish() {
    if (this.shot || this.leaving != null) return;
    this.leaving = 0.001;
    if (SD.Audio.stopMusic) SD.Audio.stopMusic({ dur: 0.9 });
  }

  update(dt) {
    this.T += dt;
    if (!this.bgReady) this.stars.update(dt);
    if (this.shot) return;
    if (this.leaving != null) {
      this.leaving += dt;
      if (this.leaving >= 0.7) SD.start('levels');
      return;
    }
    if (SD.Input.hit('KeyM')) { SD.Audio.toggleMute(); SD.Audio.click(); }
    if (this.T > 0.45 && (SD.Input.confirm() || SD.Input.hit('Escape') || SD.Input.takeClicks().length)) {
      SD.Audio.click();
      this.finish();
      return;
    }
    if (this.T >= this.DUR) this.finish();
  }

  fin() { return 1 - Math.max(0, Math.min(1, (this.T - (this.DUR - this.FADE)) / this.FADE)); }

  draw(g) {
    if (this.bgReady) {
      g.drawImage(this.bg, 0, 0, W, H);
      const dim = g.createRadialGradient(W * 0.50, H * 0.48, 50, W * 0.50, H * 0.50, 560);
      dim.addColorStop(0, 'rgba(0,0,0,0.46)');
      dim.addColorStop(0.45, 'rgba(0,0,0,0.32)');
      dim.addColorStop(1, 'rgba(0,0,0,0.16)');
      g.fillStyle = dim;
      g.fillRect(0, 0, W, H);
    } else {
      SD.drawSpaceBg(g);
      this.stars.draw(g, this.T);
    }
    // Starlight-style soft dark veil for readability
    const a = Math.min(1, this.T / 0.7) * (this.leaving != null ? 1 : this.fin());
    if (a > 0) {
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(0.10, `rgba(0,0,0,${0.28 * a})`);
      grd.addColorStop(0.28, `rgba(0,0,0,${0.58 * a})`);
      grd.addColorStop(0.72, `rgba(0,0,0,${0.58 * a})`);
      grd.addColorStop(0.90, `rgba(0,0,0,${0.28 * a})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
    }
    this.drawCrawl(g);
    if (!this.shot) {
      const hint = SD.Input.touchMode ? 'TAP ANYWHERE TO SKIP' : 'TAP  ·  SPACE  ·  ESC  TO SKIP';
      const hf = this.fin();
      if (this.T > 0.45 && hf > 0.2) {
        SD.neonText(g, hint, W / 2, H - 22, 13, '230,235,255', { blur: 6, alpha: 0.55 + 0.2 * Math.sin(this.T * 3) });
      }
    }
    const fadeIn = Math.max(0, 1 - this.T / 0.8);
    const fadeOut = this.leaving != null ? Math.min(1, this.leaving / 0.7) : (1 - this.fin());
    const fade = Math.max(fadeIn, fadeOut);
    if (fade > 0) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, W, H); }
    SD.drawScanlines(g);
  }

  drawCrawl(g) {
    const s = Math.min(this.SPEED * Math.max(0, this.T - this.T_START), this.S_END);
    g.textAlign = 'center'; g.textBaseline = 'top';
    const sc = SD.view ? SD.view.scale : 1;
    for (const it of this.items) {
      const y = this.TEXT_Y0 + it.y - s;
      if (y < -80 || y > H + 10) continue;
      const cy = y + it.size * 0.55;
      const e = Math.max(0, Math.min(1, Math.min((cy - this.TEXT_TOP) / 70, (this.TEXT_BOT - cy) / 70)));
      if (e <= 0) continue;
      g.font = it.font;
      g.shadowColor = `rgba(0,0,0,${0.9 * e})`; g.shadowBlur = 22 * sc;
      g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = `rgba(0,0,0,${0.55 * e})`;
      g.strokeText(it.text, this.TEXT_X, y);
      g.shadowColor = `rgba(${it.rgb},${0.85 * e})`; g.shadowBlur = 14 * sc;
      g.fillStyle = `rgba(${it.rgb},${e})`; g.fillText(it.text, this.TEXT_X, y);
    }
    g.shadowBlur = 0; g.lineWidth = 1;
  }
};

SD.LevelSelect = class {
  constructor(opt = {}) {
    this.T = 0;
    this.stars = new SD.Starfield(1.1);
    this.progress = opt.shot ? { unlocked: 3, stars: [3, 2, 1] } : SD.Progress.load();
    this.back = { x: 70, y: 28, w: 100, h: 32, label: 'MENU', rgb: '180,200,255', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.mute = { x: W - 58, y: 28, w: 96, h: 32, label: SD.Audio.muted ? 'SOUND OFF' : 'SOUND ON', rgb: '180,200,255', size: 13, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.cards = SD.CONFIG.levels.map((lv, i) => ({
      i, lv,
      x: 190 + i * 322, y: 300, w: 280, h: 340,
    }));
  }
  update(dt) {
    this.T += dt;
    this.stars.update(dt);
    this.mute.label = SD.Audio.muted ? 'SOUND OFF' : 'SOUND ON';
    if (SD.Input.hit('KeyM')) { SD.Audio.toggleMute(); SD.Audio.click(); }
    if (SD.Input.hit('Escape')) { SD.Audio.click(); SD.start('title'); return; }
    for (const p of SD.Input.takeClicks()) {
      if (SD.inBtn(this.mute, p)) { SD.Audio.toggleMute(); SD.Audio.click(); }
      else if (SD.inBtn(this.back, p)) { SD.Audio.click(); SD.start('title'); }
      else {
        for (const c of this.cards) {
          if (Math.abs(p.x - c.x) <= c.w / 2 && Math.abs(p.y - c.y) <= c.h / 2) {
            if (c.i < this.progress.unlocked) { SD.Audio.click(); SD.start('level', { index: c.i }); }
            else SD.Audio.deny();
            break;
          }
        }
      }
    }
  }
  draw(g) {
    SD.drawSpaceBg(g, 'orbital');
    this.stars.draw(g, this.T);
    const top = g.createLinearGradient(0, 0, 0, 160);
    top.addColorStop(0, 'rgba(3,2,12,0.55)'); top.addColorStop(1, 'rgba(3,2,12,0)');
    g.fillStyle = top; g.fillRect(0, 0, W, 160);
    SD.neonText(g, 'STARLIGHT', W / 2, 54, 28, '210,230,255', { blur: 12 });
    SD.neonText(g, 'SELECT LEVEL', W / 2, 92, 22, '255,220,140', { blur: 10 });
    const mouse = SD.Input.mouse;
    SD.drawButton(g, this.back, mouse.over && SD.inBtn(this.back, mouse), this.T);
    SD.drawButton(g, this.mute, SD.Audio.muted || (mouse.over && SD.inBtn(this.mute, mouse)), this.T);
    this.cards.forEach((c, i) => {
      const locked = i >= this.progress.unlocked;
      const hover = !locked && mouse.over && Math.abs(mouse.x - c.x) <= c.w / 2 && Math.abs(mouse.y - c.y) <= c.h / 2;
      const x = c.x - c.w / 2, y = c.y - c.h / 2;
      g.save();
      SD.roundRect(g, x, y, c.w, c.h, 14);
      g.fillStyle = hover ? 'rgba(12,16,28,0.92)' : 'rgba(8,10,20,0.88)'; g.fill();
      g.strokeStyle = hover ? 'rgba(255,220,140,0.7)' : 'rgba(180,200,220,0.35)'; g.lineWidth = hover ? 2 : 1.2; g.stroke();
      g.restore();
      // mini map tint
      g.save();
      SD.roundRect(g, x + 16, y + 16, c.w - 32, 150, 8); g.clip();
      SD.drawSpaceBg(g, c.lv.variant);
      // tiny path
      const path = c.lv.path;
      g.beginPath();
      path.forEach((pt, k) => {
        const px = x + 16 + (pt[0] / 31) * (c.w - 32);
        const py = y + 16 + (pt[1] / 17) * 150;
        k ? g.lineTo(px, py) : g.moveTo(px, py);
      });
      g.strokeStyle = 'rgba(80,200,255,0.85)'; g.lineWidth = 2.2; g.stroke();
      g.restore();
      SD.neonText(g, 'LEVEL ' + (i + 1), c.x, y + 186, 13, '180,210,255', { blur: 5 });
      SD.neonText(g, c.lv.name, c.x, y + 214, 16, '230,235,245', { blur: 7 });
      const stars = this.progress.stars[i] || 0;
      const starStr = locked ? 'LOCKED' : (stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : 'NO STARS YET');
      SD.neonText(g, starStr, c.x, y + 250, locked ? 14 : 20, locked ? '160,160,180' : '255,220,120', { blur: 6 });
      if (locked) {
        g.save(); g.fillStyle = 'rgba(4,2,12,0.45)';
        SD.roundRect(g, x, y, c.w, c.h, 14); g.fill(); g.restore();
        SD.neonText(g, 'LOCKED', c.x, c.y + 20, 18, '200,210,230', { blur: 8 });
      }
    });
    SD.drawScanlines(g);
  }
};

/* ============================================================== Defense */
SD.Defense = class {
  constructor(opt = {}) {
    this.T = 0;
    this.stars = new SD.Starfield(1);
    this.fx = new SD.Particles();
    this.shot = opt.shot || null;
    this.setLevel(opt.levelIndex || 0);
    this.spr = {
      scout: SD.Sprites.scout(),
      fighter: SD.Sprites.fighter(),
      armored: SD.Sprites.armored(),
      flagship: SD.Sprites.flagship(),
      shielded: SD.Sprites.shielded(),
      cryo: SD.Sprites.cryo(),
      interceptor: SD.Sprites.interceptor(),
      juggernaut: SD.Sprites.juggernaut(),
      station: SD.Sprites.station(),
      gate: SD.Sprites.gate(),
      turret: {},
    };
    for (const k of SHOP) {
      for (let lv = 1; lv <= 3; lv++) {
        this.spr.turret[k + 'Base' + lv] = SD.Sprites.turretBase(k, lv);
        this.spr.turret[k + 'Head' + lv] = SD.Sprites.turretHead(k, lv);
      }
      this.spr.turret[k + 'Flash'] = SD.Sprites.turretFlash(k);
    }
    this.reset();
    if (opt.shot) this.applyShot(opt.shot);
  }

  setLevel(index) {
    this.levelIndex = Math.max(0, Math.min(SD.CONFIG.levels.length - 1, index | 0));
    this.level = SD.CONFIG.levels[this.levelIndex];
    this.path = buildPath(this.level.path);
    this.waves = this.level.waves;
    this.variant = this.level.variant;
    this.hpMul = this.level.hpMul || 1;
    this._buildGrid = null;
  }

  reset() {
    this.credits = C().startCredits;
    this.hull = C().startHull;
    this.maxHull = C().startHull;
    this.waveIndex = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    this.callClock = 0;
    this.timeScale = SD.timeScale || this.timeScale || 1;
    this.waveGap = C().waveGap || 22;
    this.callAfter = C().callAfter || 3;
    this.groups = [];
    this.spawnT = 0;
    this.turrets = [];
    this.enemies = [];
    this.shots = [];
    this.beams = [];
    this.arcs = [];
    this.pulses = [];
    this.floaters = [];
    this.shop = null;
    this.picked = null;
    this.inspected = null;
    this.paused = false;
    this.over = null;
    this.banner = null;
    this.bossLine = null;
    this.flashGold = 0;
    this.flashHull = 0;
    this.ghost = null;
    this.showcase = false;
    this.score = null;
    this.waveStats = { kills: 0, earned: 0 };
    this.levelStats = { kills: 0, earned: 0, early: 0, t0: 0 };
    this.T = 0;
  }

  wavesLen() { return this.waves.length; }
  earlyBonus(left) { return Math.round(Math.max(0, left) * 2.5); }

  pause(on) {
    if (this.over) return;
    if (on === true || on === false) this.paused = on;
    else this.paused = !this.paused;
  }

  /* ---------- economy / building ---------- */
  costOf(kind) { return C().turrets[kind].cost; }
  canBuild(kind) { return this.credits >= this.costOf(kind); }
  occupyKey(tx, ty) { return tx + ',' + ty; }
  occupied(tx, ty) { return this.turrets.some(t => t.tx === tx && t.ty === ty); }
  onPath(tx, ty) { return this.path.blocked.has(this.occupyKey(tx, ty)); }
  inPlay(tx, ty) {
    const cols = W / TILE, rows = H / TILE;
    if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return false;
    if (ty <= 1 || ty >= 15) return false;
    return true;
  }
  canPlace(tx, ty) { return this.inPlay(tx, ty) && !this.onPath(tx, ty) && !this.occupied(tx, ty); }

  place(tx, ty, kind, level = 1) {
    const conf = C().turrets[kind];
    const p = tileCenter(tx, ty);
    const t = {
      tx, ty, x: p.x, y: p.y, kind, level,
      spent: conf.cost + (level > 1 ? conf.upCost : 0) + (level > 2 ? (conf.upCost2 || 0) : 0),
      cool: 0, ang: -Math.PI / 2, target: null, flash: 0, kick: 0,
    };
    this.turrets.push(t);
    return t;
  }

  nebulaReady() { return this.levelIndex >= 2; }
  hasNebula() { return this.turrets.some(t => t.kind === 'nebula'); }
  canShop(kind) {
    const conf = C().turrets[kind];
    if (!conf) return false;
    if (conf.minLevel != null && this.levelIndex < conf.minLevel) return false;
    if (conf.unique && this.turrets.filter(t => t.kind === kind).length >= (conf.unique || 1)) return false;
    return true;
  }

  tryPlace(tx, ty) {
    if (!this.shop) return false;
    if (!this.canShop(this.shop)) { SD.Audio.deny(); return false; }
    if (!this.canPlace(tx, ty)) { SD.Audio.deny(); return false; }
    if (!this.canBuild(this.shop)) { SD.Audio.deny(); this.flashGold = 0.4; return false; }
    const kind = this.shop;
    this.credits -= this.costOf(kind);
    const turret = this.place(tx, ty, kind, 1);
    this.fx.ring(turret.x, turret.y, C().turrets[kind].rgb, 28, 0.35);
    this.shop = null;
    this.picked = null;
    SD.Audio.place();
    return true;
  }

  upCostOf(t) {
    const conf = C().turrets[t.kind];
    return t.level === 1 ? conf.upCost : conf.upCost2;
  }

  tryUpgrade() {
    const t = this.picked;
    const conf = t && C().turrets[t.kind];
    const cap = (conf && conf.maxLevel) || 3;
    if (!t || t.level >= cap || !conf || !conf.upCost) { SD.Audio.deny(); return; }
    const cost = this.upCostOf(t);
    if (this.credits < cost) { SD.Audio.deny(); this.flashGold = 0.4; return; }
    this.credits -= cost; t.level += 1; t.spent += cost;
    this.fx.ring(t.x, t.y, '255,220,90', 36, 0.4);
    this.fx.burst(t.x, t.y, '255,220,90', 14, 80, 0.4, 2);
    SD.Audio.upgrade();
  }

  trySell() {
    const t = this.picked; if (!t) return;
    const back = Math.round(t.spent * C().sellRefund);
    this.credits += back;
    this.fx.float(t.x, t.y - 12, '+' + back, '255,220,90');
    this.turrets = this.turrets.filter(o => o !== t);
    this.picked = null;
    SD.Audio.sell();
  }

  /* ---------- waves ---------- */
  canCallNext() {
    if (this.over || this.score || this.waveIndex >= this.wavesLen()) return false;
    if (!this.waveActive) return true;
    return this.callClock >= this.callAfter;
  }

  estRemain() {
    let remain = 0;
    for (const e of this.enemies) {
      if (e.dead || e.hp <= 0) continue;
      const spd = Math.max(10, e.speed * (e.slow || 1));
      remain = Math.max(remain, (this.path.total - e.dist) / spd);
    }
    for (const g of this.groups) {
      if (g.left <= 0) continue;
      const typ = C().enemies[g.type];
      const spd = typ ? typ.speed : 50;
      remain = Math.max(remain, Math.max(0, g.wait) + Math.max(0, g.left - 1) * g.gap + this.path.total / Math.max(10, spd));
    }
    return remain;
  }

  startWave() {
    if (this.over || this.score || this.waveIndex >= this.wavesLen()) return;
    if (this.waveActive && this.callClock < this.callAfter) return;
    const w = this.waves[this.waveIndex];
    const incoming = w.groups.map((g, i) => ({ type: g[0], left: g[1], gap: g[2], wait: 0.12 + i * 0.85 }));
    if (this.waveActive) this.groups = this.groups.concat(incoming);
    else this.groups = incoming;
    this.waveActive = true;
    this.waveTimer = 0;
    this.callClock = 0;
    this.spawnT = 0;
    this.waveStats = { kills: 0, earned: 0 };
    this.waveIndex += 1;
    const n = this.waveIndex;
    const last = n >= this.wavesLen();
    this.banner = { text: last ? (w.name + ' DETECTED') : ('WAVE ' + n + '  —  ' + w.name), life: 2.6, rgb: last ? '255,205,90' : '80,170,255' };
    if (last) SD.Audio.boss(); else SD.Audio.wave();
    if (SD.Audio.playWave) SD.Audio.playWave(last ? 9 : n - 1);
  }

  sendWaveEarly() {
    if (this.over || this.score || !this.canCallNext()) {
      if (!this.canCallNext()) SD.Audio.deny();
      return;
    }
    let bonus = 0;
    if (this.waveActive) {
      bonus = this.earlyBonus(Math.min(this.estRemain(), this.waveGap));
    } else if (this.waveTimer > 0) {
      bonus = this.earlyBonus(this.waveTimer);
    }
    this.credits += bonus;
    this.levelStats.early += bonus;
    this.waveTimer = 0;
    if (bonus > 0) this.banner = { text: 'WAVE SENT  +' + bonus + ' CR', life: 1.8, rgb: '255,220,90' };
    this.startWave();
  }

  spawn(type, dist = 0) {
    const def = C().enemies[type];
    const p = posOnPath(this.path, dist);
    const hp = Math.round(def.hp * this.hpMul);
    const sh = def.shield ? Math.round(def.shield * this.hpMul) : 0;
    const e = {
      type, name: def.name, hp, max: hp, shield: sh, maxShield: sh,
      speed: def.speed, reward: def.reward,
      hull: def.hull, r: def.r, rgb: def.rgb, boss: !!def.boss,
      resist: def.resist || {}, weak: def.weak || [], resists: def.resists || [],
      iceImmune: !!def.iceImmune, iceSlowMul: def.iceSlowMul, notes: def.notes || '',
      scale: def.scale || 1, sprite: def.sprite || type,
      dist, x: p.x, y: p.y, ang: p.ang, slow: 1, slowT: 0, stunT: 0, stunCd: 0, freezeT: 0, hitFlash: 0,
    };
    this.enemies.push(e);
    if (e.boss && def.line) this.showBossLine(e.name, def.line);
    return e;
  }

  showBossLine(name, text) {
    const hold = C().bossLineTime || 6;
    this.bossLine = { name, text, life: hold, max: hold };
  }

  dismissBossLine() { this.bossLine = null; }


  kill(e, paid = true) {
    if (!e || e.dead) return;
    e.dead = true; e.hp = 0;
    this._dirtyEn = true;
    const heavy = this.enemies.length > 36 && !e.boss;
    this.fx.burst(e.x, e.y, e.rgb, e.boss ? 48 : (heavy ? 8 : 18), e.boss ? 260 : 160, e.boss ? 1.1 : (heavy ? 0.35 : 0.6), e.boss ? 3.2 : 2);
    if (e.boss || !heavy) this.fx.ring(e.x, e.y, e.rgb, e.boss ? 90 : 32, e.boss ? 0.8 : 0.4);
    if (e.boss || !this._sfxKill || this.T - this._sfxKill > 0.05) {
      SD.Audio.explode(e.boss ? 2.2 : e.type === 'armored' ? 1.3 : 0.8);
      this._sfxKill = this.T;
    }
    if (paid) {
      this.credits += e.reward;
      this.waveStats.kills++;
      this.waveStats.earned += e.reward;
      this.levelStats.kills++;
      this.levelStats.earned += e.reward;
      this.fx.float(e.x, e.y - 10, '+' + e.reward, '255,220,90');
      if (!this._sfxCoin || this.T - this._sfxCoin > 0.04) { SD.Audio.coin(); this._sfxCoin = this.T; }
    }
  }

  leak(e) {
    if (!e || e.dead) return;
    e.dead = true; e.hp = 0;
    this._dirtyEn = true;
    this.hull = Math.max(0, this.hull - e.hull);
    this.flashHull = 0.55;
    this.fx.burst(this.path.base.x, this.path.base.y, '255,70,90', 20, 140, 0.5, 2);
    SD.Audio.leak();
    if (this.hull <= 0) this.end('lose');
  }

  compactEnemies() {
    if (!this._dirtyEn) return;
    this.enemies = this.enemies.filter(e => !e.dead && e.hp > 0);
    this._dirtyEn = false;
  }

  end(kind) {
    this.over = kind;
    this.paused = false;
    this.shop = null;
    this.picked = null;
    if (kind === 'win') {
      if (SD.Audio.playWin) SD.Audio.playWin(); else SD.Audio.win();
    } else {
      if (SD.Audio.playLose) SD.Audio.playLose(); else SD.Audio.lose();
    }
  }

  onWaveCleared() {
    const n = this.waveIndex; // already advanced at start
    const last = n >= this.wavesLen();
    this.shop = null;
    this.picked = null;
    this.callClock = 0;
    if (last) {
      this.openLevelScore();
      return;
    }
    this.waveTimer = this.waveGap;
    this.banner = { text: 'WAVE ' + n + '  CLEARED', life: 2.4, rgb: '80,255,180' };
    if (SD.Audio.stopMusic) SD.Audio.stopMusic({ dur: 0.8 });
  }

  openLevelScore() {
    if (this.over || this.score) return;
    const ratio = this.hull / this.maxHull;
    const stars = ratio >= 0.75 ? 3 : ratio >= 0.4 ? 2 : 1;
    const time = Math.max(0, this.T - (this.levelStats.t0 || 0));
    this.score = {
      level: true,
      name: this.level.name,
      last: this.levelIndex >= SD.CONFIG.levels.length - 1,
      kills: this.levelStats.kills,
      earned: this.levelStats.earned,
      hull: this.hull,
      maxHull: this.maxHull,
      early: this.levelStats.early,
      time,
      stars,
    };
    this.shop = null;
    this.picked = null;
    this.nextBtn = { x: W / 2, y: 456, w: 260, h: 48, label: this.score.last ? 'SECTOR HELD' : 'NEXT LEVEL', rgb: '80,170,255', size: 20 };
    this.menuBtn = { x: W / 2, y: 512, w: 240, h: 44, label: 'MENU', rgb: '255,80,220', size: 18 };
    if (!this.shot) SD.Progress.record(this.levelIndex, stars);
    if (SD.Audio.playScore) SD.Audio.playScore();
  }

  closeLevelScore(toNext) {
    if (!this.score) return;
    const next = toNext && !this.score.last;
    const idx = this.levelIndex;
    this.score = null;
    if (next) SD.start('level', { index: idx + 1 });
    else SD.start('levels');
  }

  maybeWin() {
    if (this.over) return;
    if (this.waveIndex >= this.wavesLen() && !this.waveActive && this.enemies.length === 0 && !this.score) this.openLevelScore();
  }

  /* ---------- combat ---------- */
  stat(t, key) { return C().turrets[t.kind][key][t.level - 1]; }

  firstInRange(t) {
    const r = this.stat(t, 'range');
    let best = null, bestD = -1;
    for (const e of this.enemies) {
      if (e.dead || e.hp <= 0) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d <= r + e.r * 0.3 && e.dist > bestD) { best = e; bestD = e.dist; }
    }
    return best;
  }

  muzzleTip(t) {
    if (t.kind === 'laser') return t.level >= 3 ? 30 : t.level >= 2 ? 28 : 22;
    if (t.kind === 'missile') return t.level >= 3 ? 24 : 22;
    if (t.kind === 'railgun') return t.level >= 3 ? 34 : 30;
    if (t.kind === 'nebula') return 38;
    if (t.kind === 'tesla' || t.kind === 'pulse') return 16;
    return t.level >= 2 ? 16 : 14;
  }

  distToSeg(px, py, x0, y0, x1, y1) {
    const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy || 1;
    let t = ((px - x0) * vx + (py - y0) * vy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x0 + t * vx), py - (y0 + t * vy));
  }

  fire(t, e) {
    t.cool = this.stat(t, 'rate');
    if (e) t.ang = Math.atan2(e.y - t.y, e.x - t.x);
    t.flash = t.kind === 'nebula' ? 0.28 : t.kind === 'railgun' ? 0.18 : t.kind === 'missile' ? 0.16 : t.kind === 'tesla' ? 0.16 : t.kind === 'pulse' ? 0.22 : t.kind === 'ice' ? 0.14 : 0.10;
    t.kick = t.kind === 'nebula' ? 6 : t.kind === 'railgun' ? 5 : t.kind === 'missile' ? 3.2 : t.kind === 'laser' ? 1.6 : 1.2;
    const tip = this.muzzleTip(t);
    const ox = t.x + Math.cos(t.ang) * tip, oy = t.y + Math.sin(t.ang) * tip;
    const dmg = this.stat(t, 'damage');
    if (t.kind === 'laser') this.fireLaser(t, e, ox, oy, dmg);
    else if (t.kind === 'missile') this.launchMissile(t, e, ox, oy, dmg);
    else if (t.kind === 'ice') {
      this.shots.push({
        kind: 'ice', x: ox, y: oy, tx: e.x, ty: e.y, target: e, ang: t.ang, speed: 420,
        dmg, slow: this.stat(t, 'slow'), slowTime: this.stat(t, 'slowTime'),
        freeze: this.stat(t, 'freeze') || 0,
        rgb: C().turrets.ice.rgb, life: 1.6, r: 4,
      });
      SD.Audio.ice();
    } else if (t.kind === 'railgun') this.fireRail(t, ox, oy, dmg);
    else if (t.kind === 'tesla') this.fireTesla(t, e, dmg);
    else if (t.kind === 'pulse') this.firePulse(t, dmg);
    else if (t.kind === 'nebula') this.fireNebula(t, ox, oy, dmg);
  }

  fireLaser(t, e, ox, oy, dmg) {
    const rgb = C().turrets.laser.rgb;
    this.beams.push({ x0: ox, y0: oy, x1: e.x, y1: e.y, rgb, life: 0.1, max: 0.1 });
    this.hurt(e, dmg, 'laser');
    if (t.level >= 3) {
      const r = this.stat(t, 'range');
      const other = this.enemies.find(x => x !== e && x.hp > 0 && Math.hypot(x.x - t.x, x.y - t.y) <= r + x.r);
      const tgt = other || e;
      const ox2 = t.x + Math.cos(t.ang + 0.2) * this.muzzleTip(t);
      const oy2 = t.y + Math.sin(t.ang + 0.2) * this.muzzleTip(t);
      this.beams.push({ x0: ox2, y0: oy2, x1: tgt.x, y1: tgt.y, rgb, life: 0.1, max: 0.1 });
      this.hurt(tgt, dmg, 'laser');
    }
    SD.Audio.laser();
  }

  launchMissile(t, e, ox, oy, dmg) {
    const conf = C().turrets.missile;
    this.shots.push({
      kind: 'missile', x: ox, y: oy, tx: e.x, ty: e.y, target: e,
      ang: t.ang, speed: conf.speed[t.level - 1], dmg, splash: conf.splash[t.level - 1],
      splashMul: conf.splashMul[t.level - 1], cluster: this.stat(t, 'cluster') || 0,
      rgb: conf.rgb, life: 2.4, r: 5,
    });
    SD.Audio.missile();
  }

  fireRail(t, ox, oy, dmg) {
    const pierce = this.stat(t, 'pierce') || 3;
    const range = this.stat(t, 'range');
    const ang = t.ang;
    const x1 = t.x + Math.cos(ang) * range, y1 = t.y + Math.sin(ang) * range;
    const hits = [];
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (this.distToSeg(e.x, e.y, ox, oy, x1, y1) > e.r + 7) continue;
      const along = (e.x - t.x) * Math.cos(ang) + (e.y - t.y) * Math.sin(ang);
      if (along > 0 && along <= range + e.r) hits.push({ e, along });
    }
    hits.sort((a, b) => a.along - b.along);
    const n = pierce >= 90 ? hits.length : pierce;
    hits.slice(0, n).forEach(h => this.hurt(h.e, dmg, 'railgun'));
    this.beams.push({ x0: ox, y0: oy, x1, y1, rgb: C().turrets.railgun.rgb, life: 0.14, max: 0.14, thick: 3.2 });
    SD.Audio.laser();
  }

  fireNebula(t, ox, oy, dmg) {
    const pierce = this.stat(t, 'pierce') || 99;
    const range = this.stat(t, 'range');
    const ang = t.ang;
    const x1 = t.x + Math.cos(ang) * range, y1 = t.y + Math.sin(ang) * range;
    const hits = [];
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (this.distToSeg(e.x, e.y, ox, oy, x1, y1) > e.r + 10) continue;
      const along = (e.x - t.x) * Math.cos(ang) + (e.y - t.y) * Math.sin(ang);
      if (along > 0 && along <= range + e.r) hits.push({ e, along });
    }
    hits.sort((a, b) => a.along - b.along);
    const n = pierce >= 90 ? hits.length : pierce;
    hits.slice(0, n).forEach(h => this.hurt(h.e, dmg, 'nebula'));
    const rgb = C().turrets.nebula.rgb;
    this.beams.push({ x0: ox, y0: oy, x1, y1, rgb, life: 0.22, max: 0.22, thick: 6.5 });
    this.beams.push({ x0: ox, y0: oy, x1, y1, rgb: '230,180,255', life: 0.16, max: 0.16, thick: 2.2 });
    this.fx.burst(ox, oy, rgb, 10, 70, 0.25, 1.6);
    SD.Audio.laser();
  }

  fireTesla(t, e, dmg) {
    const chain = this.stat(t, 'chain') || 3;
    const jump = this.stat(t, 'jump') || 70;
    const seen = new Set();
    const nodes = [];
    let cur = e;
    for (let i = 0; i < chain && cur; i++) {
      seen.add(cur);
      nodes.push({ x: cur.x, y: cur.y });
      this.hurt(cur, dmg, 'tesla');
      let best = null, bestD = jump;
      for (const o of this.enemies) {
        if (seen.has(o) || o.hp <= 0) continue;
        const d = Math.hypot(o.x - cur.x, o.y - cur.y);
        if (d < bestD) { best = o; bestD = d; }
      }
      cur = best;
    }
    this.arcs.push({ pts: nodes, ox: t.x, oy: t.y, life: 0.16, max: 0.16, rgb: C().turrets.tesla.rgb });
    SD.Audio.laser();
  }

  firePulse(t, dmg) {
    const r = this.stat(t, 'range');
    // Stun is MK III only (config stun is 0 / 0 / 0.4). MK I–II never slow or stop ships.
    const stun = t.level >= 3 ? (this.stat(t, 'stun') || 0) : 0;
    this.pulses.push({ x: t.x, y: t.y, r: 8, maxR: r, life: 0.28, max: 0.28, rgb: C().turrets.pulse.rgb });
    for (const e of this.enemies) {
      if (e.dead || e.hp <= 0) continue;
      if (Math.hypot(e.x - t.x, e.y - t.y) <= r + e.r) {
        this.hurt(e, dmg, 'pulse');
        if (stun > 0) this.applyStun(e, stun);
      }
    }
    SD.Audio.explode(0.7);
  }

  applyStun(e, time) {
    if (!e || time <= 0 || e.dead || e.hp <= 0) return;
    if (e.boss) return; // bosses are immune
    if ((e.stunCd || 0) > 0) return;
    e.stunT = Math.max(e.stunT || 0, time);
    e.stunCd = C().turrets.pulse.stunCooldown || 3;
  }

  floater(e, text, rgb) {
    if (!e || !this.floaters) return;
    this.floaters.push({ x: e.x, y: e.y - (e.r || 12) - 8, text, rgb, life: 0.7, max: 0.7 });
    if (this.floaters.length > 24) this.floaters.shift();
  }

  hurt(e, dmg, kind) {
    if (!e || e.hp <= 0) return;
    const conf = kind && C().turrets[kind];
    const pure = !!(conf && conf.ignoreResist);
    let mul = 1;
    if (!pure && kind && e.resist && e.resist[kind] != null) mul = e.resist[kind];
    let applied = dmg * mul;
    if (e.shield > 0 && !pure) {
      if (kind === 'tesla' || kind === 'pulse') {
        if (applied >= e.shield) {
          applied -= e.shield;
          e.shield = 0;
          this.fx.ring(e.x, e.y, '80,220,255', e.r + 16, 0.3);
        } else {
          e.shield -= applied;
          applied = 0;
        }
      } else {
        let sDmg = applied * 0.06;
        if (sDmg >= e.shield) {
          applied = sDmg - e.shield;
          e.shield = 0;
          this.fx.ring(e.x, e.y, '80,220,255', e.r + 16, 0.3);
        } else {
          e.shield -= sDmg;
          applied = 0;
        }
      }
    }
    if (pure && e.shield > 0) {
      e.shield = 0;
      this.fx.ring(e.x, e.y, '180,80,255', e.r + 16, 0.28);
    }
    if (mul < 0.9) this.floater(e, 'RESIST', '255,120,90');
    else if (mul > 1.15) this.floater(e, 'WEAK', '80,255,140');
    else if (pure && applied > 0) this.floater(e, String(Math.max(1, Math.round(applied))), '200,140,255');
    else if (applied > 0) this.floater(e, String(Math.max(1, Math.round(applied))), '230,235,255');
    e.hitFlash = 0.12;
    if (applied > 0) e.hp -= applied;
    if (e.hp <= 0) this.kill(e, true);
  }

  boom(x, y, dmg, radius, mul, rgb, cluster) {
    this.fx.ring(x, y, rgb, radius, 0.35);
    this.fx.burst(x, y, rgb, 16, 140, 0.4, 2);
    SD.Audio.explode(1.1);
    for (const e of [...this.enemies]) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d <= radius + e.r) this.hurt(e, dmg * (d < 12 ? 1 : mul), 'missile');
    }
    if (cluster) {
      for (let i = 0; i < cluster; i++) {
        const a = (i / cluster) * Math.PI * 2 + 0.2;
        const r = 26 + (i % 2) * 12;
        const bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r;
        this.fx.burst(bx, by, rgb, 10, 90, 0.28, 1.6);
        for (const e of [...this.enemies]) {
          const d = Math.hypot(e.x - bx, e.y - by);
          if (d <= 28 + e.r) this.hurt(e, dmg * 0.4, 'missile');
        }
      }
    }
  }

  applySlow(e, factor, time) {
    if (!e) return;
    if (e.iceImmune) { this.floater(e, 'IMMUNE', '120,220,255'); return; }
    let f = factor;
    const mul = e.iceSlowMul || 1;
    if (mul !== 1) {
      f = 1 - (1 - factor) * mul;
      f = Math.max(0.12, Math.min(1, f));
    }
    if (f < e.slow) e.slow = f;
    e.slowT = Math.max(e.slowT, time);
  }

  applyFreeze(e, time) {
    if (!e || time <= 0) return;
    if (e.iceImmune) { this.floater(e, 'IMMUNE', '120,220,255'); return; }
    if (e.iceSlowMul && e.iceSlowMul < 1) time *= e.iceSlowMul;
    e.freezeT = Math.max(e.freezeT || 0, time);
  }

  cycleSpeed() {
    const cur = this.timeScale || 1;
    this.timeScale = cur >= 3 ? 1 : cur + 1;
    SD.timeScale = this.timeScale;
    SD.Audio.click();
  }

  /* ---------- update ---------- */
  update(dt) {
    this.handleInput();
    if (this.paused || this.over || this.score) {
      this.T += dt;
      this.stars.update(dt);
      if (this.flashGold > 0) this.flashGold -= dt;
      if (this.flashHull > 0) this.flashHull -= dt;
      if (this.banner) { this.banner.life -= dt; if (this.banner.life <= 0) this.banner = null; }
      if (this.bossLine) { this.bossLine.life -= dt; if (this.bossLine.life <= 0) this.bossLine = null; }
      return;
    }
    const scale = this.timeScale || 1;
    let left = dt * scale;
    const cap = 1 / 20;
    while (left > 0) {
      const step = Math.min(cap, left);
      this.simStep(step);
      left -= step;
    }
  }

  simStep(dt) {
    this.T += dt;
    this.stars.update(dt);
    if (this.flashGold > 0) this.flashGold -= dt;
    if (this.flashHull > 0) this.flashHull -= dt;
    if (this.banner) { this.banner.life -= dt; if (this.banner.life <= 0) this.banner = null; }
    if (this.bossLine) { this.bossLine.life -= dt; if (this.bossLine.life <= 0) this.bossLine = null; }

    this.fx.update(dt);

    if (!this.waveActive && this.waveTimer > 0 && !this.over) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.waveTimer = 0;
        this.startWave();
      }
    }

    if (this.waveActive) {
      this.callClock += dt;
      let pending = false;
      for (const g of this.groups) {
        if (g.left <= 0) continue;
        pending = true;
        g.wait -= dt;
        while (g.left > 0 && g.wait <= 0) {
          this.spawn(g.type);
          g.left--;
          g.wait += g.gap;
        }
      }
      this.compactEnemies();
      if (!pending && this.enemies.length === 0) {
        this.waveActive = false;
        this.onWaveCleared();
      }
    }

    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 1; }
      if (e.freezeT > 0) e.freezeT -= dt;
      if (e.stunT > 0) e.stunT -= dt;
      if (e.stunCd > 0) e.stunCd -= dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (!(e.freezeT > 0 || e.stunT > 0)) e.dist += e.speed * e.slow * dt;
      const p = posOnPath(this.path, e.dist);
      e.x = p.x; e.y = p.y; e.ang = p.ang;
      if (e.dist >= this.path.total) this.leak(e);
    }
    this.compactEnemies();
    if (this.inspected && (this.inspected.hp <= 0 || this.inspected.dead)) this.inspected = null;

    for (const t of this.turrets) {
      if (t.cool > 0) t.cool -= dt;
      if (t.flash > 0) t.flash -= dt;
      if (t.kick > 0) t.kick = Math.max(0, t.kick - 20 * dt);
      const e = this.firstInRange(t);
      t.target = e;
      if (e) {
        const want = Math.atan2(e.y - t.y, e.x - t.x);
        let d = want - t.ang; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        t.ang += Math.max(-8 * dt, Math.min(8 * dt, d));
        if (t.cool <= 0) {
          if (t.kind === 'pulse') this.fire(t, e);
          else if (Math.abs(d) < (t.kind === 'railgun' ? 0.16 : 0.45)) this.fire(t, e);
        }
      }
    }

    for (const s of this.shots) {
      if (s.target && s.target.hp > 0) { s.tx = s.target.x; s.ty = s.target.y; }
      const ang = Math.atan2(s.ty - s.y, s.tx - s.x);
      let d = ang - s.ang; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      s.ang += Math.max(-7 * dt, Math.min(7 * dt, d));
      s.x += Math.cos(s.ang) * s.speed * dt;
      s.y += Math.sin(s.ang) * s.speed * dt;
      s.life -= dt;
      const hitR = (s.target && s.target.hp > 0 ? s.target.r : 8) + s.r;
      if (Math.hypot(s.tx - s.x, s.ty - s.y) < hitR || s.life <= 0) {
        s.dead = true;
        if (s.kind === 'missile') this.boom(s.x, s.y, s.dmg, s.splash, s.splashMul, s.rgb, s.cluster);
        else if (s.target && s.target.hp > 0 && Math.hypot(s.target.x - s.x, s.target.y - s.y) < hitR + 8) {
          this.hurt(s.target, s.dmg, 'ice');
          this.applySlow(s.target, s.slow, s.slowTime);
          this.applyFreeze(s.target, s.freeze);
          this.fx.burst(s.x, s.y, s.rgb, 8, 70, 0.3, 1.6);
        }
      }
    }
    this.shots = this.shots.filter(s => !s.dead);
    this.compactEnemies();

    for (const b of this.beams) b.life -= dt;
    this.beams = this.beams.filter(b => b.life > 0);
    for (const a of this.arcs) a.life -= dt;
    this.arcs = this.arcs.filter(a => a.life > 0);
    for (const p of this.pulses) p.life -= dt;
    this.pulses = this.pulses.filter(p => p.life > 0);
    for (const f of this.floaters) { f.life -= dt; f.y -= 28 * dt; }
    this.floaters = this.floaters.filter(f => f.life > 0);
  }

  handleInput() {
    if (SD.Input.hit('KeyM')) { SD.Audio.toggleMute(); SD.Audio.click(); }
    if (this.bossLine && !this.score && !this.over) {
      if (SD.Input.confirm() || SD.Input.hit('Escape') || SD.Input.takeClicks().length) {
        this.dismissBossLine();
        SD.Audio.click();
        return;
      }
    }
    if (this.score) {
      if (SD.Input.confirm()) { SD.Audio.click(); this.closeLevelScore(true); return; }
      if (SD.Input.hit('Escape')) { SD.Audio.click(); this.closeLevelScore(false); return; }
      for (const p of SD.Input.takeClicks()) {
        if (this.nextBtn && SD.inBtn(this.nextBtn, p)) { SD.Audio.click(); this.closeLevelScore(true); }
        else if (this.menuBtn && SD.inBtn(this.menuBtn, p)) { SD.Audio.click(); this.closeLevelScore(false); }
      }
      return;
    }
    if (this.over) {
      for (const p of SD.Input.takeClicks()) this.clickOverlay(p);
      if (SD.Input.confirm()) { SD.Audio.click(); SD.start('level', { index: this.levelIndex }); }
      if (SD.Input.hit('Escape')) { SD.Audio.click(); SD.start('title'); }
      return;
    }
    if (SD.Input.hit('KeyP') || SD.Input.hit('Escape')) { this.pause(); SD.Audio.click(); }
    if (this.paused) {
      for (const p of SD.Input.takeClicks()) this.clickPause(p);
      return;
    }
    SHOP.forEach((k, i) => {
      if (SD.Input.hit('Digit' + (i + 1)) || SD.Input.hit('Numpad' + (i + 1))) this.toggleShop(k);
    });
    if (SD.Input.hit('KeyF')) this.cycleSpeed();
    if (SD.Input.hit('KeyU')) this.tryUpgrade();
    if (SD.Input.hit('KeyX') || SD.Input.hit('Backspace') || SD.Input.hit('Delete')) this.trySell();
    if (SD.Input.hit('Space') || SD.Input.hit('KeyG')) this.sendWaveEarly();

    const ui = this.uiButtons();
    for (const p of SD.Input.takeClicks()) {
      let hit = false;
      for (const b of ui) if (SD.inBtn(b, p)) { b.click(); hit = true; break; }
      if (hit) continue;
      if (inHud(p)) continue;
      const { tx, ty } = tileAt(p.x, p.y);
      const existing = this.turrets.find(t => t.tx === tx && t.ty === ty);
      const ship = this.enemies.find(en => Math.hypot(en.x - p.x, en.y - p.y) <= en.r + 12);
      if (existing) {
        this.picked = existing;
        this.shop = null;
        this.inspected = null;
        SD.Audio.click();
      } else if (ship) {
        this.inspected = ship;
        this.picked = null;
        SD.Audio.click();
      } else if (this.shop) {
        this.tryPlace(tx, ty);
      } else {
        this.picked = null;
        this.inspected = null;
      }
    }
  }

  toggleShop(kind) {
    this.shop = this.shop === kind ? null : kind;
    if (this.shop) this.picked = null;
    SD.Audio.click();
  }

  uiButtons() {
    const y = H - 43;
    const btns = [];
    const mk = (x, w, label, sub, rgb, click, disabled, id) => {
      btns.push({ x, y, w, h: 62, label, sub, rgb, size: 15, click, disabled, id });
    };
    for (const [i, k] of SHOP.entries()) {
      const conf = C().turrets[k];
      const locked = conf.minLevel != null && this.levelIndex < conf.minLevel;
      const used = !locked && conf.unique && this.turrets.some(t => t.kind === k);
      const noGold = this.credits < conf.cost;
      const sub = locked ? 'LEVEL 3' : used ? 'USED' : (conf.cost + ' CR');
      const b = { x: 44 + i * 76, y, w: 72, h: 62, label: conf.short, sub, rgb: conf.rgb, size: 13, click: () => this.toggleShop(k), disabled: locked || used || noGold, id: k };
      if (locked) b.tag = 'LEVEL 3';
      btns.push(b);
    }
    if (this.picked) {
      const t = this.picked, conf = C().turrets[t.kind];
      const cap = (conf && conf.maxLevel) || 3;
      if (t.level < cap && conf && conf.upCost) {
        const cost = this.upCostOf(t);
        const no = this.credits < cost;
        mk(610, 100, 'UPGRADE', cost + ' CR', '255,220,90', () => this.tryUpgrade(), no, 'up');
      } else {
        mk(610, 100, 'MAXED', cap <= 1 ? 'UNIQUE' : 'MK III', '255,220,90', () => SD.Audio.deny(), true, 'up');
      }
      const back = Math.round(t.spent * C().sellRefund);
      mk(708, 88, 'SELL', '+' + back + ' CR', '255,110,140', () => this.trySell(), false, 'sell');
    }
    const last = this.waveIndex >= this.wavesLen();
    const waiting = !this.waveActive && this.waveTimer > 0;
    const canCall = this.canCallNext();
    const midCall = this.waveActive && canCall;
    const waveLbl = midCall ? 'SEND NEXT' : this.waveActive ? 'INCOMING' : waiting ? 'SEND WAVE' : (last || this.score) ? 'CLEARED' : 'START WAVE';
    const left = this.enemies.length + this.groups.reduce((n, g) => n + g.left, 0);
    const midBonus = midCall ? this.earlyBonus(Math.min(this.estRemain(), this.waveGap)) : 0;
    const waveSub = midCall
      ? ('+' + midBonus + ' CR')
      : this.waveActive
      ? left + ' LEFT'
      : waiting ? ('+' + this.earlyBonus(this.waveTimer) + ' CR')
      : this.score ? this.level.name
      : last ? 'CLEAR' : ('WAVE ' + (this.waveIndex + 1) + ' / ' + this.wavesLen());
    mk(880, 136, waveLbl, waveSub, midCall ? '255,220,90' : this.waveActive ? '255,80,220' : '80,255,160', () => {
      if (!canCall || last) SD.Audio.deny(); else this.sendWaveEarly();
    }, !canCall || last, 'wave');

    btns.push({ x: W - 168, y: 24, w: 64, h: 28, label: 'x' + (this.timeScale || 1), rgb: '255,220,120', size: 14, click: () => this.cycleSpeed(), id: 'speed' });
    btns.push({ x: W - 100, y: 24, w: 64, h: 28, label: 'PAUSE', rgb: '180,200,255', size: 12, click: () => { this.pause(); SD.Audio.click(); }, id: 'pause' });
    btns.push({ x: W - 34, y: 24, w: 52, h: 28, label: SD.Audio.muted ? 'MUTED' : 'MUTE', rgb: '180,200,255', size: 12, click: () => { SD.Audio.toggleMute(); SD.Audio.click(); }, id: 'mute' });
    return btns;
  }

  clickPause(p) {
    const resume = { x: W / 2, y: 300, w: 240, h: 50, label: 'RESUME' };
    const menu = { x: W / 2, y: 366, w: 240, h: 50, label: 'MENU' };
    if (SD.inBtn(resume, p) || Math.hypot(p.x - W / 2, p.y - 288) < 10) { this.paused = false; SD.Audio.click(); }
    else if (SD.inBtn(menu, p)) { SD.Audio.click(); SD.start('title'); }
  }

  clickOverlay(p) {
    const again = { x: W / 2, y: 340, w: 260, h: 52 };
    const menu = { x: W / 2, y: 406, w: 260, h: 52 };
    if (SD.inBtn(again, p)) { SD.Audio.click(); SD.start('level', { index: this.levelIndex }); }
    else if (SD.inBtn(menu, p)) { SD.Audio.click(); SD.start('title'); }
  }

  /* ---------- draw ---------- */
  draw(g) {
    if (this.showcase === 'ships') { this.drawShipShowcase(g); return; }
    if (this.showcase) { this.drawShowcase(g); return; }
    SD.drawSpaceBg(g, this.variant);
    this.stars.draw(g, this.T);
    this.drawPath(g);
    this.drawBuildGrid(g);
    // gate & station
    SD.glow(g, this.path.spawn.x, this.path.spawn.y, 40, 50, '255,80,220', 0.22 + 0.08 * Math.sin(this.T * 4));
    SD.blit(g, this.spr.gate, this.path.spawn.x - 6, this.path.spawn.y, 0, 1);
    SD.glow(g, this.path.base.x, this.path.base.y, 50, 50, '80,170,255', 0.18 + 0.06 * Math.sin(this.T * 2));
    SD.blit(g, this.spr.station, this.path.base.x + 6, this.path.base.y, 0, 1);

    this.drawGhost(g);

    for (const t of this.turrets) this.drawTurret(g, t);
    for (const b of this.beams) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const a = b.life / b.max;
      g.strokeStyle = `rgba(${b.rgb},${0.25 + 0.75 * a})`; g.lineWidth = (b.thick || 1.6) + 1.4 * a;
      g.shadowColor = `rgba(${b.rgb},1)`; g.shadowBlur = 10 * SD.view.scale;
      g.beginPath(); g.moveTo(b.x0, b.y0); g.lineTo(b.x1, b.y1); g.stroke();
      g.restore();
    }
    for (const a of this.arcs) this.drawArc(g, a);
    for (const p of this.pulses) this.drawPulseRing(g, p);
    for (const s of this.shots) this.drawShot(g, s);
    for (const e of this.enemies) this.drawEnemy(g, e);
    this.fx.draw(g);
    this.drawFloaters(g);
    this.drawEnemyInfo(g);

    this.drawHud(g);
    if (this.banner && !this.bossLine) {
      const a = Math.min(1, this.banner.life, (2.6 - this.banner.life) * 3);
      SD.neonText(g, this.banner.text, W / 2, 96, this.banner.text.length > 22 ? 22 : 28, this.banner.rgb, { alpha: a, blur: 18 });
    }
    if (this.bossLine) this.drawBossLine(g);
    if (this.score) this.drawScore(g);
    if (this.paused && !this.over && !this.score) this.drawPause(g);
    if (this.over) this.drawOver(g);
    SD.drawScanlines(g);
  }

  drawPath(g) {
    const pts = this.path.pts;
    g.save();
    g.lineJoin = 'round'; g.lineCap = 'round';
    // outer glow lane
    g.strokeStyle = 'rgba(80,140,255,0.18)'; g.lineWidth = 36;
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
    g.strokeStyle = 'rgba(20,16,48,0.72)'; g.lineWidth = 26;
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
    g.strokeStyle = 'rgba(80,200,255,0.35)'; g.lineWidth = 2;
    g.setLineDash([10, 10]); g.lineDashOffset = -this.T * 24;
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
    g.setLineDash([]);
    g.restore();
  }

  hoverTile() {
    if (this.ghost) return this.ghost;
    if (!this.shop || !SD.Input.mouse.over) return null;
    if (inHud(SD.Input.mouse)) return null;
    return tileAt(SD.Input.mouse.x, SD.Input.mouse.y);
  }

  /* Subtle build pads on every in-play, off-path tile (including occupied ones). Cached. */
  drawBuildGrid(g) {
    if (!this._buildGrid) {
      this._buildGrid = SD.mkCanvas(W, H);
      const c = this._buildGrid.getContext('2d');
      const gap = 5, s = TILE - gap, cols = W / TILE;
      for (let ty = 2; ty <= 14; ty++) for (let tx = 0; tx < cols; tx++) {
        if (!this.inPlay(tx, ty) || this.onPath(tx, ty)) continue;
        const p = tileCenter(tx, ty);
        const x = p.x - s / 2, y = p.y - s / 2;
        SD.roundRect(c, x, y, s, s, 3);
        c.fillStyle = 'rgba(80,170,255,0.07)';
        c.fill();
        c.strokeStyle = 'rgba(120,210,255,0.22)';
        c.lineWidth = 1;
        c.stroke();
      }
    }
    g.drawImage(this._buildGrid, 0, 0);
  }

  drawGhost(g) {
    const hover = this.hoverTile();
    if (this.shop && hover && this.inPlay(hover.tx, hover.ty)) {
      const p = tileCenter(hover.tx, hover.ty);
      const ok = this.canPlace(hover.tx, hover.ty);
      const conf = C().turrets[this.shop];
      const range = conf.range[0];
      g.save();
      g.beginPath(); g.arc(p.x, p.y, range, 0, Math.PI * 2);
      g.fillStyle = ok ? `rgba(${conf.rgb},0.08)` : 'rgba(255,60,80,0.08)';
      g.fill();
      g.strokeStyle = ok ? `rgba(${conf.rgb},0.55)` : 'rgba(255,60,80,0.6)';
      g.lineWidth = 1.4; g.stroke();
      g.restore();
      g.save(); g.globalAlpha = 0.75;
      this.drawTurretAt(g, { kind: this.shop, level: 1, x: p.x, y: p.y, ang: -Math.PI / 2, flash: 0, kick: 0 }, 1);
      g.restore();
    }
    if (this.picked) {
      const t = this.picked, range = this.stat(t, 'range'), rgb = C().turrets[t.kind].rgb;
      g.save();
      g.beginPath(); g.arc(t.x, t.y, range, 0, Math.PI * 2);
      g.fillStyle = `rgba(${rgb},0.08)`; g.fill();
      g.strokeStyle = `rgba(${rgb},0.55)`; g.lineWidth = 1.4; g.stroke();
      g.restore();
    }
  }

  drawTurret(g, t, scale = 1) {
    if (scale === 1 && this.picked === t) {
      g.save();
      g.beginPath(); g.arc(t.x, t.y, 22, 0, Math.PI * 2);
      g.strokeStyle = 'rgba(255,220,90,0.9)'; g.lineWidth = 2;
      g.shadowColor = 'rgba(255,220,90,1)'; g.shadowBlur = 10 * SD.view.scale; g.stroke();
      g.restore();
    }
    this.drawTurretAt(g, t, scale);
  }

  drawTurretAt(g, t, scale = 1) {
    const lv = t.level || 1;
    const base = this.spr.turret[t.kind + 'Base' + lv];
    const head = this.spr.turret[t.kind + 'Head' + lv];
    SD.blit(g, base, t.x, t.y, 0, scale);
    const kick = t.kick || 0;
    const hx = t.x - Math.cos(t.ang) * kick * scale;
    const hy = t.y - Math.sin(t.ang) * kick * scale;
    SD.blit(g, head, hx, hy, t.ang + Math.PI / 2, scale);
    if (t.flash > 0) {
      const tip = this.muzzleTip(t) * scale;
      const fl = this.spr.turret[t.kind + 'Flash'];
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(1, t.flash / 0.07);
      SD.blit(g, fl, t.x + Math.cos(t.ang) * tip, t.y + Math.sin(t.ang) * tip, t.ang + Math.PI / 2, scale);
      g.restore();
    }
  }

  drawShot(g, s) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(s.x, s.y); g.rotate(s.ang);
    if (s.kind === 'missile') {
      g.fillStyle = `rgba(${s.rgb},1)`;
      g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -3.2); g.lineTo(-5, 3.2); g.closePath(); g.fill();
      SD.glow(g, -6, 0, 8, 5, '255,140,40', 0.55);
    } else {
      g.fillStyle = `rgba(${s.rgb},1)`;
      g.beginPath(); g.arc(0, 0, 3.2, 0, Math.PI * 2); g.fill();
      SD.glow(g, 0, 0, 10, 10, s.rgb, 0.5);
    }
    g.restore();
  }

  drawArc(g, a) {
    const al = a.life / a.max;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(${a.rgb},${0.35 + 0.65 * al})`; g.lineWidth = 2;
    g.shadowColor = `rgba(${a.rgb},1)`; g.shadowBlur = 8 * SD.view.scale;
    g.beginPath();
    let ax = a.ox, ay = a.oy;
    g.moveTo(ax, ay);
    for (const pt of a.pts) {
      const jx = (pt.x + ax) / 2 + (Math.random() - 0.5) * 10;
      const jy = (pt.y + ay) / 2 + (Math.random() - 0.5) * 10;
      g.lineTo(jx, jy); g.lineTo(pt.x, pt.y);
      ax = pt.x; ay = pt.y;
    }
    g.stroke();
    g.restore();
  }

  drawPulseRing(g, p) {
    const k = 1 - p.life / p.max;
    const r = p.r + (p.maxR - p.r) * k;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(${p.rgb},${0.7 * (1 - k)})`; g.lineWidth = 3;
    g.shadowColor = `rgba(${p.rgb},1)`; g.shadowBlur = 12 * SD.view.scale;
    g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.stroke();
    g.restore();
  }

  drawFloaters(g) {
    for (const f of this.floaters) {
      const a = Math.min(1, f.life / 0.2, f.life);
      SD.neonText(g, f.text, f.x, f.y, 11, f.rgb, { blur: 6, alpha: a });
    }
  }

  drawEnemy(g, e) {
    if (e.dead) return;
    const spr = this.spr[e.sprite || e.type] || this.spr.fighter;
    const scale = e.scale || 1;
    const busy = this.enemies.length > 36;
    if (!busy && (e.slow < 0.99 || e.freezeT > 0)) SD.glow(g, e.x, e.y, e.r + 10, e.r + 10, '140,230,255', 0.28);
    if (e.stunT > 0) SD.glow(g, e.x, e.y, e.r + 12, e.r + 12, '80,255,180', 0.22);
    if (e.shield > 0) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const pulse = 0.35 + 0.15 * Math.sin(this.T * 4);
      g.strokeStyle = `rgba(100,220,255,${pulse})`; g.lineWidth = 2;
      g.beginPath(); g.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2); g.stroke();
      g.fillStyle = `rgba(80,180,255,${0.08 + 0.04 * Math.sin(this.T * 3)})`;
      g.beginPath(); g.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    if (e.hitFlash > 0) { g.save(); g.globalCompositeOperation = 'lighter'; }
    SD.blit(g, spr, e.x, e.y, e.ang, scale);
    if (e.hitFlash > 0) g.restore();
    const bw = e.boss ? 86 : Math.max(18, e.r * 2.2), bh = e.boss ? 5 : 3;
    const bx = e.x - bw / 2, by = e.y - (e.boss ? 44 * (e.scale || 1) : e.r + 12);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const pct = Math.max(0, e.hp / e.max);
    g.fillStyle = pct > 0.5 ? '#5cff9a' : pct > 0.25 ? '#ffd25a' : '#ff5a6a';
    g.fillRect(bx, by, bw * pct, bh);
    if (e.maxShield) {
      const sy = by - 5;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(bx - 1, sy - 1, bw + 2, 4);
      g.fillStyle = '#6ad8ff';
      g.fillRect(bx, sy, bw * Math.max(0, e.shield / e.maxShield), 3);
    }
    if (e.boss) SD.neonText(g, e.name.toUpperCase(), e.x, by - 12, 11, '255,205,90', { blur: 8 });
    if (this.inspected === e) {
      g.save();
      g.strokeStyle = 'rgba(255,240,180,0.85)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(e.x, e.y, e.r + 14, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
  }

  drawEnemyInfo(g) {
    const e = this.inspected;
    if (!e || e.hp <= 0) return;
    const lines = [];
    lines.push(e.name.toUpperCase());
    lines.push('HP  ' + Math.max(0, Math.ceil(e.hp)) + ' / ' + e.max);
    if (e.maxShield) lines.push('SHIELD  ' + Math.max(0, Math.ceil(e.shield)) + ' / ' + e.maxShield);
    if (e.weak && e.weak.length) lines.push('WEAK  ' + e.weak.join(', '));
    if (e.resists && e.resists.length) lines.push('RESISTS  ' + e.resists.join(', '));
    if (e.iceImmune) lines.push('IMMUNE TO ICE');
    if (e.notes) lines.push(e.notes);
    const w = 268, h = 28 + lines.length * 18;
    let x = Math.min(W - 16 - w, Math.max(16, e.x + 24));
    let y = Math.min(H - C().hud.bottom - 16 - h, Math.max(56, e.y - h / 2));
    g.save();
    SD.roundRect(g, x, y, w, h, 8);
    g.fillStyle = 'rgba(8,10,20,0.92)'; g.fill();
    g.strokeStyle = 'rgba(200,220,255,0.45)'; g.lineWidth = 1.2; g.stroke();
    g.restore();
    lines.forEach((ln, i) => {
      const rgb = i === 0 ? '255,230,140' : (ln.startsWith('WEAK') ? '80,255,160' : ln.startsWith('RESIST') || ln.startsWith('IMMUNE') ? '255,140,110' : '220,230,245');
      SD.neonText(g, ln, x + 14, y + 18 + i * 18, i === 0 ? 13 : 12, rgb, { blur: 5, align: 'left' });
    });
  }

  wrapLine(g, text, maxW) {
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  drawBossLine(g) {
    const q = this.bossLine; if (!q) return;
    const fadeIn = Math.min(1, (q.max - q.life) * 4);
    const fadeOut = Math.min(1, q.life * 4);
    const a = Math.min(fadeIn, fadeOut);
    g.save();
    g.font = 'bold 16px ' + (SD.CONFIG.font || 'sans-serif');
    const lines = this.wrapLine(g, q.text, 700);
    const w = 760, h = 86 + lines.length * 22;
    const x = (W - w) / 2, y = 118;
    g.globalAlpha = 0.94 * a;
    SD.roundRect(g, x, y, w, h, 12);
    g.fillStyle = 'rgba(8,10,20,0.94)'; g.fill();
    g.strokeStyle = 'rgba(255,205,90,0.7)'; g.lineWidth = 1.6; g.stroke();
    g.restore();
    SD.neonText(g, 'EDISAR STARLIGHT', W / 2, y + 22, 13, '255,205,90', { blur: 8, alpha: a });
    SD.neonText(g, q.name.toUpperCase(), W / 2, y + 42, 11, '200,210,230', { blur: 5, alpha: a * 0.9 });
    lines.forEach((ln, i) => {
      SD.neonText(g, ln, W / 2, y + 68 + i * 22, 16, '230,235,245', { blur: 6, alpha: a });
    });
    const hint = SD.Input.touchMode ? 'TAP TO DISMISS' : 'TAP  ·  SPACE  TO DISMISS';
    SD.neonText(g, hint, W / 2, y + h - 16, 11, '180,200,220', { blur: 5, alpha: 0.55 * a });
  }

  drawHud(g) {
    // top bar
    g.save();
    g.fillStyle = 'rgba(5,2,16,0.72)';
    g.fillRect(0, 0, W, 48);
    g.strokeStyle = 'rgba(80,170,255,0.25)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, 48); g.lineTo(W, 48); g.stroke();
    g.restore();

    const hullRgb = this.flashHull > 0 ? '255,80,100' : (this.hull <= 5 ? '255,80,100' : '80,220,255');
    SD.neonText(g, 'HULL  ' + this.hull + ' / ' + this.maxHull, 110, 24, 16, hullRgb, { blur: 8 });
    const goldRgb = this.flashGold > 0 ? '255,80,100' : '255,220,90';
    SD.neonText(g, 'CR  ' + this.credits, 340, 24, 16, goldRgb, { blur: 8 });
    const nW = this.wavesLen();
    let waveTxt;
    if (this.waveActive) waveTxt = 'WAVE  ' + this.waveIndex + ' / ' + nW + (this.canCallNext() ? '  CALL' : '');
    else if (this.score) waveTxt = this.level.name;
    else if (this.waveIndex >= nW) waveTxt = 'WAVE  ' + nW + ' / ' + nW;
    else if (this.waveTimer > 0) waveTxt = 'NEXT  ' + Math.ceil(this.waveTimer) + 's  +' + this.earlyBonus(this.waveTimer) + ' CR';
    else if (this.waveIndex === 0) waveTxt = 'WAVE  1 / ' + nW + '  READY';
    else waveTxt = 'WAVE  ' + this.waveIndex + ' / ' + nW + '  CLEARED';
    SD.neonText(g, waveTxt, 640, 24, 16, this.waveTimer > 0 || (this.waveActive && this.canCallNext()) ? '255,220,120' : '200,210,255', { blur: 8 });
    SD.neonText(g, this.level.short || this.level.name, 470, 24, 13, '180,200,220', { blur: 6, alpha: 0.85 });

    // bottom bar
    g.save();
    g.fillStyle = 'rgba(5,2,16,0.82)';
    g.fillRect(0, H - C().hud.bottom, W, C().hud.bottom);
    g.strokeStyle = 'rgba(80,170,255,0.25)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, H - C().hud.bottom); g.lineTo(W, H - C().hud.bottom); g.stroke();
    g.restore();

    const mouse = SD.Input.mouse;
    for (const b of this.uiButtons()) {
      const cap = this.picked ? ((C().turrets[this.picked.kind].maxLevel) || 3) : 3;
      const selected = (b.id && b.id === this.shop) || (b.id === 'up' && this.picked && this.picked.level < cap && SD.inBtn(b, mouse)) || (b.id === 'speed' && (this.timeScale || 1) > 1);
      const hover = mouse.over && SD.inBtn(b, mouse);
      SD.drawButton(g, b, selected || hover, this.T);
      if (b.tag) SD.neonText(g, b.tag, b.x, b.y - 20, 8, '255,210,90', { blur: 3 });
    }
    if (this.picked && !this.shop) {
      const t = this.picked, conf = C().turrets[t.kind];
      SD.neonText(g, conf.name + '  MK ' + (t.level === 3 ? 'III' : t.level === 2 ? 'II' : 'I'), 650, H - 78, 11, conf.rgb, { blur: 4, alpha: 0.8 });
    }
  }

  drawScore(g) {
    const s = this.score;
    g.save(); g.fillStyle = 'rgba(4,2,12,0.72)'; g.fillRect(0, 0, W, H); g.restore();
    const x = W / 2 - 300, y = 48, w = 600, h = 500;
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = 'rgba(8,10,20,0.94)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.4)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    const heading = s.last ? 'SECTOR HELD' : 'LEVEL COMPLETE';
    SD.neonText(g, heading, W / 2, 88, 32, '80,255,180', { blur: 16 });
    if (s.name) SD.neonText(g, s.name, W / 2, 126, 16, '200,210,230', { blur: 7, alpha: 0.9 });
    SD.neonText(g, '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars), W / 2, 164, 28, '255,220,120', { blur: 10 });
    const mm = SD.pad(Math.floor(s.time / 60)), ss = SD.pad(Math.floor(s.time % 60));
    const rows = [
      ['KILLS', String(s.kills)],
      ['CREDITS EARNED', '+' + s.earned],
      ['HULL LEFT', s.hull + ' / ' + s.maxHull],
      ['EARLY-SEND BONUS', '+' + (s.early || 0)],
      ['TIME', mm + ':' + ss],
    ];
    rows.forEach((row, i) => {
      const yy = 210 + i * 36;
      SD.neonText(g, row[0], W / 2 - 220, yy, 16, '180,200,220', { blur: 6, align: 'left' });
      SD.neonText(g, row[1], W / 2 + 220, yy, 18, '255,220,120', { blur: 8, align: 'right' });
    });
    const next = this.nextBtn || { x: W / 2, y: 456, w: 260, h: 48, label: s.last ? 'SECTOR HELD' : 'NEXT LEVEL', rgb: '80,170,255', size: 20 };
    const menu = this.menuBtn || { x: W / 2, y: 512, w: 240, h: 44, label: 'MENU', rgb: '255,80,220', size: 18 };
    const mouse = SD.Input.mouse;
    SD.drawButton(g, next, mouse.over && SD.inBtn(next, mouse), this.T);
    SD.drawButton(g, menu, mouse.over && SD.inBtn(menu, mouse), this.T);
  }

  drawPause(g) {
    g.save(); g.fillStyle = 'rgba(4,2,12,0.62)'; g.fillRect(0, 0, W, H); g.restore();
    SD.neonText(g, 'PAUSED', W / 2, 220, 48, '80,170,255', { blur: 20 });
    SD.drawButton(g, { x: W / 2, y: 300, w: 240, h: 50, label: 'RESUME', rgb: '80,170,255', size: 22 }, false, this.T);
    SD.drawButton(g, { x: W / 2, y: 366, w: 240, h: 50, label: 'MENU', rgb: '255,80,220', size: 22 }, false, this.T);
    SD.neonText(g, 'P / ESC TO RESUME', W / 2, 440, 13, '180,200,255', { blur: 6, alpha: 0.7 });
  }

  drawOver(g) {
    g.save(); g.fillStyle = 'rgba(4,2,12,0.72)'; g.fillRect(0, 0, W, H); g.restore();
    if (this.over === 'win') {
      SD.neonText(g, 'SECTOR HELD', W / 2, 200, 52, '80,255,180', { blur: 22 });
      SD.neonText(g, "Edisar's flagship is down. The station stands.", W / 2, 260, 18, '220,230,255', { blur: 8, alpha: 0.9 });
    } else {
      SD.neonText(g, 'HULL BREACHED', W / 2, 200, 48, '255,80,120', { blur: 22 });
      SD.neonText(g, 'The station has fallen to Edisar\'s fleet.', W / 2, 260, 18, '220,230,255', { blur: 8, alpha: 0.9 });
    }
    SD.drawButton(g, { x: W / 2, y: 340, w: 260, h: 52, label: this.over === 'win' ? 'PLAY AGAIN' : 'RETRY', rgb: '80,170,255', size: 22 }, false, this.T);
    SD.drawButton(g, { x: W / 2, y: 406, w: 260, h: 52, label: 'MENU', rgb: '255,80,220', size: 22 }, false, this.T);
  }

  /* Close-up of the turret roster at MK I / II / III for screenshots. */
  drawShowcase(g) {
    SD.drawSpaceBg(g);
    this.stars.draw(g, this.T);
    SD.neonText(g, 'TURRETS', W / 2, 28, 28, '200,220,255', { blur: 14 });
    const kinds = SHOP;
    const xs = kinds.map((_, i) => 78 + i * 132);
    const ys = [150, 330, 500];
    const labels = ['MK I', 'MK II', 'MK III'];
    for (let lv = 1; lv <= 3; lv++) {
      SD.neonText(g, labels[lv - 1], 48, ys[lv - 1], 14, '255,210,120', { blur: 8 });
      for (let i = 0; i < kinds.length; i++) {
        const conf = C().turrets[kinds[i]];
        const pulse = 0.5 + 0.5 * Math.sin(this.T * (4 + lv) + i * 1.3);
        const cap = conf.maxLevel || 3;
        if (lv > cap) continue;
        const t = {
          kind: kinds[i], level: lv, x: xs[i], y: ys[lv - 1],
          ang: -0.72 + i * 0.12 + 0.06 * Math.sin(this.T * 0.7 + i),
          flash: pulse > 0.55 ? 0.09 * (pulse - 0.2) : 0,
          kick: pulse > 0.55 ? 1.2 : 0,
        };
        this.drawTurretAt(g, t, 1.55);
        if (lv === 1) SD.neonText(g, conf.short, xs[i], 64, 12, conf.rgb, { blur: 7 });
        if (kinds[i] === 'nebula' && lv === 1) SD.neonText(g, 'L3  ·  UNIQUE', xs[i], 82, 9, conf.rgb, { blur: 4, alpha: 0.85 });
      }
    }
    SD.drawScanlines(g);
  }

  /* All enemy types with weakness / resistance labels. */
  drawShipShowcase(g) {
    SD.drawSpaceBg(g);
    this.stars.draw(g, this.T);
    SD.neonText(g, "EDISAR'S FLEET", W / 2, 28, 26, '200,220,255', { blur: 14 });
    const row = [
      ['scout', 'SCOUT', 80, 150, 1.85],
      ['fighter', 'FIGHTER', 230, 150, 1.6],
      ['interceptor', 'INTERCEPTOR', 380, 150, 1.7],
      ['armored', 'ARMORED', 530, 150, 1.4],
      ['shielded', 'SHIELDED', 680, 150, 1.5],
      ['cryo', 'CRYO', 820, 150, 1.5],
      ['juggernaut', 'JUGGERNAUT', 950, 150, 1.25],
    ];
    for (const [type, name, x, y, sc] of row) {
      const def = C().enemies[type];
      const spr = this.spr[type];
      if (type === 'shielded') {
        g.save(); g.strokeStyle = 'rgba(100,220,255,0.5)'; g.lineWidth = 2;
        g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.stroke(); g.restore();
      }
      SD.blit(g, spr, x, y, -0.10, sc);
      SD.neonText(g, name, x, 62, 11, def.rgb, { blur: 6 });
      if (def.weak && def.weak.length) SD.neonText(g, 'WEAK ' + def.weak.join('/'), x, 228, 10, '80,255,160', { blur: 4 });
      if (def.resists && def.resists.length) SD.neonText(g, 'RESIST ' + def.resists.join('/'), x, 244, 10, '255,140,110', { blur: 4 });
    }
    const bosses = [
      ['flagship1', 200, 400, 0.85],
      ['flagship2', 512, 400, 0.95],
      ['flagship', 824, 400, 1.05],
    ];
    for (const [type, x, y, sc] of bosses) {
      const def = C().enemies[type];
      SD.blit(g, this.spr.flagship, x, y, -0.06, sc);
      if (def.shield) {
        g.save(); g.strokeStyle = 'rgba(100,220,255,0.4)'; g.lineWidth = 2;
        g.beginPath(); g.arc(x, y, 58 * sc, 0, Math.PI * 2); g.stroke(); g.restore();
      }
      SD.neonText(g, def.name.toUpperCase(), x, 526, 13, '255,210,120', { blur: 7 });
    }
    SD.drawScanlines(g);
  }

  /* ---------- screenshot setups ---------- */
  nearPads(n) {
    const pads = [];
    for (let ty = 2; ty <= 14; ty++) for (let tx = 1; tx < 31; tx++) {
      if (!this.canPlace(tx, ty)) continue;
      const p = tileCenter(tx, ty);
      let best = 1e9;
      for (const pt of this.path.pts) best = Math.min(best, Math.hypot(pt.x - p.x, pt.y - p.y));
      if (best < 86) pads.push({ tx, ty, best });
    }
    pads.sort((a, b) => a.best - b.best);
    const picked = [];
    for (const p of pads) {
      if (picked.some(q => Math.abs(q.tx - p.tx) + Math.abs(q.ty - p.ty) < 3)) continue;
      picked.push(p);
      if (picked.length >= n) break;
    }
    return picked;
  }

  applyShot(id) {
    const layout = [
      [4, 6, 'laser', 3], [8, 6, 'railgun', 2], [8, 9, 'ice', 3], [11, 9, 'tesla', 2],
      [15, 6, 'pulse', 2], [17, 6, 'ice', 2], [18, 8, 'missile', 3], [22, 10, 'laser', 2],
      [25, 10, 'railgun', 1], [25, 14, 'pulse', 3], [22, 14, 'tesla', 1], [4, 9, 'missile', 2],
    ];
    const plant = (list) => {
      this.turrets = [];
      for (const [tx, ty, k, lv] of list) if (this.canPlace(tx, ty) || this.occupied(tx, ty)) this.place(tx, ty, k, lv);
    };
    const mixKinds = ['laser', 'missile', 'ice', 'railgun', 'tesla', 'pulse'];
    const plantNear = (n) => {
      const pads = this.nearPads(n);
      this.turrets = [];
      pads.forEach((p, i) => this.place(p.tx, p.ty, mixKinds[i % 6], 1 + (i % 3)));
    };

    if (id === 'build') {
      plant([[4, 6, 'laser', 1], [8, 9, 'ice', 1], [11, 9, 'tesla', 1], [15, 6, 'railgun', 2], [18, 8, 'pulse', 1]]);
      this.credits = 210;
      this.waveIndex = 2;
      this.shop = 'laser';
      this.picked = null;
      this.ghost = { tx: 8, ty: 6 };
    } else if (id === 'midwave') {
      plant(layout);
      this.credits = 260;
      this.waveIndex = 3;
      this.startWave();
      const types = ['scout', 'interceptor', 'fighter', 'armored', 'juggernaut', 'shielded', 'cryo', 'interceptor', 'scout', 'armored', 'fighter', 'cryo', 'interceptor', 'scout'];
      const dists = [60, 150, 250, 360, 470, 580, 700, 820, 940, 1060, 1180, 1300, 1420, 1540];
      this.enemies = [];
      types.forEach((tp, i) => this.spawn(tp, dists[i]));
      this.groups = [{ type: 'fighter', left: 4, gap: 0.45, wait: 0.3 }];
      this.sim(1.35);
      this.waveActive = false;
      this.groups = [];
      this.waveIndex = 4;
      this.waveTimer = 16.4;
      this.banner = { text: 'WAVE 4  CLEARED', life: 2.2, rgb: '80,255,180' };
      for (const e of this.enemies) e.stunT = 8;
    } else if (id === 'boss' || id === 'map1') {
      plant(layout);
      this.credits = 180;
      this.waveIndex = 9;
      this.startWave();
      this.enemies = [];
      this.spawn('flagship1', 980);
      this.spawn('armored', 760);
      this.spawn('shielded', 680);
      this.spawn('fighter', 560);
      this.spawn('cryo', 500);
      this.spawn('fighter', 1180);
      this.groups = [{ type: 'fighter', left: 2, gap: 0.8, wait: 0.5 }];
      this.sim(2.4);
    } else if (id === 'map2') {
      this.setLevel(1);
      this.reset();
      plantNear(10);
      this.credits = 200;
      this.waveIndex = 4;
      this.startWave();
      this.enemies = [];
      ['scout', 'interceptor', 'fighter', 'armored', 'juggernaut', 'shielded', 'cryo', 'interceptor', 'scout', 'fighter', 'cryo'].forEach((tp, i) => this.spawn(tp, 80 + i * 140));
      this.groups = [{ type: 'fighter', left: 4, gap: 0.45, wait: 0.3 }];
      this.sim(1.2);
    } else if (id === 'map3') {
      this.setLevel(2);
      this.reset();
      plantNear(10);
      this.credits = 200;
      this.waveIndex = 9;
      this.startWave();
      this.enemies = [];
      this.spawn('flagship', 860);
      this.spawn('shielded', 620);
      this.spawn('armored', 480);
      this.spawn('cryo', 340);
      this.spawn('fighter', 1100);
      this.spawn('scout', 200);
      this.spawn('interceptor', 280);
      this.spawn('juggernaut', 720);
      this.spawn('shielded', 980);
      this.spawn('fighter', 140);
      this.groups = [{ type: 'shielded', left: 3, gap: 0.5, wait: 0.3 }];
      this.sim(1.6);
    } else if (id === 'score') {
      plant(layout);
      this.credits = 240;
      this.hull = 16;
      this.waveIndex = 10;
      this.waveActive = false;
      this.levelStats = { kills: 86, earned: 1640, early: 120, t0: this.T - 312 };
      this.openLevelScore();
    } else if (id === 'turrets') {
      this.showcase = true;
      this.credits = 0;
    } else if (id === 'ships' || id === 'enemies') {
      this.showcase = 'ships';
      this.credits = 0;
    } else if (id === 'enemyinfo') {
      plant(layout);
      this.credits = 220;
      this.waveIndex = 5;
      this.waveActive = false;
      this.enemies = [];
      const e = this.spawn('shielded', 640);
      this.spawn('armored', 420);
      this.spawn('cryo', 980);
      this.inspected = e;
      for (const en of this.enemies) en.stunT = 30;
    } else if (id === 'speed') {
      plant([[4, 6, 'laser', 2], [8, 9, 'ice', 1], [11, 9, 'tesla', 1], [15, 6, 'railgun', 1], [18, 8, 'pulse', 1]]);
      this.credits = 240;
      this.waveIndex = 2;
      this.waveActive = false;
      this.waveTimer = 0;
      this.shop = null;
      this.timeScale = 2;
      SD.timeScale = 2;
    } else if (id === 'multiwave') {
      plant(layout);
      this.credits = 280;
      this.waveIndex = 2;
      this.startWave();
      this.callClock = this.callAfter;
      this.sendWaveEarly();
      this.callClock = this.callAfter;
      this.enemies = [];
      const typesA = ['scout', 'interceptor', 'fighter', 'scout', 'interceptor', 'fighter', 'scout'];
      const typesB = ['armored', 'juggernaut', 'shielded', 'cryo', 'armored', 'fighter', 'juggernaut'];
      typesA.forEach((tp, i) => this.spawn(tp, 80 + i * 110));
      typesB.forEach((tp, i) => this.spawn(tp, 140 + i * 120));
      this.groups = [
        { type: 'scout', left: 4, gap: 0.4, wait: 0.2 },
        { type: 'armored', left: 3, gap: 0.6, wait: 0.5 },
      ];
      this.waveActive = true;
      this.banner = { text: 'WAVE 4  —  OVERLAP', life: 8, rgb: '80,170,255' };
      this.sim(0.6);
      this.callClock = this.callAfter;
    } else if (id === 'nebula') {
      this.setLevel(2);
      this.reset();
      this.turrets = [];
      for (const [tx, ty, k, lv] of [[5, 5, 'laser', 2], [5, 11, 'tesla', 2], [17, 7, 'pulse', 2], [20, 9, 'ice', 1], [24, 9, 'missile', 2]]) {
        if (this.canPlace(tx, ty)) this.place(tx, ty, k, lv);
      }
      let nebPad = null;
      for (const cand of [[10, 12], [11, 12], [9, 12], [10, 11], [12, 11], [8, 12]]) {
        if (this.canPlace(cand[0], cand[1])) { nebPad = cand; break; }
      }
      if (!nebPad) nebPad = [10, 10];
      const neb = this.place(nebPad[0], nebPad[1], 'nebula', 1);
      this.credits = 220;
      this.waveIndex = 5;
      this.waveActive = true;
      this.groups = [];
      this.enemies = [];
      // Long bottom lane on Moon Base is path dist ~672–1056.
      const types = ['shielded', 'armored', 'fighter', 'cryo', 'juggernaut', 'scout'];
      const dists = [720, 780, 840, 900, 960, 1020];
      types.forEach((tp, i) => this.spawn(tp, dists[i]));
      neb.ang = 0;
      const tip = this.muzzleTip(neb);
      const ox = neb.x + Math.cos(neb.ang) * tip, oy = neb.y + Math.sin(neb.ang) * tip;
      this.fireNebula(neb, ox, oy, this.stat(neb, 'damage'));
      neb.flash = 0.5; neb.kick = 6;
      for (const b of this.beams) { b.life = 8; b.max = 8; }
      this.callClock = this.callAfter;
    } else if (id === 'edisar') {
      this.setLevel(2);
      this.reset();
      plantNear(8);
      this.credits = 240;
      this.waveIndex = 10;
      this.waveActive = true;
      this.groups = [];
      this.enemies = [];
      this.spawn('flagship', 780);
      this.spawn('shielded', 520);
      this.spawn('juggernaut', 400);
      this.spawn('interceptor', 260);
      this.spawn('armored', 980);
      if (this.bossLine) this.bossLine.life = this.bossLine.max - 0.5;
      this.sim(0.25);
      if (this.bossLine) this.bossLine.life = this.bossLine.max - 0.5;
    } else if (id === 'title') {
      // unused here
    }
  }

  sim(seconds) {
    const step = 1 / 60;
    for (let t = 0; t < seconds; t += step) this.update(step);
  }
};

SD.runBalance = function (mode, levelIndex) {
  const d = new SD.Defense({ levelIndex: levelIndex || 0 });
  const nebulaMix = mode === 'mixed+nebula' || mode === 'mixednebula';
  const kinds = (mode === 'mixed' || nebulaMix) ? ['pulse', 'laser', 'tesla', 'missile', 'railgun', 'ice'] : [mode];
  const cap = (levelIndex || 0) === 0 ? 8 : 10;
  const maxLv = (t) => (C().turrets[t.kind] && C().turrets[t.kind].maxLevel) || 3;
  const spend = () => {
    if (nebulaMix && d.canShop('nebula') && d.canBuild('nebula') && d.turrets.length < cap) {
      for (const p of d.nearPads(cap)) {
        if (d.occupied(p.tx, p.ty) || !d.canPlace(p.tx, p.ty)) continue;
        d.shop = 'nebula';
        if (d.tryPlace(p.tx, p.ty)) break;
      }
    }
    // Place a core first; upgrading too early is a weak opening on later levels.
    const minT = Math.min(cap, 5);
    if (d.turrets.length >= minT) {
      for (const t of d.turrets) {
        if (t.level < maxLv(t) && d.upCostOf(t) > 0) {
          d.picked = t;
          if (d.credits >= d.upCostOf(t)) d.tryUpgrade();
        }
      }
      d.picked = null;
    }
    const reserve = nebulaMix && !d.hasNebula() ? 1 : 0;
    if (d.turrets.length >= cap - reserve) return;
    const pads = d.nearPads(cap);
    let regular = d.turrets.filter(t => t.kind !== 'nebula').length;
    for (const p of pads) {
      if (d.turrets.length >= cap - reserve) break;
      if (d.occupied(p.tx, p.ty)) continue;
      const kind = kinds[regular % kinds.length];
      if (d.canShop(kind) && d.canBuild(kind) && d.canPlace(p.tx, p.ty)) {
        d.shop = kind;
        if (d.tryPlace(p.tx, p.ty)) regular++;
      }
    }
  };
  spend();
  let acc = 0, guard = 0;
  const step = 1 / 30;
  const limit = 30 * 60 * 18;
  while (!d.score && !d.over && guard < limit) {
    acc += step;
    if (acc >= 0.45) { spend(); acc = 0; }
    if (!d.waveActive && !d.score && !d.over) {
      const needBuild = (levelIndex || 0) >= 1 && d.waveIndex > 0 && d.waveTimer > 13;
      let canSpend = d.turrets.length < cap;
      if (!canSpend) {
        for (const tr of d.turrets) {
          if (tr.level < maxLv(tr) && d.upCostOf(tr) > 0 && d.credits >= d.upCostOf(tr)) { canSpend = true; break; }
        }
      } else {
        canSpend = kinds.some(k => d.canBuild(k));
      }
      if (!(needBuild && canSpend)) d.sendWaveEarly();
    }
    d.update(step);
    guard++;
  }
  return {
    mode,
    level: (d.level && d.level.name) || String(levelIndex || 0),
    result: d.score ? 'win' : (d.over || 'timeout'),
    hull: d.hull,
    credits: d.credits,
    waves: d.waveIndex,
    stars: d.score ? d.score.stars : 0,
    turrets: d.turrets.map(t => t.kind + t.level),
    time: Math.round(d.T),
  };
};

})();

