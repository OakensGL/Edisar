/* Title screen + the tower-defense match. */
(() => {
const { W, H, TILE } = SD;
const C = () => SD.CONFIG;
const KINDS = ['laser', 'missile', 'ice', 'railgun', 'tesla', 'pulse'];
const SHOP = KINDS.concat('nebula');

SD.Portraits = SD.Portraits || {};
if (!SD.Portraits.edisar) {
  const im = new Image();
  im.src = 'assets/edisar-scarred.jpg';
  SD.Portraits.edisar = im;
}

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

function buildRoutes(level) {
  const lists = (level && (level.paths || (level.path && [level.path]))) || [SD.CONFIG.levels[0].path];
  const paths = lists.map(tiles => buildPath(tiles));
  const blocked = new Set();
  for (const p of paths) p.blocked.forEach(k => blocked.add(k));
  for (const p of paths) p.blocked = blocked;
  return { paths, blocked, spawn: paths.map(p => p.spawn), base: paths[paths.length - 1].base };
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
        flagship1: SD.Sprites.flagship1(),
        flagship2: SD.Sprites.flagship2(),
        flagship4: SD.Sprites.flagship4(),
        flagship5: SD.Sprites.flagship5(),
        flagship6: SD.Sprites.flagship6(),
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
    const x = W / 2 - 360, y = 56, w = 720, h = 470;
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = 'rgba(8,10,20,0.92)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.4)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'HOW TO PLAY', W / 2, 148, 28, '200,230,255', { blur: 12 });
    const lines = [
      'Six levels, ten waves each. Credits and turrets reset every level. Later maps use two entrance gates.',
      'Build only on marked pads. Gold pads are premium chokepoints — pay credits to unlock them.',
      'LASER · MISSILES · ICE · RAILGUN · TESLA · PULSE (strips shields and poisons hulls; MK III toxin spreads).',
      'NEBULA · Level 3 and later, one per map. A red dark-energy beam that ignores shields and resists.',
      'Upgrade twice for MK III specials (twin beams, cluster, freeze, full pierce, longer chains, spreading toxin).',
      'Tap a ship to see HP, weaknesses and resistances. Pulse no longer stuns.',
      'About 3s after a wave starts you can send the next one and fight several at once. Bonus scales with time saved.',
      'Each turret can target First, Last, Strongest, Weakest or Closest — toggle it in the turret panel.',
      'Abilities: Orbital Strike, Drones (brief hold), EMP (drops shields). Tap the button, then the field. Esc or right-click cancels.',
      'Bring Oakens or Nebula. Tap them, then a tile to move. R or the SPECIAL button fires their power.',
      'Drag a turret from the build bar onto a pad to place it. T retries the level (with a confirm).',
      'The HUD speed button (or F) cycles x1 / x2 / x3. It only speeds the battle, not the music.',
      '',
      SD.Input.touchMode
        ? 'PHONE  ·  DRAG A TURRET ONTO A PAD  ·  SPECIAL AND SEND WAVE ARE ON THE HUD  ·  LANDSCAPE'
        : 'DESKTOP  ·  1–7 SELECT  ·  DRAG TO PLACE  ·  R SPECIAL  ·  T RETRY  ·  U UPGRADE  ·  F SPEED  ·  P PAUSE',
    ];
    lines.forEach((ln, i) => {
      const small = i >= lines.length - 1;
      SD.neonText(g, ln, W / 2, 168 + i * 20, small ? 12 : 13, small ? '180,210,255' : '220,230,245', { blur: 5, alpha: 0.92 });
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
    this.progress = opt.shot ? { unlocked: 6, stars: [3, 3, 1, 2, 1, 0] } : SD.Progress.load();
    this.back = { x: 70, y: 28, w: 100, h: 32, label: 'MENU', rgb: '180,200,255', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.mute = { x: W - 58, y: 28, w: 96, h: 32, label: SD.Audio.muted ? 'SOUND OFF' : 'SOUND ON', rgb: '180,200,255', size: 13, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.cards = SD.CONFIG.levels.map((lv, i) => ({
      i, lv,
      x: 200 + (i % 3) * 312, y: 230 + Math.floor(i / 3) * 230,
      w: 284, h: 210,
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
      g.save();
      SD.roundRect(g, x + 14, y + 12, c.w - 28, 96, 8); g.clip();
      SD.drawSpaceBg(g, c.lv.variant);
      const routes = c.lv.paths || [c.lv.path];
      routes.forEach((path, pi) => {
        g.beginPath();
        path.forEach((pt, k) => {
          const px = x + 14 + (pt[0] / 31) * (c.w - 28);
          const py = y + 12 + (pt[1] / 17) * 96;
          k ? g.lineTo(px, py) : g.moveTo(px, py);
        });
        g.strokeStyle = pi ? 'rgba(255,90,200,0.9)' : 'rgba(80,200,255,0.9)';
        g.lineWidth = 2; g.stroke();
      });
      g.restore();
      SD.neonText(g, 'LEVEL ' + (i + 1), c.x, y + 122, 12, '180,210,255', { blur: 5 });
      SD.neonText(g, c.lv.name, c.x, y + 144, 15, '230,235,245', { blur: 7 });
      const stars = this.progress.stars[i] || 0;
      const starStr = locked ? 'LOCKED' : (stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : 'NO STARS YET');
      SD.neonText(g, starStr, c.x, y + 172, locked ? 13 : 18, locked ? '160,160,180' : '255,220,120', { blur: 6 });
      if (locked) {
        g.save(); g.fillStyle = 'rgba(4,2,12,0.45)';
        SD.roundRect(g, x, y, c.w, c.h, 14); g.fill(); g.restore();
        SD.neonText(g, 'LOCKED', c.x, c.y + 16, 16, '200,210,230', { blur: 8 });
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
    this.auto = !!opt.auto;
    this.heroKind = opt.hero || null;
    this.setLevel(opt.levelIndex || 0);
    this.spr = {
      scout: SD.Sprites.scout(),
      fighter: SD.Sprites.fighter(),
      armored: SD.Sprites.armored(),
      flagship: SD.Sprites.flagship(),
      flagship1: SD.Sprites.flagship1(),
      flagship2: SD.Sprites.flagship2(),
      flagship4: SD.Sprites.flagship4(),
      flagship5: SD.Sprites.flagship5(),
      flagship6: SD.Sprites.flagship6(),
      shielded: SD.Sprites.shielded(),
      cryo: SD.Sprites.cryo(),
      interceptor: SD.Sprites.interceptor(),
      juggernaut: SD.Sprites.juggernaut(),
      station: SD.Sprites.station(),
      gate: SD.Sprites.gate(),
      hero: { oakens: SD.Sprites.hero('oakens'), nebula: SD.Sprites.hero('nebula') },
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
    else if (this.heroKind || this.auto) this.spawnHero(this.heroKind || 'oakens');
    else this.pickingHero = true;
  }

  setLevel(index) {
    this.levelIndex = Math.max(0, Math.min(SD.CONFIG.levels.length - 1, index | 0));
    this.level = SD.CONFIG.levels[this.levelIndex];
    this.routes = buildRoutes(this.level);
    this.paths = this.routes.paths;
    this.path = this.paths[0];
    this.waves = this.level.waves;
    this.variant = this.level.variant;
    this.hpMul = this.level.hpMul || 1;
    this._buildGrid = null;
    this.initPads();
  }

  initPads() {
    const list = (this.level && this.level.pads) || [];
    this.pads = list.map(p => ({ tx: p.tx, ty: p.ty, premium: !!p.premium, cost: p.cost || 0, open: !p.premium }));
  }
  padAt(tx, ty) { return (this.pads || []).find(p => p.tx === tx && p.ty === ty) || null; }

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
    this.drag = null;
    this.pickingHero = false;
    this.hero = null;
    this.pickedHero = false;
    this.heroHint = null;
    this.restartAsk = false;
    this.restartFrom = null;
    this.restartSel = 0;
    this.aim = null;
    this.abCd = { orbital: 0, drones: 0, emp: 0 };
    this.bossBarTrail = null;
    this.bossBarOf = null;
    this.drones = [];
    this.strikes = [];
    this.initPads();
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
  onPath(tx, ty) { return this.routes ? this.routes.blocked.has(this.occupyKey(tx, ty)) : this.path.blocked.has(this.occupyKey(tx, ty)); }
  inPlay(tx, ty) {
    const cols = W / TILE, rows = H / TILE;
    if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return false;
    if (ty <= 1 || ty >= 15) return false;
    return true;
  }
  canPlace(tx, ty, force = false) {
    if (!this.inPlay(tx, ty) || this.onPath(tx, ty) || this.occupied(tx, ty)) return false;
    if (force) return true;
    const pad = this.padAt(tx, ty);
    return !!(pad && pad.open);
  }
  canDrop(tx, ty, kind) {
    kind = kind || this.shop;
    if (!kind || !this.canShop(kind)) return false;
    if (this.canPlace(tx, ty) && this.canBuild(kind)) return true;
    if (this.padLocked(tx, ty)) {
      const pad = this.padAt(tx, ty);
      return this.credits >= (pad.cost || 0) + this.costOf(kind);
    }
    return false;
  }
  padLocked(tx, ty) {
    const pad = this.padAt(tx, ty);
    return !!(pad && pad.premium && !pad.open);
  }

  tryUnlock(tx, ty) {
    const pad = this.padAt(tx, ty);
    if (!pad || pad.open || !pad.premium) return false;
    if (this.credits < pad.cost) { SD.Audio.deny(); this.flashGold = 0.4; return false; }
    this.credits -= pad.cost;
    pad.open = true;
    const p = tileCenter(tx, ty);
    this.fx.ring(p.x, p.y, '255,220,90', 30, 0.4);
    SD.Audio.upgrade();
    this.banner = { text: 'PAD UNLOCKED  −' + pad.cost + ' CR', life: 1.6, rgb: '255,220,90' };
    return true;
  }

  place(tx, ty, kind, level = 1) {
    const conf = C().turrets[kind];
    const p = tileCenter(tx, ty);
    const t = {
      tx, ty, x: p.x, y: p.y, kind, level,
      spent: conf.cost + (level > 1 ? conf.upCost : 0) + (level > 2 ? (conf.upCost2 || 0) : 0),
      cool: 0, ang: -Math.PI / 2, target: null, flash: 0, kick: 0,
      priority: 'first',
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
    if (this.padLocked(tx, ty)) {
      const pad = this.padAt(tx, ty);
      const need = (pad ? pad.cost : 0) + this.costOf(this.shop);
      if (this.credits < need) { SD.Audio.deny(); this.flashGold = 0.4; return false; }
      if (!this.tryUnlock(tx, ty)) return false;
    }
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
      const route = e.route || this.paths[e.pathI || 0] || this.path;
      remain = Math.max(remain, (route.total - e.dist) / spd);
    }
    for (const g of this.groups) {
      if (g.left <= 0) continue;
      const typ = C().enemies[g.type];
      const spd = typ ? typ.speed : 50;
      const route = this.paths[g.pathI || 0] || this.path;
      remain = Math.max(remain, Math.max(0, g.wait) + Math.max(0, g.left - 1) * g.gap + route.total / Math.max(10, spd));
    }
    return remain;
  }

  expandGroups(groups) {
    const n = this.paths ? this.paths.length : 1;
    const out = [];
    groups.forEach((g, i) => {
      const type = g[0], left = g[1], gap = g[2], gate = g[3];
      const wait = 0.12 + i * 0.85;
      if (n < 2) { out.push({ type, left, gap, wait, pathI: 0 }); return; }
      if (gate === 0 || gate === 1) { out.push({ type, left, gap, wait, pathI: gate }); return; }
      const a = Math.ceil(left / n), b = left - a;
      out.push({ type, left: a, gap, wait, pathI: 0 });
      if (b > 0) out.push({ type, left: b, gap, wait: wait + 0.2, pathI: 1 });
    });
    return out;
  }

  startWave() {
    if (this.over || this.score || this.waveIndex >= this.wavesLen()) return;
    if (this.waveActive && this.callClock < this.callAfter) return;
    const w = this.waves[this.waveIndex];
    const incoming = this.expandGroups(w.groups);
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

  spawn(type, dist = 0, pathI = 0) {
    const def = C().enemies[type];
    const route = this.paths[pathI] || this.path;
    const p = posOnPath(route, dist);
    const hp = Math.round(def.hp * this.hpMul);
    const sh = def.shield ? Math.round(def.shield * this.hpMul) : 0;
    const e = {
      type, name: def.name, hp, max: hp, shield: sh, maxShield: sh,
      speed: def.speed, reward: def.reward,
      hull: def.hull, r: def.r, rgb: def.rgb, boss: !!def.boss,
      resist: def.resist || {}, weak: def.weak || [], resists: def.resists || [],
      iceImmune: !!def.iceImmune, iceSlowMul: def.iceSlowMul, notes: def.notes || '',
      scale: def.scale || 1, sprite: def.sprite || type,
      pathI, route,
      dist, x: p.x, y: p.y, ang: p.ang, slow: 1, slowT: 0, stunT: 0, stunCd: 0, freezeT: 0, holdT: 0, hitFlash: 0,
      poison: [],
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

  firstInRange(t) { return this.pickTarget(t); }

  cyclePriority(t) {
    const order = ['first', 'last', 'strongest', 'weakest', 'closest'];
    const i = Math.max(0, order.indexOf(t.priority || 'first'));
    t.priority = order[(i + 1) % order.length];
    SD.Audio.click();
  }
  priLabel(t) {
    return ({ first: 'FIRST', last: 'LAST', strongest: 'STRONG', weakest: 'WEAK', closest: 'CLOSE' })[t.priority || 'first'];
  }

  pickTarget(t) {
    const r = this.stat(t, 'range');
    const mode = t.priority || 'first';
    let best = null, bestS = null;
    for (const e of this.enemies) {
      if (e.dead || e.hp <= 0) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d > r + e.r * 0.3) continue;
      const route = e.route || this.paths[e.pathI || 0] || this.path;
      let score;
      if (mode === 'last') score = -(e.dist / (route.total || 1));
      else if (mode === 'closest') score = -d;
      else if (mode === 'strongest') score = (e.hp + (e.shield || 0));
      else if (mode === 'weakest') score = -(e.hp + (e.shield || 0));
      else score = e.dist / (route.total || 1);
      if (bestS == null || score > bestS) { best = e; bestS = score; }
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
    this.beams.push({ x0: ox, y0: oy, x1, y1, rgb: '255,230,230', life: 0.16, max: 0.16, thick: 2.2 });
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
    const pDps = this.stat(t, 'poison') || 0;
    const pTime = this.stat(t, 'poisonTime') || 0;
    const pMax = this.stat(t, 'poisonMax') || 2;
    const spread = this.stat(t, 'poisonSpread') || 0;
    this.pulses.push({ x: t.x, y: t.y, r: 8, maxR: r, life: 0.28, max: 0.28, rgb: C().turrets.pulse.rgb });
    const hit = [];
    for (const e of this.enemies) {
      if (e.dead || e.hp <= 0) continue;
      if (Math.hypot(e.x - t.x, e.y - t.y) <= r + e.r) {
        this.hurt(e, dmg, 'pulse');
        this.applyPoison(e, pDps, pTime, pMax);
        hit.push(e);
      }
    }
    if (spread > 0) {
      for (const src of hit) {
        for (const e of this.enemies) {
          if (e.dead || e.hp <= 0 || hit.includes(e)) continue;
          if (Math.hypot(e.x - src.x, e.y - src.y) <= spread + e.r) this.applyPoison(e, pDps * 0.5, pTime, pMax);
        }
      }
    }
    SD.Audio.explode(0.7);
  }

  applyPoison(e, dps, time, maxStacks) {
    if (!e || dps <= 0 || time <= 0 || e.dead || e.hp <= 0) return;
    if (!e.poison) e.poison = [];
    if (e.poison.length >= maxStacks) {
      e.poison.sort((a, b) => a.life - b.life);
      e.poison[0].dps = Math.max(e.poison[0].dps, dps);
      e.poison[0].life = Math.max(e.poison[0].life, time);
    } else {
      e.poison.push({ dps, life: time });
    }
  }

  toxin(e, dmg) {
    if (!e || dmg <= 0 || e.dead) return;
    const mul = (e.resist && e.resist.pulse != null) ? e.resist.pulse : 1;
    e.hp -= dmg * mul;
    e.hitFlash = 0.08;
    if (e.hp <= 0) this.kill(e, true);
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
      this.fx.ring(e.x, e.y, '255,70,70', e.r + 16, 0.28);
    }
    if (mul < 0.9) this.floater(e, 'RESIST', '255,120,90');
    else if (mul > 1.15) this.floater(e, 'WEAK', '80,255,140');
    else if (pure && applied > 0) this.floater(e, String(Math.max(1, Math.round(applied))), '255,160,160');
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
    if (this.paused || this.over || this.score || this.pickingHero) {
      this.T += dt;
      this.stars.update(dt);
      if (this.flashGold > 0) this.flashGold -= dt;
      if (this.flashHull > 0) this.flashHull -= dt;
      if (this.banner) { this.banner.life -= dt; if (this.banner.life <= 0) this.banner = null; }
      if (this.bossLine) { this.bossLine.life -= dt; if (this.bossLine.life <= 0) this.bossLine = null; }
      if (this.heroHint) { this.heroHint.life -= dt; if (this.heroHint.life <= 0) this.heroHint = null; }
      this.tickBossBar(dt);
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
    if (this.heroHint) { this.heroHint.life -= dt; if (this.heroHint.life <= 0) this.heroHint = null; }
    this.tickBossBar(dt);

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
          this.spawn(g.type, 0, g.pathI || 0);
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
      if (e.holdT > 0) e.holdT -= dt;
      if (e.stunT > 0) e.stunT -= dt;
      if (e.stunCd > 0) e.stunCd -= dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.poison && e.poison.length) {
        let dps = 0;
        for (const p of e.poison) { p.life -= dt; dps += p.dps; }
        e.poison = e.poison.filter(p => p.life > 0);
        if (dps > 0) this.toxin(e, dps * dt);
        if (e.dead) continue;
      }
      if (!(e.freezeT > 0 || e.stunT > 0 || e.holdT > 0)) e.dist += e.speed * e.slow * dt;
      const route = e.route || this.paths[e.pathI || 0] || this.path;
      const p = posOnPath(route, e.dist);
      e.x = p.x; e.y = p.y; e.ang = p.ang;
      if (e.dist >= route.total) this.leak(e);
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

    for (const k of Object.keys(this.abCd || {})) if (this.abCd[k] > 0) this.abCd[k] = Math.max(0, this.abCd[k] - dt);
    this.updateDrones(dt);
    this.updateHero(dt);
  }

  /* ---------- abilities / hero ---------- */
  abilityConf(id) { return C().abilities[id]; }
  abilityReady(id) { return (this.abCd[id] || 0) <= 0; }
  armAbility(id) {
    if (!this.abilityReady(id)) { SD.Audio.deny(); return; }
    this.aim = this.aim === id ? null : id;
    this.shop = null;
    this.picked = null;
    this.pickedHero = false;
    SD.Audio.click();
  }
  cancelAim() {
    if (!this.aim) return false;
    this.aim = null;
    SD.Audio.click();
    return true;
  }
  fireAbility(id, x, y) {
    const conf = this.abilityConf(id);
    if (!conf || !this.abilityReady(id)) { SD.Audio.deny(); return; }
    this.abCd[id] = conf.cd;
    this.aim = null;
    if (id === 'orbital') {
      this.fx.ring(x, y, conf.rgb, conf.radius, 0.55);
      this.fx.burst(x, y, conf.rgb, 22, 180, 0.5, 2.2);
      SD.Audio.explode(1.6);
      for (const e of [...this.enemies]) {
        if (e.dead || e.hp <= 0) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d <= conf.radius + e.r) {
          const mul = d < 18 ? 1 : Math.max(0.4, 1 - d / conf.radius * 0.5);
          this.hurt(e, conf.dmg * mul, 'pulse');
        }
      }
    } else if (id === 'emp') {
      this.fx.ring(x, y, conf.rgb, conf.radius, 0.5);
      SD.Audio.laser();
      for (const e of this.enemies) {
        if (e.dead || e.hp <= 0) continue;
        if (Math.hypot(e.x - x, e.y - y) <= conf.radius + e.r && e.shield > 0) {
          e.shield = 0;
          this.fx.ring(e.x, e.y, '80,220,255', e.r + 16, 0.3);
        }
      }
    } else if (id === 'drones') {
      this.drones.push({ x, y, r: conf.radius, hold: conf.hold, life: 2.2, max: 2.2, rgb: conf.rgb });
      this.fx.ring(x, y, conf.rgb, 28, 0.35);
      SD.Audio.wave();
    }
  }
  updateDrones(dt) {
    for (const d of this.drones) {
      d.life -= dt;
      for (const e of this.enemies) {
        if (e.dead || e.hp <= 0) continue;
        if (Math.hypot(e.x - d.x, e.y - d.y) <= d.r + e.r) e.holdT = Math.max(e.holdT || 0, d.hold);
      }
    }
    this.drones = this.drones.filter(d => d.life > 0);
  }

  heroConf(kind) { return C().heroes[kind] || C().heroes.oakens; }
  heroHome() {
    const spawn = (this.routes && this.routes.spawn[0]) || this.path.spawn;
    const st = tileAt(spawn.x, spawn.y);
    const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1],[0,2],[2,0]];
    for (const [dx, dy] of dirs) {
      const tx = st.tx + dx, ty = st.ty + dy;
      if (this.inPlay(tx, ty) && !this.onPath(tx, ty)) return tileCenter(tx, ty);
    }
    return { x: spawn.x, y: spawn.y + TILE };
  }
  spawnHero(kind) {
    const id = kind === 'nebula' ? 'nebula' : 'oakens';
    const conf = this.heroConf(id);
    const home = this.heroHome();
    this.heroKind = id;
    this.pickingHero = false;
    this.hero = {
      kind: id, name: conf.name, rgb: conf.rgb,
      x: home.x, y: home.y, homeX: home.x, homeY: home.y,
      hp: conf.hp, max: conf.hp, ang: 0,
      cool: 0, moveCd: 0, specialCd: 0, respawn: 0,
      dead: false, moving: false, destX: home.x, destY: home.y, flash: 0,
    };
    if (!this.shot && !this.auto && this.levelIndex <= 1) {
      this.heroHint = { life: 7.5, max: 7.5 };
    }
  }
  updateHero(dt) {
    const h = this.hero; if (!h) return;
    const conf = this.heroConf(h.kind);
    if (h.moveCd > 0) h.moveCd -= dt;
    if (h.specialCd > 0) h.specialCd -= dt;
    if (h.flash > 0) h.flash -= dt;
    if (h.dead) {
      h.respawn -= dt;
      if (h.respawn <= 0) {
        h.dead = false; h.hp = h.max; h.x = h.homeX; h.y = h.homeY;
        h.moving = false; this.fx.ring(h.x, h.y, h.rgb, 28, 0.35);
      }
      return;
    }
    if (h.moving) {
      const dx = h.destX - h.x, dy = h.destY - h.y, d = Math.hypot(dx, dy);
      if (d < 4) { h.x = h.destX; h.y = h.destY; h.moving = false; }
      else {
        const step = conf.moveSpeed * dt;
        h.ang = Math.atan2(dy, dx);
        h.x += dx / d * Math.min(step, d);
        h.y += dy / d * Math.min(step, d);
      }
    }
    // nearby ships chip the hero
    let dps = 0;
    for (const e of this.enemies) {
      if (e.dead || e.hp <= 0) continue;
      if (Math.hypot(e.x - h.x, e.y - h.y) <= (e.r + 16)) dps += 10 + (e.hull || 1) * 4;
    }
    if (dps > 0) {
      h.hp -= dps * dt; h.flash = 0.12;
      if (h.hp <= 0) {
        h.hp = 0; h.dead = true; h.respawn = conf.respawn; this.pickedHero = false;
        this.fx.burst(h.x, h.y, h.rgb, 16, 120, 0.4, 2);
        this.banner = { text: h.name + ' DOWN', life: 1.8, rgb: '255,100,120' };
      }
    }
    if (h.dead) return;
    if (h.cool > 0) h.cool -= dt;
    // auto-attack
    let tgt = null, best = 1e9;
    for (const e of this.enemies) {
      if (e.dead || e.hp <= 0) continue;
      const d = Math.hypot(e.x - h.x, e.y - h.y);
      if (d <= conf.range + e.r && d < best) { tgt = e; best = d; }
    }
    if (tgt) {
      const want = Math.atan2(tgt.y - h.y, tgt.x - h.x);
      let ad = want - h.ang; while (ad > Math.PI) ad -= Math.PI * 2; while (ad < -Math.PI) ad += Math.PI * 2;
      h.ang += Math.max(-8 * dt, Math.min(8 * dt, ad));
      if (h.cool <= 0) {
        h.cool = conf.rate; h.flash = 0.12;
        this.beams.push({ x0: h.x, y0: h.y, x1: tgt.x, y1: tgt.y, rgb: h.rgb, life: 0.08, max: 0.08, thick: 1.4 });
        this.hurt(tgt, conf.damage, h.kind === 'nebula' ? 'nebula' : 'laser');
      }
    }
  }
  tryMoveHero(x, y) {
    const h = this.hero; if (!h || h.dead) return false;
    if (h.moveCd > 0) { SD.Audio.deny(); return false; }
    const { tx, ty } = tileAt(x, y);
    if (!this.inPlay(tx, ty) || this.onPath(tx, ty)) { SD.Audio.deny(); return false; }
    const p = tileCenter(tx, ty);
    const conf = this.heroConf(h.kind);
    h.destX = p.x; h.destY = p.y; h.moving = true; h.moveCd = conf.moveCd;
    this.pickedHero = false;
    SD.Audio.click();
    return true;
  }
  heroSpecial() {
    const h = this.hero; if (!h || h.dead) { SD.Audio.deny(); return; }
    const conf = this.heroConf(h.kind);
    if (h.specialCd > 0) { SD.Audio.deny(); return; }
    h.specialCd = conf.specialCd;
    h.flash = 0.25;
    if (conf.special === 'beam') {
      const ang = h.ang, reach = conf.specialRange || 200;
      const x1 = h.x + Math.cos(ang) * reach, y1 = h.y + Math.sin(ang) * reach;
      for (const e of this.enemies) {
        if (e.dead || e.hp <= 0) continue;
        if (this.distToSeg(e.x, e.y, h.x, h.y, x1, y1) <= e.r + 10) this.hurt(e, conf.specialDmg, 'nebula');
      }
      this.beams.push({ x0: h.x, y0: h.y, x1, y1, rgb: h.rgb, life: 0.2, max: 0.2, thick: 5 });
      SD.Audio.laser();
    } else {
      this.fx.ring(h.x, h.y, h.rgb, conf.specialR, 0.4);
      this.fx.burst(h.x, h.y, h.rgb, 16, 140, 0.4, 2);
      for (const e of this.enemies) {
        if (e.dead || e.hp <= 0) continue;
        if (Math.hypot(e.x - h.x, e.y - h.y) <= conf.specialR + e.r) this.hurt(e, conf.specialDmg, 'laser');
      }
      SD.Audio.explode(0.9);
    }
  }

  handleInput() {
    if (SD.Input.hit('KeyM')) { SD.Audio.toggleMute(); SD.Audio.click(); }
    const downs = SD.Input.takeDowns();
    const released = SD.Input.takeReleased();
    const clicks = released.filter(u => u.tap && u.button !== 2);

    if (this.restartAsk) {
      this.handleRestartInput(clicks);
      return;
    }
    if (this.pickingHero && !this.score && !this.over) {
      if (SD.Input.hit('Digit1') || SD.Input.hit('KeyO')) { this.spawnHero('oakens'); SD.Audio.click(); return; }
      if (SD.Input.hit('Digit2') || SD.Input.hit('KeyN')) { this.spawnHero('nebula'); SD.Audio.click(); return; }
      for (const p of clicks) {
        if (this.oakensBtn && SD.inBtn(this.oakensBtn, p)) { this.spawnHero('oakens'); SD.Audio.click(); }
        else if (this.nebulaBtn && SD.inBtn(this.nebulaBtn, p)) { this.spawnHero('nebula'); SD.Audio.click(); }
      }
      return;
    }
    if (this.bossLine && !this.score && !this.over) {
      if (SD.Input.confirm() || SD.Input.hit('Escape') || clicks.length) {
        this.dismissBossLine();
        SD.Audio.click();
        return;
      }
    }
    if (this.score) {
      if (SD.Input.confirm()) { SD.Audio.click(); this.closeLevelScore(true); return; }
      if (SD.Input.hit('Escape')) { SD.Audio.click(); this.closeLevelScore(false); return; }
      for (const p of clicks) {
        if (this.nextBtn && SD.inBtn(this.nextBtn, p)) { SD.Audio.click(); this.closeLevelScore(true); }
        else if (this.menuBtn && SD.inBtn(this.menuBtn, p)) { SD.Audio.click(); this.closeLevelScore(false); }
      }
      return;
    }
    if (this.over) {
      if (SD.Input.hit('KeyT') && this.over !== 'win') { this.askRestart('over'); return; }
      for (const p of clicks) this.clickOverlay(p);
      if (this.over !== 'win' && (SD.Input.confirm() || SD.Input.hit('KeyT'))) this.askRestart('over');
      if (SD.Input.hit('Escape')) { SD.Audio.click(); SD.start('title'); }
      return;
    }
    const rightClick = downs.some(d => d.button === 2) || released.some(u => u.button === 2);
    if (this.aim && (SD.Input.hit('Escape') || rightClick)) { this.cancelAim(); return; }
    if (SD.Input.hit('KeyT')) { this.askRestart(this.paused ? 'pause' : 'play'); return; }
    if (SD.Input.hit('KeyP') || SD.Input.hit('Escape')) { this.pause(); SD.Audio.click(); }
    if (this.paused) {
      for (const p of clicks) this.clickPause(p);
      return;
    }
    SHOP.forEach((k, i) => {
      if (SD.Input.hit('Digit' + (i + 1)) || SD.Input.hit('Numpad' + (i + 1))) this.toggleShop(k);
    });
    if (SD.Input.hit('KeyF')) this.cycleSpeed();
    if (SD.Input.hit('KeyQ')) this.armAbility('orbital');
    if (SD.Input.hit('KeyW')) this.armAbility('drones');
    if (SD.Input.hit('KeyE')) this.armAbility('emp');
    if (SD.Input.hit('KeyR')) this.heroSpecial();
    if (SD.Input.hit('KeyU')) this.tryUpgrade();
    if (SD.Input.hit('KeyX') || SD.Input.hit('Backspace') || SD.Input.hit('Delete')) this.trySell();
    if (SD.Input.hit('Space') || SD.Input.hit('KeyG')) this.sendWaveEarly();

    this.updateDrag(downs, released);
    if (this._dragConsumed) { this._dragConsumed = false; return; }

    const ui = this.uiButtons();
    for (const p of clicks) {
      let hit = false;
      for (const b of ui) if (SD.inBtn(b, p)) { b.click(); hit = true; break; }
      if (hit) continue;
      if (inHud(p)) continue;
      if (this.aim) { this.fireAbility(this.aim, p.x, p.y); continue; }
      const { tx, ty } = tileAt(p.x, p.y);
      const existing = this.turrets.find(t => t.tx === tx && t.ty === ty);
      const ship = this.enemies.find(en => Math.hypot(en.x - p.x, en.y - p.y) <= en.r + 12);
      const heroHit = this.hero && !this.hero.dead && Math.hypot(this.hero.x - p.x, this.hero.y - p.y) <= 22;
      if (this.pickedHero && !heroHit) {
        this.tryMoveHero(p.x, p.y);
        continue;
      }
      if (heroHit) {
        this.pickedHero = true; this.picked = null; this.shop = null; this.inspected = null;
        SD.Audio.click();
      } else if (existing) {
        this.picked = existing;
        this.shop = null;
        this.pickedHero = false;
        this.inspected = null;
        SD.Audio.click();
      } else if (this.padLocked(tx, ty) && !this.shop) {
        this.tryUnlock(tx, ty);
      } else if (ship) {
        this.inspected = ship;
        this.picked = null;
        this.pickedHero = false;
        SD.Audio.click();
      } else if (this.shop) {
        this.tryPlace(tx, ty);
      } else {
        this.picked = null;
        this.pickedHero = false;
        this.inspected = null;
      }
    }
  }

  shopBtnAt(p) {
    for (const b of this.uiButtons()) {
      if (SHOP.includes(b.id) && !b.disabled && SD.inBtn(b, p)) return b;
    }
    return null;
  }
  updateDrag(downs, released) {
    this._dragConsumed = false;
    if (!this.drag) {
      for (const d of downs) {
        if (d.button === 2) continue;
        const b = this.shopBtnAt(d);
        if (b) {
          this.drag = { kind: b.id, x: d.x, y: d.y, ox: d.x, oy: d.y, armed: false, ptr: d.id };
          break;
        }
      }
    }
    if (!this.drag) return;
    const ptr = (this.drag.ptr != null && SD.Input.pointers.get(this.drag.ptr))
      || (SD.Input.pointers.size ? SD.Input.pointers.values().next().value : null);
    if (ptr) { this.drag.x = ptr.x; this.drag.y = ptr.y; }
    else if (SD.Input.mouse.over && !released.length) {
      this.drag.x = SD.Input.mouse.x; this.drag.y = SD.Input.mouse.y;
    }
    if (!this.drag.armed) {
      const dx = this.drag.x - this.drag.ox, dy = this.drag.y - this.drag.oy;
      if (dx * dx + dy * dy >= 14 * 14) {
        this.drag.armed = true;
        this.shop = this.drag.kind;
        this.picked = null; this.pickedHero = false; this.aim = null;
      }
    }
    if (released.length) {
      if (this.drag.armed) {
        this.finishDrag(released[0].x, released[0].y);
        this._dragConsumed = true;
      }
      this.drag = null;
    }
  }
  finishDrag(x, y) {
    const kind = this.drag && this.drag.kind;
    this.shop = kind;
    if (!kind || inHud({ x, y })) {
      this.shop = null; SD.Audio.deny(); return;
    }
    const { tx, ty } = tileAt(x, y);
    if (this.canDrop(tx, ty, kind)) this.tryPlace(tx, ty);
    else { this.shop = null; SD.Audio.deny(); }
  }

  canRestart() {
    if (this.score || this.pickingHero) return false;
    if (this.over === 'win') return false;
    return true;
  }
  askRestart(from) {
    if (!this.canRestart()) return;
    this.restartAsk = true;
    this.restartFrom = from || (this.over ? 'over' : this.paused ? 'pause' : 'play');
    this.restartSel = 0;
    if (!this.over && !this.paused) this.pause(true);
    SD.Audio.click();
  }
  cancelRestart() {
    if (!this.restartAsk) return;
    this.restartAsk = false;
    SD.Audio.click();
    if (this.restartFrom === 'play') this.pause(false);
  }
  retryLevel() {
    SD.start('level', { index: this.levelIndex, hero: this.heroKind || undefined });
  }
  restartButtons() {
    return {
      yes: { x: W / 2 - 100, y: 330, w: 180, h: 50, label: 'YES', rgb: '255,80,220', size: 22 },
      no:  { x: W / 2 + 100, y: 330, w: 180, h: 50, label: 'NO',  rgb: '70,160,255', size: 22 },
    };
  }
  pauseButtons() {
    return {
      resume: { x: W / 2, y: 268, w: 240, h: 50, label: 'RESUME', rgb: '80,170,255', size: 22 },
      retry:  { x: W / 2, y: 334, w: 240, h: 50, label: 'RETRY',  rgb: '255,200,90', size: 22 },
      menu:   { x: W / 2, y: 400, w: 240, h: 50, label: 'MENU',   rgb: '255,80,220', size: 22 },
    };
  }
  overButtons() {
    return {
      again: { x: W / 2, y: 340, w: 260, h: 52, label: this.over === 'win' ? 'PLAY AGAIN' : 'RETRY', rgb: '80,170,255', size: 22 },
      menu:  { x: W / 2, y: 406, w: 260, h: 52, label: 'MENU', rgb: '255,80,220', size: 22 },
    };
  }
  handleRestartInput(clicks) {
    const btns = this.restartButtons();
    if (SD.Input.hitAny('Escape', 'Backspace', 'KeyN')) { this.cancelRestart(); return; }
    if (SD.Input.hitAny('ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS')) {
      this.restartSel = 1 - this.restartSel; SD.Audio.click(); return;
    }
    if (SD.Input.hit('KeyY') || (SD.Input.confirm() && this.restartSel === 0)) { this.retryLevel(); return; }
    if (SD.Input.confirm() && this.restartSel === 1) { this.cancelRestart(); return; }
    for (const p of clicks) {
      if (SD.inBtn(btns.yes, p)) this.retryLevel();
      else if (SD.inBtn(btns.no, p)) this.cancelRestart();
    }
  }

  toggleShop(kind) {
    this.shop = this.shop === kind ? null : kind;
    if (this.shop) { this.picked = null; this.pickedHero = false; this.aim = null; }
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
      btns.push({ x: 800, y: H - 78, w: 92, h: 22, label: 'TGT '+this.priLabel(t), rgb: '200,220,255', size: 11, click: () => this.cyclePriority(t), id: 'pri' });
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

    const abs = ['orbital', 'drones', 'emp'];
    abs.forEach((id, i) => {
      const conf = C().abilities[id];
      const cd = this.abCd[id] || 0;
      const ready = cd <= 0;
      const sub = ready ? 'READY' : (Math.ceil(cd) + 's');
      btns.push({
        x: 64 + i * 96, y: 68, w: 90, h: 30,
        label: conf.name, sub, rgb: conf.rgb, size: 11,
        click: () => this.armAbility(id), disabled: !ready && this.aim !== id, id: 'ab-' + id,
      });
    });
    if (this.hero) {
      const h = this.hero;
      const down = h.dead;
      const ready = !down && h.specialCd <= 0;
      const sub = down ? (Math.ceil(h.respawn) + 's') : (ready ? 'READY' : (Math.ceil(h.specialCd) + 's'));
      btns.push({
        x: 352, y: 68, w: 100, h: 30,
        label: 'SPECIAL', sub, rgb: h.rgb, size: 11,
        click: () => this.heroSpecial(), disabled: !ready, id: 'hspecial',
      });
    }

    btns.push({ x: W - 168, y: 24, w: 64, h: 28, label: 'x' + (this.timeScale || 1), rgb: '255,220,120', size: 14, click: () => this.cycleSpeed(), id: 'speed' });
    btns.push({ x: W - 100, y: 24, w: 64, h: 28, label: 'PAUSE', rgb: '180,200,255', size: 12, click: () => { this.pause(); SD.Audio.click(); }, id: 'pause' });
    btns.push({ x: W - 34, y: 24, w: 52, h: 28, label: SD.Audio.muted ? 'MUTED' : 'MUTE', rgb: '180,200,255', size: 12, click: () => { SD.Audio.toggleMute(); SD.Audio.click(); }, id: 'mute' });
    return btns;
  }

  clickPause(p) {
    if (this.restartAsk) {
      this.handleRestartInput([p]);
      return;
    }
    const b = this.pauseButtons();
    if (SD.inBtn(b.resume, p)) { this.paused = false; SD.Audio.click(); }
    else if (SD.inBtn(b.retry, p)) this.askRestart('pause');
    else if (SD.inBtn(b.menu, p)) { SD.Audio.click(); SD.start('title'); }
  }

  clickOverlay(p) {
    if (this.restartAsk) {
      this.handleRestartInput([p]);
      return;
    }
    const b = this.overButtons();
    if (SD.inBtn(b.again, p)) {
      if (this.over === 'win') { SD.Audio.click(); this.retryLevel(); }
      else this.askRestart('over');
    } else if (SD.inBtn(b.menu, p)) { SD.Audio.click(); SD.start('title'); }
  }

  /* ---------- draw ---------- */
  draw(g) {
    if (this.showcase === 'ships') { this.drawShipShowcase(g); return; }
    if (this.showcase) { this.drawShowcase(g); return; }
    SD.drawSpaceBg(g, this.variant);
    this.stars.draw(g, this.T);
    this.drawPath(g);
    this.drawBuildGrid(g);
    // gates & station
    const spawns = (this.routes && this.routes.spawn) || [this.path.spawn];
    const gateRgb = ['255,80,220', '80,220,255'];
    spawns.forEach((s, i) => {
      SD.glow(g, s.x, s.y, 40, 50, gateRgb[i % 2], 0.22 + 0.08 * Math.sin(this.T * 4 + i));
      SD.blit(g, this.spr.gate, s.x - 6, s.y, 0, 1);
    });
    const base = (this.routes && this.routes.base) || this.path.base;
    SD.glow(g, base.x, base.y, 50, 50, '80,170,255', 0.18 + 0.06 * Math.sin(this.T * 2));
    SD.blit(g, this.spr.station, base.x + 6, base.y, 0, 1);

    this.drawGhost(g);
    this.drawDrones(g);
    this.drawHero(g);
    this.drawAim(g);

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
    if (this.heroHint) this.drawHeroHint(g);
    if (this.banner && !this.bossLine) {
      const a = Math.min(1, this.banner.life, (2.6 - this.banner.life) * 3);
      SD.neonText(g, this.banner.text, W / 2, 96, this.banner.text.length > 22 ? 22 : 28, this.banner.rgb, { alpha: a, blur: 18 });
    }
    if (this.bossLine) this.drawBossLine(g);
    if (this.score) this.drawScore(g);
    if (this.pickingHero) this.drawHeroPick(g);
    if (this.paused && !this.over && !this.score) this.drawPause(g);
    if (this.over) this.drawOver(g);
    SD.drawScanlines(g);
  }

  drawPath(g) {
    const routes = this.paths || [this.path];
    routes.forEach((route, ri) => {
      const pts = route.pts;
      const rgb = ri ? '255,90,200' : '80,200,255';
      g.save();
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = ri ? 'rgba(255,90,200,0.16)' : 'rgba(80,140,255,0.18)'; g.lineWidth = 36;
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
      g.strokeStyle = 'rgba(20,16,48,0.72)'; g.lineWidth = 26;
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
      g.strokeStyle = `rgba(${rgb},0.4)`; g.lineWidth = 2;
      g.setLineDash([10, 10]); g.lineDashOffset = -this.T * 24;
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
      g.setLineDash([]);
      g.restore();
    });
  }

  hoverTile() {
    if (this.drag && this.drag.armed) {
      if (inHud({ x: this.drag.x, y: this.drag.y })) return null;
      return tileAt(this.drag.x, this.drag.y);
    }
    if (this.ghost) return this.ghost;
    if (!this.shop || !SD.Input.mouse.over) return null;
    if (inHud(SD.Input.mouse)) return null;
    return tileAt(SD.Input.mouse.x, SD.Input.mouse.y);
  }

  /* Marked build pads only. Premium pads stay gold and locked until bought. */
  drawBuildGrid(g) {
    const s = TILE - 6;
    for (const pad of this.pads || []) {
      const p = tileCenter(pad.tx, pad.ty);
      const x = p.x - s / 2, y = p.y - s / 2;
      const occ = this.occupied(pad.tx, pad.ty);
      g.save();
      SD.roundRect(g, x, y, s, s, 4);
      if (pad.premium && !pad.open) {
        g.fillStyle = 'rgba(255,200,80,0.14)'; g.fill();
        g.strokeStyle = 'rgba(255,220,90,0.7)'; g.lineWidth = 1.6; g.stroke();
        SD.neonText(g, 'LOCK', p.x, p.y - 5, 9, '255,220,90', { blur: 3 });
        SD.neonText(g, pad.cost + ' CR', p.x, p.y + 10, 9, '255,220,90', { blur: 3 });
      } else if (pad.premium) {
        g.fillStyle = occ ? 'rgba(255,200,80,0.05)' : 'rgba(255,200,80,0.12)'; g.fill();
        g.strokeStyle = 'rgba(255,220,90,0.55)'; g.lineWidth = 1.4; g.stroke();
      } else {
        g.fillStyle = occ ? 'rgba(80,170,255,0.05)' : 'rgba(80,170,255,0.14)'; g.fill();
        g.strokeStyle = 'rgba(120,210,255,0.45)'; g.lineWidth = 1.2; g.stroke();
      }
      const hover = this.hoverTile();
      if (this.shop && hover && hover.tx === pad.tx && hover.ty === pad.ty) {
        const ok = this.canDrop(pad.tx, pad.ty, this.shop);
        g.strokeStyle = ok ? 'rgba(80,255,160,0.95)' : 'rgba(255,70,90,0.95)';
        g.lineWidth = 2.4; g.stroke();
      }
      g.restore();
    }
  }

  drawGhost(g) {
    const hover = this.hoverTile();
    if (this.shop && hover && this.inPlay(hover.tx, hover.ty)) {
      const p = tileCenter(hover.tx, hover.ty);
      const ok = this.canDrop(hover.tx, hover.ty, this.shop);
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

  drawDrones(g) {
    for (const d of this.drones || []) {
      const a = Math.max(0, d.life / d.max);
      g.save();
      g.strokeStyle = `rgba(${d.rgb},${0.25 + 0.5 * a})`; g.lineWidth = 1.4;
      g.beginPath(); g.arc(d.x, d.y, d.r, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 3; i++) {
        const ang = this.T * 2.4 + i * Math.PI * 2 / 3;
        const px = d.x + Math.cos(ang) * 16, py = d.y + Math.sin(ang) * 16;
        SD.glow(g, px, py, 10, 10, d.rgb, 0.5);
        g.fillStyle = `rgba(${d.rgb},0.95)`; g.beginPath(); g.arc(px, py, 3.2, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }
  }

  drawAim(g) {
    if (!this.aim) return;
    const conf = C().abilities[this.aim];
    if (!conf) return;
    const m = SD.Input.mouse;
    const at = (m.over && !inHud(m)) ? m : null;
    if (at) {
      g.save();
      g.beginPath(); g.arc(at.x, at.y, conf.radius, 0, Math.PI * 2);
      g.fillStyle = `rgba(${conf.rgb},0.12)`; g.fill();
      g.strokeStyle = `rgba(${conf.rgb},0.85)`; g.lineWidth = 2; g.stroke();
      // reticle
      g.beginPath(); g.arc(at.x, at.y, 8, 0, Math.PI * 2);
      g.strokeStyle = `rgba(${conf.rgb},0.95)`; g.lineWidth = 1.4; g.stroke();
      g.beginPath();
      g.moveTo(at.x - 16, at.y); g.lineTo(at.x - 5, at.y);
      g.moveTo(at.x + 5, at.y); g.lineTo(at.x + 16, at.y);
      g.moveTo(at.x, at.y - 16); g.lineTo(at.x, at.y - 5);
      g.moveTo(at.x, at.y + 5); g.lineTo(at.x, at.y + 16);
      g.stroke();
      g.restore();
    }
    const touch = SD.Input.touchMode;
    const title = (conf.name || 'ABILITY') + '  ·  ' + (touch ? 'TAP TO TARGET' : 'CLICK TO TARGET');
    const hint = touch ? 'TAP THE BUTTON AGAIN TO CANCEL' : 'ESC  ·  RIGHT-CLICK  ·  BUTTON TO CANCEL';
    const w = 520, h = 48, x = (W - w) / 2, y = 100;
    g.save();
    SD.roundRect(g, x, y, w, h, 10);
    g.fillStyle = 'rgba(8,10,20,0.88)'; g.fill();
    g.strokeStyle = `rgba(${conf.rgb},0.7)`; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, title, W / 2, y + 18, 15, conf.rgb, { blur: 7 });
    SD.neonText(g, hint, W / 2, y + 36, 11, '200,220,240', { blur: 5, alpha: 0.85 });
  }

  tickBossBar(dt) {
    const boss = (this.enemies || []).find(e => e.boss && !e.dead && e.hp > 0);
    if (!boss) { this.bossBarTrail = null; this.bossBarOf = null; return; }
    const pct = Math.max(0, Math.min(1, boss.hp / (boss.max || 1)));
    if (this.bossBarOf !== boss) { this.bossBarTrail = pct; this.bossBarOf = boss; }
    if (this.bossBarTrail == null) this.bossBarTrail = pct;
    const step = Math.max(0.15, dt) * 0.55;
    if (this.bossBarTrail > pct) this.bossBarTrail = Math.max(pct, this.bossBarTrail - step);
    else this.bossBarTrail = pct;
  }

  drawBossBar(g) {
    const boss = (this.enemies || []).find(e => e.boss && !e.dead && e.hp > 0);
    if (!boss) return;
    const pct = Math.max(0, Math.min(1, boss.hp / (boss.max || 1)));
    const trail = this.bossBarTrail == null ? pct : this.bossBarTrail;
    const name = (boss.name || 'EDISAR').toUpperCase();
    // Under the top bar, clear of ability/SPECIAL buttons (they end at x=402).
    const w = 420, x = 424, y = 50, h = 28;
    g.save();
    SD.roundRect(g, x, y, w, h, 7);
    g.fillStyle = 'rgba(6,8,14,0.92)'; g.fill();
    const frame = g.createLinearGradient(x, y, x, y + h);
    frame.addColorStop(0, 'rgba(210,220,235,0.85)');
    frame.addColorStop(0.45, 'rgba(70,80,100,0.9)');
    frame.addColorStop(1, 'rgba(150,160,180,0.65)');
    g.strokeStyle = frame; g.lineWidth = 1.7; g.stroke();
    g.restore();
    SD.neonText(g, name, x + w / 2, y + 10, 11, '255,210,210', { blur: 6 });
    const bx = x + 10, by = y + 16, bw = w - 20, bh = 8;
    g.save();
    SD.roundRect(g, bx, by, bw, bh, 3);
    g.fillStyle = 'rgba(18,6,8,0.95)'; g.fill();
    if (trail > pct + 0.01) {
      SD.roundRect(g, bx, by, bw * trail, bh, 3);
      g.fillStyle = 'rgba(200,90,50,0.9)'; g.fill();
    }
    const hg = g.createLinearGradient(bx, by, bx, by + bh);
    hg.addColorStop(0, '#ff8a8a');
    hg.addColorStop(0.4, '#e01828');
    hg.addColorStop(1, '#7a0a14');
    SD.roundRect(g, bx, by, Math.max(0, bw * pct), bh, 3);
    g.fillStyle = hg; g.fill();
    g.strokeStyle = 'rgba(255,230,230,0.22)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(bx + 1, by + 1.2); g.lineTo(bx + bw * pct - 1, by + 1.2); g.stroke();
    g.strokeStyle = 'rgba(8,8,12,0.75)'; g.lineWidth = 1;
    for (const t of [0.25, 0.5, 0.75]) {
      const tx = Math.round(bx + bw * t) + 0.5;
      g.beginPath(); g.moveTo(tx, by); g.lineTo(tx, by + bh); g.stroke();
    }
    g.restore();
  }

  drawHero(g) {
    const h = this.hero; if (!h) return;
    if (h.dead) {
      SD.neonText(g, h.name + '  ' + Math.ceil(h.respawn) + 's', h.homeX, h.homeY, 11, h.rgb, { blur: 5 });
      return;
    }
    if (this.pickedHero) {
      const conf = this.heroConf(h.kind);
      g.save();
      g.beginPath(); g.arc(h.x, h.y, conf.range, 0, Math.PI * 2);
      g.fillStyle = `rgba(${h.rgb},0.07)`; g.fill();
      g.strokeStyle = `rgba(${h.rgb},0.5)`; g.lineWidth = 1.3; g.stroke();
      g.restore();
    } else if (!h.moving) {
      const pulse = 0.5 + 0.5 * Math.sin(this.T * 3.2);
      g.save();
      g.beginPath(); g.arc(h.x, h.y, 15 + pulse * 5, 0, Math.PI * 2);
      g.strokeStyle = `rgba(${h.rgb},${0.28 + 0.42 * pulse})`;
      g.lineWidth = 1.6; g.stroke();
      g.restore();
    }
    const spr = this.spr.hero && this.spr.hero[h.kind];
    if (spr) SD.blit(g, spr, h.x, h.y, h.ang + Math.PI / 2, 1);
    else {
      SD.glow(g, h.x, h.y, 18, 18, h.rgb, 0.35);
      g.save(); g.translate(h.x, h.y); g.rotate(h.ang);
      g.fillStyle = '#c8ccd8';
      g.beginPath(); g.moveTo(12, 0); g.lineTo(-8, 7); g.lineTo(-5, 0); g.lineTo(-8, -7); g.closePath(); g.fill();
      g.fillStyle = `rgba(${h.rgb},1)`; g.beginPath(); g.arc(-1, 0, 3, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    // hp bar
    const bw = 28, bh = 3, ratio = Math.max(0, h.hp / h.max);
    g.save();
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(h.x - bw / 2, h.y + 16, bw, bh);
    g.fillStyle = `rgba(${h.rgb},0.95)`; g.fillRect(h.x - bw / 2, h.y + 16, bw * ratio, bh);
    g.restore();
    if (this.pickedHero) SD.neonText(g, h.name, h.x, h.y - 22, 10, h.rgb, { blur: 4 });
  }

  drawHeroPick(g) {
    g.save(); g.fillStyle = 'rgba(4,2,12,0.62)'; g.fillRect(0, 0, W, H); g.restore();
    SD.neonText(g, 'CHOOSE YOUR PILOT', W / 2, 140, 28, '200,230,255', { blur: 14 });
    SD.neonText(g, this.level.name, W / 2, 176, 16, '255,220,140', { blur: 8 });
    this.oakensBtn = { x: W / 2 - 150, y: 310, w: 240, h: 70, label: 'OAKENS', rgb: '80,170,255', size: 22 };
    this.nebulaBtn = { x: W / 2 + 150, y: 310, w: 240, h: 70, label: 'NEBULA', rgb: '255,70,70', size: 22 };
    const mouse = SD.Input.mouse;
    SD.drawButton(g, this.oakensBtn, mouse.over && SD.inBtn(this.oakensBtn, mouse), this.T);
    SD.drawButton(g, this.nebulaBtn, mouse.over && SD.inBtn(this.nebulaBtn, mouse), this.T);
    SD.neonText(g, 'Cyan visor. Fast burst special.', W / 2 - 150, 370, 12, '180,210,255', { blur: 5 });
    SD.neonText(g, 'Red beam. Ignores shields.', W / 2 + 150, 370, 12, '255,160,160', { blur: 5 });
    SD.neonText(g, 'TAP A PILOT  ·  1 OAKENS  ·  2 NEBULA', W / 2, 440, 13, '180,200,220', { blur: 5, alpha: 0.8 });
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
    if (e.poison && e.poison.length) SD.glow(g, e.x, e.y, e.r + 12, e.r + 12, '80,255,180', 0.18 + 0.08 * Math.min(3, e.poison.length));
    if (e.holdT > 0) SD.glow(g, e.x, e.y, e.r + 10, e.r + 10, '80,200,255', 0.22);
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

  drawHeroHint(g) {
    const q = this.heroHint; if (!q) return;
    const fadeIn = Math.min(1, (q.max - q.life) * 3);
    const fadeOut = Math.min(1, q.life * 3);
    const a = Math.min(fadeIn, fadeOut);
    const touch = SD.Input.touchMode;
    const l1 = touch
      ? 'Tap your hero, then tap a tile to move.'
      : 'Click your hero, then click a tile to move.';
    const l2 = touch
      ? 'Tap SPECIAL to fire their power.'
      : 'Press R or the SPECIAL button to fire their power.';
    const w = 560, h = 78, x = (W - w) / 2, y = 108;
    g.save();
    g.globalAlpha = 0.94 * a;
    SD.roundRect(g, x, y, w, h, 10);
    g.fillStyle = 'rgba(8,10,20,0.92)'; g.fill();
    g.strokeStyle = 'rgba(80,170,255,0.65)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, l1, W / 2, y + 28, 15, '200,230,255', { blur: 6, alpha: a });
    SD.neonText(g, l2, W / 2, y + 52, 15, '200,230,255', { blur: 6, alpha: a });
  }

  drawBossLine(g) {
    const q = this.bossLine; if (!q) return;
    const fadeIn = Math.min(1, (q.max - q.life) * 4);
    const fadeOut = Math.min(1, q.life * 4);
    const a = Math.min(fadeIn, fadeOut);
    const por = 148, gap = 16, textW = 620;
    const w = 18 + por + gap + textW + 18;
    g.save();
    g.font = 'bold 16px ' + (SD.CONFIG.font || 'sans-serif');
    const lines = this.wrapLine(g, q.text, textW - 8);
    const h = Math.max(por + 20, 92 + lines.length * 22);
    const x = (W - w) / 2, y = 108;
    const px = x + 10, py = y + (h - por) / 2;
    g.globalAlpha = 0.96 * a;
    SD.roundRect(g, x, y, w, h, 12);
    g.fillStyle = 'rgba(8,10,20,0.94)'; g.fill();
    g.strokeStyle = 'rgba(255,205,90,0.75)'; g.lineWidth = 1.8; g.stroke();
    g.restore();

    const im = SD.Portraits && SD.Portraits.edisar;
    g.save();
    g.globalAlpha = a;
    SD.roundRect(g, px, py, por, por, 10);
    g.fillStyle = 'rgba(8,4,20,0.9)'; g.fill();
    g.clip();
    if (im && im.complete && im.naturalWidth) {
      g.drawImage(im, px, py, por, por);
      g.fillStyle = 'rgba(0,0,0,0.14)';
      for (let sy = py; sy < py + por; sy += 4) g.fillRect(px, sy, por, 1.4);
    }
    g.restore();
    g.save();
    g.globalAlpha = a;
    SD.roundRect(g, px, py, por, por, 10);
    g.strokeStyle = 'rgba(255,205,90,0.95)'; g.lineWidth = 2.2;
    g.shadowColor = 'rgba(255,205,90,0.85)'; g.shadowBlur = 14 * (SD.view && SD.view.scale || 1);
    g.stroke();
    g.restore();

    const tx = px + por + gap;
    SD.neonText(g, 'EDISAR STARLIGHT', tx, y + 24, 15, '255,205,90', { blur: 8, alpha: a, align: 'left' });
    SD.neonText(g, q.name.toUpperCase(), tx, y + 44, 11, '200,210,230', { blur: 5, alpha: a * 0.9, align: 'left' });
    lines.forEach((ln, i) => {
      SD.neonText(g, ln, tx, y + 72 + i * 22, 16, '230,235,245', { blur: 6, alpha: a, align: 'left' });
    });
    const hint = SD.Input.touchMode ? 'TAP TO DISMISS' : 'TAP  ·  SPACE  TO DISMISS';
    SD.neonText(g, hint, tx, y + h - 16, 11, '180,200,220', { blur: 5, alpha: 0.55 * a, align: 'left' });
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
      const selected = (b.id && b.id === this.shop) || (b.id === 'up' && this.picked && this.picked.level < cap && SD.inBtn(b, mouse)) || (b.id === 'speed' && (this.timeScale || 1) > 1) || (b.id && b.id.startsWith('ab-') && this.aim && b.id === 'ab-' + this.aim) || (b.id === 'pri');
      const hover = mouse.over && SD.inBtn(b, mouse);
      SD.drawButton(g, b, selected || hover, this.T);
      if (b.tag) SD.neonText(g, b.tag, b.x, b.y - 20, 8, '255,210,90', { blur: 3 });
    }
    if (this.picked && !this.shop) {
      const t = this.picked, conf = C().turrets[t.kind];
      SD.neonText(g, conf.name + '  MK ' + (t.level === 3 ? 'III' : t.level === 2 ? 'II' : 'I'), 650, H - 78, 11, conf.rgb, { blur: 4, alpha: 0.8 });
    }
    this.drawBossBar(g);
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

  drawRestartAsk(g) {
    const mouse = SD.Input.mouse;
    SD.neonText(g, 'RESTART?', W / 2, 210, 48, '255,80,220', { blur: 22 });
    SD.neonText(g, 'THIS LEVEL WILL START OVER', W / 2, 262, 16, '160,200,255', { blur: 8, alpha: 0.9 });
    const b = this.restartButtons();
    SD.drawButton(g, b.yes, this.restartSel === 0 || (mouse.over && SD.inBtn(b.yes, mouse)), this.T);
    SD.drawButton(g, b.no, this.restartSel === 1 || (mouse.over && SD.inBtn(b.no, mouse)), this.T);
  }

  drawPause(g) {
    g.save(); g.fillStyle = 'rgba(4,2,12,0.62)'; g.fillRect(0, 0, W, H); g.restore();
    if (this.restartAsk) { this.drawRestartAsk(g); return; }
    const mouse = SD.Input.mouse;
    SD.neonText(g, 'PAUSED', W / 2, 196, 48, '80,170,255', { blur: 20 });
    const b = this.pauseButtons();
    SD.drawButton(g, b.resume, mouse.over && SD.inBtn(b.resume, mouse), this.T);
    SD.drawButton(g, b.retry, mouse.over && SD.inBtn(b.retry, mouse), this.T);
    SD.drawButton(g, b.menu, mouse.over && SD.inBtn(b.menu, mouse), this.T);
    SD.neonText(g, SD.Input.touchMode ? 'RESUME  ·  RETRY  ·  MENU' : 'P / ESC TO RESUME  ·  T RETRY', W / 2, 468, 13, '180,200,255', { blur: 6, alpha: 0.7 });
  }

  drawOver(g) {
    g.save(); g.fillStyle = 'rgba(4,2,12,0.72)'; g.fillRect(0, 0, W, H); g.restore();
    if (this.restartAsk) { this.drawRestartAsk(g); return; }
    const mouse = SD.Input.mouse;
    if (this.over === 'win') {
      SD.neonText(g, 'SECTOR HELD', W / 2, 200, 52, '80,255,180', { blur: 22 });
      SD.neonText(g, "Edisar's flagship is down. The station stands.", W / 2, 260, 18, '220,230,255', { blur: 8, alpha: 0.9 });
    } else {
      SD.neonText(g, 'HULL BREACHED', W / 2, 200, 48, '255,80,120', { blur: 22 });
      SD.neonText(g, "The station has fallen to Edisar's fleet.", W / 2, 260, 18, '220,230,255', { blur: 8, alpha: 0.9 });
    }
    const b = this.overButtons();
    SD.drawButton(g, b.again, mouse.over && SD.inBtn(b.again, mouse), this.T);
    SD.drawButton(g, b.menu, mouse.over && SD.inBtn(b.menu, mouse), this.T);
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
      const spr = this.spr[def.sprite || type] || this.spr.flagship;
      SD.blit(g, spr, x, y, 0, sc);
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
    for (const pad of this.pads || []) {
      if (this.occupied(pad.tx, pad.ty)) continue;
      const p = tileCenter(pad.tx, pad.ty);
      let best = 1e9;
      for (const route of (this.paths || [this.path])) {
        for (const pt of route.pts) best = Math.min(best, Math.hypot(pt.x - p.x, pt.y - p.y));
      }
      pads.push({ tx: pad.tx, ty: pad.ty, best, premium: pad.premium, cost: pad.cost, open: pad.open });
    }
    pads.sort((a, b) => a.best - b.best);
    return pads.slice(0, Math.max(n * 2, n));
  }

  applyShot(id) {
    const layout = [
      [4, 6, 'laser', 3], [8, 6, 'railgun', 2], [8, 9, 'ice', 3], [11, 9, 'tesla', 2],
      [15, 6, 'pulse', 2], [17, 6, 'ice', 2], [18, 8, 'missile', 3], [22, 10, 'laser', 2],
      [25, 10, 'railgun', 1], [25, 14, 'pulse', 3], [22, 14, 'tesla', 1], [4, 9, 'missile', 2],
    ];
    const plant = (list) => {
      this.turrets = [];
      for (const [tx, ty, k, lv] of list) {
        const pad = this.padAt(tx, ty);
        if (pad && pad.premium) pad.open = true;
        if (this.canPlace(tx, ty) || this.occupied(tx, ty) || this.shot) this.place(tx, ty, k, lv);
      }
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
    } else if (id === 'pads') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 2], [8, 10, 'ice', 1], [15, 5, 'tesla', 1], [19, 8, 'railgun', 1]]);
      this.credits = 220;
      this.waveIndex = 1;
      this.shop = 'missile';
    } else if (id === 'targeting') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 2], [10, 10, 'pulse', 2], [19, 8, 'railgun', 2]]);
      this.picked = this.turrets.find(t => t.kind === 'railgun') || this.turrets[0];
      if (this.picked) this.picked.priority = 'strongest';
      this.credits = 200;
      this.waveIndex = 2;
    } else if (id === 'abilities') {
      this.setLevel(1); this.reset(); this.spawnHero('oakens');
      plantNear(8);
      this.credits = 260;
      this.waveIndex = 4;
      this.startWave();
      this.enemies = [];
      const types = ['scout', 'shielded', 'fighter', 'armored', 'interceptor', 'cryo', 'shielded', 'scout'];
      types.forEach((tp, i) => this.spawn(tp, 120 + i * 130));
      this.sim(0.35);
      const cx = 420, cy = 300;
      this.fx.ring(cx, cy, '255,180,80', 78, 8);
      this.fx.burst(cx, cy, '255,180,80', 22, 180, 8, 2.2);
      this.aim = null;
      this.abCd.orbital = 12;
    } else if (id === 'hero') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 1], [8, 10, 'ice', 1], [15, 5, 'tesla', 1]]);
      this.credits = 210;
      const h = this.hero;
      const mid = this.path.pts[2] || this.path.pts[1];
      h.x = mid.x + 28; h.y = mid.y + 28; h.homeX = h.x; h.homeY = h.y;
      this.pickedHero = true;
      this.waveIndex = 2;
      this.waveActive = true;
      this.enemies = [];
      this.spawn('fighter', 420); this.spawn('scout', 300); this.spawn('armored', 560);
      this.heroSpecial();
      this.hero.specialCd = 0;
      this.sim(0.2);
      this.pickedHero = true;
    } else if (id === 'twoentries' || id === 'map5') {
      this.setLevel(4); this.reset(); this.spawnHero('nebula');
      plantNear(8);
      this.credits = 260;
      this.waveIndex = 3;
      this.startWave();
      this.enemies = [];
      ['scout','fighter','interceptor','armored'].forEach((tp, i) => this.spawn(tp, 140 + i * 160, 0));
      ['scout','shielded','cryo','juggernaut'].forEach((tp, i) => this.spawn(tp, 180 + i * 160, 1));
      this.groups = [{ type: 'scout', left: 3, gap: 0.4, wait: 0.2, pathI: 0 }, { type: 'fighter', left: 3, gap: 0.5, wait: 0.3, pathI: 1 }];
      this.waveActive = true;
      this.banner = { text: 'WAVE 4  —  BOTH GATES', life: 8, rgb: '80,170,255' };
      this.sim(0.4);
    } else if (id === 'map4') {
      this.setLevel(3); this.reset(); this.spawnHero('oakens');
      plantNear(8);
      this.credits = 240;
      this.waveIndex = 4;
      this.startWave();
      this.enemies = [];
      const types = ['scout','fighter','armored','cryo','interceptor','shielded','juggernaut','fighter'];
      types.forEach((tp, i) => this.spawn(tp, 160 + i * 150));
      this.sim(0.5);
    } else if (id === 'map6') {
      this.setLevel(5); this.reset(); this.spawnHero('nebula');
      plantNear(8);
      this.credits = 260;
      this.waveIndex = 6;
      this.startWave();
      this.enemies = [];
      ['scout','fighter','armored','interceptor'].forEach((tp, i) => this.spawn(tp, 160 + i * 150, 0));
      ['shielded','cryo','juggernaut','fighter'].forEach((tp, i) => this.spawn(tp, 200 + i * 150, 1));
      this.sim(0.5);
    } else if (id === 'portrait' || id === 'edisarline') {
      this.setLevel(2);
      this.reset();
      this.spawnHero('oakens');
      plantNear(8);
      this.credits = 240;
      this.waveIndex = 10;
      this.waveActive = true;
      this.groups = [];
      this.enemies = [];
      this.spawn('flagship', 780);
      this.spawn('shielded', 520);
      this.spawn('juggernaut', 400);
      if (this.bossLine) { this.bossLine.life = this.bossLine.max - 0.4; this.bossLine.max = this.bossLine.life + 8; }
      this.heroHint = null;
    } else if (id === 'drag') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 2], [8, 10, 'ice', 1], [15, 5, 'tesla', 1], [19, 8, 'railgun', 1]]);
      this.credits = 220;
      this.shop = 'missile';
      this.drag = { kind: 'missile', x: 10 * 32 + 16, y: 10 * 32 + 16, ox: 120, oy: H - 43, armed: true, ptr: -1 };
      this.heroHint = null;
    } else if (id === 'retry') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 2], [8, 10, 'ice', 1], [15, 5, 'tesla', 1], [19, 8, 'railgun', 1]]);
      this.credits = 200;
      this.paused = true;
      this.restartAsk = true;
      this.restartFrom = 'pause';
      this.restartSel = 0;
      this.heroHint = null;
    } else if (id === 'herohint') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 1], [8, 10, 'ice', 1], [15, 5, 'tesla', 1]]);
      this.credits = 210;
      const h = this.hero;
      const mid = this.path.pts[2] || this.path.pts[1];
      h.x = mid.x + 28; h.y = mid.y + 28; h.homeX = h.x; h.homeY = h.y;
      this.pickedHero = false;
      this.heroHint = { life: 6.5, max: 7.5 };
      this.waveIndex = 1;
    } else if (id === 'edisarship') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 2], [8, 10, 'ice', 1]]);
      this.credits = 200;
      this.waveIndex = 10;
      this.waveActive = true;
      this.groups = [];
      this.enemies = [];
      this.heroHint = null;
      const e = this.spawn('flagship', 0);
      // Vertical leg (20,4)->(20,12): nose down the path, clear of the left turrets.
      const route = e.route || this.path;
      const seg = route.seg[5];
      e.dist = seg.start + seg.len * 0.48;
      const p = posOnPath(route, e.dist);
      e.x = p.x; e.y = p.y; e.ang = p.ang;
      e.stunT = 99; e.freezeT = 99;
      this.bossLine = null;
      this.banner = null;
      this.floaters = [];
    } else if (id === 'edisarship2') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 2], [8, 10, 'ice', 1]]);
      this.credits = 200;
      this.waveIndex = 10;
      this.waveActive = true;
      this.groups = [];
      this.enemies = [];
      this.heroHint = null;
      const e = this.spawn('flagship1', 0);
      // Long horizontal run (20,12)->(28,12), nose to the right.
      const route = e.route || this.path;
      const seg = route.seg[6];
      e.dist = seg.start + seg.len * 0.45;
      const p = posOnPath(route, e.dist);
      e.x = p.x; e.y = p.y; e.ang = p.ang;
      e.stunT = 99; e.freezeT = 99;
      this.bossLine = null;
      this.banner = null;
      this.floaters = [];
    } else if (id === 'orbital') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 2], [8, 10, 'ice', 1], [15, 5, 'tesla', 2], [19, 8, 'railgun', 1]]);
      this.credits = 240;
      this.waveIndex = 4;
      this.startWave();
      this.enemies = [];
      ['scout','fighter','armored','shielded','interceptor','cryo','scout','fighter'].forEach((tp, i) => this.spawn(tp, 140 + i * 110));
      this.sim(0.25);
      const cx = 400, cy = 290;
      this.fireAbility('orbital', cx, cy);
      this.abCd.orbital = 12;
      this.fx.ring(cx, cy, '255,180,80', 78, 8);
      this.fx.burst(cx, cy, '255,180,80', 22, 180, 8, 2.2);
      this.heroHint = null;
      this.banner = null;
      if (SD.Audio && SD.Audio.muted) SD.Audio.toggleMute();
    } else if (id === 'bossbar') {
      this.setLevel(2); this.reset(); this.spawnHero('oakens');
      plantNear(6);
      this.credits = 220;
      this.waveIndex = 10;
      this.waveActive = true;
      this.groups = [];
      this.enemies = [];
      this.heroHint = null;
      const e = this.spawn('flagship', 0);
      const route = e.route || this.path;
      const seg = route.seg[Math.min(3, route.seg.length - 1)];
      e.dist = seg.start + seg.len * 0.45;
      const p = posOnPath(route, e.dist);
      e.x = p.x; e.y = p.y; e.ang = p.ang;
      e.hp = Math.round(e.max * 0.58);
      e.stunT = 99; e.freezeT = 99;
      this.bossBarOf = e;
      this.bossBarTrail = 0.86;
      this.bossLine = null;
      this.banner = null;
      this.floaters = [];
      if (SD.Audio && SD.Audio.muted) SD.Audio.toggleMute();
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
  const d = new SD.Defense({ levelIndex: levelIndex || 0, hero: 'oakens', auto: true });
  const nebulaMix = mode === 'mixed+nebula' || mode === 'mixednebula';
  const kinds = (mode === 'mixed' || nebulaMix) ? ['pulse', 'laser', 'tesla', 'missile', 'railgun', 'ice'] : [mode];
  const cap = (levelIndex || 0) === 0 ? 8 : 10;
  const maxLv = (t) => (C().turrets[t.kind] && C().turrets[t.kind].maxLevel) || 3;
  const spend = () => {
    // Unlock one nearby premium pad only after a core is standing, and only if a turret can still be afforded.
    if (d.turrets.length >= 3 && d.turrets.length < cap) {
      const cheapest = Math.min(...kinds.map(k => d.costOf(k)));
      for (const p of d.nearPads(cap + 4)) {
        if (p.open || !p.premium) continue;
        if (d.credits >= (p.cost || 0) + cheapest) { d.tryUnlock(p.tx, p.ty); break; }
      }
    }
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

