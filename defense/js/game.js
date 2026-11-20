/* Title screen + the tower-defense match. */
(() => {
const { W, H, TILE } = SD;
const C = () => SD.CONFIG;
const KINDS = ['laser', 'missile', 'ice'];

function tileCenter(tx, ty) { return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }; }
function tileAt(x, y) { return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) }; }

function buildPath() {
  const tiles = C().path;
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
    this.play = { x: W / 2 - 132, y: 172, w: 200, h: 48, label: 'PLAY', rgb: '80,170,255', size: 22 };
    this.helpBtn = { x: W / 2 + 132, y: 172, w: 220, h: 48, label: 'HOW TO PLAY', rgb: '180,210,255', size: 18 };
    this.story = { x: W / 2 - 90, y: 226, w: 150, h: 28, label: 'STORY', rgb: '255,210,90', size: 14 };
    this.creditsBtn = { x: W / 2 + 90, y: 226, w: 150, h: 28, label: 'CREDITS', rgb: '200,210,230', size: 14 };
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
    if (SD.Input.confirm()) { SD.Audio.click(); SD.start('crawl'); return; }
    if (SD.Input.hit('Escape') || SD.Input.hit('KeyH')) { this.help = true; SD.Audio.click(); }
    if (SD.Input.hit('KeyC')) { this.showCredits = true; SD.Audio.click(); }
    for (const p of SD.Input.takeClicks()) {
      if (SD.inBtn(this.mute, p)) { SD.Audio.toggleMute(); SD.Audio.click(); }
      else if (SD.inBtn(this.play, p)) { SD.Audio.click(); SD.start('crawl'); }
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

    SD.neonText(g, 'STARLIGHT DEFENSE', W / 2, 86, 46, '200,230,255', { blur: 18 });

    // button bar sits in the upper sky, clear of the characters
    const barX = W / 2 - 268, barY = 146, barW = 536, barH = 54;
    g.save();
    SD.roundRect(g, barX, barY, barW, barH, 12);
    g.fillStyle = 'rgba(6,8,16,0.58)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.35)'; g.lineWidth = 1.2; g.stroke();
    g.restore();

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
    const x = W / 2 - 340, y = 110, w = 680, h = 400;
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = 'rgba(8,10,20,0.92)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.4)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'HOW TO PLAY', W / 2, 148, 28, '200,230,255', { blur: 12 });
    const lines = [
      'Place turrets on the pads beside the path.',
      'Pick a turret type, then a pad, to build.',
      'Select a built turret to upgrade or sell it.',
      'Every enemy you destroy grants credits.',
      'Buy, upgrade and sell at any time — even during a wave.',
      'Start a wave when you are ready. Hold the station for 10 waves.',
      "The last wave brings Commander Edisar's flagship.",
      '',
      SD.Input.touchMode
        ? 'PHONE  ·  TAP A TURRET, THEN TAP THE MAP  ·  LANDSCAPE RECOMMENDED'
        : 'DESKTOP  ·  1 / 2 / 3 SELECT  ·  U UPGRADE  ·  X SELL  ·  P PAUSE  ·  M MUTE',
    ];
    lines.forEach((ln, i) => {
      const small = i >= lines.length - 1;
      SD.neonText(g, ln, W / 2, 200 + i * 24, small ? 13 : 16, small ? '180,210,255' : '220,230,245', { blur: 5, alpha: 0.92 });
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
    this.scroll = -60;
    this.speed = 36;
    this.ss = 2;
    this.sheetW = 900;
    this.k = 3.6;
    this.vanishY = 72;
    this.floorY = H - 58;
    this.sheet = this.buildSheet();
    this.visibleSrc = this.sourceDepth();
    this.endScroll = this.sheetH + this.visibleSrc + 80;
    this.loadBg();
    if (this.shot) {
      this.scroll = this.scrollFor(this.titleAnchor, 220);
      this.T = 2;
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

  paintText(g, text, x, y, fill = true) {
    g.strokeText(text, x, y);
    if (fill) g.fillText(text, x, y);
  }

  buildSheet() {
    const ss = this.ss, width = this.sheetW;
    const title = 'THE RETURN OF EDISAR STARLIGHT';
    const titleLines = ['THE RETURN OF', 'EDISAR STARLIGHT'];
    const paras = [
      "The war was supposed to be over. Avrill's sacrifice broke Edisar's fleet, and his flagship fell at the edge of the solar system.",
      'But Edisar Starlight survived.',
      'From the shadows of deep space, he has rebuilt his fleet, stronger than ever, and now it marches straight for Earth.',
      'With no fleet left to stop him, Oakens and Dr. Nebula have put their differences aside. Together they have turned the last orbital station into a fortress bristling with turrets.',
      'Every ship that falls brings them closer to victory. Every ship that passes brings Earth closer to its end.',
      'The defense of humanity begins now...',
    ];
    // Layout in logical pixels, then paint at ss.
    const dummy = SD.mkCanvas(16, 16).getContext('2d');
    dummy.font = `bold 30px ${SD.CONFIG.font}`;
    const bodyMax = 780;
    const blocks = paras.map((p, i) => ({
      kind: 'body',
      lines: this.wrap(dummy, p, bodyMax),
      emph: i === 1 || i === paras.length - 1,
    }));

    const titleSize = 44;
    const titleLh = 54;
    const bodySize = 30;
    const bodyLh = 46;
    const paraGap = 38;
    let y = 8;
    const titleTop = y;
    y += titleLines.length * titleLh + 18;
    const ruleY = y;
    y += 36;
    const bodyStart = y;
    const laid = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      laid.push({ kind: 'body', lines: b.lines, y, emph: b.emph });
      y += b.lines.length * bodyLh + paraGap;
    }
    this.sheetH = y + 20;
    this.titleAnchor = titleTop + titleLh; // mid of title block

    const c = SD.mkCanvas(width * ss, Math.ceil(this.sheetH * ss));
    const g = c.getContext('2d');
    g.scale(ss, ss);
    g.textAlign = 'center';
    g.textBaseline = 'top';
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(30,16,0,0.8)';
    g.fillStyle = '#f4f6ff';
    g.shadowColor = 'rgba(200,215,255,0.4)';
    g.shadowBlur = 10 * ss;
    g.lineWidth = 3.2;

    g.font = `bold ${titleSize}px ${SD.CONFIG.font}`;
    titleLines.forEach((ln, i) => this.paintText(g, ln, width / 2, titleTop + i * titleLh));

    g.shadowBlur = 0;
    g.beginPath();
    g.strokeStyle = 'rgba(230,235,255,0.7)';
    g.lineWidth = 2;
    g.moveTo(width / 2 - 210, ruleY);
    g.lineTo(width / 2 + 210, ruleY);
    g.stroke();

    g.strokeStyle = 'rgba(30,16,0,0.8)';
    g.lineWidth = 3;
    g.shadowColor = 'rgba(200,215,255,0.3)';
    g.shadowBlur = 8 * ss;
    laid.forEach(b => {
      const size = b.emph ? 32 : bodySize;
      g.font = `bold ${size}px ${SD.CONFIG.font}`;
      b.lines.forEach((ln, i) => this.paintText(g, ln, width / 2, b.y + i * bodyLh));
    });

    this._title = title; // exact heading kept with the body paragraphs
    return c;
  }

  sourceDepth() {
    const depth = this.floorY - this.vanishY;
    let acc = 0;
    for (let i = 0; i < depth; i++) {
      const t = i / depth;
      const scale = 1 / (1 + this.k * t);
      acc += 1 / scale;
    }
    return acc;
  }

  scrollFor(srcY, destY) {
    const depth = this.floorY - this.vanishY;
    const iMax = Math.max(0, this.floorY - destY);
    let acc = 0;
    for (let i = 0; i < iMax; i++) {
      const t = i / depth;
      const scale = 1 / (1 + this.k * t);
      acc += 1 / scale;
    }
    return srcY + acc;
  }

  finish() {
    if (this.shot || this.leaving != null) return;
    this.leaving = 0.001;
  }

  update(dt) {
    this.T += dt;
    this.stars.update(dt);
    if (this.shot) return;
    if (this.leaving != null) {
      this.leaving += dt;
      if (this.leaving >= 0.7) SD.start('play');
      return;
    }
    if (SD.Input.hit('KeyM')) { SD.Audio.toggleMute(); SD.Audio.click(); }
    if (SD.Input.confirm() || SD.Input.hit('Escape') || SD.Input.takeClicks().length) {
      SD.Audio.click();
      this.finish();
      return;
    }
    if (this.T > 0.85) this.scroll += this.speed * dt;
    if (this.scroll >= this.endScroll) this.finish();
  }

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
    this.drawPerspective(g);

    const top = g.createLinearGradient(0, this.vanishY - 8, 0, this.vanishY + 100);
    top.addColorStop(0, 'rgba(0,0,0,0.75)');
    top.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = top;
    g.fillRect(0, 0, W, this.vanishY + 100);

    const bot = g.createLinearGradient(0, H - 70, 0, H);
    bot.addColorStop(0, 'rgba(0,0,0,0)');
    bot.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = bot;
    g.fillRect(0, H - 70, W, 70);

    if (!this.shot) {
      const hint = SD.Input.touchMode ? 'TAP ANYWHERE TO SKIP' : 'TAP  ·  SPACE  ·  ESC  TO SKIP';
      SD.neonText(g, hint, W / 2, H - 20, 13, '230,235,255', { blur: 6, alpha: 0.8 });
    }

    const fadeIn = Math.max(0, 1 - this.T / 0.8);
    const fadeOut = this.leaving != null ? Math.min(1, this.leaving / 0.7) : 0;
    const fade = Math.max(fadeIn, fadeOut);
    if (fade > 0) {
      g.fillStyle = `rgba(4,1,12,${fade})`;
      g.fillRect(0, 0, W, H);
    }
    SD.drawScanlines(g);
  }

  drawPerspective(g) {
    const sheet = this.sheet;
    const srcW = sheet.width;
    const srcH = sheet.height;
    const ss = this.ss;
    const depth = this.floorY - this.vanishY;
    const step = 1;
    const nearW = W * 0.84;
    let srcBottom = this.scroll * ss;
    g.save();
    g.imageSmoothingEnabled = true;
    if (g.imageSmoothingQuality) g.imageSmoothingQuality = 'high';
    for (let i = 0; i < depth; i += step) {
      const t = i / depth;
      const scale = 1 / (1 + this.k * t);
      const destY = this.floorY - i - step;
      const destW = nearW * scale;
      const destX = (W - destW) / 2;
      const srcSlice = (step / scale) * ss;
      const srcTop = srcBottom - srcSlice;
      if (srcBottom > 0 && srcTop < srcH) {
        const sy = Math.max(0, srcTop);
        const sh = Math.min(srcSlice, srcH - sy, srcBottom - sy);
        if (sh > 0.4) {
          const fade = t > 0.78 ? 1 - (t - 0.78) / 0.22 : 1;
          g.globalAlpha = Math.max(0, fade);
          g.drawImage(sheet, 0, sy, srcW, sh, destX, destY, destW, step + 0.5);
        }
      }
      srcBottom = srcTop;
    }
    g.restore();
  }
};

/* ============================================================== Defense */
SD.Defense = class {
  constructor(opt = {}) {
    this.T = 0;
    this.stars = new SD.Starfield(1);
    this.fx = new SD.Particles();
    this.path = buildPath();
    this.spr = {
      scout: SD.Sprites.scout(),
      fighter: SD.Sprites.fighter(),
      armored: SD.Sprites.armored(),
      flagship: SD.Sprites.flagship(),
      station: SD.Sprites.station(),
      gate: SD.Sprites.gate(),
      turret: {},
    };
    for (const k of KINDS) {
      this.spr.turret[k + 'Base1'] = SD.Sprites.turretBase(k, 1);
      this.spr.turret[k + 'Base2'] = SD.Sprites.turretBase(k, 2);
      this.spr.turret[k + 'Head1'] = SD.Sprites.turretHead(k, 1);
      this.spr.turret[k + 'Head2'] = SD.Sprites.turretHead(k, 2);
      this.spr.turret[k + 'Flash'] = SD.Sprites.turretFlash(k);
    }
    this.reset();
    if (opt.shot) this.applyShot(opt.shot);
  }

  reset() {
    this.credits = C().startCredits;
    this.hull = C().startHull;
    this.maxHull = C().startHull;
    this.waveIndex = 0;          // next wave to start (0..10)
    this.waveActive = false;
    this.groups = [];
    this.spawnT = 0;
    this.turrets = [];
    this.enemies = [];
    this.shots = [];
    this.beams = [];
    this.shop = null;            // 'laser' | 'missile' | 'ice' | null
    this.picked = null;          // turret
    this.paused = false;
    this.over = null;            // 'win' | 'lose'
    this.banner = null;
    this.flashGold = 0;
    this.flashHull = 0;
    this.ghost = null;           // forced ghost tile for screenshots
    this.showcase = false;
    this.score = null;           // post-wave summary
    this.waveStats = { kills: 0, earned: 0 };
    this.T = 0;
  }

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
      spent: conf.cost + (level > 1 ? conf.upCost : 0),
      cool: 0, ang: -Math.PI / 2, target: null, flash: 0, kick: 0,
    };
    this.turrets.push(t);
    return t;
  }

  tryPlace(tx, ty) {
    if (!this.shop) return false;
    if (!this.canPlace(tx, ty)) { SD.Audio.deny(); return false; }
    if (!this.canBuild(this.shop)) { SD.Audio.deny(); this.flashGold = 0.4; return false; }
    this.credits -= this.costOf(this.shop);
    this.place(tx, ty, this.shop, 1);
    this.picked = this.turrets[this.turrets.length - 1];
    this.fx.ring(this.picked.x, this.picked.y, C().turrets[this.shop].rgb, 28, 0.35);
    SD.Audio.place();
    return true;
  }

  tryUpgrade() {
    const t = this.picked; if (!t || t.level >= 2) { SD.Audio.deny(); return; }
    const cost = C().turrets[t.kind].upCost;
    if (this.credits < cost) { SD.Audio.deny(); this.flashGold = 0.4; return; }
    this.credits -= cost; t.level = 2; t.spent += cost;
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
  startWave() {
    if (this.waveActive || this.over || this.score || this.waveIndex >= C().waves.length) return;
    const w = C().waves[this.waveIndex];
    this.groups = w.groups.map(g => ({ type: g[0], left: g[1], gap: g[2], wait: 0.15 }));
    this.waveActive = true;
    this.spawnT = 0;
    this.waveStats = { kills: 0, earned: 0 };
    const n = this.waveIndex + 1;
    this.banner = { text: n === 10 ? 'FLAGSHIP DETECTED' : ('WAVE ' + n + '  —  ' + w.name), life: 2.6, rgb: n === 10 ? '255,205,90' : '80,170,255' };
    if (n === 10) SD.Audio.boss(); else SD.Audio.wave();
    if (SD.Audio.playWave) SD.Audio.playWave(this.waveIndex);
  }

  spawn(type, dist = 0) {
    const def = C().enemies[type];
    const p = posOnPath(this.path, dist);
    const e = {
      type, name: def.name, hp: def.hp, max: def.hp, speed: def.speed, reward: def.reward,
      hull: def.hull, r: def.r, rgb: def.rgb, boss: !!def.boss,
      dist, x: p.x, y: p.y, ang: p.ang, slow: 1, slowT: 0, hitFlash: 0,
    };
    this.enemies.push(e);
    return e;
  }

  kill(e, paid = true) {
    this.enemies = this.enemies.filter(o => o !== e);
    this.fx.burst(e.x, e.y, e.rgb, e.boss ? 48 : 18, e.boss ? 260 : 160, e.boss ? 1.1 : 0.6, e.boss ? 3.2 : 2);
    this.fx.ring(e.x, e.y, e.rgb, e.boss ? 90 : 32, e.boss ? 0.8 : 0.4);
    SD.Audio.explode(e.boss ? 2.2 : e.type === 'armored' ? 1.3 : 0.8);
    if (paid) {
      this.credits += e.reward;
      this.waveStats.kills++;
      this.waveStats.earned += e.reward;
      this.fx.float(e.x, e.y - 10, '+' + e.reward, '255,220,90');
      SD.Audio.coin();
    }
  }

  leak(e) {
    this.hull = Math.max(0, this.hull - e.hull);
    this.flashHull = 0.55;
    this.fx.burst(this.path.base.x, this.path.base.y, '255,70,90', 20, 140, 0.5, 2);
    SD.Audio.leak();
    this.enemies = this.enemies.filter(o => o !== e);
    if (this.hull <= 0) this.end('lose');
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

  openScore() {
    if (this.over || this.score) return;
    const n = this.waveIndex + 1;
    const bonus = 10 * n + 2 * this.hull;
    const w = C().waves[this.waveIndex];
    this.score = {
      wave: n,
      name: w ? w.name : '',
      kills: this.waveStats.kills,
      earned: this.waveStats.earned,
      hull: this.hull,
      maxHull: this.maxHull,
      bonus,
    };
    this.shop = null;
    this.picked = null;
    this.continueBtn = { x: W / 2, y: 470, w: 240, h: 50, label: 'CONTINUE', rgb: '80,170,255', size: 22 };
    if (SD.Audio.playScore) SD.Audio.playScore();
  }

  closeScore() {
    if (!this.score) return;
    this.credits += this.score.bonus;
    const last = this.waveIndex + 1 >= C().waves.length;
    this.waveIndex++;
    this.score = null;
    if (last) this.end('win');
    else if (SD.Audio.stopMusic) SD.Audio.stopMusic();
  }

  maybeWin() {
    if (this.over) return;
    if (this.waveIndex >= C().waves.length && !this.waveActive && this.enemies.length === 0) this.end('win');
  }

  /* ---------- combat ---------- */
  stat(t, key) { return C().turrets[t.kind][key][t.level - 1]; }

  firstInRange(t) {
    const r = this.stat(t, 'range');
    let best = null, bestD = -1;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d <= r + e.r * 0.3 && e.dist > bestD) { best = e; bestD = e.dist; }
    }
    return best;
  }

  muzzleTip(t) {
    if (t.kind === 'laser') return t.level >= 2 ? 28 : 22;
    if (t.kind === 'missile') return 22;
    return t.level >= 2 ? 16 : 14;
  }

  fire(t, e) {
    t.cool = this.stat(t, 'rate');
    t.ang = Math.atan2(e.y - t.y, e.x - t.x);
    t.flash = t.kind === 'missile' ? 0.16 : t.kind === 'ice' ? 0.14 : 0.10;
    t.kick = t.kind === 'missile' ? 3.2 : t.kind === 'laser' ? 1.6 : 1.2;
    const tip = this.muzzleTip(t);
    const ox = t.x + Math.cos(t.ang) * tip, oy = t.y + Math.sin(t.ang) * tip;
    const dmg = this.stat(t, 'damage');
    if (t.kind === 'laser') {
      this.beams.push({ x0: ox, y0: oy, x1: e.x, y1: e.y, rgb: C().turrets.laser.rgb, life: 0.1, max: 0.1 });
      this.hurt(e, dmg);
      SD.Audio.laser();
    } else if (t.kind === 'missile') {
      const conf = C().turrets.missile;
      this.shots.push({
        kind: 'missile', x: ox, y: oy, tx: e.x, ty: e.y, target: e,
        ang: t.ang, speed: conf.speed[t.level - 1], dmg, splash: conf.splash[t.level - 1],
        splashMul: conf.splashMul[t.level - 1], rgb: conf.rgb, life: 2.4, r: 5,
      });
      SD.Audio.missile();
    } else {
      this.shots.push({
        kind: 'ice', x: ox, y: oy, tx: e.x, ty: e.y, target: e, ang: t.ang, speed: 420,
        dmg, slow: this.stat(t, 'slow'), slowTime: this.stat(t, 'slowTime'),
        rgb: C().turrets.ice.rgb, life: 1.6, r: 4,
      });
      SD.Audio.ice();
    }
  }

  hurt(e, dmg) {
    if (!e || e.hp <= 0) return;
    e.hp -= dmg; e.hitFlash = 0.12;
    if (e.hp <= 0) this.kill(e, true);
  }

  boom(x, y, dmg, radius, mul, rgb) {
    this.fx.ring(x, y, rgb, radius, 0.35);
    this.fx.burst(x, y, rgb, 16, 140, 0.4, 2);
    SD.Audio.explode(1.1);
    for (const e of [...this.enemies]) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d <= radius + e.r) this.hurt(e, dmg * (d < 12 ? 1 : mul));
    }
  }

  applySlow(e, factor, time) {
    if (factor < e.slow) e.slow = factor;
    e.slowT = Math.max(e.slowT, time);
  }

  /* ---------- update ---------- */
  update(dt) {
    this.T += dt;
    this.stars.update(dt);
    if (this.flashGold > 0) this.flashGold -= dt;
    if (this.flashHull > 0) this.flashHull -= dt;
    if (this.banner) { this.banner.life -= dt; if (this.banner.life <= 0) this.banner = null; }

    this.handleInput();
    if (this.paused || this.over || this.score) return;

    this.fx.update(dt);

    // spawn
    if (this.waveActive) {
      const g = this.groups.find(x => x.left > 0);
      if (g) {
        g.wait -= dt;
        if (g.wait <= 0) {
          this.spawn(g.type);
          g.left--;
          g.wait = g.gap;
        }
      } else if (this.enemies.length === 0) {
        this.waveActive = false;
        this.openScore();
      }
    }

    // enemies
    for (const e of [...this.enemies]) {
      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 1; }
      if (e.hitFlash > 0) e.hitFlash -= dt;
      e.dist += e.speed * e.slow * dt;
      const p = posOnPath(this.path, e.dist);
      e.x = p.x; e.y = p.y; e.ang = p.ang;
      if (e.dist >= this.path.total) this.leak(e);
    }

    // turrets
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
        if (t.cool <= 0 && Math.abs(d) < 0.45) this.fire(t, e);
      }
    }

    // shots
    for (const s of this.shots) {
      if (s.target && s.target.hp > 0) { s.tx = s.target.x; s.ty = s.target.y; }
      const ang = Math.atan2(s.ty - s.y, s.tx - s.x);
      // gentle home
      let d = ang - s.ang; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      s.ang += Math.max(-7 * dt, Math.min(7 * dt, d));
      s.x += Math.cos(s.ang) * s.speed * dt;
      s.y += Math.sin(s.ang) * s.speed * dt;
      s.life -= dt;
      const hitR = (s.target && s.target.hp > 0 ? s.target.r : 8) + s.r;
      if (Math.hypot(s.tx - s.x, s.ty - s.y) < hitR || s.life <= 0) {
        s.dead = true;
        if (s.kind === 'missile') this.boom(s.x, s.y, s.dmg, s.splash, s.splashMul, s.rgb);
        else if (s.target && s.target.hp > 0 && Math.hypot(s.target.x - s.x, s.target.y - s.y) < hitR + 8) {
          this.hurt(s.target, s.dmg);
          this.applySlow(s.target, s.slow, s.slowTime);
          this.fx.burst(s.x, s.y, s.rgb, 8, 70, 0.3, 1.6);
        }
      }
    }
    this.shots = this.shots.filter(s => !s.dead);

    for (const b of this.beams) b.life -= dt;
    this.beams = this.beams.filter(b => b.life > 0);
  }

  handleInput() {
    if (SD.Input.hit('KeyM')) { SD.Audio.toggleMute(); SD.Audio.click(); }
    if (this.score) {
      if (SD.Input.confirm()) { SD.Audio.click(); this.closeScore(); return; }
      if (SD.Input.takeClicks().length) { SD.Audio.click(); this.closeScore(); }
      return;
    }
    if (this.over) {
      for (const p of SD.Input.takeClicks()) this.clickOverlay(p);
      if (SD.Input.confirm()) { SD.Audio.click(); SD.start('play'); }
      if (SD.Input.hit('Escape')) { SD.Audio.click(); SD.start('title'); }
      return;
    }
    if (SD.Input.hit('KeyP') || SD.Input.hit('Escape')) { this.pause(); SD.Audio.click(); }
    if (this.paused) {
      for (const p of SD.Input.takeClicks()) this.clickPause(p);
      return;
    }
    if (SD.Input.hit('Digit1') || SD.Input.hit('Numpad1')) this.toggleShop('laser');
    if (SD.Input.hit('Digit2') || SD.Input.hit('Numpad2')) this.toggleShop('missile');
    if (SD.Input.hit('Digit3') || SD.Input.hit('Numpad3')) this.toggleShop('ice');
    if (SD.Input.hit('KeyU')) this.tryUpgrade();
    if (SD.Input.hit('KeyX') || SD.Input.hit('Backspace') || SD.Input.hit('Delete')) this.trySell();
    if (SD.Input.hit('Space') || SD.Input.hit('KeyG')) this.startWave();

    const ui = this.uiButtons();
    for (const p of SD.Input.takeClicks()) {
      let hit = false;
      for (const b of ui) if (SD.inBtn(b, p)) { b.click(); hit = true; break; }
      if (hit) continue;
      if (inHud(p)) continue;
      const { tx, ty } = tileAt(p.x, p.y);
      const existing = this.turrets.find(t => t.tx === tx && t.ty === ty);
      if (existing) {
        this.picked = existing;
        this.shop = null;
        SD.Audio.click();
      } else if (this.shop) {
        this.tryPlace(tx, ty);
      } else {
        this.picked = null;
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
    for (const [i, k] of KINDS.entries()) {
      const conf = C().turrets[k];
      const disabled = this.credits < conf.cost;
      mk(78 + i * 132, 124, conf.name, conf.cost + ' CR', conf.rgb, () => this.toggleShop(k), disabled, k);
    }
    if (this.picked) {
      const t = this.picked, conf = C().turrets[t.kind];
      if (t.level < 2) {
        const no = this.credits < conf.upCost;
        mk(500, 150, 'UPGRADE', conf.upCost + ' CR', '255,220,90', () => this.tryUpgrade(), no, 'up');
      } else {
        mk(500, 150, 'MAXED', 'LVL II', '255,220,90', () => SD.Audio.deny(), true, 'up');
      }
      const back = Math.round(t.spent * C().sellRefund);
      mk(660, 124, 'SELL', '+' + back + ' CR', '255,110,140', () => this.trySell(), false, 'sell');
    }
    const last = this.waveIndex >= C().waves.length;
    const waveLbl = this.waveActive ? 'INCOMING' : (last || this.score) ? 'CLEARED' : 'START WAVE';
    const waveSub = this.waveActive
      ? (this.enemies.length + this.groups.reduce((n, g) => n + g.left, 0)) + ' LEFT'
      : this.score ? ('WAVE ' + this.score.wave + ' / ' + C().waves.length)
      : last ? 'EDISAR DOWN' : ('WAVE ' + (this.waveIndex + 1) + ' / ' + C().waves.length);
    mk(900, 168, waveLbl, waveSub, this.waveActive ? '255,80,220' : '80,255,160', () => {
      if (this.waveActive || last) SD.Audio.deny(); else this.startWave();
    }, this.waveActive || last, 'wave');

    btns.push({ x: W - 96, y: 24, w: 64, h: 28, label: 'PAUSE', rgb: '180,200,255', size: 12, click: () => { this.pause(); SD.Audio.click(); }, id: 'pause' });
    btns.push({ x: W - 30, y: 24, w: 52, h: 28, label: SD.Audio.muted ? 'MUTED' : 'MUTE', rgb: '180,200,255', size: 12, click: () => { SD.Audio.toggleMute(); SD.Audio.click(); }, id: 'mute' });
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
    if (SD.inBtn(again, p)) { SD.Audio.click(); SD.start('play'); }
    else if (SD.inBtn(menu, p)) { SD.Audio.click(); SD.start('title'); }
  }

  /* ---------- draw ---------- */
  draw(g) {
    if (this.showcase === 'ships') { this.drawShipShowcase(g); return; }
    if (this.showcase) { this.drawShowcase(g); return; }
    SD.drawSpaceBg(g);
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
      g.strokeStyle = `rgba(${b.rgb},${0.25 + 0.75 * a})`; g.lineWidth = 1.6 + 1.4 * a;
      g.shadowColor = `rgba(${b.rgb},1)`; g.shadowBlur = 10 * SD.view.scale;
      g.beginPath(); g.moveTo(b.x0, b.y0); g.lineTo(b.x1, b.y1); g.stroke();
      g.restore();
    }
    for (const s of this.shots) this.drawShot(g, s);
    for (const e of this.enemies) this.drawEnemy(g, e);
    this.fx.draw(g);

    this.drawHud(g);
    if (this.banner) {
      const a = Math.min(1, this.banner.life, (2.6 - this.banner.life) * 3);
      SD.neonText(g, this.banner.text, W / 2, 96, this.banner.text.length > 22 ? 22 : 28, this.banner.rgb, { alpha: a, blur: 18 });
    }
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

  drawEnemy(g, e) {
    const spr = this.spr[e.type] || this.spr.fighter;
    const scale = e.boss ? 1 : 1;
    if (e.slow < 0.99) SD.glow(g, e.x, e.y, e.r + 10, e.r + 10, '140,230,255', 0.28);
    if (e.hitFlash > 0) { g.save(); g.globalCompositeOperation = 'lighter'; }
    SD.blit(g, spr, e.x, e.y, e.ang, scale);
    if (e.hitFlash > 0) g.restore();
    // hp bar
    const bw = e.boss ? 86 : Math.max(18, e.r * 2.2), bh = e.boss ? 5 : 3;
    const bx = e.x - bw / 2, by = e.y - (e.boss ? 40 : e.r + 10);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const pct = Math.max(0, e.hp / e.max);
    g.fillStyle = pct > 0.5 ? '#5cff9a' : pct > 0.25 ? '#ffd25a' : '#ff5a6a';
    g.fillRect(bx, by, bw * pct, bh);
    if (e.boss) SD.neonText(g, 'EDISAR FLAGSHIP', e.x, by - 12, 11, '255,205,90', { blur: 8 });
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
    let waveTxt;
    if (this.waveActive) waveTxt = 'WAVE  ' + (this.waveIndex + 1) + ' / ' + C().waves.length;
    else if (this.score) waveTxt = 'WAVE  ' + this.score.wave + ' / ' + C().waves.length + '  CLEARED';
    else if (this.waveIndex >= C().waves.length) waveTxt = 'WAVE  10 / 10';
    else waveTxt = 'WAVE  ' + this.waveIndex + ' / ' + C().waves.length + '  CLEARED';
    if (!this.waveActive && this.waveIndex === 0 && !this.score) waveTxt = 'WAVE  1 / 10  READY';
    SD.neonText(g, waveTxt, 620, 24, 16, '200,210,255', { blur: 8 });

    // bottom bar
    g.save();
    g.fillStyle = 'rgba(5,2,16,0.82)';
    g.fillRect(0, H - C().hud.bottom, W, C().hud.bottom);
    g.strokeStyle = 'rgba(80,170,255,0.25)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, H - C().hud.bottom); g.lineTo(W, H - C().hud.bottom); g.stroke();
    g.restore();

    const mouse = SD.Input.mouse;
    for (const b of this.uiButtons()) {
      const selected = (b.id && b.id === this.shop) || (b.id === 'up' && this.picked && this.picked.level < 2 && SD.inBtn(b, mouse));
      const hover = mouse.over && SD.inBtn(b, mouse);
      SD.drawButton(g, b, selected || hover, this.T);
    }
    if (this.picked && !this.shop) {
      const t = this.picked, conf = C().turrets[t.kind];
      SD.neonText(g, conf.name + '  L' + (t.level === 2 ? 'II' : 'I'), 500, H - 78, 11, conf.rgb, { blur: 4, alpha: 0.8 });
    }
  }

  drawScore(g) {
    const s = this.score;
    g.save(); g.fillStyle = 'rgba(4,2,12,0.72)'; g.fillRect(0, 0, W, H); g.restore();
    const x = W / 2 - 300, y = 70, w = 600, h = 430;
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = 'rgba(8,10,20,0.94)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.4)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'WAVE ' + s.wave + '  CLEARED', W / 2, 114, 32, '80,255,180', { blur: 16 });
    if (s.name) SD.neonText(g, s.name, W / 2, 156, 16, '200,210,230', { blur: 7, alpha: 0.9 });
    const rows = [
      ['KILLS', String(s.kills)],
      ['CREDITS EARNED', '+' + s.earned],
      ['HULL LEFT', s.hull + ' / ' + s.maxHull],
      ['WAVE BONUS', '+' + s.bonus],
    ];
    rows.forEach((row, i) => {
      const yy = 210 + i * 42;
      SD.neonText(g, row[0], W / 2 - 220, yy, 18, '180,200,220', { blur: 6, align: 'left' });
      SD.neonText(g, row[1], W / 2 + 220, yy, 20, '255,220,120', { blur: 8, align: 'right' });
    });
    const btn = this.continueBtn || { x: W / 2, y: 470, w: 240, h: 50, label: 'CONTINUE', rgb: '80,170,255', size: 22 };
    SD.drawButton(g, btn, SD.Input.mouse.over && SD.inBtn(btn, SD.Input.mouse), this.T);
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

  /* Close-up of all six turrets (3 kinds x MK I / MK II) for screenshots. */
  drawShowcase(g) {
    SD.drawSpaceBg(g);
    this.stars.draw(g, this.T);
    SD.neonText(g, 'TURRETS', W / 2, 46, 36, '200,220,255', { blur: 14 });
    const kinds = ['laser', 'missile', 'ice'];
    const names = ['LASER', 'MISSILES', 'ICE'];
    const rgb = ['80,170,255', '255,170,70', '140,230,255'];
    const xs = [210, 512, 814];
    const ys = [250, 450];
    for (let lv = 1; lv <= 2; lv++) {
      SD.neonText(g, lv === 1 ? 'MK I' : 'MK II', 64, ys[lv - 1], 18, '255,210,120', { blur: 8 });
      for (let i = 0; i < 3; i++) {
        const pulse = 0.5 + 0.5 * Math.sin(this.T * (lv === 2 ? 8 : 6) + i * 1.7);
        const t = {
          kind: kinds[i], level: lv, x: xs[i], y: ys[lv - 1],
          ang: -0.72 + i * 0.18 + 0.06 * Math.sin(this.T * 0.7 + i),
          flash: pulse > 0.55 ? 0.09 * (pulse - 0.2) : 0,
          kick: pulse > 0.55 ? 1.2 : 0,
        };
        this.drawTurretAt(g, t, 2.35);
        if (lv === 1) SD.neonText(g, names[i], xs[i], 130, 18, rgb[i], { blur: 8 });
      }
    }
    SD.drawScanlines(g);
  }

  /* Close-up of the four enemy hulls for screenshots. */
  drawShipShowcase(g) {
    SD.drawSpaceBg(g);
    this.stars.draw(g, this.T);
    SD.neonText(g, "EDISAR'S FLEET", W / 2, 42, 32, '200,220,255', { blur: 14 });
    const row = [
      ['scout', 'SCOUT', 200, 195, 2.55, '210,130,170'],
      ['fighter', 'FIGHTER', 512, 195, 2.25, '140,190,220'],
      ['armored', 'ARMORED', 824, 195, 2.05, '220,190,120'],
    ];
    for (const [type, name, x, y, sc, rgb] of row) {
      SD.blit(g, this.spr[type], x, y, -0.10, sc);
      SD.neonText(g, name, x, 88, 16, rgb, { blur: 8 });
    }
    SD.blit(g, this.spr.flagship, W / 2, 415, -0.06, 1.32);
    SD.neonText(g, "EDISAR'S FLAGSHIP", W / 2, 548, 18, '255,210,120', { blur: 8 });
    SD.drawScanlines(g);
  }

  /* ---------- screenshot setups ---------- */
  applyShot(id) {
    const layout = [
      [4, 6, 'laser', 2], [8, 6, 'laser', 1], [8, 9, 'ice', 2], [11, 9, 'missile', 1],
      [15, 6, 'laser', 2], [17, 6, 'ice', 1], [18, 8, 'missile', 2], [22, 10, 'laser', 2],
      [25, 10, 'missile', 1], [25, 14, 'ice', 2], [22, 14, 'laser', 1], [4, 9, 'missile', 1],
    ];
    const plant = (list) => {
      this.turrets = [];
      for (const [tx, ty, k, lv] of list) this.place(tx, ty, k, lv);
    };

    if (id === 'build') {
      plant([[4, 6, 'laser', 1], [8, 9, 'ice', 1], [11, 9, 'missile', 1], [15, 6, 'laser', 2], [18, 8, 'ice', 1]]);
      this.credits = 210;
      this.waveIndex = 2;
      this.shop = 'laser';
      this.picked = null;
      this.ghost = { tx: 8, ty: 6 };
    } else if (id === 'midwave') {
      plant(layout);
      this.credits = 240;
      this.waveIndex = 4;
      this.startWave();
      // seed enemies along the path and run a short sim so beams / missiles exist
      const types = ['scout', 'fighter', 'armored', 'fighter', 'scout', 'armored', 'fighter', 'scout', 'fighter'];
      const dists = [80, 220, 380, 520, 700, 880, 1080, 1280, 1500];
      this.enemies = [];
      types.forEach((t, i) => this.spawn(t, dists[i]));
      this.groups = [{ type: 'fighter', left: 3, gap: 0.7, wait: 0.4 }];
      this.sim(1.6);
    } else if (id === 'boss') {
      plant(layout);
      this.credits = 180;
      this.waveIndex = 9;
      this.startWave();
      this.enemies = [];
      this.spawn('flagship', 980);
      this.spawn('armored', 760);
      this.spawn('armored', 680);
      this.spawn('fighter', 560);
      this.spawn('fighter', 500);
      this.spawn('fighter', 1180);
      this.groups = [{ type: 'fighter', left: 2, gap: 0.8, wait: 0.5 }];
      this.sim(3.05);
    } else if (id === 'score') {
      plant(layout);
      this.credits = 240;
      this.hull = 16;
      this.waveIndex = 4;
      this.waveActive = false;
      this.waveStats = { kills: 14, earned: 186 };
      this.openScore();
    } else if (id === 'turrets') {
      this.showcase = true;
      this.credits = 0;
    } else if (id === 'ships') {
      this.showcase = 'ships';
      this.credits = 0;
    } else if (id === 'title') {
      // unused here; main.js only routes shots into Defense. Kept for completeness.
    }
  }

  sim(seconds) {
    const step = 1 / 60;
    for (let t = 0; t < seconds; t += step) this.update(step);
  }
};
})();
