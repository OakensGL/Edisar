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
if (!SD.Portraits.joe) {
  const joe = new Image();
  joe.src = 'assets/bazooka-joe.jpg';
  SD.Portraits.joe = joe;
}
if (!SD.Portraits.joeValio) {
  const valio = new Image();
  valio.src = 'assets/bazooka-joe-valio.jpg';
  SD.Portraits.joeValio = valio;
}
if (!SD.Portraits.nebula) {
  const neb = new Image();
  neb.src = 'assets/nebula.jpg';
  SD.Portraits.nebula = neb;
}
SD.JOE_LINES = {
  open: [
    'Ah, a customer! Mind the vials, half of them explode.',
    "Come in, come in! If it sparks, that's the good kind of sparks.",
  ],
  generic: [
    "Sold! If it starts humming, that's normal. If it screams, that's also normal.",
    "Another one off the rack. Don't say I never gave you anything.",
    "Ha! Credits well wasted. I mean spent. Spent!",
    "You want it, you got it. Warranty is a dirty word around here.",
    "Oh, I like your taste. Chaotic. Slightly unwise. Perfect.",
    "Done. If Joe made it, it'll work... or it'll be very educational.",
    "Hehehe! She'll shoot straighter now... probably.",
  ],
  laser: [
    "Lasers! Thin, mean, and loud. Just how I like my light shows.",
    "More beam, less mercy. Try not to look directly at it.",
    "A hotter laser. Don't thank me, thank the scorch marks.",
  ],
  missile: [
    "Missiles. Pointy gifts with a terrible sense of personal space.",
    "Boom in a box. Shake well, then absolutely do not.",
    "More warheads, fewer friends. That's the spirit.",
  ],
  ice: [
    "Cold enough to make a sun shiver. Don't lick the barrel.",
    "A slow, frozen hell for anything that gets close. Beautiful.",
    "Ice upgrade! If they move, they regret it. If they don't, even better.",
  ],
  railgun: [
    "Railgun! One shot, one very neat hole, and a hell of a kick.",
    "Piercing fire. If it still moves after that, I want a refund. From them.",
    "More rails, more holes. Science is just organized violence.",
  ],
  tesla: [
    "Tesla coil, but angry. Don't pet it.",
    "Lightning in a cage. I taught it manners. I lied.",
    "More arc, more chaos. If your hair stands up, it's working.",
  ],
  pulse: [
    "Pulse wave. Strips shields and ruins someone's afternoon.",
    "A shock, a toxin, a bad day. That's science, baby!",
    "Pulse is hungrier now. Feed it ships.",
  ],
  mk4: [
    "Now THAT is science!",
    "MK IV! I may have overdone it. You're welcome.",
    "That's the good stuff. Don't tell the safety board.",
    "I almost named this one after myself. Then I thought, nah, let it be infamous.",
  ],
  hero: [
    "Hero protocol? Oh, I like it when they glow.",
    "A special for the specials. Try not to miss.",
    "Give the pilots a bigger stick. They've earned a little mayhem.",
  ],
  freeze: [
    "FREEZE, huh? Heartless. I respect that.",
    "A cold snap for every ship on the field. Delightfully unfair.",
  ],
  overload: [
    "OVERLOAD. Subtle as a sledgehammer. My kind of science.",
    "More punch on the special. If anything's still standing, I'll be shocked.",
  ],
  core: [
    "Dark core for the red lady's toy. Handle it like it's cursed, because it is.",
    "A hungrier Nebula beam. Don't stand in front of it. Or behind it. Or near it.",
  ],
  station: [
    "More funds! Spend 'em before I invent a way to take 'em back.",
    "Thicker hull. Ugly, sturdy, and too damn honest.",
    "Faster charges. The universe hates a fair cooldown.",
    "Station first, fireworks second. I can respect a plan.",
  ],
  respec: [
    "Back to the drawing board! I love the drawing board.",
    "All right, all right, take it all apart. I'll pretend this never happened.",
  ],
  placeNebula: [
    "Oh hell. She's here. Edisar, start writing your will.",
    "That's Nebula's toy. Somebody tell Edisar it's over.",
    "Well, that's it. Game over, Edisar. Pack it up.",
    "The red lady's on the pad. Those poor bastards are already dead.",
    "High Level Performance, my ass. That thing's a war crime with a warranty.",
  ],
  // In-match turret upgrades (MK II / MK III). Kept short for the side toast.
  match: {
    generic2: [
      "MK II. A little more kick, a little less mercy.",
      "Upgraded on the pad. If it rattles, that's flavor.",
    ],
    generic3: [
      "MK III! That's the good stuff on a live turret.",
      "Maxed it. Try not to melt the pad.",
    ],
    special: [
      "Special kit on the pad. Handle it like it's cursed.",
      "That's the fancy one. Don't stand in front of it.",
    ],
    laser2: [
      "MK II laser. Now that's a proper sting.",
      "Hotter beam, same bad attitude. I like it.",
    ],
    laser3: [
      "Twin beams! I told you one wasn't enough.",
      "MK III laser. Don't look at it. I mean it this time.",
    ],
    missile2: [
      "Missiles packed tighter. The neighbors will complain.",
      "MK II warheads. Pointier, ruder, perfect.",
    ],
    missile3: [
      "Cluster munitions! That's the messy science I live for.",
      "MK III missiles. One shot, a whole damn party.",
    ],
    ice2: [
      "Colder still. I can see my breath from here.",
      "MK II ice. If they weren't slow, they are now.",
    ],
    ice3: [
      "A real freeze on that. Heartless. Beautiful.",
      "MK III ice. I almost feel bad. Almost.",
    ],
    railgun2: [
      "MK II rail. The kick's nastier. So's the hole.",
      "Harder slug, longer punch. Don't stand behind it.",
    ],
    railgun3: [
      "MK III railgun. That'll go through a bad day and the next one.",
      "Full pierce. If anything's left, I'll eat my hat.",
    ],
    tesla2: [
      "MK II tesla. The arc's got opinions now.",
      "More bite in the lightning. Don't pet it. Still.",
    ],
    tesla3: [
      "Chaining harder. That's a whole family of bad news.",
      "MK III tesla. I taught it to share. It shares pain.",
    ],
    pulse2: [
      "MK II pulse. Shields won't like this one.",
      "A meaner shockwave. Someone's afternoon is ruined.",
    ],
    pulse3: [
      "MK III pulse. The toxin spreads. I'm so proud.",
      "Now it poisons the neighbors too. That's science, baby.",
    ],
    nebula2: [
      "The red lady's toy just got hungrier.",
      "Darker beam on the pad. Don't thank me, thank physics.",
    ],
    nebula3: [
      "Maxed the red beam. That's a special kind of unwise. I love it.",
      "MK III Nebula kit. If it starts singing, leave the room.",
    ],
  },
};
SD.pickJoeLine = function (id, last) {
  const L = SD.JOE_LINES || {};
  const add = (arr, extra) => (arr || []).concat(extra || []);
  let pool;
  if (!id) pool = add(L.open, L.generic);
  else if (id === 'respec') pool = L.respec || L.generic;
  else if (id === 'open') pool = L.open || L.generic;
  else if (id.indexOf('-mk4') >= 0) pool = add(L.mk4, L.generic.slice(0, 2));
  else if (id === 'hero') pool = add(L.hero, L.generic.slice(0, 2));
  else if (id === 'hero-freeze') pool = add(L.freeze, L.hero);
  else if (id === 'hero-overload') pool = add(L.overload, L.hero);
  else if (id === 'nebula-core') pool = add(L.core, L.generic.slice(0, 2));
  else if (id === 'funds' || id === 'hull' || id === 'charge') pool = add(L.station, L.generic.slice(0, 2));
  else {
    const kind = String(id).split('-')[0];
    pool = add(L[kind], L.generic);
  }
  if (!pool || !pool.length) pool = L.generic || ["Hehehe! She'll shoot straighter now... probably."];
  const opts = pool.filter(s => s && s !== last);
  const use = opts.length ? opts : pool;
  return use[Math.floor(Math.random() * use.length)];
};
SD.pickJoeMatchLine = function (kind, level, last) {
  const M = (SD.JOE_LINES && SD.JOE_LINES.match) || {};
  const lv = level >= 3 ? 3 : 2;
  const unique = kind === 'nebula' || kind === 'special';
  const pool = []
    .concat(unique ? (M.special || []) : [])
    .concat(M[(kind || '') + lv] || [])
    .concat(M['generic' + lv] || []);
  const opts = pool.filter(s => s && s !== last);
  const use = opts.length ? opts : (pool.length ? pool : ["Upgraded on the pad. If it rattles, that's flavor."]);
  return use[Math.floor(Math.random() * use.length)];
};

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
        wp: i,
      };
    }
  }
  return { x: path.base.x, y: path.base.y, ang: 0, wp: path.seg.length };
}

/* Bosses fillet sharp vertices so a long hull does not pin on a 90-degree tile corner. */
function posOnPathSmooth(path, dist, radius) {
  const p = posOnPath(path, dist);
  if (!radius || !path.seg || path.seg.length < 2) return p;
  for (let i = 0; i < path.seg.length - 1; i++) {
    const s = path.seg[i];
    const nxt = path.seg[i + 1];
    const rad = Math.min(radius, s.len * 0.45, nxt.len * 0.45);
    if (rad < 8) continue;
    const corner = s.start + s.len;
    if (Math.abs(dist - corner) >= rad) continue;
    const b = s.b;
    const inL = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y) || 1;
    const outL = Math.hypot(nxt.b.x - nxt.a.x, nxt.b.y - nxt.a.y) || 1;
    const ux = (s.b.x - s.a.x) / inL, uy = (s.b.y - s.a.y) / inL;
    const vx = (nxt.b.x - nxt.a.x) / outL, vy = (nxt.b.y - nxt.a.y) / outL;
    const t = (dist - corner + rad) / (2 * rad);
    const mt = 1 - t;
    const p0x = b.x - ux * rad, p0y = b.y - uy * rad;
    const p2x = b.x + vx * rad, p2y = b.y + vy * rad;
    const x = mt * mt * p0x + 2 * mt * t * b.x + t * t * p2x;
    const y = mt * mt * p0y + 2 * mt * t * b.y + t * t * p2y;
    const tx = 2 * mt * (b.x - p0x) + 2 * t * (p2x - b.x);
    const ty = 2 * mt * (b.y - p0y) + 2 * t * (p2y - b.y);
    return { x, y, ang: Math.atan2(ty, tx), wp: i };
  }
  return p;
}

function makeBossFlight(route) {
  const a = route.spawn, b = route.base;
  const mid = { x: W * 0.5, y: H * 0.52 };
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const t = Math.max(0, Math.min(1, ((mid.x - a.x) * dx + (mid.y - a.y) * dy) / (len * len)));
  const cx = a.x + dx * t, cy = a.y + dy * t;
  const hugs = Math.hypot(mid.x - cx, mid.y - cy) > 90;
  const pts = hugs ? [a, mid, b] : [a, b];
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const sl = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y) || 1;
    seg.push({ a: pts[i], b: pts[i + 1], len: sl, start: total });
    total += sl;
  }
  return { a, b, mid: hugs ? mid : null, seg, total, ang: Math.atan2(b.y - a.y, b.x - a.x) };
}

function posOnFlight(flight, dist) {
  if (!flight || !flight.seg || !flight.seg.length) return { x: 0, y: 0, ang: 0 };
  const d = Math.max(0, Math.min(flight.total, dist));
  let s = flight.seg[flight.seg.length - 1];
  for (const seg of flight.seg) { if (d <= seg.start + seg.len) { s = seg; break; } }
  const t = (d - s.start) / (s.len || 1);
  const x = s.a.x + (s.b.x - s.a.x) * t;
  const y = s.a.y + (s.b.y - s.a.y) * t;
  return { x, y, ang: Math.atan2(flight.b.y - y, flight.b.x - x) };
}

function wrapText(g, text, maxW) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function inHud(p) {
  return p.y < C().hud.top || p.y > H - C().hud.bottom;
}

/* ================================================================== Title */
SD.Title = class {
  constructor(opt = {}) {
    this.T = 0;
    this.stars = new SD.Starfield(1.1);
    this.bg = null;
    this.bgReady = false;
    this.help = !!(opt.help || opt.shot === 'help');
    this.play = { x: 304, y: 182, w: 180, h: 48, label: 'PLAY', rgb: '80,170,255', size: 22, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.armoryBtn = { x: 502, y: 182, w: 180, h: 48, label: 'ARMORY', rgb: '255,220,120', size: 20, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.helpBtn = { x: 710, y: 182, w: 200, h: 48, label: 'HOW TO PLAY', rgb: '180,210,255', size: 17, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.story = { x: W / 2 - 90, y: 236, w: 150, h: 28, label: 'STORY', rgb: '255,210,90', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.creditsBtn = { x: W / 2 + 90, y: 236, w: 150, h: 28, label: 'CREDITS', rgb: '200,210,230', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.mute = { x: W - 58, y: 28, w: 96, h: 32, label: SD.Audio.muted ? 'SOUND OFF' : 'SOUND ON', rgb: '180,200,255', size: 13 };
    this.closeHelp = { x: W / 2, y: 522, w: 180, h: 36, label: 'CLOSE', rgb: '80,170,255', size: 16 };
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
        flagship7: SD.Sprites.flagship7(),
        flagship8: SD.Sprites.flagship8(),
        flagship9: SD.Sprites.flagship9(),
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
    if (SD.Input.hit('KeyA')) { SD.Audio.click(); SD.start('armory', { from: 'title' }); return; }
    for (const p of SD.Input.takeClicks()) {
      if (SD.inBtn(this.mute, p)) { SD.Audio.toggleMute(); SD.Audio.click(); }
      else if (SD.inBtn(this.play, p)) { SD.Audio.click(); SD.start('levels'); }
      else if (SD.inBtn(this.armoryBtn, p)) { SD.Audio.click(); SD.start('armory', { from: 'title' }); }
      else if (SD.inBtn(this.story, p)) { SD.Audio.click(); SD.start('crawl'); }
      else if (SD.inBtn(this.creditsBtn, p)) { this.showCredits = true; SD.Audio.click(); }
      else if (SD.inBtn(this.helpBtn, p)) { this.help = true; SD.Audio.click(); }
    }
  }

  inHelpPanel(p) {
    return Math.abs(p.x - W / 2) <= 360 && p.y >= 36 && p.y <= 560;
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
    SD.drawButton(g, this.armoryBtn, mouse.over && SD.inBtn(this.armoryBtn, mouse), this.T);
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
    this.closeHelp.y = 522;
    g.save(); g.fillStyle = 'rgba(4,2,12,0.62)'; g.fillRect(0, 0, W, H); g.restore();
    const x = W / 2 - 360, y = 36, w = 720, h = 524;
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = 'rgba(8,10,20,0.92)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.4)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'HOW TO PLAY', W / 2, 68, 24, '200,230,255', { blur: 12 });
    const raw = [
      'Nine campaign levels, ten waves each. Credits and turrets reset every level. Later maps use two or three entrance gates.',
      'LAST STAND (unlock after Level 3) is an endless siege. Waves never stop and grow harder. A new gate and a new sky open every ten waves, and Edisar flagships fly straight at the station. Score points for kills, waves cleared, and hull held; your best score is saved.',
      'Build only on marked pads. Gold pads are premium chokepoints — pay credits to unlock them.',
      'ARMORY on the title or level select (or A in a match) spends stars on upgrades unique to each turret, plus station upgrades. Respec is free.',
      'LASER · MISSILES · ICE · RAILGUN · TESLA · PULSE (strips shields and poisons hulls; MK III toxin spreads).',
      'NEBULA · Level 3 and later, one per map. High Level Performance.',
      'Upgrade twice for MK III specials (twin beams, cluster, freeze, full pierce, longer chains, spreading toxin).',
      'Tap a ship to see HP, weaknesses and resistances. Edisar flagships fly a straight line at the station and fire an ion EMP that briefly disables nearby turrets.',
      'About 3s after a wave starts you can send the next one and fight several at once. Bonus scales with time saved.',
      'Each turret can target First, Last, Strongest, Weakest or Closest — toggle it in the turret panel.',
      'Abilities: Orbital Strike, Drones (brief hold), EMP (drops shields). Tap the button, then the field. Esc or right-click cancels.',
      'Bring Oakens or Nebula. Tap them, then a tile to move. R or SPECIAL hits every ship (Oakens: missile rain, Nebula: red lightning).',
      'Hover or long-press a turret in the build bar to see what it does. Long-press does not place it. Drag a turret onto a pad to build. T retries the level (with a confirm).',
      'The HUD speed button (or F) cycles x1 / x2 / x3. It only speeds the battle, not the music.',
      '',
      SD.Input.touchMode
        ? 'PHONE  ·  DRAG A TURRET ONTO A PAD  ·  SPECIAL AND SEND WAVE ARE ON THE HUD  ·  LANDSCAPE'
        : 'DESKTOP  ·  1–7 SELECT  ·  DRAG TO PLACE  ·  R SPECIAL  ·  T RETRY  ·  U UPGRADE  ·  F SPEED  ·  P PAUSE',
    ];
    g.font = 'bold 12px ' + C().font;
    const wrapped = [];
    raw.forEach(ln => {
      if (!ln) { wrapped.push({ text: '', small: false }); return; }
      const small = ln === raw[raw.length - 1];
      wrapText(g, ln, w - 48).forEach(part => wrapped.push({ text: part, small }));
    });
    const top = 92, bot = 500;
    const lh = Math.min(17, (bot - top) / Math.max(1, wrapped.length - 1));
    wrapped.forEach((ln, i) => {
      if (!ln.text) return;
      SD.neonText(g, ln.text, W / 2, top + i * lh, ln.small ? 11 : 12, ln.small ? '180,210,255' : '220,230,245', { blur: 5, alpha: 0.92 });
    });
    SD.drawButton(g, this.closeHelp, SD.Input.mouse.over && SD.inBtn(this.closeHelp, SD.Input.mouse), this.T);
  }
  drawCredits(g) {
    this.closeHelp.y = 500;
    g.save(); g.fillStyle = 'rgba(4,2,12,0.62)'; g.fillRect(0, 0, W, H); g.restore();
    const x = W / 2 - 360, y = 56, w = 720, h = 464;
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = 'rgba(8,10,20,0.94)'; g.fill();
    g.strokeStyle = 'rgba(180,200,220,0.4)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'CREDITS', W / 2, 88, 26, '200,230,255', { blur: 12 });
    const lines = [
      ['Game design, art direction', '180,210,255', 12],
      ['Juan Carlos Garcia', '230,235,245', 15],
      ['', '', 6],
      ['Title music', '180,210,255', 12],
      ['"Space Dimensions (8bit/Retro Version)"', '230,235,245', 14],
      ['by Matthew Pablo  —  CC-BY 3.0  —  www.matthewpablo.com', '200,210,230', 13],
      ['', '', 6],
      ['Game music  ·  Space Shooter Music pack', '180,210,255', 12],
      ['Music by Oblidivm  —  CC-BY 3.0  —  oblidivmmusic.blogspot.com', '200,210,230', 13],
      ['SkyFire  ·  Brave Pilots  ·  Without Fear  ·  Battle in the Stars', '200,210,230', 12],
      ['Space Heroes  ·  DeathMatch  ·  Victory Tune  ·  Defeated', '200,210,230', 12],
      ['', '', 6],
      ['Last Stand music', '180,210,255', 12],
      ['"The Evil Sacrifice Archenemies" by ISAo', '230,235,245', 14],
      ['SOUND AIRYLUVS  —  OGA-BY 3.0  —  airyluvs.com', '200,210,230', 13],
      ['', '', 6],
      ['Sound effects are synthesized in-game.', '180,200,220', 12],
    ];
    let y0 = 114;
    for (const [ln, rgb, sz] of lines) {
      if (ln) SD.neonText(g, ln, W / 2, y0, sz, rgb, { blur: 5, alpha: 0.95 });
      y0 += sz === 6 ? 8 : 18;
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
    this.progress = opt.shot ? { unlocked: 9, stars: [3, 3, 1, 2, 1, 0, 2, 1, 0], siegeBest: 24850, siegeBestWave: 22, siegeStars: 2 } : SD.Progress.load();
    this.back = { x: 70, y: 28, w: 100, h: 32, label: 'MENU', rgb: '180,200,255', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.armoryBtn = { x: 200, y: 28, w: 130, h: 32, label: 'ARMORY', rgb: '255,220,120', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.mute = { x: W - 58, y: 28, w: 96, h: 32, label: SD.Audio.muted ? 'SOUND OFF' : 'SOUND ON', rgb: '180,200,255', size: 13, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.cards = SD.CONFIG.levels.map((lv, i) => ({
      i, lv,
      x: 248 + (i % 3) * 262, y: 164 + Math.floor(i / 3) * 122,
      w: 244, h: 112,
    }));
    this.siegeCard = { x: W / 2, y: 522, w: 800, h: 80 };
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
      else if (SD.inBtn(this.armoryBtn, p)) { SD.Audio.click(); SD.start('armory', { from: 'levels' }); }
      else if (SD.inBtn(this.siegeCard, p)) {
        if (SD.Progress.siegeUnlocked(this.progress)) { SD.Audio.click(); SD.start('siege'); }
        else SD.Audio.deny();
      } else {
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
    SD.neonText(g, 'STARLIGHT', W / 2, 48, 24, '210,230,255', { blur: 12 });
    SD.neonText(g, 'SELECT LEVEL', W / 2, 76, 18, '255,220,140', { blur: 10 });
    const earned = SD.StarShop.earned(this.progress);
    const left = SD.StarShop.available(this.progress);
    SD.neonText(g, '★  ' + left + ' / ' + earned, 340, 32, 14, '255,220,120', { blur: 6 });
    const mouse = SD.Input.mouse;
    SD.drawButton(g, this.back, mouse.over && SD.inBtn(this.back, mouse), this.T);
    SD.drawButton(g, this.armoryBtn, mouse.over && SD.inBtn(this.armoryBtn, mouse), this.T);
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
      const prevH = 50;
      g.save();
      SD.roundRect(g, x + 10, y + 6, c.w - 20, prevH, 7); g.clip();
      SD.drawSpaceBg(g, c.lv.variant);
      const routes = c.lv.paths || [c.lv.path];
      const cols = ['80,200,255', '255,90,200', '255,200,80', '120,255,140'];
      routes.forEach((path, pi) => {
        g.beginPath();
        path.forEach((pt, k) => {
          const px = x + 10 + (pt[0] / 31) * (c.w - 20);
          const py = y + 6 + (pt[1] / 17) * prevH;
          k ? g.lineTo(px, py) : g.moveTo(px, py);
        });
        g.strokeStyle = `rgba(${cols[pi % 4]},0.9)`;
        g.lineWidth = 2; g.stroke();
      });
      g.restore();
      SD.neonText(g, 'LEVEL ' + (i + 1), c.x, y + 64, 9, '180,210,255', { blur: 5 });
      SD.neonText(g, c.lv.name, c.x, y + 78, 12, '230,235,245', { blur: 7 });
      const stars = this.progress.stars[i] || 0;
      const starStr = locked ? 'LOCKED' : (stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : 'NO STARS YET');
      SD.neonText(g, starStr, c.x, y + 96, locked ? 10 : 13, locked ? '160,160,180' : '255,220,120', { blur: 6 });
      if (locked) {
        g.save(); g.fillStyle = 'rgba(4,2,12,0.45)';
        SD.roundRect(g, x, y, c.w, c.h, 14); g.fill(); g.restore();
        SD.neonText(g, 'LOCKED', c.x, c.y + 12, 14, '200,210,230', { blur: 8 });
      }
    });
    this.drawSiegeCard(g, mouse);
    SD.drawScanlines(g);
  }
  drawSiegeCard(g, mouse) {
    const c = this.siegeCard;
    const unlocked = SD.Progress.siegeUnlocked(this.progress);
    const hover = unlocked && mouse.over && SD.inBtn(c, mouse);
    const x = c.x - c.w / 2, y = c.y - c.h / 2;
    g.save();
    SD.roundRect(g, x, y, c.w, c.h, 12);
    g.fillStyle = hover ? 'rgba(18,12,16,0.94)' : 'rgba(10,8,14,0.9)'; g.fill();
    g.strokeStyle = hover ? 'rgba(255,180,90,0.85)' : 'rgba(255,160,80,0.45)'; g.lineWidth = hover ? 2 : 1.3; g.stroke();
    g.restore();
    const prevW = 168, prevH = c.h - 16;
    g.save();
    SD.roundRect(g, x + 10, y + 8, prevW, prevH, 7); g.clip();
    SD.drawSpaceBg(g, 'siege');
    const routes = (C().siege && C().siege.paths) || [];
    const cols = ['80,200,255', '255,90,200', '255,200,80', '120,255,140'];
    routes.forEach((path, pi) => {
      g.beginPath();
      path.forEach((pt, k) => {
        const px = x + 10 + (pt[0] / 31) * prevW;
        const py = y + 8 + (pt[1] / 17) * prevH;
        k ? g.lineTo(px, py) : g.moveTo(px, py);
      });
      g.strokeStyle = `rgba(${cols[pi % 4]},0.95)`;
      g.lineWidth = 2; g.stroke();
    });
    g.restore();
    const tx = x + 200;
    SD.neonText(g, 'LAST STAND', tx, c.y - 16, 20, '255,200,120', { blur: 9, align: 'left' });
    SD.neonText(g, 'ENDLESS SIEGE', tx, c.y + 6, 13, '200,210,230', { blur: 6, align: 'left' });
    const best = this.progress.siegeBest || 0;
    const bestW = this.progress.siegeBestWave || 0;
    const sStars = this.progress.siegeStars || 0;
    const rec = best ? ('BEST  ' + best + (bestW ? '   ·   WAVE ' + bestW : '')) : 'NO SCORE YET';
    SD.neonText(g, rec, tx, c.y + 26, 12, '255,220,120', { blur: 6, align: 'left' });
    SD.neonText(g, unlocked ? ('★'.repeat(sStars) + '☆'.repeat(3 - sStars)) : 'LOCKED', c.x + 340, c.y, unlocked ? 18 : 14, unlocked ? '255,220,120' : '160,160,180', { blur: 7 });
    if (!unlocked) {
      g.save(); g.fillStyle = 'rgba(4,2,12,0.4)';
      SD.roundRect(g, x, y, c.w, c.h, 12); g.fill(); g.restore();
      SD.neonText(g, 'CLEAR LEVEL 3 TO UNLOCK', c.x + 170, c.y, 13, '200,210,230', { blur: 6 });
    }
  }
};


/* ============================================================== Armory */
SD.Armory = class {
  constructor(opt = {}) {
    this.T = 0;
    this.stars = new SD.Starfield(1.1);
    this.shot = opt.shot || false;
    this.from = opt.from === 'title' ? 'title' : 'levels';
    this.progress = this.shot ? this.shotProgress() : SD.Progress.load();
    this.hover = null;
    this.focus = (this.shot === true || this.shot === 'armory') ? 'laser-economy' : null;
    this.joeLine = SD.pickJoeLine('open');
    this.joePop = 0.4;
    this.joeLife = 5.5;
    this.respecAsk = false;
    this.respecSel = 0;
    this.back = { x: 70, y: 26, w: 100, h: 30, label: 'BACK', rgb: '180,200,255', size: 14, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.respec = { x: W - 70, y: 26, w: 110, h: 30, label: 'RESPEC', rgb: '255,160,120', size: 13, fill: 'rgba(6,8,16,0.88)', drop: true };
    this.spr = this.prepSprites();
    this.layout = this.buildLayout();
    if (this.shot) {
      this.T = 0.48;
      if (this.shot === 'joe' || this.shot === 'joeline') {
        this.focus = 'laser-mk4';
        this.joeLine = "MK IV! I may have overdone it. You're welcome.";
        this.joePop = 0.5;
        this.joeLife = 30;
      }
    }
  }
  leave() {
    SD.start(this.from === 'title' ? 'title' : 'levels');
  }
  shotProgress() {
    return {
      unlocked: 6,
      stars: [3, 3, 3, 3, 3, 3],
      bought: ['laser-power', 'laser-reach', 'laser-economy', 'laser-mk4', 'ice-power', 'ice-reach', 'ice-mk4', 'hero'],
    };
  }
  prepSprites() {
    const turret = {};
    for (const k of SD.StarShop.kinds.concat(['nebula'])) {
      const lv = k === 'nebula' ? 1 : 3;
      try { turret[k] = { base: SD.Sprites.turretBase(k, lv), head: SD.Sprites.turretHead(k, lv) }; }
      catch (e) { turret[k] = null; }
    }
    let station = null, oakens = null, nebula = null;
    try { station = SD.Sprites.station(); } catch (e) {}
    try { oakens = SD.Sprites.hero('oakens'); nebula = SD.Sprites.hero('nebula'); } catch (e) {}
    return { turret, station, hero: { oakens, nebula } };
  }
  buildLayout() {
    const kinds = SD.StarShop.kinds;
    const chassis = { x: 14, y: 92, w: 996, h: 368 };
    const pad = 10, gap = 6;
    const innerW = chassis.w - pad * 2;
    const w = Math.floor((innerW - gap * 6) / 7);
    const x0 = chassis.x + pad + Math.floor((innerW - (w * 7 + gap * 6)) / 2);
    const y0 = chassis.y + 8;
    const map = {};
    const bays = [];
    kinds.forEach((col, i) => {
      const x = x0 + i * (w + gap);
      const cx = x + w / 2;
      bays.push({ col, x, y: y0, w, h: chassis.h - 16, cx });
      const power = { x: cx - 30, y: y0 + 132, w: 58, h: 62 };
      const reach = { x: cx + 30, y: y0 + 132, w: 58, h: 62 };
      const mk4 = { x: cx, y: y0 + 224, w: 68, h: 72 };
      const econ = { x: cx, y: y0 + 314, w: 58, h: 62 };
      const byId = { power, reach, economy: econ, mk4 };
      ['power', 'reach', 'economy', 'mk4'].forEach(key => {
        const it = SD.StarShop.item(col + '-' + key);
        const pos = byId[key];
        map[it.id] = { x: pos.x, y: pos.y, w: pos.w, h: pos.h, it, r: key === 'mk4' ? 26 : 22 };
      });
    });
    const sx = x0 + 6 * (w + gap);
    const scx = sx + w / 2;
    bays.push({ col: 'station', x: sx, y: y0, w, h: chassis.h - 16, cx: scx });
    const stations = {
      funds:  { x: scx - 30, y: y0 + 108, w: 54, h: 54, r: 19 },
      hull:   { x: scx + 30, y: y0 + 108, w: 54, h: 54, r: 19 },
      charge: { x: scx - 30, y: y0 + 168, w: 54, h: 54, r: 19 },
      'nebula-core': { x: scx + 30, y: y0 + 168, w: 54, h: 54, r: 19 },
      hero:   { x: scx, y: y0 + 236, w: 58, h: 58, r: 21 },
      'hero-freeze': { x: scx - 30, y: y0 + 306, w: 54, h: 56, r: 20 },
      'hero-overload': { x: scx + 30, y: y0 + 306, w: 54, h: 56, r: 20 },
    };
    Object.keys(stations).forEach(id => {
      const it = SD.StarShop.item(id);
      const pos = stations[id];
      map[it.id] = { x: pos.x, y: pos.y, w: pos.w, h: pos.h, it, r: pos.r };
    });
    this.chassis = chassis;
    this.bays = bays;
    this.tipBox = { x: 14, y: 466, w: 996, h: 100 };
    return map;
  }
  yesNo() {
    return {
      yes: { x: W / 2 - 100, y: 330, w: 180, h: 50, label: 'YES', rgb: '255,80,220', size: 22 },
      no:  { x: W / 2 + 100, y: 330, w: 180, h: 50, label: 'NO',  rgb: '70,160,255', size: 22 },
    };
  }
  hitItem(p) {
    for (const id of Object.keys(this.layout)) {
      const b = this.layout[id];
      if (Math.abs(p.x - b.x) <= b.w / 2 && Math.abs(p.y - b.y) <= b.h / 2) return b;
    }
    return null;
  }
  stateOf(it) {
    const p = this.progress;
    const owned = SD.StarShop.owns(p, it.id);
    const lock = SD.StarShop.locked(p, it);
    const afford = SD.StarShop.canBuy(p, it.id);
    const hot = (this.hover && this.hover.it.id === it.id) || this.focus === it.id;
    return { owned, lock, afford, hot };
  }
  tryBuy(id) {
    if (this.shot) { this.focus = id; SD.Audio.click(); return; }
    const p = this.progress;
    if (SD.StarShop.owns(p, id)) { this.focus = id; SD.Audio.click(); return; }
    if (SD.StarShop.canBuy(p, id)) {
      SD.StarShop.buy(p, id);
      this.progress = SD.Progress.load();
      this.focus = id;
      this.sayJoe(id);
      SD.Audio.upgrade();
    } else {
      this.focus = id;
      SD.Audio.deny();
    }
  }
  confirmRespec() {
    if (this.shot) { this.respecAsk = false; return; }
    SD.StarShop.respec(this.progress);
    this.progress = SD.Progress.load();
    this.respecAsk = false;
    this.focus = null;
    this.sayJoe('respec');
    SD.Audio.sell();
  }
  sayJoe(kind) {
    this.joeLine = SD.pickJoeLine(kind, this.joeLine);
    this.joePop = 0;
    this.joeLife = 5.2;
  }
  wrapJoe(g, text, maxW) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? cur + ' ' + w : w;
      if (cur && g.measureText(next).width > maxW) { lines.push(cur); cur = w; }
      else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  update(dt) {
    this.T += dt;
    this.joePop = (this.joePop || 0) + dt;
    if (this.joeLife != null && !this.shot) this.joeLife -= dt;
    this.stars.update(dt);
    const mouse = SD.Input.mouse;
    this.hover = mouse.over ? this.hitItem(mouse) : null;
    if (this.respecAsk) {
      const b = this.yesNo();
      if (SD.Input.hitAny('Escape', 'Backspace', 'KeyN')) { this.respecAsk = false; SD.Audio.click(); return; }
      if (SD.Input.hitAny('ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD')) { this.respecSel = 1 - this.respecSel; SD.Audio.click(); }
      if (SD.Input.hit('KeyY') || (SD.Input.confirm() && this.respecSel === 0)) { this.confirmRespec(); return; }
      if (SD.Input.confirm() && this.respecSel === 1) { this.respecAsk = false; SD.Audio.click(); return; }
      for (const p of SD.Input.takeClicks()) {
        if (SD.inBtn(b.yes, p)) this.confirmRespec();
        else if (SD.inBtn(b.no, p)) { this.respecAsk = false; SD.Audio.click(); }
      }
      return;
    }
    if (SD.Input.hit('Escape')) { SD.Audio.click(); this.leave(); return; }
    for (const p of SD.Input.takeClicks()) {
      if (SD.inBtn(this.back, p)) { SD.Audio.click(); this.leave(); }
      else if (SD.inBtn(this.respec, p)) {
        if ((this.progress.bought || []).length) { this.respecAsk = true; this.respecSel = 0; SD.Audio.click(); }
        else SD.Audio.deny();
      } else {
        const hit = this.hitItem(p);
        if (hit) this.tryBuy(hit.it.id);
      }
    }
  }

  /* ---------- chrome ---------- */
  drawChassis(g, x, y, w, h) {
    g.save();
    SD.roundRect(g, x, y, w, h, 14);
    const well = g.createLinearGradient(x, y, x, y + h);
    well.addColorStop(0, 'rgba(18,22,34,0.94)');
    well.addColorStop(0.18, 'rgba(10,12,20,0.92)');
    well.addColorStop(1, 'rgba(6,8,14,0.94)');
    g.fillStyle = well; g.fill();
    // top light
    const shine = g.createLinearGradient(x, y, x, y + 70);
    shine.addColorStop(0, 'rgba(200,215,240,0.10)');
    shine.addColorStop(1, 'rgba(200,215,240,0)');
    SD.roundRect(g, x, y, w, h, 14);
    g.fillStyle = shine; g.fill();
    const frame = g.createLinearGradient(x, y, x, y + h);
    frame.addColorStop(0, 'rgba(220,230,245,0.85)');
    frame.addColorStop(0.4, 'rgba(80,90,110,0.9)');
    frame.addColorStop(1, 'rgba(160,170,190,0.55)');
    g.strokeStyle = frame; g.lineWidth = 2; g.stroke();
    // corner brackets
    g.strokeStyle = 'rgba(230,235,245,0.7)'; g.lineWidth = 2.2; g.lineCap = 'square';
    const L = 16;
    [[x + 8, y + 8, 1, 1], [x + w - 8, y + 8, -1, 1], [x + 8, y + h - 8, 1, -1], [x + w - 8, y + h - 8, -1, -1]].forEach(([bx, by, sx, sy]) => {
      g.beginPath(); g.moveTo(bx + L * sx, by); g.lineTo(bx, by); g.lineTo(bx, by + L * sy); g.stroke();
    });
    g.restore();
  }
  drawBay(g, bay) {
    g.save();
    SD.roundRect(g, bay.x, bay.y, bay.w, bay.h, 10);
    g.fillStyle = 'rgba(4,6,12,0.45)'; g.fill();
    g.strokeStyle = 'rgba(140,160,190,0.16)'; g.lineWidth = 1; g.stroke();
    // soft inner light at the portrait well
    const lg = g.createRadialGradient(bay.cx, bay.y + 40, 4, bay.cx, bay.y + 40, 54);
    const rgb = bay.col === 'station' ? '255,220,140' : ((SD.CONFIG.turrets[bay.col] && SD.CONFIG.turrets[bay.col].rgb) || '180,200,220');
    lg.addColorStop(0, `rgba(${rgb},0.16)`);
    lg.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = lg; g.beginPath(); g.arc(bay.cx, bay.y + 40, 54, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  drawPortrait(g, bay) {
    const labels = { laser: 'LASER', missile: 'MISSILE', ice: 'ICE', railgun: 'RAIL', tesla: 'TESLA', pulse: 'PULSE', station: 'STATION' };
    const rgb = bay.col === 'station' ? '255,220,140' : ((SD.CONFIG.turrets[bay.col] && SD.CONFIG.turrets[bay.col].rgb) || '200,210,230');
    const cx = bay.cx, cy = bay.y + 40;
    // pedestal
    g.save();
    g.beginPath(); g.ellipse(cx, cy + 22, 28, 7, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fill();
    g.restore();
    if (bay.col === 'station') {
      if (this.spr.station) SD.blit(g, this.spr.station, cx, bay.y + 32, 0, 0.72);
    } else {
      const spr = this.spr.turret[bay.col];
      if (spr) {
        const sweep = -Math.PI / 2 + 0.28 * Math.sin(this.T * 0.85 + bay.x * 0.01);
        SD.blit(g, spr.base, cx, cy + 2, 0, 0.95);
        SD.blit(g, spr.head, cx, cy + 2, sweep + Math.PI / 2, 0.95);
      }
    }
    SD.neonText(g, labels[bay.col] || bay.col.toUpperCase(), cx, bay.col === 'station' ? bay.y + 66 : bay.y + 84, 11, rgb, { blur: 6 });
  }
  drawConnectors(g, bay) {
    const p = this.progress;
    if (bay.col === 'station') {
      const funds = this.layout.funds, hull = this.layout.hull, charge = this.layout.charge;
      const core = this.layout['nebula-core'], hero = this.layout.hero;
      const fr = this.layout['hero-freeze'], ov = this.layout['hero-overload'];
      const owned = (id) => SD.StarShop.owns(p, id);
      this.rail(g, funds.x, funds.y + 20, funds.x, charge.y - 20, owned('funds'));
      this.rail(g, hull.x, hull.y + 20, hull.x, core.y - 20, owned('hull'));
      this.rail(g, charge.x, charge.y + 20, hero.x - 8, hero.y - 22, owned('charge') || owned('hero'));
      this.rail(g, core.x, core.y + 20, hero.x + 8, hero.y - 22, owned('nebula-core') || owned('hero'));
      // specialization fork
      this.rail(g, hero.x, hero.y + 22, fr.x, fr.y - 22, owned('hero') || owned('hero-freeze'));
      this.rail(g, hero.x, hero.y + 22, ov.x, ov.y - 22, owned('hero') || owned('hero-overload'));
      const midY = (hero.y + 22 + fr.y - 22) / 2;
      const forkNote = (owned('hero-freeze') || owned('hero-overload')) ? 'RESPEC TO SWITCH' : 'PICK ONE';
      SD.neonText(g, forkNote, hero.x, midY - 1, 8, '200,220,255', { blur: 3, alpha: owned('hero') ? 0.9 : 0.55 });
      return;
    }
    const pow = this.layout[bay.col + '-power'];
    const rea = this.layout[bay.col + '-reach'];
    const mk = this.layout[bay.col + '-mk4'];
    const eco = this.layout[bay.col + '-economy'];
    const ownP = SD.StarShop.owns(p, pow.it.id);
    const ownR = SD.StarShop.owns(p, rea.it.id);
    const ownM = SD.StarShop.owns(p, mk.it.id);
    const ownE = SD.StarShop.owns(p, eco.it.id);
    // from portrait down to the pair
    this.rail(g, bay.cx, bay.y + 90, pow.x, pow.y - 24, ownP);
    this.rail(g, bay.cx, bay.y + 90, rea.x, rea.y - 24, ownR);
    // merge into MK IV
    this.rail(g, pow.x, pow.y + 24, mk.x, mk.y - 28, ownP);
    this.rail(g, rea.x, rea.y + 24, mk.x, mk.y - 28, ownR);
    // optional economy branch off the trunk
    this.rail(g, mk.x, mk.y + 28, eco.x, eco.y - 24, ownM || ownE, true);
  }
  rail(g, x0, y0, x1, y1, on, optional) {
    g.save();
    g.strokeStyle = on ? 'rgba(255,210,120,0.85)' : (optional ? 'rgba(120,140,170,0.28)' : 'rgba(120,150,190,0.4)');
    g.lineWidth = on ? 2.2 : 1.4;
    g.lineCap = 'round';
    if (optional && !on) g.setLineDash([3, 4]);
    if (on) { g.shadowColor = 'rgba(255,200,100,0.7)'; g.shadowBlur = 6 * (SD.view ? SD.view.scale : 1); }
    g.beginPath(); g.moveTo(x0, y0);
    if (Math.abs(x0 - x1) > 4 && Math.abs(y0 - y1) > 4) {
      const midY = (y0 + y1) / 2;
      g.lineTo(x0, midY); g.lineTo(x1, midY); g.lineTo(x1, y1);
    } else g.lineTo(x1, y1);
    g.stroke();
    g.restore();
  }

  /* ---------- nodes / icons ---------- */
  drawNode(g, b) {
    const st = this.stateOf(b.it);
    const r = b.r || 22;
    const pulse = 0.5 + 0.5 * Math.sin(this.T * 3.15);
    g.save();
    // glow for affordable
    if (st.afford) {
      g.save(); g.globalCompositeOperation = 'lighter';
      SD.glow(g, b.x, b.y, r + 10, r + 10, '120,210,255', 0.18 + 0.22 * pulse);
      g.restore();
    } else if (st.owned) {
      SD.glow(g, b.x, b.y, r + 8, r + 8, '255,200,100', 0.18);
    }
    g.beginPath(); g.arc(b.x, b.y, r, 0, Math.PI * 2);
    if (st.owned) {
      const fill = g.createRadialGradient(b.x - 4, b.y - 5, 2, b.x, b.y, r);
      fill.addColorStop(0, '#3a3220'); fill.addColorStop(1, '#141014');
      g.fillStyle = fill;
    } else if (st.lock) {
      g.fillStyle = 'rgba(8,10,14,0.92)';
    } else {
      const fill = g.createRadialGradient(b.x - 4, b.y - 5, 2, b.x, b.y, r);
      fill.addColorStop(0, '#1c2430'); fill.addColorStop(1, '#0a0e14');
      g.fillStyle = fill;
    }
    g.fill();
    let stroke, lw;
    if (st.owned) { stroke = 'rgba(255,210,120,0.95)'; lw = 2; }
    else if (st.afford) { stroke = `rgba(140,220,255,${0.55 + 0.45 * pulse})`; lw = 2.1; }
    else if (st.hot) { stroke = 'rgba(200,220,255,0.8)'; lw = 1.8; }
    else if (st.lock) { stroke = 'rgba(90,100,120,0.45)'; lw = 1.2; }
    else { stroke = 'rgba(150,170,200,0.4)'; lw = 1.3; }
    g.strokeStyle = stroke; g.lineWidth = lw;
    if (st.afford || st.owned) {
      g.shadowColor = st.owned ? 'rgba(255,200,100,0.8)' : 'rgba(120,210,255,0.9)';
      g.shadowBlur = (st.afford ? 10 + 6 * pulse : 8) * (SD.view ? SD.view.scale : 1);
    }
    g.stroke();
    g.shadowBlur = 0;
    g.restore();

    const rgb = st.owned ? '255,220,140' : st.lock ? '120,130,150' : st.afford ? '210,235,255' : '180,195,215';
    const alpha = st.lock && !st.owned ? 0.8 : 1;
    this.drawIcon(g, b.it, b.x, b.y - 1, st.lock ? 16 : 17, rgb, alpha);

    if (st.lock) this.drawLock(g, b.x + r - 7, b.y - r + 7);
    if (st.owned) this.drawCheck(g, b.x + r - 6, b.y - r + 7);
    else this.drawCostBadge(g, b.x, b.y + r + 3, b.it.cost, st.afford, st.lock);

    const shorts = { funds: 'FUNDS', hull: 'HULL', charge: 'CHARGE', hero: 'PROTOCOL', 'nebula-core': 'DARK CORE', 'hero-freeze': 'FREEZE', 'hero-overload': 'OVERLOAD' };
    const label = shorts[b.it.id] || (b.it.perk ? b.it.perk : b.it.name);
    SD.neonText(g, label, b.x, b.y + r + 14, b.it.perk ? 8 : 9, rgb, { blur: 3, alpha: (st.lock ? 0.7 : 0.95) });
  }
  drawCostBadge(g, x, y, cost, afford, lock) {
    const w = 26, h = 11;
    g.save();
    SD.roundRect(g, x - w / 2, y - h / 2, w, h, 3);
    g.fillStyle = afford ? 'rgba(20,28,40,0.95)' : 'rgba(10,12,16,0.9)';
    g.fill();
    g.strokeStyle = afford ? 'rgba(255,220,120,0.8)' : (lock ? 'rgba(100,110,130,0.4)' : 'rgba(180,190,210,0.35)');
    g.lineWidth = 0.8; g.stroke();
    g.restore();
    SD.neonText(g, cost + '★', x, y + 0.5, 8, afford ? '255,220,120' : (lock ? '140,150,165' : '200,210,230'), { blur: 2, alpha: 0.95 });
  }
  drawCheck(g, x, y) {
    g.save();
    g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2);
    g.fillStyle = 'rgba(40,32,10,0.95)'; g.fill();
    g.strokeStyle = 'rgba(255,220,120,0.95)'; g.lineWidth = 1.1; g.stroke();
    g.strokeStyle = 'rgba(255,230,160,1)'; g.lineWidth = 1.7; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - 3.2, y); g.lineTo(x - 0.6, y + 2.8); g.lineTo(x + 3.6, y - 2.6); g.stroke();
    g.restore();
  }
  drawLock(g, x, y) {
    g.save();
    g.translate(x, y);
    g.fillStyle = 'rgba(16,18,24,0.9)';
    g.beginPath(); g.arc(0, 0, 7, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(180,190,210,0.7)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(200,210,230,0.85)'; g.lineWidth = 1.3;
    g.beginPath(); g.arc(0, -1.6, 2.2, Math.PI, 0); g.stroke();
    g.fillStyle = 'rgba(190,200,220,0.9)';
    SD.roundRect(g, -2.4, -1.1, 4.8, 4.2, 0.8); g.fill();
    g.restore();
  }
  drawIcon(g, it, x, y, s, rgb, a = 1) {
    const id = it.id;
    const kind = it.col;
    const perk = it.perk;
    g.save();
    g.translate(x, y);
    g.globalAlpha = a;
    g.strokeStyle = `rgba(${rgb},0.95)`;
    g.fillStyle = `rgba(${rgb},0.9)`;
    g.lineWidth = 1.5;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.shadowColor = `rgba(${rgb},0.8)`;
    g.shadowBlur = 4 * (SD.view ? SD.view.scale : 1);
    if (it.icon && this.drawNamedIcon(g, it.icon, s)) { /* unique turret node */ }
    else if (perk === 'FOCUS FIRE') this.iconFocus(g, s);
    else if (perk === 'BARRAGE') this.iconBarrage(g, s);
    else if (perk === 'SHATTER') this.iconShatter(g, s);
    else if (perk === 'CHARGED SLUG') this.iconSlug(g, s);
    else if (perk === 'OVERVOLT') this.iconVolt(g, s);
    else if (perk === 'VIRULENT') this.iconVirulent(g, s);
    else if (id === 'funds') this.iconEconomy(g, s);
    else if (id === 'hull') this.iconHull(g, s);
    else if (id === 'charge') this.iconClock(g, s);
    else if (id === 'hero') this.iconHero(g, s);
    else if (id === 'hero-freeze') this.iconHeroFreeze(g, s);
    else if (id === 'hero-overload') this.iconHeroOverload(g, s);
    else if (id === 'nebula-core') this.iconCore(g, s);
    g.restore();
  }
  drawNamedIcon(g, name, s) {
    const map = {
      overclock: this.iconOverclock, hotshot: this.iconHotshot, prism: this.iconPrism,
      warheads: this.iconWarheads, boosters: this.iconBoosters, autoload: this.iconAutoload,
      deepfreeze: this.iconDeepFreeze, whiteout: this.iconWhiteout, rimefield: this.iconRimefield,
      pierce: this.iconPierce, quickcharge: this.iconQuickCharge, sabot: this.iconSabot,
      arcspan: this.iconArcSpan, forked: this.iconForked, static: this.iconStatic,
      neurotoxin: this.iconNeurotoxin, ionspike: this.iconIonSpike, stockpile: this.iconEconomy,
    };
    const fn = map[name];
    if (!fn) return false;
    fn.call(this, g, s);
    return true;
  }
  iconOverclock(g, s) {
    // stacked chevrons — faster fire, no overheat
    for (let i = 0; i < 3; i++) {
      const x = -s * 0.42 + i * s * 0.28;
      g.beginPath();
      g.moveTo(x - s * 0.08, -s * 0.38);
      g.lineTo(x + s * 0.22, 0);
      g.lineTo(x - s * 0.08, s * 0.38);
      g.stroke();
    }
  }
  iconHotshot(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.28, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, 0, 1.7, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      g.beginPath();
      g.moveTo(Math.cos(a) * s * 0.36, Math.sin(a) * s * 0.36);
      g.lineTo(Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.72);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(s * 0.12, -s * 0.55); g.lineTo(s * 0.42, -s * 0.72); g.stroke();
    g.beginPath(); g.arc(s * 0.5, -s * 0.78, s * 0.1, 0, Math.PI * 2); g.fill();
  }
  iconPrism(g, s) {
    g.beginPath();
    g.moveTo(-s * 0.15, -s * 0.55); g.lineTo(s * 0.15, -s * 0.55); g.lineTo(s * 0.32, s * 0.15); g.lineTo(-s * 0.32, s * 0.15);
    g.closePath(); g.stroke(); g.globalAlpha *= 0.35; g.fill(); g.globalAlpha /= 0.35;
    g.beginPath(); g.moveTo(-s * 0.02, -s * 0.7); g.lineTo(0, -s * 0.2); g.stroke();
    g.beginPath(); g.moveTo(0, s * 0.15); g.lineTo(-s * 0.38, s * 0.7); g.moveTo(0, s * 0.15); g.lineTo(s * 0.38, s * 0.7); g.stroke();
  }
  iconWarheads(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.28, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(0, 0, s * 0.5, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      g.beginPath();
      g.moveTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55);
      g.lineTo(Math.cos(a) * s * 0.78, Math.sin(a) * s * 0.78);
      g.stroke();
    }
  }
  iconBoosters(g, s) {
    g.beginPath();
    g.moveTo(s * 0.55, 0); g.lineTo(-s * 0.1, -s * 0.22); g.lineTo(-s * 0.1, s * 0.22);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(-s * 0.1, -s * 0.14); g.lineTo(-s * 0.55, 0); g.lineTo(-s * 0.1, s * 0.14);
    g.stroke();
    g.beginPath();
    g.moveTo(-s * 0.55, 0); g.lineTo(-s * 0.82, -s * 0.16);
    g.moveTo(-s * 0.55, 0); g.lineTo(-s * 0.82, s * 0.16);
    g.stroke();
  }
  iconAutoload(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.42, 0.4, Math.PI * 1.6); g.stroke();
    g.beginPath();
    const ax = Math.cos(0.4) * s * 0.42, ay = Math.sin(0.4) * s * 0.42;
    g.moveTo(ax, ay); g.lineTo(ax + s * 0.08, ay - s * 0.18); g.lineTo(ax + s * 0.2, ay - s * 0.02); g.stroke();
    g.beginPath(); g.moveTo(s * 0.12, 0); g.lineTo(-s * 0.08, -s * 0.16); g.lineTo(-s * 0.08, s * 0.16); g.closePath(); g.fill();
  }
  iconDeepFreeze(g, s) {
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.7);
      g.stroke();
      const bx = Math.cos(a) * s * 0.38, by = Math.sin(a) * s * 0.38;
      const px = Math.cos(a + 0.55) * s * 0.18, py = Math.sin(a + 0.55) * s * 0.18;
      g.beginPath(); g.moveTo(bx - px, by - py); g.lineTo(bx, by); g.lineTo(bx + px, by + py); g.stroke();
    }
  }
  iconWhiteout(g, s) {
    g.beginPath();
    g.moveTo(-s * 0.15, s * 0.15); g.lineTo(-s * 0.7, -s * 0.55); g.lineTo(s * 0.7, -s * 0.55); g.lineTo(s * 0.15, s * 0.15);
    g.closePath(); g.stroke();
    g.beginPath(); g.arc(0, s * 0.28, s * 0.2, 0, Math.PI * 2); g.fill();
  }
  iconRimefield(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.22, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(0, 0, s * 0.58, 0.15, Math.PI * 2 - 0.15); g.stroke();
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 - 0.3;
      g.beginPath(); g.arc(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62, s * 0.08, 0, Math.PI * 2); g.fill();
    }
  }
  iconPierce(g, s) {
    g.beginPath();
    g.moveTo(s * 0.78, 0); g.lineTo(s * 0.2, -s * 0.16); g.lineTo(-s * 0.78, -s * 0.1);
    g.lineTo(-s * 0.78, s * 0.1); g.lineTo(s * 0.2, s * 0.16); g.closePath();
    g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(-s * 0.1, -s * 0.55); g.lineTo(-s * 0.1, s * 0.55);
    g.moveTo(s * 0.28, -s * 0.55); g.lineTo(s * 0.28, s * 0.55);
    g.stroke();
  }
  iconQuickCharge(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.52, 0.35, Math.PI * 1.7); g.stroke();
    g.beginPath();
    g.moveTo(s * 0.08, -s * 0.5); g.lineTo(-s * 0.12, 0.02); g.lineTo(s * 0.18, 0.02); g.lineTo(-s * 0.08, s * 0.5);
    g.stroke();
  }
  iconSabot(g, s) {
    g.beginPath();
    g.moveTo(s * 0.7, 0); g.lineTo(s * 0.1, -s * 0.22); g.lineTo(-s * 0.2, -s * 0.14);
    g.lineTo(-s * 0.2, s * 0.14); g.lineTo(s * 0.1, s * 0.22);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(-s * 0.2, -s * 0.28); g.lineTo(-s * 0.65, -s * 0.4);
    g.moveTo(-s * 0.2, s * 0.28); g.lineTo(-s * 0.65, s * 0.4);
    g.moveTo(-s * 0.2, 0); g.lineTo(-s * 0.7, 0);
    g.stroke();
  }
  iconArcSpan(g, s) {
    g.beginPath();
    g.moveTo(-s * 0.75, s * 0.1); g.lineTo(-s * 0.35, -s * 0.35); g.lineTo(-s * 0.05, s * 0.2);
    g.lineTo(s * 0.3, -s * 0.32); g.lineTo(s * 0.75, s * 0.15);
    g.stroke();
    g.beginPath(); g.arc(-s * 0.75, s * 0.1, s * 0.1, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(s * 0.75, s * 0.15, s * 0.1, 0, Math.PI * 2); g.fill();
  }
  iconForked(g, s) {
    g.beginPath();
    g.moveTo(0, -s * 0.7); g.lineTo(-s * 0.08, -s * 0.05); g.lineTo(s * 0.16, -s * 0.05); g.lineTo(-s * 0.08, s * 0.15);
    g.stroke();
    g.beginPath(); g.moveTo(-s * 0.08, s * 0.15); g.lineTo(-s * 0.55, s * 0.65); g.moveTo(-s * 0.08, s * 0.15); g.lineTo(s * 0.5, s * 0.65); g.stroke();
  }
  iconStatic(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.18, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 - 0.4;
      const r0 = s * 0.28, r1 = s * (i % 2 ? 0.7 : 0.55);
      g.beginPath();
      g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      g.stroke();
    }
  }
  iconNeurotoxin(g, s) {
    g.beginPath();
    g.moveTo(-s * 0.18, -s * 0.55); g.lineTo(s * 0.18, -s * 0.55);
    g.lineTo(s * 0.18, -s * 0.2); g.lineTo(s * 0.38, s * 0.15);
    g.quadraticCurveTo(s * 0.4, s * 0.65, 0, s * 0.65);
    g.quadraticCurveTo(-s * 0.4, s * 0.65, -s * 0.38, s * 0.15);
    g.lineTo(-s * 0.18, -s * 0.2);
    g.closePath(); g.stroke(); g.globalAlpha *= 0.35; g.fill(); g.globalAlpha /= 0.35;
    g.beginPath(); g.arc(0, s * 0.22, s * 0.12, 0, Math.PI * 2); g.fill();
  }
  iconIonSpike(g, s) {
    g.beginPath();
    g.arc(0, 0, s * 0.52, -0.6, Math.PI * 1.15);
    g.stroke();
    g.beginPath();
    g.moveTo(s * 0.2, -s * 0.45); g.lineTo(s * 0.05, -s * 0.05); g.lineTo(s * 0.45, 0); g.lineTo(s * 0.15, s * 0.2);
    g.stroke();
    g.beginPath(); g.moveTo(-s * 0.15, -s * 0.1); g.lineTo(s * 0.55, s * 0.55); g.stroke();
  }
  iconPower(g, s) {
    // bursting bullet / energy bolt
    g.beginPath();
    g.moveTo(s * 0.55, 0); g.lineTo(-s * 0.1, -s * 0.28); g.lineTo(-s * 0.05, -s * 0.08);
    g.lineTo(-s * 0.55, 0); g.lineTo(-s * 0.05, s * 0.08); g.lineTo(-s * 0.1, s * 0.28);
    g.closePath(); g.fill(); g.stroke();
    g.globalCompositeOperation = 'lighter';
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -0.7 + i * 0.35;
      g.moveTo(Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2);
      g.lineTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.55);
    }
    g.stroke();
  }
  iconReach(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.32, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, 0, s * 0.55, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, 0, 1.6, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      g.beginPath();
      g.moveTo(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62);
      g.lineTo(Math.cos(a) * s * 0.78, Math.sin(a) * s * 0.78);
      g.stroke();
    }
  }
  iconEconomy(g, s) {
    g.save();
    SD.roundRect(g, -s * 0.46, -s * 0.32, s * 0.92, s * 0.64, 3);
    g.fill(); g.stroke();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(20,16,8,0.9)';
    g.font = `bold ${Math.round(s * 0.42)}px ${SD.CONFIG.font}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('CR', 0, 1);
    g.restore();
  }
  iconFocus(g, s) {
    // ramping twin beams
    g.beginPath(); g.moveTo(-s * 0.55, -s * 0.22); g.lineTo(s * 0.6, -s * 0.08); g.lineTo(s * 0.6, -s * 0.22); g.lineTo(-s * 0.55, -s * 0.36); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-s * 0.55, s * 0.22); g.lineTo(s * 0.6, s * 0.08); g.lineTo(s * 0.6, s * 0.22); g.lineTo(-s * 0.55, s * 0.36); g.closePath(); g.fill();
    g.beginPath(); g.arc(-s * 0.15, 0, s * 0.16, 0, Math.PI * 2); g.stroke();
  }
  iconBarrage(g, s) {
    const rocket = (ox, oy) => {
      g.beginPath(); g.moveTo(ox + s * 0.55, oy); g.lineTo(ox - s * 0.2, oy - s * 0.2); g.lineTo(ox - s * 0.2, oy + s * 0.2); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(ox - s * 0.2, oy - s * 0.12); g.lineTo(ox - s * 0.55, oy); g.lineTo(ox - s * 0.2, oy + s * 0.12); g.stroke();
    };
    rocket(-s * 0.02, -s * 0.26); rocket(s * 0.08, s * 0.26);
  }
  iconShatter(g, s) {
    g.beginPath();
    g.moveTo(0, -s * 0.6); g.lineTo(s * 0.42, -s * 0.12); g.lineTo(s * 0.26, s * 0.5); g.lineTo(-s * 0.28, s * 0.5); g.lineTo(-s * 0.48, -s * 0.08);
    g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(0, -s * 0.15); g.lineTo(s * 0.1, s * 0.08); g.lineTo(-s * 0.02, s * 0.5); g.stroke();
    g.beginPath(); g.moveTo(s * 0.06, -s * 0.2); g.lineTo(s * 0.42, -s * 0.12); g.stroke();
  }
  iconSlug(g, s) {
    g.beginPath();
    g.moveTo(s * 0.7, 0); g.lineTo(s * 0.15, -s * 0.2); g.lineTo(-s * 0.55, -s * 0.16);
    g.lineTo(-s * 0.55, s * 0.16); g.lineTo(s * 0.15, s * 0.2); g.closePath();
    g.fill(); g.stroke();
    g.beginPath(); g.arc(-s * 0.15, 0, s * 0.32, 0, Math.PI * 2); g.stroke();
    g.globalCompositeOperation = 'lighter';
    g.beginPath(); g.arc(s * 0.42, 0, s * 0.12, 0, Math.PI * 2); g.fill();
  }
  iconVolt(g, s) {
    g.beginPath();
    g.moveTo(s * 0.1, -s * 0.6); g.lineTo(-s * 0.05, -s * 0.08); g.lineTo(s * 0.28, -s * 0.08);
    g.lineTo(-s * 0.15, s * 0.6); g.lineTo(0, s * 0.08); g.lineTo(-s * 0.32, s * 0.08);
    g.closePath(); g.fill(); g.stroke();
  }
  iconVirulent(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.26, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, 0, s * 0.12, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(0, 0, s * 0.52, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3 - 0.4;
      g.beginPath(); g.arc(Math.cos(a) * s * 0.58, Math.sin(a) * s * 0.58, s * 0.12, 0, Math.PI * 2); g.fill();
    }
  }
  iconHull(g, s) {
    g.beginPath();
    g.moveTo(0, -s * 0.6); g.lineTo(s * 0.52, -s * 0.18); g.lineTo(s * 0.38, s * 0.4);
    g.lineTo(0, s * 0.58); g.lineTo(-s * 0.38, s * 0.4); g.lineTo(-s * 0.52, -s * 0.18);
    g.closePath(); g.stroke(); g.globalAlpha *= 0.35; g.fill();
  }
  iconClock(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.52, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s * 0.28); g.moveTo(0, 0); g.lineTo(s * 0.22, s * 0.08); g.stroke();
    // refresh arrow
    g.beginPath(); g.arc(0, 0, s * 0.7, 0.4, 2.2); g.stroke();
    g.beginPath(); g.moveTo(Math.cos(2.2) * s * 0.7, Math.sin(2.2) * s * 0.7);
    g.lineTo(Math.cos(2.2) * s * 0.52, Math.sin(2.2) * s * 0.85);
    g.stroke();
  }
  iconHero(g, s) {
    if (this.spr.hero && this.spr.hero.oakens) {
      g.shadowBlur = 0; g.globalAlpha = 1;
      SD.blit(g, this.spr.hero.oakens, 0, 1, 0, 0.48);
      return;
    }
    g.beginPath(); g.arc(0, -s * 0.12, s * 0.28, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-s * 0.4, s * 0.5); g.quadraticCurveTo(0, s * 0.1, s * 0.4, s * 0.5); g.stroke();
  }
  iconHeroFreeze(g, s) {
    g.beginPath();
    g.moveTo(0, -s * 0.62); g.lineTo(s * 0.2, -s * 0.12); g.lineTo(s * 0.55, -s * 0.2);
    g.lineTo(s * 0.18, s * 0.1); g.lineTo(s * 0.32, s * 0.55); g.lineTo(0, s * 0.22);
    g.lineTo(-s * 0.32, s * 0.55); g.lineTo(-s * 0.18, s * 0.1); g.lineTo(-s * 0.55, -s * 0.2);
    g.lineTo(-s * 0.2, -s * 0.12); g.closePath();
    g.stroke(); g.globalAlpha *= 0.4; g.fill();
  }
  iconHeroOverload(g, s) {
    g.beginPath();
    g.moveTo(s * 0.08, -s * 0.62); g.lineTo(-s * 0.08, -s * 0.08); g.lineTo(s * 0.32, -s * 0.08);
    g.lineTo(-s * 0.12, s * 0.62); g.lineTo(s * 0.06, s * 0.1); g.lineTo(-s * 0.34, s * 0.1);
    g.closePath(); g.fill(); g.stroke();
  }
  iconCore(g, s) {
    g.beginPath(); g.arc(0, 0, s * 0.38, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(0, 0, s * 0.58, 0, Math.PI * 2); g.stroke();
    g.globalCompositeOperation = 'lighter';
    g.beginPath(); g.moveTo(-s * 0.12, -s * 0.5); g.lineTo(s * 0.08, 0); g.lineTo(-s * 0.06, 0); g.lineTo(s * 0.16, s * 0.5); g.stroke();
  }

  drawJoePortrait(g, px, py, por) {
    const im = SD.Portraits && SD.Portraits.joe;
    g.save();
    SD.roundRect(g, px, py, por, por, 10);
    g.fillStyle = 'rgba(8,4,16,0.95)'; g.fill();
    g.clip();
    if (im && im.complete && im.naturalWidth) {
      g.drawImage(im, px, py, por, por);
      g.fillStyle = 'rgba(0,0,0,0.12)';
      for (let sy = py; sy < py + por; sy += 4) g.fillRect(px, sy, por, 1.2);
    }
    g.restore();
    g.save();
    SD.roundRect(g, px, py, por, por, 10);
    g.strokeStyle = 'rgba(255,210,120,0.95)'; g.lineWidth = 2;
    g.shadowColor = 'rgba(80,220,255,0.55)'; g.shadowBlur = 10 * (SD.view && SD.view.scale || 1);
    g.stroke();
    g.restore();
  }
  drawJoeBubble(g, x, y, w, h) {
    const fadeIn = Math.min(1, (this.joePop || 0) * 5);
    const fadeOut = this.joeLife == null ? 1 : Math.min(1, Math.max(0, this.joeLife) * 3);
    const pop = fadeIn * fadeOut;
    if (pop <= 0.04) return;
    const line = this.joeLine || SD.pickJoeLine('open');
    g.save();
    g.globalAlpha = 0.38 + 0.54 * pop;
    // tail pointing at the portrait
    g.beginPath();
    g.moveTo(x + 2, y + h * 0.45);
    g.lineTo(x - 10, y + h * 0.55);
    g.lineTo(x + 2, y + h * 0.68);
    g.fillStyle = 'rgba(10,14,22,0.94)'; g.fill();
    SD.roundRect(g, x, y, w, h, 12);
    g.fillStyle = 'rgba(10,14,22,0.94)'; g.fill();
    const stroke = g.createLinearGradient(x, y, x + w, y + h);
    stroke.addColorStop(0, 'rgba(120,220,255,0.7)');
    stroke.addColorStop(1, 'rgba(255,210,120,0.55)');
    g.strokeStyle = stroke; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'BAZOOKA JOE', x + 14, y + 16, 11, '255,220,140', { blur: 5, align: 'left', alpha: 0.95 });
    g.save();
    g.font = 'bold 14px ' + (SD.CONFIG.font || 'sans-serif');
    const wrapped = this.wrapJoe(g, line, w - 28);
    g.restore();
    const size = wrapped.length > 2 ? 12 : 14;
    wrapped.forEach((ln, i) => {
      SD.neonText(g, ln, x + 14, y + 38 + i * (size + 4), size, '220,235,250', { blur: 5, align: 'left' });
    });
  }
  drawTooltip(g) {
    const box = this.tipBox;
    this.drawChassis(g, box.x, box.y, box.w, box.h);
    const por = 80;
    const px = box.x + 10, py = box.y + (box.h - por) / 2;
    this.drawJoePortrait(g, px, py, por);
    const shown = this.hover || (this.focus && this.layout[this.focus]);
    const textX = px + por + 18;
    const bubbleW = shown ? 312 : (box.x + box.w - 14 - textX);
    this.drawJoeBubble(g, textX, box.y + 8, bubbleW, box.h - 16);
    if (!shown) return;
    const tip = { x: textX + bubbleW + 10, y: box.y, w: box.x + box.w - (textX + bubbleW + 10), h: box.h };
    const it = shown.it;
    const st = this.stateOf(it);
    const ix = tip.x + 28, iy = tip.y + tip.h / 2;
    g.save();
    g.beginPath(); g.arc(ix, iy, 22, 0, Math.PI * 2);
    g.fillStyle = 'rgba(8,10,16,0.9)'; g.fill();
    g.strokeStyle = st.owned ? 'rgba(255,210,120,0.85)' : 'rgba(180,200,220,0.45)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    this.drawIcon(g, it, ix, iy, 18, st.owned ? '255,220,140' : '210,230,255', 1);
    const title = it.perk ? (it.name + '  ·  ' + it.perk) : it.name;
    const colName = it.col === 'station' ? '' : ((((SD.CONFIG.turrets[it.col] || {}).short) || '') + '  ');
    SD.neonText(g, (colName + title).trim(), tip.x + 58, tip.y + 28, 16, st.owned ? '255,220,140' : '230,235,250', { blur: 8, align: 'left' });
    let desc = it.blurb || '';
    const cut = desc.indexOf(' — ');
    if (cut >= 0) desc = desc.slice(cut + 3);
    else desc = desc.replace(/^[A-Z][A-Z0-9 \-]*\s+/, '').trim();
    g.save();
    g.font = 'bold 12px ' + (SD.CONFIG.font || 'sans-serif');
    const dlines = this.wrapJoe(g, desc, tip.w - 78);
    g.restore();
    dlines.slice(0, 3).forEach((ln, i) => {
      SD.neonText(g, ln, tip.x + 58, tip.y + 50 + i * 16, 12, '190,210,230', { blur: 5, align: 'left', alpha: 0.95 });
    });
    let status;
    if (st.owned) status = 'OWNED';
    else if (st.lock) status = 'LOCKED  ·  ' + (SD.StarShop.lockReason(this.progress, it) || 'LOCKED');
    else if (st.afford) status = 'AVAILABLE  ·  ' + it.cost + '★';
    else status = 'NEED  ' + it.cost + '★';
    SD.neonText(g, status, tip.x + tip.w - 16, tip.y + 28, 12, st.owned ? '255,220,120' : (st.afford ? '120,220,255' : '200,180,140'), { blur: 6, align: 'right' });
    if (st.lock && !st.owned && dlines.length < 3) {
      const reason = SD.StarShop.lockReason(this.progress, it);
      const hint = reason === 'RESPEC TO SWITCH'
        ? 'Only one specialization at a time. Respec to change it.'
        : (reason ? (reason + ' first.') : 'Locked.');
      SD.neonText(g, hint, tip.x + 58, tip.y + 50 + dlines.length * 16, 11, '160,170,190', { blur: 4, align: 'left', alpha: 0.85 });
    }
  }

  draw(g) {
    SD.drawSpaceBg(g, 'orbital');
    this.stars.draw(g, this.T);
    const top = g.createLinearGradient(0, 0, 0, 110);
    top.addColorStop(0, 'rgba(3,2,12,0.62)'); top.addColorStop(1, 'rgba(3,2,12,0)');
    g.fillStyle = top; g.fillRect(0, 0, W, 110);
    SD.neonText(g, 'ARMORY', W / 2, 28, 24, '255,220,140', { blur: 12 });
    const earned = SD.StarShop.earned(this.progress);
    const left = SD.StarShop.available(this.progress);
    // star wallet badge
    const wx = W / 2, wy = 62;
    g.save();
    SD.roundRect(g, wx - 170, wy - 14, 340, 28, 8);
    g.fillStyle = 'rgba(8,10,18,0.8)'; g.fill();
    const wg = g.createLinearGradient(wx, wy - 14, wx, wy + 14);
    wg.addColorStop(0, 'rgba(220,210,160,0.7)'); wg.addColorStop(1, 'rgba(120,100,50,0.55)');
    g.strokeStyle = wg; g.lineWidth = 1.3; g.stroke();
    g.restore();
    SD.neonText(g, '★  ' + left + ' AVAILABLE    ·    ' + earned + ' EARNED', wx, wy, 13, '255,220,120', { blur: 6 });
    const mouse = SD.Input.mouse;
    SD.drawButton(g, this.back, mouse.over && SD.inBtn(this.back, mouse), this.T);
    const canRespec = (this.progress.bought || []).length > 0;
    SD.drawButton(g, this.respec, canRespec && mouse.over && SD.inBtn(this.respec, mouse), this.T);

    this.drawChassis(g, this.chassis.x, this.chassis.y, this.chassis.w, this.chassis.h);
    for (const bay of this.bays) this.drawBay(g, bay);
    for (const bay of this.bays) this.drawPortrait(g, bay);
    for (const bay of this.bays) this.drawConnectors(g, bay);
    for (const id of Object.keys(this.layout)) this.drawNode(g, this.layout[id]);
    this.drawTooltip(g);

    if (this.respecAsk) {
      g.save(); g.fillStyle = 'rgba(4,2,12,0.72)'; g.fillRect(0, 0, W, H); g.restore();
      SD.neonText(g, 'RESPEC?', W / 2, 210, 44, '255,160,120', { blur: 20 });
      SD.neonText(g, 'ALL UPGRADES WILL BE CLEARED. STARS RETURN.', W / 2, 262, 15, '160,200,255', { blur: 8, alpha: 0.9 });
      const b = this.yesNo();
      SD.drawButton(g, b.yes, this.respecSel === 0 || (mouse.over && SD.inBtn(b.yes, mouse)), this.T);
      SD.drawButton(g, b.no, this.respecSel === 1 || (mouse.over && SD.inBtn(b.no, mouse)), this.T);
    }
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
    this._armoryBought = Array.isArray(opt.bought) ? opt.bought.slice() : (SD.Progress.load().bought || []);
    if (opt.siege || opt.shot === 'siege' || opt.shot === 'siegemid' || opt.shot === 'siegescore') this.setLevel('siege');
    else this.setLevel(opt.levelIndex || 0);
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
      flagship7: SD.Sprites.flagship7(),
      flagship8: SD.Sprites.flagship8(),
      flagship9: SD.Sprites.flagship9(),
      wraith: SD.Sprites.wraith(),
      hive: SD.Sprites.hive(),
      swarmer: SD.Sprites.swarmer(),
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
    if (!this.shot) {
      if (this.endless && SD.Audio.playSiege) SD.Audio.playSiege();
      else if (SD.Audio.playBuild) SD.Audio.playBuild();
    }
  }

  setLevel(index) {
    if (index === 'siege') {
      this.endless = true;
      this.siegeGates = 2;
      this.siegePhase = 0;
      this.speedMul = 1;
      this.levelIndex = 2;
      this.level = C().siege;
      this.routes = buildRoutes(this.level);
      this.paths = this.routes.paths;
      this.path = this.paths[0];
      this.waves = [];
      this.variant = this.level.variant || 'siege';
      this.hpMul = 1;
      this._buildGrid = null;
      ['15,7','16,7','17,7','15,8','16,8','17,8','15,9','16,9','17,9'].forEach(k => {
        this.routes.blocked.add(k);
        this.paths.forEach(p => p.blocked.add(k));
      });
      this.initPads();
      return;
    }
    this.endless = false;
    this.siegeGates = 0;
    this.levelIndex = Math.max(0, Math.min(SD.CONFIG.levels.length - 1, index | 0));
    this.level = SD.CONFIG.levels[this.levelIndex];
    this.routes = buildRoutes(this.level);
    this.paths = this.routes.paths;
    this.path = this.paths[0];
    this.waves = this.level.waves;
    this.variant = this.level.variant;
    this.hpMul = this.level.hpMul || 1;
    this.speedMul = 1;
    this._buildGrid = null;
    this.initPads();
  }

  initPads() {
    const list = (this.level && this.level.pads) || [];
    this.pads = list.map(p => ({ tx: p.tx, ty: p.ty, premium: !!p.premium, cost: p.cost || 0, open: !p.premium }));
  }
  padAt(tx, ty) { return (this.pads || []).find(p => p.tx === tx && p.ty === ty) || null; }

  reset() {
    this.bought = this._armoryBought || [];
    const startCr = (this.endless && this.level && this.level.startCredits) ? this.level.startCredits : C().startCredits;
    this.credits = startCr + (this.hasPerk('funds') ? 50 : 0);
    this.hull = C().startHull + (this.hasPerk('hull') ? 4 : 0);
    this.maxHull = this.hull;
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
    this.shopTip = null;
    this.shopHold = null;
    this.shopTipSticky = null;
    this.picked = null;
    this.inspected = null;
    this.paused = false;
    this.over = null;
    this.banner = null;
    this.bossLine = null;
    this.joePending = null;
    this._joeAt = -99;
    this._joeSaid = null;
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
    this.heroFx = null;
    this.empFx = [];
    this.initPads();
    this.showcase = false;
    this.score = null;
    this.waveStats = { kills: 0, earned: 0 };
    this.levelStats = { kills: 0, earned: 0, early: 0, t0: 0 };
    this.siegeScore = 0;
    this.wavesCleared = 0;
    this.siegeParts = { kills: 0, waves: 0, hull: 0, early: 0, bosses: 0 };
    if (this.endless) {
      this.siegeGates = 2; this.siegePhase = 0; this.speedMul = 1;
      this.variant = (this.level && this.level.variant) || 'siege';
      if (!this.shot) this.showSiegeTaunt('open');
    }
    this.T = 0;
  }

  wavesLen() { return this.endless ? 1e9 : this.waves.length; }
  earlyBonus(left) { return Math.round(Math.max(0, left) * 2.5); }

  pause(on) {
    if (this.over) return;
    if (on === true || on === false) this.paused = on;
    else this.paused = !this.paused;
  }

  /* ---------- economy / building ---------- */
  hasPerk(id) { return (this.bought || []).indexOf(id) >= 0; }
  costOf(kind) {
    let c = C().turrets[kind].cost;
    if (kind === 'pulse' && this.hasPerk('pulse-economy')) c = Math.round(c * 0.85);
    return c;
  }
  heroVal(key, kind) {
    const conf = this.heroConf(kind || (this.hero && this.hero.kind) || 'oakens');
    const on = this.hasPerk('hero');
    if (key === 'hp') return conf.hp + (on ? 25 : 0);
    if (key === 'damage') return conf.damage * (on ? 1.15 : 1);
    if (key === 'specialDmg') {
      let d = conf.specialDmg * (on ? 1.15 : 1);
      if (this.hasPerk('hero-overload')) d *= 1.5;
      return d;
    }
    if (key === 'specialCd') return Math.max(1, conf.specialCd - (on ? 3 : 0));
    if (key === 'respawn') return Math.max(1, conf.respawn - (on ? 2 : 0));
    return conf[key];
  }
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
      spent: this.costOf(kind) + (level > 1 ? conf.upCost : 0) + (level > 2 ? (conf.upCost2 || 0) : 0),
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
    if (kind === 'nebula' && !this.auto && !this.shot) this.sayJoeNebula();
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
    if (!this.auto && !this.shot) this.sayJoeUpgrade(t);
  }

  talkBusy() {
    const q = this.bossLine;
    if (!q || !q.items) return false;
    const it = q.items[q.i];
    return !!(it && (it.who === 'edisar' || it.who === 'nebula'));
  }

  sayJoeUpgrade(t) {
    if (!t) return;
    const conf = C().turrets[t.kind] || {};
    const unique = !!(conf.unique || t.kind === 'nebula');
    const kind = unique ? 'nebula' : t.kind;
    const text = SD.pickJoeMatchLine(kind, t.level, this._joeSaid);
    this.showJoeLine(text);
  }

  sayJoeNebula() {
    const pool = (SD.JOE_LINES && SD.JOE_LINES.placeNebula) || [];
    if (!pool.length) return;
    const opts = pool.filter(s => s && s !== this._joeSaid);
    const use = opts.length ? opts : pool;
    this.showJoeLine(use[Math.floor(Math.random() * use.length)], { ignoreGap: true, portrait: 'joeValio' });
  }

  showJoeLine(text, opt) {
    if (!text) return;
    opt = opt || {};
    const hold = C().joeLineTime || 4.2;
    const gap = C().joeLineGap || 7;
    const item = {
      who: 'joe', title: 'BAZOOKA JOE', name: 'Field Kit',
      text, rgb: '255,210,120', hold, ignoreGap: !!opt.ignoreGap,
      portrait: opt.portrait || 'joe',
    };
    if (this.talkBusy()) {
      this.joePending = item;
      return;
    }
    if (!item.ignoreGap && (this.T - (this._joeAt == null ? -99 : this._joeAt)) < gap) return;
    this.bossLine = { items: [item], i: 0, life: hold, max: hold };
    this._joeSaid = text;
    this._joeAt = this.T;
    this.joePending = null;
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
      const route = e.route || this.paths[e.pathI || 0] || this.path;
      const total = (e.boss && e.flight) ? e.flight.total : route.total;
      let spd = e.speed * (e.slow || 1);
      if (e.boss) spd = Math.max(C().bossMinSpeed || 12, e.speed * Math.max(C().bossSlowFloor || 0.75, e.slow || 1)) * (e.flightPace || 1);
      remain = Math.max(remain, (total - e.dist) / Math.max(10, spd));
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
    const open = this.siegeOpenPaths();
    const n = open.length;
    const out = [];
    groups.forEach((g, i) => {
      const type = g[0], left = g[1], gap = g[2], gate = g[3];
      const wait = 0.12 + i * 0.85;
      if (n < 2) { out.push({ type, left, gap, wait, pathI: open[0] || 0 }); return; }
      if (Number.isInteger(gate) && open.includes(gate)) { out.push({ type, left, gap, wait, pathI: gate }); return; }
      if (Number.isInteger(gate) && gate >= 0 && gate < n) { out.push({ type, left, gap, wait, pathI: open[gate] }); return; }
      let remain = left;
      for (let pth = 0; pth < n; pth++) {
        const share = Math.ceil(remain / (n - pth));
        if (share <= 0) continue;
        remain -= share;
        out.push({ type, left: share, gap, wait: wait + pth * 0.18, pathI: open[pth] });
      }
    });
    return out;
  }

  siegeOpenPaths() {
    const total = this.paths ? this.paths.length : 1;
    if (!this.endless) return Array.from({ length: total }, (_, i) => i);
    const order = (this.level && this.level.gateOrder) || [0, 2, 1, 3];
    const n = Math.max(1, Math.min(total, this.siegeGates || 2));
    return order.slice(0, n).filter(i => i >= 0 && i < total);
  }

  siegeGateOpen(i) {
    if (!this.endless) return true;
    return this.siegeOpenPaths().indexOf(i) >= 0;
  }

  startWave() {
    if (this.over || this.score || this.waveIndex >= this.wavesLen()) return;
    if (this.waveActive && this.callClock < this.callAfter) return;
    if (this.endless) {
      const ev = this.siegeApplyPhase(this.waveIndex + 1);
      if (!this.shot && ev) {
        if (ev.opened) this.showSiegeTaunt('gate' + ev.gates);
        else if (ev.shifted) this.showSiegeTaunt('shift');
      }
    }
    const w = this.endless ? this.makeSiegeWave(this.waveIndex + 1) : this.waves[this.waveIndex];
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
    const last = this.endless ? !!w.boss : n >= this.wavesLen();
    const label = this.endless && w.newGate ? ('WAVE ' + n + '  —  NEW GATE ONLINE') : (last ? (w.name + ' DETECTED') : ('WAVE ' + n + '  —  ' + w.name));
    this.banner = { text: label, life: 2.6, rgb: last || (w && w.newGate) ? '255,205,90' : '80,170,255' };
    if (last) SD.Audio.boss(); else SD.Audio.wave();
    if (SD.Audio.playWave) SD.Audio.playWave(last ? 9 : Math.min(8, n - 1));
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
    if (this.endless && bonus > 0) {
      const pts = bonus * 2;
      this.siegeScore = (this.siegeScore || 0) + pts;
      this.siegeParts.early += pts;
    }
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
      speed: def.speed * (!def.boss && this.endless ? (this.speedMul || 1) : 1), reward: def.reward,
      hull: def.hull, r: def.r, rgb: def.rgb, boss: !!def.boss,
      resist: def.resist || {}, weak: def.weak || [], resists: def.resists || [],
      iceImmune: !!def.iceImmune, iceSlowMul: def.iceSlowMul, notes: def.notes || '',
      scale: def.scale || 1, sprite: def.sprite || type,
      pathI, route,
      dist, x: p.x, y: p.y, ang: p.ang, slow: 1, slowT: 0, stunT: 0, stunCd: 0, freezeT: 0, freezeCd: 0, freezeHeroCd: 0, holdT: 0, hitFlash: 0,
      empCd: def.emp ? (def.emp.delay || def.emp.cd) : 0, empSaid: false, wp: p.wp || 0,
      poison: [],
    };
    if (def.splitOnDeath) e.splitOnDeath = { type: def.splitOnDeath.type, count: def.splitOnDeath.count || 3 };
    if (def.phase) { e.phaseT = def.phase.visible * (0.4 + Math.random() * 0.7); e.phased = false; }
    if (e.boss) {
      e.flight = makeBossFlight(route);
      e.flightPace = e.flight.total / Math.max(1, route.total);
      const frac = route.total > 0 ? Math.max(0, Math.min(0.9, dist / route.total)) : 0;
      e.dist = e.flight.total * frac;
      const fp = posOnFlight(e.flight, e.dist);
      e.x = fp.x; e.y = fp.y; e.ang = fp.ang;
    }
    this.enemies.push(e);
    if (e.boss && def.line) this.showBossLine(e.name, def.line, def.reply);
    return e;
  }

  showBossLine(name, text, reply) {
    if (!text) return;
    const hold = C().bossLineTime || 5.6;
    const items = [{
      who: 'edisar', title: 'EDISAR STARLIGHT', name: name || 'Commander',
      text, rgb: '255,205,90', hold,
    }];
    if (reply) {
      items.push({
        who: 'nebula', title: 'DR. NEBULA', name: 'The Station',
        text: reply, rgb: '255,80,100', hold: C().replyLineTime || 4.6,
      });
    }
    this.bossLine = { items, i: 0, life: hold, max: hold };
  }

  tickBossLine(dt) {
    const q = this.bossLine;
    if (!q) return;
    q.life -= dt;
    if (q.life > 0) return;
    if (q.items && q.i < q.items.length - 1) {
      q.i += 1;
      const it = q.items[q.i];
      q.max = (it && it.hold) || (C().replyLineTime || 4.6);
      q.life = q.max;
    } else {
      this.bossLine = null;
      if (this.joePending) {
        const item = this.joePending;
        this.joePending = null;
        this.bossLine = { items: [item], i: 0, life: item.hold || 4.2, max: item.hold || 4.2 };
        this._joeSaid = item.text;
        this._joeAt = this.T;
      }
    }
  }

  holdBossLine(who) {
    const q = this.bossLine;
    if (!q || !q.items) return;
    if (who) {
      const i = q.items.findIndex(it => it.who === who);
      if (i >= 0) q.i = i;
    }
    const it = q.items[q.i];
    if (!it) return;
    q.max = it.hold || 6;
    q.life = q.max - 0.35;
  }

  dismissBossLine() { this.bossLine = null; this.joePending = null; }


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
      if (this.endless) {
        const pts = Math.round((e.reward || 0) * 10);
        this.siegeScore = (this.siegeScore || 0) + pts;
        this.siegeParts.kills += pts;
      }
      this.fx.float(e.x, e.y - 10, '+' + e.reward, '255,220,90');
      if (!this._sfxCoin || this.T - this._sfxCoin > 0.04) { SD.Audio.coin(); this._sfxCoin = this.T; }
    }
    if (paid && e.splitOnDeath && e.splitOnDeath.count > 0 && e.splitOnDeath.type) {
      const typ = e.splitOnDeath.type, n = e.splitOnDeath.count;
      for (let i = 0; i < n; i++) {
        const baby = this.spawn(typ, Math.max(0, (e.dist || 0) - 8 + i * 10), e.pathI || 0);
        baby.x = e.x + (i - (n - 1) / 2) * 8;
        baby.y = e.y + (i % 2 ? 6 : -6);
      }
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
    if (this.endless) this.openSiegeScore();
  }

  onWaveCleared() {
    const n = this.waveIndex; // already advanced at start
    const last = !this.endless && n >= this.wavesLen();
    this.shop = null;
    this.picked = null;
    this.callClock = 0;
    if (this.endless) this.addSiegeWaveScore(n);
    if (last) {
      this.openLevelScore();
      return;
    }
    this.waveTimer = this.waveGap;
    this.banner = { text: 'WAVE ' + n + '  CLEARED', life: 2.4, rgb: '80,255,180' };
    if (SD.Audio.playBuild) SD.Audio.playBuild();
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
    if (this.score.siege) {
      this.score = null;
      if (toNext) SD.start('siege', { hero: this.heroKind || undefined });
      else SD.start('levels');
      return;
    }
    const next = toNext && !this.score.last;
    const idx = this.levelIndex;
    this.score = null;
    if (next) SD.start('level', { index: idx + 1 });
    else SD.start('levels');
  }


  siegeApplyPhase(n) {
    const prevGates = this.siegeGates || 2;
    const prevPhase = this.siegePhase || 0;
    const prevVar = this.variant;
    const phase = Math.max(0, Math.floor((n - 1) / 10));
    const variants = ['siege', 'siege2', 'siege3', 'siege4'];
    const gates = Math.min(4, 2 + phase);
    const variant = variants[phase % 4];
    const opened = gates > prevGates;
    const shifted = !opened && (phase !== prevPhase || variant !== prevVar);
    this.siegeGates = gates;
    this.siegePhase = phase;
    this.variant = variant;
    return { opened, shifted, gates, phase, variant };
  }

  packLine(v) {
    if (!v) return { text: null, reply: null };
    if (typeof v === 'string') return { text: v, reply: null };
    return { text: v.edisar || v.text || null, reply: v.nebula || v.reply || null };
  }

  showSiegeTaunt(kind) {
    const lines = C().siegeLines || {};
    let pack = null, name = 'The Siege';
    if (kind === 'open') { pack = this.packLine(lines.open); name = 'Last Stand'; }
    else if (kind === 'gate3') { pack = this.packLine(lines.gate3); name = 'New Gate'; }
    else if (kind === 'gate4') { pack = this.packLine(lines.gate4); name = 'New Gate'; }
    else if (kind === 'shift') {
      const arr = lines.shift || [];
      if (!arr.length) return;
      const idx = Math.max(0, (this.siegePhase || 0) - 3);
      pack = this.packLine(arr[idx % arr.length]);
      name = 'The Siege';
    }
    if (pack && pack.text) this.showBossLine(name, pack.text, pack.reply);
  }

  makeSiegeWave(n) {
    const newGate = n > 1 && n % 10 === 1;
    const hpMul = 1.05 + (n - 1) * 0.07;
    const countScale = 1 + (n - 1) * 0.055;
    const speedMul = 1 + Math.min(0.40, (n - 1) * 0.012);
    this.hpMul = hpMul;
    this.speedMul = speedMul;
    const sc = (c) => Math.max(1, Math.round(c * countScale));
    const bossWave = n % 10 === 0;
    const bosses = ['flagship1', 'flagship2', 'flagship', 'flagship4', 'flagship5', 'flagship6', 'flagship7', 'flagship8', 'flagship9'];
    if (bossWave) {
      const type = bosses[((n / 10) - 1) % bosses.length];
      const def = C().enemies[type];
      const open = this.siegeOpenPaths();
      const gate = open[open.length - 1] || 0;
      const groups = [
        [type, 1, 0.10, gate],
        ['armored', sc(8), 0.52],
        ['shielded', sc(8), 0.44],
        ['juggernaut', Math.max(2, sc(3)), 1.10],
        ['interceptor', sc(10), 0.22],
      ];
      if (n >= 10) groups.push(['wraith', sc(6), 0.42]);
      if (n >= 20) groups.push(['hive', sc(5), 0.60]);
      if (n >= 30) groups.push(['cryo', sc(8), 0.40]);
      return { name: (def && def.name) || 'FLAGSHIP', groups, boss: true, newGate };
    }
    const packs = [
      { name: 'FIRST CONTACT', groups: [['scout', sc(16), 0.30], ['fighter', sc(8), 0.42]] },
      { name: 'SCOUT SCREEN', groups: [['fighter', sc(14), 0.32], ['interceptor', sc(10), 0.20]] },
      { name: 'PHANTOM EDGE', groups: [['wraith', sc(6), 0.50], ['scout', sc(14), 0.22]] },
      { name: 'ARMOR COLUMN', groups: [['armored', sc(10), 0.46], ['fighter', sc(12), 0.34]] },
      { name: 'POD BURST', groups: [['hive', sc(5), 0.70], ['scout', sc(16), 0.20]] },
      { name: 'SHIELD WALL', groups: [['shielded', sc(12), 0.40], ['armored', sc(8), 0.44], ['wraith', sc(6), 0.46]] },
      { name: 'HEAVY STEP', groups: [['juggernaut', Math.max(2, sc(3)), 1.12], ['armored', sc(10), 0.44], ['cryo', sc(8), 0.40]] },
      { name: 'CROSS SWARM', groups: [['scout', sc(20), 0.16], ['interceptor', sc(14), 0.16], ['wraith', sc(8), 0.42], ['hive', sc(4), 0.64]] },
      { name: 'SIEGE TIDE', groups: [['armored', sc(12), 0.38], ['shielded', sc(12), 0.38], ['juggernaut', Math.max(2, sc(3)), 1.08], ['cryo', sc(8), 0.38], ['wraith', sc(6), 0.42]] },
    ];
    const pack = packs[(n - 1) % 9];
    return { name: pack.name, groups: pack.groups, boss: false, newGate };
  }

  addSiegeWaveScore(n) {
    this.wavesCleared = n;
    const wavePts = 200 + n * 40;
    const hullPts = (this.hull || 0) * 8;
    const bossPts = (n % 10 === 0) ? 1500 : 0;
    this.siegeScore = (this.siegeScore || 0) + wavePts + hullPts + bossPts;
    this.siegeParts.waves += wavePts;
    this.siegeParts.hull += hullPts;
    this.siegeParts.bosses += bossPts;
  }

  siegeStarCount(waves) {
    return waves >= 30 ? 3 : waves >= 20 ? 2 : waves >= 10 ? 1 : 0;
  }

  openSiegeScore() {
    if (this.score) return;
    const waves = this.wavesCleared || Math.max(0, this.waveIndex - (this.waveActive ? 1 : 0));
    const stars = this.siegeStarCount(waves);
    const points = this.siegeScore || 0;
    const time = Math.max(0, this.T - (this.levelStats.t0 || 0));
    let best = 0, isNew = false;
    if (!this.shot) {
      const rec = SD.Progress.recordSiege(points, waves, stars);
      best = rec.progress.siegeBest;
      isNew = !!rec.isNew;
    } else {
      best = Math.max(points, (SD.Progress.load().siegeBest || 0));
    }
    this.score = {
      siege: true,
      name: 'LAST STAND',
      last: false,
      kills: this.levelStats.kills,
      earned: this.levelStats.earned,
      hull: this.hull,
      maxHull: this.maxHull,
      early: this.levelStats.early,
      time,
      stars,
      points,
      best,
      isNew,
      waves,
      parts: Object.assign({}, this.siegeParts),
    };
    this.nextBtn = { x: W / 2, y: 470, w: 260, h: 48, label: 'RETRY', rgb: '80,170,255', size: 20 };
    this.menuBtn = { x: W / 2, y: 524, w: 240, h: 44, label: 'MENU', rgb: '255,80,220', size: 18 };
    if (SD.Audio.playScore) SD.Audio.playScore();
  }

  maybeWin() {
    if (this.over || this.endless) return;
    if (this.waveIndex >= this.wavesLen() && !this.waveActive && this.enemies.length === 0 && !this.score) this.openLevelScore();
  }

  /* ---------- combat ---------- */
  stat(t, key) {
    const conf = C().turrets[t.kind];
    if (!conf || conf[key] == null) return 0;
    let v = Array.isArray(conf[key]) ? conf[key][Math.max(0, (t.level || 1) - 1)] : conf[key];
    if (v == null) v = 0;
    if (key === 'range' && t.kind === 'ice' && this.hasPerk('ice-reach')) v *= 1.16;
    if (key === 'damage' && t.kind === 'nebula' && this.hasPerk('nebula-core')) v *= 1.15;
    if (key === 'rate') {
      if (t.kind === 'laser' && this.hasPerk('laser-power')) v /= 1.08;
      if (t.kind === 'missile' && this.hasPerk('missile-economy')) v /= 1.18;
      if (t.kind === 'railgun' && this.hasPerk('railgun-reach')) v /= 1.16;
    }
    if (key === 'splash' && t.kind === 'missile' && this.hasPerk('missile-power')) v *= 1.30;
    if (key === 'speed' && t.kind === 'missile' && this.hasPerk('missile-reach')) v *= 1.45;
    if (key === 'slow' && this.hasPerk('ice-power')) v = 1 - (1 - v) * 1.18;
    if (key === 'slowTime' && this.hasPerk('ice-power')) v += 0.8;
    if (key === 'pierce' && this.hasPerk('railgun-power') && v < 90) v += 1;
    if (key === 'jump' && this.hasPerk('tesla-power')) v *= 1.28;
    if (key === 'chain' && this.hasPerk('tesla-reach')) v += 1;
    if (key === 'chain' && this.hasPerk('tesla-mk4')) v += 1;
    if (key === 'poison' && this.hasPerk('pulse-power')) v *= 1.30;
    if (key === 'poisonTime' && this.hasPerk('pulse-power')) v += 0.7;
    if (key === 'poisonTime' && this.hasPerk('pulse-mk4')) v += 1;
    if (key === 'poisonMax' && this.hasPerk('pulse-mk4')) v += 1;
    if (key === 'poisonSpread' && this.hasPerk('pulse-mk4') && !(v > 0)) v = 40;
    return v;
  }

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
      if (e.dead || e.hp <= 0 || e.phased) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d > r + e.r * 0.3) continue;
      const route = e.route || this.paths[e.pathI || 0] || this.path;
      const total = (e.boss && e.flight) ? e.flight.total : (route.total || 1);
      let score;
      if (mode === 'last') score = -(e.dist / (total || 1));
      else if (mode === 'closest') score = -d;
      else if (mode === 'strongest') score = (e.hp + (e.shield || 0));
      else if (mode === 'weakest') score = -(e.hp + (e.shield || 0));
      else score = e.dist / (total || 1);
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
    if (t.disabledT > 0) return;
    t.cool = this.stat(t, 'rate');
    if (e) t.ang = Math.atan2(e.y - t.y, e.x - t.x);
    t.flash = t.kind === 'nebula' ? 0.28 : t.kind === 'railgun' ? 0.18 : t.kind === 'missile' ? 0.16 : t.kind === 'tesla' ? 0.16 : t.kind === 'pulse' ? 0.22 : t.kind === 'ice' ? 0.14 : 0.10;
    t.kick = t.kind === 'nebula' ? 6 : t.kind === 'railgun' ? 5 : t.kind === 'missile' ? 3.2 : t.kind === 'laser' ? 1.6 : 1.2;
    const tip = this.muzzleTip(t);
    const ox = t.x + Math.cos(t.ang) * tip, oy = t.y + Math.sin(t.ang) * tip;
    let dmg = this.stat(t, 'damage');
    if (t.kind === 'laser') this.fireLaser(t, e, ox, oy, dmg);
    else if (t.kind === 'missile') {
      this.launchMissile(t, e, ox, oy, dmg);
      if (this.hasPerk('missile-mk4')) {
        t.volleys = (t.volleys || 0) + 1;
        if (t.volleys % 4 === 0) this.launchMissile(t, e, ox, oy, dmg, true);
      }
    } else if (t.kind === 'ice') {
      this.shots.push({
        kind: 'ice', x: ox, y: oy, tx: e.x, ty: e.y, target: e, ang: t.ang, speed: 420,
        dmg, slow: this.stat(t, 'slow'), slowTime: this.stat(t, 'slowTime'),
        freeze: this.stat(t, 'freeze') || 0,
        rime: this.hasPerk('ice-economy') ? 42 : 0,
        rgb: C().turrets.ice.rgb, life: 1.6, r: 4,
      });
      SD.Audio.ice();
    } else if (t.kind === 'railgun') this.fireRail(t, e, ox, oy, dmg);
    else if (t.kind === 'tesla') this.fireTesla(t, e, dmg);
    else if (t.kind === 'pulse') this.firePulse(t, dmg);
    else if (t.kind === 'nebula') this.fireNebula(t, ox, oy, dmg);
  }

  fireLaser(t, e, ox, oy, dmg) {
    const rgb = C().turrets.laser.rgb;
    const critMul = (this.hasPerk('laser-reach') && Math.random() < 0.10) ? 1.45 : 1;
    let primary = dmg;
    if (this.hasPerk('laser-mk4') && e) {
      if (t.focusId !== e) { t.focusId = e; t.focusHits = 0; }
      t.focusHits = (t.focusHits || 0) + 1;
      primary = dmg * (1 + Math.min(0.40, Math.max(0, t.focusHits - 1) * 0.08));
    }
    primary *= critMul;
    this.beams.push({ x0: ox, y0: oy, x1: e.x, y1: e.y, rgb: critMul > 1 ? '220,245,255' : rgb, life: critMul > 1 ? 0.14 : 0.1, max: critMul > 1 ? 0.14 : 0.1, thick: critMul > 1 ? 3.2 : undefined });
    this.hurt(e, primary, 'laser');
    const used = new Set([e]);
    if (t.level >= 3) {
      const r = this.stat(t, 'range');
      const other = this.enemies.find(x => x !== e && x.hp > 0 && Math.hypot(x.x - t.x, x.y - t.y) <= r + x.r);
      const tgt = other || e;
      const twinCrit = (this.hasPerk('laser-reach') && tgt !== e && Math.random() < 0.10) ? 1.45 : (tgt === e ? critMul : 1);
      const ox2 = t.x + Math.cos(t.ang + 0.2) * this.muzzleTip(t);
      const oy2 = t.y + Math.sin(t.ang + 0.2) * this.muzzleTip(t);
      this.beams.push({ x0: ox2, y0: oy2, x1: tgt.x, y1: tgt.y, rgb, life: 0.1, max: 0.1 });
      this.hurt(tgt, (tgt === e ? primary : dmg) * (tgt === e ? 1 : twinCrit), 'laser');
      if (tgt !== e) used.add(tgt);
    }
    if (this.hasPerk('laser-economy')) {
      const r = this.stat(t, 'range');
      const mid = this.enemies.find(x => !used.has(x) && x.hp > 0
        && Math.hypot(x.x - e.x, x.y - e.y) <= 90 + x.r
        && Math.hypot(x.x - t.x, x.y - t.y) <= r + x.r);
      if (mid) {
        this.beams.push({ x0: e.x, y0: e.y, x1: mid.x, y1: mid.y, rgb: '160,220,255', life: 0.08, max: 0.08, thick: 1.4 });
        this.hurt(mid, primary * 0.30, 'laser');
      }
    }
    SD.Audio.laser();
  }

  launchMissile(t, e, ox, oy, dmg, extra) {
    const conf = C().turrets.missile;
    const ang = t.ang + (extra ? 0.16 : 0);
    this.shots.push({
      kind: 'missile', x: ox, y: oy, tx: e.x, ty: e.y, target: e,
      ang, speed: this.stat(t, 'speed') || conf.speed[t.level - 1], dmg, splash: this.stat(t, 'splash') || conf.splash[t.level - 1],
      splashMul: conf.splashMul[t.level - 1], cluster: this.stat(t, 'cluster') || 0,
      rgb: conf.rgb, life: 2.4, r: 5,
    });
    if (!extra) SD.Audio.missile();
  }

  fireRail(t, e, ox, oy, dmg) {
    const pierce = this.stat(t, 'pierce') || 3;
    const range = this.stat(t, 'range');
    const ang = t.ang;
    let shot = dmg, charged = false;
    if (this.hasPerk('railgun-mk4')) {
      const fresh = e && t.chargeTgt !== e;
      if (fresh || t.chargeAt == null || this.T >= t.chargeAt) {
        charged = true;
        shot = dmg * 1.5;
        t.chargeTgt = e || t.chargeTgt;
        t.chargeAt = this.T + 8;
      }
    }
    const x1 = t.x + Math.cos(ang) * range, y1 = t.y + Math.sin(ang) * range;
    const hits = [];
    for (const en of this.enemies) {
      if (en.hp <= 0) continue;
      if (this.distToSeg(en.x, en.y, ox, oy, x1, y1) > en.r + 7) continue;
      const along = (en.x - t.x) * Math.cos(ang) + (en.y - t.y) * Math.sin(ang);
      if (along > 0 && along <= range + en.r) hits.push({ e: en, along });
    }
    hits.sort((a, b) => a.along - b.along);
    const n = pierce >= 90 ? hits.length : pierce;
    hits.slice(0, n).forEach(h => this.hurt(h.e, shot, 'railgun'));
    this.beams.push({ x0: ox, y0: oy, x1, y1, rgb: C().turrets.railgun.rgb, life: charged ? 0.2 : 0.14, max: charged ? 0.2 : 0.14, thick: charged ? 5 : 3.2 });
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
      if (i === 0 && this.hasPerk('tesla-mk4') && cur.shield > 0) {
        cur.shield = Math.max(0, cur.shield - Math.max(25, cur.shield * 0.25));
        if (cur.shield <= 0) { cur.shield = 0; this.fx.ring(cur.x, cur.y, '80,220,255', cur.r + 16, 0.3); }
      }
      this.hurt(cur, dmg, 'tesla');
      if (this.hasPerk('tesla-economy')) this.tryTeslaStun(cur);
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
    if (this.hasPerk('ice-mk4') && ((e.slowT > 0 && (e.slow || 1) < 0.995) || (e.freezeT > 0))) {
      applied *= 1.20;
    }
    if (kind === 'railgun' && this.hasPerk('railgun-economy')) {
      if (e.boss) applied *= 1.08;
      else if ((e.hull || 1) >= 2) applied *= 1.20;
    }
    if (e.shield > 0 && !pure) {
      if (kind === 'tesla' || kind === 'pulse') {
        const spike = (kind === 'pulse' && this.hasPerk('pulse-reach')) ? 1.25 : 1;
        const vsShield = applied * spike;
        if (vsShield >= e.shield) {
          applied = applied - e.shield / spike;
          e.shield = 0;
          this.fx.ring(e.x, e.y, '80,220,255', e.r + 16, 0.3);
        } else {
          e.shield -= vsShield;
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

  applyRimeField(s) {
    const r = s.rime || 0;
    if (r <= 0) return;
    this.fx.ring(s.x, s.y, s.rgb || '140,230,255', r, 0.22);
    const weak = 1 - (1 - (s.slow || 0.55)) * 0.65;
    for (const o of this.enemies) {
      if (o.dead || o.hp <= 0) continue;
      if (s.target && o === s.target) continue;
      if (Math.hypot(o.x - s.x, o.y - s.y) <= r + o.r) this.applySlow(o, weak, s.slowTime);
    }
  }

  tryTeslaStun(e) {
    if (!e || e.dead || e.boss || (e.hull || 1) > 1) return;
    if ((e.stunCd || 0) > 0) return;
    if (Math.random() > 0.16) return;
    e.stunT = Math.max(e.stunT || 0, 0.4);
    e.stunCd = 1.1;
    this.fx.burst(e.x, e.y, '200,180,255', 6, 50, 0.2, 1.2);
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
    if (e.boss) f = Math.max(C().bossSlowFloor || 0.75, f);
    if (f < e.slow) e.slow = f;
    e.slowT = Math.max(e.slowT, time);
  }

  applyFreeze(e, time, opt) {
    this.imposeFreeze(e, time, opt || null);
  }

  imposeFreeze(e, time, opt) {
    if (!e || time <= 0) return false;
    const hero = !!(opt && opt.hero);
    if (e.iceImmune && !hero) { this.floater(e, 'IMMUNE', '120,220,255'); return false; }
    if (e.boss) {
      if (hero) {
        if (e.freezeHeroCd > 0) return false;
        time = Math.min(time, C().bossHeroFreeze || 0.5);
        e.freezeHeroCd = C().bossHeroFreezeCd || 4;
      } else {
        if (e.freezeCd > 0) return false;
        if (e.iceSlowMul && e.iceSlowMul < 1) time *= e.iceSlowMul;
        time = Math.min(time, C().bossIceFreezeCap || 0.3);
        e.freezeCd = C().bossIceFreezeCd || 2.4;
      }
    } else if (!hero && e.iceSlowMul && e.iceSlowMul < 1) {
      time *= e.iceSlowMul;
    }
    e.freezeT = Math.max(e.freezeT || 0, time);
    return true;
  }

  moveEnemy(e, dt) {
    const route = e.route || this.paths[e.pathI || 0] || this.path;
    if (e.boss) {
      if (!e.flight) e.flight = makeBossFlight(route);
      const flight = e.flight;
      const locked = (e.freezeT > 0 || e.stunT > 0 || e.holdT > 0);
      if (!locked) {
        const floor = C().bossSlowFloor || 0.75;
        const minSpd = C().bossMinSpeed || 12;
        const pace = e.flightPace || 1;
        const spd = Math.max(minSpd, e.speed * Math.max(floor, e.slow || 1)) * pace;
        e.dist += spd * dt;
      }
      const p = posOnFlight(flight, e.dist);
      e.x = p.x; e.y = p.y; e.ang = p.ang; e.wp = 0;
      if (e.dist >= flight.total) this.leak(e);
      return;
    }
    const locked = (e.freezeT > 0 || e.stunT > 0 || e.holdT > 0);
    if (!locked) {
      let spd = e.speed * (e.slow || 1);
      let left = spd * dt;
      // Overshoot-safe walk along segments so a large step cannot hang on a vertex.
      while (left > 0 && e.dist < route.total) {
        const info = posOnPath(route, e.dist);
        const seg = route.seg[info.wp] || route.seg[route.seg.length - 1];
        const rem = Math.max(0, (seg.start + seg.len) - e.dist);
        if (rem <= 1e-6) {
          e.dist = Math.min(route.total, seg.start + seg.len + 1e-4);
          continue;
        }
        if (left >= rem) {
          e.dist += rem;
          left -= rem;
        } else {
          e.dist += left;
          left = 0;
        }
      }
      if (left > 0) e.dist = Math.min(route.total + left, e.dist + left);
    }
    const p = posOnPath(route, e.dist);
    e.x = p.x; e.y = p.y; e.ang = p.ang;
    e.wp = p.wp || 0;
    if (e.dist >= route.total) this.leak(e);
  }

  tickBossEmp(e, dt) {
    if (!e || !e.boss || e.dead) return;
    const def = C().enemies[e.type];
    const emp = def && def.emp;
    if (!emp) return;
    if (e.empCd == null) e.empCd = emp.delay || emp.cd;
    e.empCd -= dt;
    if (e.empCd > 0) return;
    e.empCd = emp.cd;
    this.fireBossEmp(e, emp);
  }

  fireBossEmp(e, emp) {
    if (!e || !emp) return [];
    const r = emp.radius || 110;
    const dur = emp.duration || 3.2;
    const max = emp.max || 1;
    const list = this.turrets
      .map(t => ({ t, d: Math.hypot(t.x - e.x, t.y - e.y) }))
      .sort((a, b) => a.d - b.d);
    let hits = list.filter(x => x.d <= r).slice(0, max);
    if (!hits.length && list.length && list[0].d <= r * 1.45) hits = [list[0]];
    for (const { t } of hits) {
      t.disabledT = dur;
      t.disabledMax = dur;
      t.target = null;
    }
    if (!this.empFx) this.empFx = [];
    this.empFx.push({
      x: e.x, y: e.y, r, life: 0.55, max: 0.55,
      bolts: hits.map(({ t }) => ({ x: t.x, y: t.y })),
    });
    this.fx.ring(e.x, e.y, '140,230,255', Math.min(r * 0.7, 90), 0.45);
    this.fx.burst(e.x, e.y, '180,240,255', 22, 140, 0.5, 2.4);
    if (SD.Audio.bossEmp) SD.Audio.bossEmp(); else if (SD.Audio.boss) SD.Audio.boss();
    if (!e.empSaid) {
      e.empSaid = true;
      const line = (C().bossEmpLine) || "Power down. Let's see those towers fight in the dark.";
      this.showBossLine(e.name, line, C().bossEmpReply);
    }
    return hits;
  }

  tickEmpFx(dt) {
    if (!this.empFx) return;
    for (const fx of this.empFx) fx.life -= dt;
    this.empFx = this.empFx.filter(fx => fx.life > 0);
  }

  drawEmpFx(g) {
    if (!this.empFx || !this.empFx.length) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const fx of this.empFx) {
      const al = Math.max(0, fx.life / fx.max);
      const rad = fx.r * (0.35 + 0.65 * (1 - al));
      g.beginPath(); g.arc(fx.x, fx.y, rad, 0, Math.PI * 2);
      g.strokeStyle = `rgba(160,240,255,${0.85 * al})`;
      g.lineWidth = 3.5; g.stroke();
      g.beginPath(); g.arc(fx.x, fx.y, rad * 0.62, 0, Math.PI * 2);
      g.strokeStyle = `rgba(80,180,255,${0.5 * al})`;
      g.lineWidth = 7; g.stroke();
      for (const b of fx.bolts || []) {
        g.beginPath();
        g.moveTo(fx.x, fx.y);
        const mx = (fx.x + b.x) / 2 + Math.sin((1 - al) * 18) * 10;
        const my = (fx.y + b.y) / 2 + Math.cos((1 - al) * 16) * 10;
        g.lineTo(mx, my);
        g.lineTo(b.x, b.y);
        g.strokeStyle = `rgba(200,250,255,${0.9 * al})`;
        g.lineWidth = 2.2; g.stroke();
        g.beginPath(); g.arc(b.x, b.y, 16 + (1 - al) * 8, 0, Math.PI * 2);
        g.strokeStyle = `rgba(140,230,255,${0.8 * al})`;
        g.lineWidth = 2; g.stroke();
      }
    }
    g.restore();
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
    this.tickShopTip(dt);
    if (this._freezeSim) {
      this.T += dt;
      this.stars.update(dt);
      return;
    }
    if (this.paused || this.over || this.score || this.pickingHero) {
      this.T += dt;
      this.stars.update(dt);
      if (this.flashGold > 0) this.flashGold -= dt;
      if (this.flashHull > 0) this.flashHull -= dt;
      if (this.banner) { this.banner.life -= dt; if (this.banner.life <= 0) this.banner = null; }
      if (this.bossLine) this.tickBossLine(dt);
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
    if (this.bossLine) this.tickBossLine(dt);
    if (this.heroHint) { this.heroHint.life -= dt; if (this.heroHint.life <= 0) this.heroHint = null; }
    this.tickBossBar(dt);

    this.fx.update(dt);
    this.tickHeroFx(dt);

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
      if (e.freezeCd > 0) e.freezeCd -= dt;
      if (e.freezeHeroCd > 0) e.freezeHeroCd -= dt;
      if (e.holdT > 0) e.holdT -= dt;
      if (e.stunT > 0) e.stunT -= dt;
      if (e.stunCd > 0) e.stunCd -= dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.type === 'wraith' || e.phaseT != null) {
        const ph = (C().enemies[e.type] && C().enemies[e.type].phase) || { visible: 2.6, hidden: 1.15 };
        e.phaseT = (e.phaseT || 0) - dt;
        if (e.phaseT <= 0) {
          e.phased = !e.phased;
          e.phaseT = e.phased ? ph.hidden : ph.visible;
        }
      }
      if (e.poison && e.poison.length) {
        let dps = 0;
        for (const p of e.poison) { p.life -= dt; dps += p.dps; }
        e.poison = e.poison.filter(p => p.life > 0);
        if (dps > 0) this.toxin(e, dps * dt);
        if (e.dead) continue;
      }
      this.moveEnemy(e, dt);
      if (e.boss) this.tickBossEmp(e, dt);
    }
    this.compactEnemies();
    if (this.inspected && (this.inspected.hp <= 0 || this.inspected.dead)) this.inspected = null;
    this.tickEmpFx(dt);

    for (const t of this.turrets) {
      if (t.cool > 0) t.cool -= dt;
      if (t.flash > 0) t.flash -= dt;
      if (t.kick > 0) t.kick = Math.max(0, t.kick - 20 * dt);
      if (t.disabledT > 0) {
        t.disabledT -= dt;
        t.target = null;
        if (Math.random() < dt * 10) this.fx.burst(t.x, t.y, '140,230,255', 3, 50, 0.25, 1.4);
        continue;
      }
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
        else if (s.kind === 'ice') {
          if (s.target && s.target.hp > 0 && Math.hypot(s.target.x - s.x, s.target.y - s.y) < hitR + 8) {
            this.hurt(s.target, s.dmg, 'ice');
            this.applySlow(s.target, s.slow, s.slowTime);
            this.applyFreeze(s.target, s.freeze);
            this.fx.burst(s.x, s.y, s.rgb, 8, 70, 0.3, 1.6);
          }
          if (s.rime > 0) this.applyRimeField(s);
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
    this.abCd[id] = conf.cd * (this.hasPerk('charge') ? 0.82 : 1);
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
        if (Math.hypot(e.x - d.x, e.y - d.y) <= d.r + e.r) {
          const hold = e.boss ? Math.min(d.hold, 0.8) : d.hold;
          e.holdT = Math.max(e.holdT || 0, hold);
        }
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
      hp: this.heroVal('hp', id), max: this.heroVal('hp', id), ang: 0,
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
        h.hp = 0; h.dead = true; h.respawn = this.heroVal('respawn', h.kind); this.pickedHero = false;
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
        this.hurt(tgt, this.heroVal('damage', h.kind), h.kind === 'nebula' ? 'nebula' : 'laser');
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
    h.specialCd = this.heroVal('specialCd', h.kind);
    h.flash = 0.35;
    const dmg = this.heroVal('specialDmg', h.kind);
    const targets = this.enemies.filter(e => !e.dead && e.hp > 0);
    if (h.kind === 'nebula') this.castLightning(targets, dmg);
    else this.castMissileRain(targets, dmg);
  }
  specialFreezeTime(e) {
    if (!this.hasPerk('hero-freeze')) return 0;
    return e && e.boss ? (C().bossHeroFreeze || 0.5) : 2.5;
  }
  hurtHeroSpecial(e, dmg, style) {
    if (!e || e.dead || e.hp <= 0 || dmg <= 0) return;
    let amount = dmg;
    if (e.boss) amount *= 0.4;
    let mul = 1;
    if (!e.boss && style && e.resist && e.resist[style] != null) mul = e.resist[style];
    let applied = amount * mul;
    // Ultimates punch shields the way Tesla / Pulse do.
    if (e.shield > 0) {
      if (applied >= e.shield) {
        applied -= e.shield;
        e.shield = 0;
        this.fx.ring(e.x, e.y, '80,220,255', e.r + 16, 0.3);
      } else {
        e.shield -= applied;
        applied = 0;
      }
    }
    e.hitFlash = 0.16;
    if (applied > 0) e.hp -= applied;
    const freeze = this.specialFreezeTime(e);
    if (freeze > 0 && this.imposeFreeze(e, freeze, { hero: true })) {
      this.floater(e, 'FREEZE', '140,230,255');
    }
    if (e.hp <= 0) this.kill(e, true);
  }
  castMissileRain(targets, dmg) {
    const shots = targets.map((e, i) => ({
      e,
      x: e.x + (Math.random() - 0.5) * 36,
      y: -20 - (i % 4) * 10 - Math.random() * 12,
      tx: e.x, ty: e.y,
      delay: (i % 5) * 0.008,
      t: 0,
      dur: 0.46 + (i % 3) * 0.03,
      arrived: false,
    }));
    this.heroFx = { kind: 'missiles', life: 0.95, max: 0.95, flash: 0.28, rgb: '255,170,70', shots, dmg };
    this.fx.burst(this.hero.x, this.hero.y, this.hero.rgb, 14, 120, 0.35, 1.8);
    if (SD.Audio.heroMissiles) SD.Audio.heroMissiles(); else SD.Audio.explode(1.2);
  }
  castLightning(targets, dmg) {
    const bolts = targets.map((e, i) => {
      const x0 = e.x + (Math.random() - 0.5) * 24;
      const midX = (x0 + e.x) / 2 + (Math.random() - 0.5) * 28;
      const midY = (30 + e.y) / 2 + (Math.random() - 0.5) * 22;
      return {
        e,
        pts: [{ x: x0, y: 10 + Math.random() * 24 }, { x: midX, y: midY }, { x: e.x, y: e.y }],
        fork: Math.random() < 0.7,
        delay: i * 0.015,
      };
    });
    this.heroFx = { kind: 'lightning', life: 0.7, max: 0.7, flash: 0.32, rgb: '255,70,70', bolts, struck: false, dmg };
    if (SD.Audio.heroLightning) SD.Audio.heroLightning(); else { SD.Audio.laser(); SD.Audio.explode(1.1); }
  }
  tickHeroFx(dt) {
    const fx = this.heroFx; if (!fx) return;
    fx.life -= dt;
    if (fx.kind === 'missiles') {
      for (const s of fx.shots) {
        if (s.delay > 0) { s.delay -= dt; continue; }
        if (s.arrived) continue;
        s.t += dt;
        const e = s.e;
        if (e && !e.dead) { s.tx = e.x; s.ty = e.y; }
        const u = Math.min(1, s.t / s.dur);
        const y0 = s.y, x0 = s.x;
        s.cx = x0 + (s.tx - x0) * u;
        s.cy = y0 + (s.ty - y0) * u;
        if (u >= 1) {
          s.arrived = true;
          if (e && !e.dead && e.hp > 0) {
            this.hurtHeroSpecial(e, fx.dmg, 'missile');
            this.fx.ring(s.tx, s.ty, '255,170,70', 22, 0.28);
            this.fx.burst(s.tx, s.ty, '255,140,40', 8, 90, 0.25, 1.4);
          }
        }
      }
    } else if (fx.kind === 'lightning' && !fx.struck) {
      fx.struck = true;
      for (const b of fx.bolts) {
        const e = b.e;
        if (e && !e.dead && e.hp > 0) {
          this.hurtHeroSpecial(e, fx.dmg, 'tesla');
          this.fx.burst(e.x, e.y, '255,70,70', 8, 80, 0.25, 1.3);
        }
      }
    }
    if (fx.life <= 0) this.heroFx = null;
  }
  drawHeroSpecial(g) {
    const fx = this.heroFx; if (!fx) return;
    const a = Math.max(0, fx.life / fx.max);
    const flash = fx.flash ? Math.max(0, (fx.flash - (fx.max - fx.life)) / fx.flash) : 0;
    if (flash > 0) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = fx.kind === 'lightning' ? `rgba(255,40,40,${0.16 * flash})` : `rgba(255,160,60,${0.14 * flash})`;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
    if (fx.kind === 'missiles') {
      for (const s of fx.shots) {
        if (s.delay > 0 || s.arrived || s.cx == null) continue;
        const ang = Math.atan2(s.ty - (s.cy || s.y), s.tx - (s.cx || s.x));
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.translate(s.cx, s.cy); g.rotate(ang);
        // long exhaust
        const trail = g.createLinearGradient(-8, 0, -46, 0);
        trail.addColorStop(0, 'rgba(255,200,80,0.95)');
        trail.addColorStop(0.4, 'rgba(255,120,40,0.55)');
        trail.addColorStop(1, 'rgba(255,80,20,0)');
        g.strokeStyle = trail; g.lineWidth = 3.2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-8, 0); g.lineTo(-46, 0); g.stroke();
        g.strokeStyle = 'rgba(255,240,180,0.8)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(-8, 0); g.lineTo(-28, 0); g.stroke();
        SD.glow(g, -10, 0, 16, 8, '255,140,40', 0.85);
        g.fillStyle = 'rgba(255,230,140,1)';
        g.beginPath(); g.moveTo(14, 0); g.lineTo(-10, -5); g.lineTo(-8, 0); g.lineTo(-10, 5); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,90,50,1)';
        g.beginPath(); g.moveTo(-8, -4.2); g.lineTo(-14, 0); g.lineTo(-8, 4.2); g.closePath(); g.fill();
        g.restore();
      }
    } else if (fx.kind === 'lightning') {
      const fade = 0.35 + 0.65 * a;
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const b of fx.bolts) {
        if (b.delay > 0) continue;
        const pts = b.pts;
        g.strokeStyle = `rgba(255,80,80,${0.85 * fade})`;
        g.lineWidth = 2.6; g.shadowColor = 'rgba(255,60,60,1)'; g.shadowBlur = 10 * (SD.view ? SD.view.scale : 1);
        g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.stroke();
        g.strokeStyle = `rgba(255,220,220,${0.7 * fade})`; g.lineWidth = 1.1; g.shadowBlur = 0;
        g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.stroke();
        if (b.fork && pts.length >= 2) {
          const mid = pts[1];
          g.strokeStyle = `rgba(255,90,90,${0.55 * fade})`; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(mid.x, mid.y);
          g.lineTo(mid.x + 16, mid.y + 18); g.stroke();
        }
        const e = b.e;
        if (e && !e.dead) SD.glow(g, e.x, e.y, 18, 18, '255,70,70', 0.35 * fade);
      }
      g.restore();
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
      // Toast is non-blocking: clicks pass through to the field. Escape still dismisses.
      if (SD.Input.hit('Escape')) this.dismissBossLine();
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
    if (this._dragConsumed) {
      this._dragConsumed = false;
      return;
    }
    if (clicks.length && this.shopTipSticky) {
      const onTip = clicks.some(p => {
        const b = this.tipBtnAt(p);
        return b && b.id === this.shopTipSticky;
      });
      if (!onTip) { this.shopTipSticky = null; this.shopTip = null; }
    }

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

  shopBtnAt(p, any = false) {
    for (const b of this.uiButtons()) {
      if (SHOP.includes(b.id) && (any || !b.disabled) && SD.inBtn(b, p)) return b;
    }
    return null;
  }
  tipBtnAt(p) {
    for (const b of this.uiButtons()) {
      if (b.shop && SD.inBtn(b, p)) return b;
    }
    return null;
  }
  tickShopTip(dt) {
    if (this._shotTip) { this.shopTip = this._shotTip; return; }
    if (this.pickingHero || this.score || this.over || this.restartAsk) {
      this.shopTip = null; return;
    }
    if (this.shopHold) {
      const ptr = (this.shopHold.ptr != null && SD.Input.pointers.get(this.shopHold.ptr))
        || (SD.Input.pointers.size ? SD.Input.pointers.values().next().value : null);
      if (ptr) {
        const dx = ptr.x - this.shopHold.ox, dy = ptr.y - this.shopHold.oy;
        if (dx * dx + dy * dy >= 14 * 14) {
          this.shopHold = null;
        } else {
          this.shopHold.t += dt;
          if (this.shopHold.t >= 0.4) {
            this.shopHold.shown = true;
            this.shopTip = this.shopHold.kind;
            this.shopTipSticky = SD.Input.touchMode ? this.shopHold.kind : null;
          }
        }
      }
    }
    if (this.drag && this.drag.armed) {
      this.shopTip = null;
      this.shopTipSticky = null;
      return;
    }
    if (!SD.Input.touchMode && SD.Input.mouse.over) {
      const b = this.tipBtnAt(SD.Input.mouse);
      this.shopTip = b ? b.id : null;
      return;
    }
    if (this.shopHold && this.shopHold.shown) this.shopTip = this.shopHold.kind;
    else if (this.shopTipSticky) this.shopTip = this.shopTipSticky;
    else this.shopTip = null;
  }
  updateDrag(downs, released) {
    this._dragConsumed = false;
    if (!this.drag) {
      for (const d of downs) {
        if (d.button === 2) continue;
        const b = this.shopBtnAt(d) || ((d.type === 'touch' || d.type === 'pen' || SD.Input.touchMode) && this.tipBtnAt(d));
        // allow drag only from affordable buttons; still start a hold on any shop button for the tooltip
        const hold = this.tipBtnAt(d);
        if (hold) {
          this.shopHold = { kind: hold.id, t: 0, shown: false, ptr: d.id, ox: d.x, oy: d.y };
          if (SD.Input.touchMode) this.shopTipSticky = null;
        }
        if (b) {
          this.drag = { kind: b.id, x: d.x, y: d.y, ox: d.x, oy: d.y, armed: false, ptr: d.id };
          break;
        }
      }
    }
    if (!this.drag) {
      if (released.length && this.shopHold && this.shopHold.shown) {
        this._dragConsumed = true;
        this.shopTipSticky = this.shopHold.kind;
        this.shopTip = this.shopHold.kind;
        this.shopHold = null;
      }
      return;
    }
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
        this.shopHold = null;
        this.shopTip = null;
        this.shopTipSticky = null;
      }
    }
    if (released.length) {
      if (this.drag.armed) {
        this.finishDrag(released[0].x, released[0].y);
        this._dragConsumed = true;
      } else if (this.shopHold && this.shopHold.shown) {
        // long-press was a tooltip, not a select / place
        this._dragConsumed = true;
        this.shopTipSticky = this.shopHold.kind;
        this.shopTip = this.shopHold.kind;
      }
      this.drag = null;
      this.shopHold = null;
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
    if (this.endless) SD.start('siege', { hero: this.heroKind || undefined });
    else SD.start('level', { index: this.levelIndex, hero: this.heroKind || undefined });
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
      const noGold = this.credits < this.costOf(k);
      const sub = locked ? 'LEVEL 3' : used ? 'USED' : (this.costOf(k) + ' CR');
      const b = {
        x: 44 + i * 76, y, w: 72, h: 62, label: conf.short, sub, rgb: conf.rgb,
        size: 11, subSize: 10, labelY: 8, subY: 21,
        click: () => this.toggleShop(k), disabled: locked || used || noGold, id: k, shop: true,
      };
      if (locked) b.tag = 'LV3';
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
      : last ? 'CLEAR' : (this.endless ? ('WAVE ' + (this.waveIndex + 1)) : ('WAVE ' + (this.waveIndex + 1) + ' / ' + this.wavesLen()));
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
    const gateRgb = ['255,80,220', '80,220,255', '255,200,80', '120,255,140'];
    spawns.forEach((s, i) => {
      const active = this.siegeGateOpen(i);
      g.save();
      g.globalAlpha = active ? 1 : 0.32;
      SD.glow(g, s.x, s.y, 40, 50, gateRgb[i % 4], active ? (0.22 + 0.08 * Math.sin(this.T * 4 + i)) : 0.08);
      SD.blit(g, this.spr.gate, s.x - (s.x < W / 2 ? -6 : 6), s.y, 0, 1);
      g.restore();
    });
    const base = (this.routes && this.routes.base) || this.path.base;
    SD.glow(g, base.x, base.y, this.endless ? 64 : 50, this.endless ? 64 : 50, '80,170,255', 0.18 + 0.06 * Math.sin(this.T * 2));
    SD.blit(g, this.spr.station, this.endless ? base.x : base.x + 6, base.y, 0, this.endless ? 1.08 : 1);

    this.drawGhost(g);
    this.drawDrones(g);
    this.drawHero(g);
    this.drawAim(g);

    for (const t of this.turrets) this.drawTurret(g, t);
    this.drawEmpFx(g);
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
    this.drawHeroSpecial(g);
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
    if (this.over && !this.score) this.drawOver(g);
    SD.drawScanlines(g);
  }

  drawPath(g) {
    const routes = this.paths || [this.path];
    routes.forEach((route, ri) => {
      const pts = route.pts;
      const cols = ['80,200,255', '255,90,200', '255,200,80', '120,255,140'];
      const rgb = cols[ri % 4];
      const halos = ['rgba(80,140,255,0.18)', 'rgba(255,90,200,0.16)', 'rgba(255,200,80,0.16)', 'rgba(80,255,140,0.16)'];
      const halo = halos[ri % 4];
      const active = this.siegeGateOpen(ri);
      g.save();
      g.globalAlpha = active ? 1 : 0.28;
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = halo; g.lineWidth = 36;
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
      g.strokeStyle = 'rgba(20,16,48,0.72)'; g.lineWidth = 26;
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
      g.strokeStyle = `rgba(${rgb},0.4)`; g.lineWidth = 2;
      g.setLineDash([10, 10]); g.lineDashOffset = -this.T * 24;
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
      g.setLineDash([]);
      g.restore();
    });
    for (const e of this.enemies) {
      if (!e.boss || e.dead || !e.flight) continue;
      const f = e.flight;
      g.save();
      g.setLineDash([8, 10]);
      g.strokeStyle = 'rgba(255,200,80,0.34)';
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(f.a.x, f.a.y);
      if (f.mid) g.lineTo(f.mid.x, f.mid.y);
      g.lineTo(f.b.x, f.b.y);
      g.stroke();
      g.restore();
    }
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
      const range = this.stat({ kind: this.shop, level: 1 }, 'range');
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
    SD.neonText(g, 'Cyan visor. Missile rain on every ship.', W / 2 - 150, 370, 12, '180,210,255', { blur: 5 });
    SD.neonText(g, 'Red lightning on every ship.', W / 2 + 150, 370, 12, '255,160,160', { blur: 5 });
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
    if (t.disabledT > 0) {
      const max = t.disabledMax || 3.5;
      const pct = Math.max(0, Math.min(1, t.disabledT / max));
      g.save();
      g.beginPath(); g.arc(t.x, t.y, 20 * scale, 0, Math.PI * 2);
      g.fillStyle = 'rgba(12,16,22,0.58)'; g.fill();
      g.strokeStyle = 'rgba(150,180,200,0.7)'; g.lineWidth = 1.4 * scale; g.stroke();
      g.beginPath();
      g.arc(t.x, t.y, 26 * scale, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      g.strokeStyle = 'rgba(130,230,255,0.95)'; g.lineWidth = 2.6 * scale;
      g.shadowColor = 'rgba(80,220,255,0.95)'; g.shadowBlur = 8 * (SD.view && SD.view.scale || 1);
      g.stroke();
      g.shadowBlur = 0;
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const a = this.T * 11 + i * 1.26 + (t.x + t.y) * 0.02;
        const rr = (11 + (i % 3) * 5) * scale;
        const sx = t.x + Math.cos(a) * rr, sy = t.y + Math.sin(a * 1.3) * rr;
        g.fillStyle = i % 2 ? 'rgba(200,250,255,0.9)' : 'rgba(90,200,255,0.8)';
        g.beginPath(); g.arc(sx, sy, (1.4 + (i % 2)) * scale, 0, Math.PI * 2); g.fill();
      }
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
    if (e.phased) {
      g.save();
      g.globalAlpha = 0.32 + 0.08 * Math.sin(this.T * 8);
      g.setLineDash([4, 5]);
      g.strokeStyle = `rgba(${e.rgb || '180,120,255'},0.7)`;
      g.lineWidth = 1.3;
      g.beginPath(); g.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2); g.stroke();
    }
    if (e.hitFlash > 0) { g.save(); g.globalCompositeOperation = 'lighter'; }
    SD.blit(g, spr, e.x, e.y, e.ang, scale);
    if (e.hitFlash > 0) g.restore();
    if (e.phased) g.restore();
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

  talkToastBox() {
    const touch = SD.Input.touchMode;
    return {
      x: 10,
      y: 90,
      w: touch ? Math.min(W - 20, 740) : 460,
      por: touch ? 36 : 44,
      titleSz: touch ? 10 : 11,
      bodySz: touch ? 11 : 12,
      lineH: touch ? 13 : 14,
      radius: 8,
    };
  }

  drawTalkToast(g, opt) {
    const a = opt.alpha;
    if (a <= 0.03) return;
    const box = this.talkToastBox();
    const por = opt.portrait ? box.por : 0;
    const pad = 8, gap = opt.portrait ? 8 : 0;
    const textX = box.x + pad + por + gap;
    const textW = box.w - pad * 2 - por - gap;
    g.save();
    g.font = 'bold ' + box.bodySz + 'px ' + (SD.CONFIG.font || 'sans-serif');
    const body = [];
    (opt.lines || []).forEach(ln => this.wrapLine(g, ln, textW).forEach(w => body.push(w)));
    g.restore();
    const lines = body.slice(0, 5);
    const h = Math.max(por ? por + 12 : 0, pad + box.titleSz + 4 + (opt.sub ? 12 : 0) + lines.length * box.lineH + pad);
    const y = box.y;
    const x = box.x;
    const rgb = opt.rgb || '200,220,255';
    g.save();
    g.globalAlpha = 0.88 * a;
    SD.roundRect(g, x, y, box.w, h, box.radius);
    g.fillStyle = 'rgba(8,10,20,0.72)'; g.fill();
    g.strokeStyle = `rgba(${rgb},0.7)`; g.lineWidth = 1.3; g.stroke();
    g.restore();

    if (opt.portrait) {
      const px = x + pad, py = y + (h - por) / 2;
      const im = SD.Portraits && SD.Portraits[opt.portrait];
      g.save();
      g.globalAlpha = a;
      SD.roundRect(g, px, py, por, por, 7);
      g.fillStyle = 'rgba(8,4,20,0.9)'; g.fill();
      g.clip();
      if (im && im.complete && im.naturalWidth) {
        g.drawImage(im, px, py, por, por);
        g.fillStyle = 'rgba(0,0,0,0.12)';
        for (let sy = py; sy < py + por; sy += 4) g.fillRect(px, sy, por, 1.1);
      }
      g.restore();
      g.save();
      g.globalAlpha = a;
      SD.roundRect(g, px, py, por, por, 7);
      g.strokeStyle = `rgba(${rgb},0.95)`; g.lineWidth = 1.6;
      g.shadowColor = `rgba(${rgb},0.7)`; g.shadowBlur = 8 * (SD.view && SD.view.scale || 1);
      g.stroke();
      g.restore();
    }

    let ty = y + pad + box.titleSz;
    SD.neonText(g, opt.title, textX, ty, box.titleSz, rgb, { blur: 6, alpha: a, align: 'left' });
    if (opt.sub) {
      ty += 13;
      SD.neonText(g, String(opt.sub).toUpperCase(), textX, ty, 10, '200,210,230', { blur: 4, alpha: a * 0.9, align: 'left' });
    }
    ty += 6 + box.lineH;
    lines.forEach((ln, i) => {
      SD.neonText(g, ln, textX, ty + i * box.lineH, box.bodySz, '230,235,245', { blur: 5, alpha: a, align: 'left' });
    });
  }

  drawHeroHint(g) {
    const q = this.heroHint; if (!q || this.bossLine) return;
    const fadeIn = Math.min(1, (q.max - q.life) * 3);
    const fadeOut = Math.min(1, q.life * 3);
    const a = Math.min(fadeIn, fadeOut);
    const touch = SD.Input.touchMode;
    const l1 = touch
      ? 'Tap your hero, then tap a tile to move.'
      : 'Click your hero, then click a tile to move.';
    const l2 = touch
      ? 'Tap SPECIAL to hit every ship on the field.'
      : 'Press R or SPECIAL to hit every ship on the field.';
    this.drawTalkToast(g, {
      alpha: a, rgb: '80,170,255', title: 'TIP', sub: '',
      lines: [l1, l2], portrait: null,
    });
  }

  drawBossLine(g) {
    const q = this.bossLine; if (!q || !q.items) return;
    const it = q.items[q.i]; if (!it) return;
    const fadeIn = Math.min(1, (q.max - q.life) * 4);
    const fadeOut = Math.min(1, q.life * 4);
    const a = Math.min(fadeIn, fadeOut);
    this.drawTalkToast(g, {
      alpha: a,
      rgb: it.rgb || '255,205,90',
      title: it.title || 'EDISAR STARLIGHT',
      sub: it.name || '',
      lines: [it.text],
      portrait: it.portrait || (it.who === 'nebula' ? 'nebula' : (it.who === 'joe' ? 'joe' : 'edisar')),
    });
  }

  drawShopIcon(g, b) {
    const k = b.id;
    const base = this.spr.turret[k + 'Base1'];
    const head = this.spr.turret[k + 'Head1'];
    const ix = b.x, iy = b.y - 12;
    const sc = 0.38;
    g.save();
    if (b.disabled) g.globalAlpha = 0.55;
    if (base) SD.blit(g, base, ix, iy, 0, sc);
    if (head) SD.blit(g, head, ix, iy, -0.55, sc);
    g.restore();
    if (b.tag) SD.neonText(g, b.tag, b.x + 24, b.y - 24, 8, '255,210,90', { blur: 3 });
  }
  drawShopTip(g, kind) {
    const conf = C().turrets[kind];
    if (!conf) return;
    const tip = conf.tip || {};
    const cost = this.costOf(kind);
    const title = (conf.name || conf.short || kind.toUpperCase()) + '  ·  ' + cost + ' CR';
    const raw = [tip.role, tip.effect, tip.vs, tip.resist].filter(Boolean);
    const btn = this.uiButtons().find(b => b.id === kind);
    const bw = 320, pad = 12, lineH = 15, titleH = 20;
    g.save();
    g.font = 'bold 11px ' + (C().font || 'monospace');
    const lines = [];
    raw.forEach(ln => this.wrapLine(g, ln, bw - pad * 2).forEach(w => lines.push(w)));
    g.restore();
    const bh = pad + titleH + lines.length * lineH + pad;
    let cx = btn ? btn.x : W / 2;
    let x = cx - bw / 2;
    if (x < 8) x = 8;
    if (x + bw > W - 8) x = W - 8 - bw;
    // Sit just above the build bar so the card does not cover shop buttons
    // or steal placement taps on the field any longer than a hover lasts.
    const barTop = H - C().hud.bottom;
    let y = barTop - bh - 6;
    if (y < 52) y = 52;
    g.save();
    SD.roundRect(g, x, y, bw, bh, 8);
    g.fillStyle = 'rgba(6,8,16,0.94)'; g.fill();
    const rgb = conf.rgb || '200,220,255';
    g.strokeStyle = `rgba(${rgb},0.75)`; g.lineWidth = 1.4;
    g.shadowColor = `rgba(${rgb},0.6)`; g.shadowBlur = 10 * (SD.view && SD.view.scale || 1);
    g.stroke();
    g.restore();
    // caret toward the button
    if (btn) {
      const bx = Math.max(x + 16, Math.min(x + bw - 16, btn.x));
      const by = y + bh;
      const barY = btn.y - btn.h / 2;
      if (by <= barY + 2) {
        g.save();
        g.fillStyle = 'rgba(6,8,16,0.94)';
        g.strokeStyle = `rgba(${rgb},0.75)`; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(bx - 7, by); g.lineTo(bx, by + 8); g.lineTo(bx + 7, by); g.closePath(); g.fill(); g.stroke();
        g.restore();
      }
    }
    SD.neonText(g, title, x + pad, y + pad + 10, 14, rgb, { blur: 6, align: 'left' });
    lines.forEach((ln, i) => {
      SD.neonText(g, ln, x + pad, y + pad + titleH + i * lineH + 8, 11, '210,225,240', { blur: 4, align: 'left', alpha: 0.95 });
    });
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
    if (this.endless) {
      if (this.score) waveTxt = 'WAVE  ' + (this.score.waves || 0);
      else if (this.waveActive) waveTxt = 'WAVE  ' + this.waveIndex + (this.canCallNext() ? '  CALL' : '');
      else if (this.waveTimer > 0) waveTxt = 'NEXT  ' + Math.ceil(this.waveTimer) + 's  +' + this.earlyBonus(this.waveTimer) + ' CR';
      else if (this.waveIndex === 0) waveTxt = 'WAVE  1  READY';
      else waveTxt = 'WAVE  ' + this.waveIndex + '  CLEARED';
    } else if (this.waveActive) waveTxt = 'WAVE  ' + this.waveIndex + ' / ' + nW + (this.canCallNext() ? '  CALL' : '');
    else if (this.score) waveTxt = this.level.name;
    else if (this.waveIndex >= nW) waveTxt = 'WAVE  ' + nW + ' / ' + nW;
    else if (this.waveTimer > 0) waveTxt = 'NEXT  ' + Math.ceil(this.waveTimer) + 's  +' + this.earlyBonus(this.waveTimer) + ' CR';
    else if (this.waveIndex === 0) waveTxt = 'WAVE  1 / ' + nW + '  READY';
    else waveTxt = 'WAVE  ' + this.waveIndex + ' / ' + nW + '  CLEARED';
    if (this.endless) {
      SD.neonText(g, 'SCORE  ' + (this.score ? this.score.points : (this.siegeScore || 0)), 455, 24, 16, '255,220,120', { blur: 8 });
      SD.neonText(g, waveTxt, 680, 24, 16, this.waveTimer > 0 || (this.waveActive && this.canCallNext()) ? '255,220,120' : '200,210,255', { blur: 8 });
    } else {
      SD.neonText(g, waveTxt, 640, 24, 16, this.waveTimer > 0 || (this.waveActive && this.canCallNext()) ? '255,220,120' : '200,210,255', { blur: 8 });
      SD.neonText(g, this.level.short || this.level.name, 470, 24, 13, '180,200,220', { blur: 6, alpha: 0.85 });
    }

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
      const hover = (mouse.over && SD.inBtn(b, mouse)) || (b.shop && this.shopTip === b.id);
      SD.drawButton(g, b, selected || hover, this.T);
      if (b.shop) this.drawShopIcon(g, b);
      else if (b.tag) SD.neonText(g, b.tag, b.x, b.y - 20, 8, '255,210,90', { blur: 3 });
    }
    if (this.shopTip) this.drawShopTip(g, this.shopTip);
    if (this.picked && !this.shop) {
      const t = this.picked, conf = C().turrets[t.kind];
      const mk = t.level === 3 ? 'III' : t.level === 2 ? 'II' : 'I';
      const perks = SD.StarShop.perksOf({ bought: this.bought }, t.kind);
      const line = conf.name + '  MK ' + mk + (perks.length ? '   ·   ' + perks.join('  ·  ') : '');
      const y = H - C().hud.bottom - 14;
      const tw = Math.min(560, line.length * 7.2);
      g.save();
      SD.roundRect(g, 512 - tw / 2 - 10, y - 12, tw + 20, 22, 6);
      g.fillStyle = 'rgba(6,8,16,0.78)'; g.fill();
      g.restore();
      SD.neonText(g, line, 512, y, 12, conf.rgb, { blur: 5, alpha: 0.95 });
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
    if (s.siege) {
      SD.neonText(g, 'HULL BREACHED', W / 2, 78, 28, '255,80,120', { blur: 16 });
      SD.neonText(g, 'LAST STAND', W / 2, 112, 16, '200,210,230', { blur: 7, alpha: 0.9 });
      SD.neonText(g, 'SCORE  ' + s.points, W / 2, 156, 34, '255,220,120', { blur: 14 });
      if (s.isNew) SD.neonText(g, 'NEW RECORD', W / 2, 188, 16, '80,255,180', { blur: 10 });
      else SD.neonText(g, 'BEST  ' + (s.best || 0), W / 2, 188, 14, '200,210,230', { blur: 7 });
      const starN = s.stars || 0;
      SD.neonText(g, '★'.repeat(starN) + '☆'.repeat(3 - starN), W / 2, 216, 20, '255,220,120', { blur: 8 });
      const mm = SD.pad(Math.floor(s.time / 60)), ss = SD.pad(Math.floor(s.time % 60));
      const parts = s.parts || {};
      const rows = [
        ['WAVES CLEARED', String(s.waves || 0)],
        ['KILLS', String(s.kills)],
        ['KILL POINTS', '+' + (parts.kills || 0)],
        ['WAVE / HULL / BOSS', '+' + ((parts.waves || 0) + (parts.hull || 0) + (parts.bosses || 0))],
        ['EARLY-SEND', '+' + (parts.early || 0)],
        ['TIME', mm + ':' + ss],
      ];
      rows.forEach((row, i) => {
        const yy = 244 + i * 30;
        SD.neonText(g, row[0], W / 2 - 220, yy, 14, '180,200,220', { blur: 6, align: 'left' });
        SD.neonText(g, row[1], W / 2 + 220, yy, 16, '255,220,120', { blur: 8, align: 'right' });
      });
      const next = this.nextBtn || { x: W / 2, y: 470, w: 260, h: 48, label: 'RETRY', rgb: '80,170,255', size: 20 };
      const menu = this.menuBtn || { x: W / 2, y: 524, w: 240, h: 44, label: 'MENU', rgb: '255,80,220', size: 18 };
      const mouse = SD.Input.mouse;
      SD.drawButton(g, next, mouse.over && SD.inBtn(next, mouse), this.T);
      SD.drawButton(g, menu, mouse.over && SD.inBtn(menu, mouse), this.T);
      return;
    }
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

    if (id === 'nebulatip' || id === 'nebulatooltip') {
      this._armoryBought = [];
      this.setLevel(2); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      plant([[5, 5, 'laser', 2], [5, 11, 'tesla', 2], [17, 7, 'pulse', 2], [20, 9, 'ice', 1]]);
      this.credits = 340;
      this.waveIndex = 0;
      this.shop = null;
      this.picked = null;
      this.heroHint = null;
      this.banner = null;
      this.bossLine = null;
      this.shopTip = 'nebula';
      this._shotTip = 'nebula';
      const neb = this.uiButtons().find(b => b.id === 'nebula');
      if (neb && SD.Input && SD.Input.mouse) {
        SD.Input.mouse.x = neb.x; SD.Input.mouse.y = neb.y; SD.Input.mouse.over = true;
      }
      this._freezeSim = true;
    } else if (id === 'buildtip' || id === 'buildbar') {
      this._armoryBought = [];
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 6, 'laser', 2], [8, 10, 'ice', 1], [15, 5, 'tesla', 1], [19, 8, 'railgun', 1]]);
      this.credits = 240;
      this.waveIndex = 0;
      this.shop = null;
      this.picked = null;
      this.heroHint = null;
      this.banner = null;
      this.shopTip = 'tesla';
      this._shotTip = 'tesla';
      const tesla = this.uiButtons().find(b => b.id === 'tesla');
      if (tesla && SD.Input && SD.Input.mouse) {
        SD.Input.mouse.x = tesla.x; SD.Input.mouse.y = tesla.y; SD.Input.mouse.over = true;
      }
      this._freezeSim = true;
      if (SD.Audio && SD.Audio.muted) SD.Audio.toggleMute();
    } else if (id === 'build') {
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
      this.holdBossLine('edisar');
      this.heroHint = null;
      this.banner = null;
      this._freezeSim = true;
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
    } else if (id === 'mk4') {
      this._armoryBought = ['laser-power', 'laser-reach', 'laser-economy', 'laser-mk4', 'ice-power', 'ice-reach', 'ice-mk4', 'funds'];
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 3], [8, 10, 'ice', 3], [15, 5, 'tesla', 2], [19, 8, 'railgun', 1]]);
      this.credits = 240;
      this.waveIndex = 4;
      this.startWave();
      this.enemies = [];
      ['fighter', 'armored', 'scout', 'fighter', 'armored', 'shielded'].forEach((tp, i) => this.spawn(tp, 180 + i * 90));
      const ice = this.turrets.find(t => t.kind === 'ice');
      const laser = this.turrets.find(t => t.kind === 'laser');
      if (ice && this.enemies[1]) {
        this.fire(ice, this.enemies[1]);
        if (this.enemies[1]) { this.applySlow(this.enemies[1], 0.38, 4); this.applyFreeze(this.enemies[1], 1); }
      }
      if (laser && this.enemies[1]) {
        laser.focusId = this.enemies[1];
        laser.focusHits = 6;
        this.fire(laser, this.enemies[1]);
      }
      this.sim(0.45);
      this.picked = laser || this.turrets[0];
      this.shop = null;
      this.heroHint = null;
      this.banner = null;
      if (SD.Audio && SD.Audio.muted) SD.Audio.toggleMute();
    } else if (id === 'heroglobal' || id === 'hero-global') {
      this._armoryBought = [];
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      plant([[4, 5, 'laser', 2], [8, 10, 'ice', 2], [15, 5, 'tesla', 1], [19, 8, 'railgun', 1]]);
      this.credits = 240;
      this.waveIndex = 4;
      this.startWave();
      this.groups = [];
      this.enemies = [];
      ['scout', 'fighter', 'armored', 'shielded', 'interceptor', 'cryo', 'fighter', 'scout', 'armored', 'juggernaut', 'fighter', 'scout'].forEach((tp, i) => this.spawn(tp, 80 + i * 95));
      const h = this.hero;
      const mid = this.path.pts[2] || this.path.pts[1];
      h.x = mid.x + 24; h.y = mid.y + 30; h.homeX = h.x; h.homeY = h.y;
      this.heroHint = null;
      this.banner = null;
      this.turrets.forEach(t => { t.cool = 99; t.kick = 0; });
      this.enemies.forEach(e => { e.stunT = 99; });
      this.heroSpecial();
      this.sim(0.26);
      this._freezeSim = true;
      if (SD.Audio && SD.Audio.muted) SD.Audio.toggleMute();
    } else if (id === 'bossemp' || id === 'emp') {
      this._armoryBought = [];
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      // Lower-right corridor, clear of the taunt box, so the ion pulse and disabled turret stay visible.
      plant([[23, 11, 'laser', 2], [26, 11, 'ice', 2], [21, 11, 'tesla', 2]]);
      this.credits = 200;
      this.waveIndex = 10;
      this.waveActive = true;
      this.groups = [];
      this.shop = null;
      this.picked = null;
      this.heroHint = null;
      this.banner = null;
      this.enemies = [];
      const boss = this.spawn('flagship1', 0);
      if (boss.flight) {
        boss.dist = boss.flight.total * 0.78;
        const fp = posOnFlight(boss.flight, boss.dist);
        boss.x = fp.x; boss.y = fp.y; boss.ang = fp.ang;
      }
      boss.freezeT = 0; boss.stunT = 0; boss.holdT = 0; boss.slow = 1; boss.slowT = 0;
      this.fireBossEmp(boss, (C().enemies.flagship1 && C().enemies.flagship1.emp) || { radius: 100, duration: 3, max: 1, cd: 10 });
      this.sim(0.18);
      this._freezeSim = true;
      if (SD.Audio && SD.Audio.muted) SD.Audio.toggleMute();
    } else if (id === 'bossflight' || id === 'bossline') {
      this._armoryBought = [];
      this.setLevel(8); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      plant([[14, 8, 'laser', 3], [16, 8, 'ice', 3], [20, 8, 'railgun', 2], [17, 8, 'tesla', 2], [21, 8, 'missile', 2]]);
      this.turrets.forEach(t => { t.cool = 99; t.kick = 0; });
      this.credits = 240;
      this.shop = null; this.picked = null; this.heroHint = null; this.banner = null;
      this.groups = []; this.waveActive = true; this.waveIndex = 10;
      this.enemies = [];
      const boss = this.spawn('flagship9', 0, 1);
      if (boss.flight) {
        boss.dist = boss.flight.total * 0.48;
        const fp = posOnFlight(boss.flight, boss.dist);
        boss.x = fp.x; boss.y = fp.y; boss.ang = fp.ang;
      }
      boss.hp = Math.round(boss.max * 0.72);
      boss.freezeT = 0; boss.stunT = 0; boss.holdT = 0; boss.slow = 1; boss.slowT = 0;
      this._freezeSim = true;
      if (SD.Audio && SD.Audio.muted) SD.Audio.toggleMute();
    } else if (id === 'l7' || id === 'l8' || id === 'l9') {
      const idx = id === 'l7' ? 6 : id === 'l8' ? 7 : 8;
      this._armoryBought = [];
      this.setLevel(idx); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      this.credits = 260;
      this.shop = null; this.picked = null; this.heroHint = null; this.banner = null;
      this.groups = []; this.waveActive = true;
      this.enemies = [];
      const types = id === 'l7' ? ['wraith', 'fighter', 'armored'] : id === 'l8' ? ['hive', 'fighter', 'wraith'] : ['wraith', 'hive', 'armored', 'scout'];
      (this.paths || [this.path]).forEach((route, pi) => {
        types.forEach((tp, i) => this.spawn(tp, route.total * (0.22 + i * 0.16), pi));
      });
      this._freezeSim = true;
    } else if (id === 'siege' || id === 'siegemid') {
      this.setLevel('siege'); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      this.siegeApplyPhase(14);
      this.waveIndex = 14; this.wavesCleared = 13; this.waveActive = true;
      this.siegeScore = 18740;
      this.siegeParts = { kills: 11200, waves: 4680, hull: 1660, early: 200, bosses: 1500 };
      this.credits = 340;
      this.shop = null; this.picked = null; this.heroHint = null; this.banner = null; this.bossLine = null;
      this.groups = [];
      const plant = (list) => {
        this.turrets = [];
        for (const [tx, ty, k, lv] of list) {
          const pad = this.padAt(tx, ty);
          if (pad && pad.premium) pad.open = true;
          if (this.canPlace(tx, ty) || this.occupied(tx, ty) || this.shot) this.place(tx, ty, k, lv);
        }
      };
      plant([
        [14, 7, 'laser', 3], [18, 7, 'ice', 3], [14, 10, 'railgun', 3], [18, 11, 'tesla', 3],
        [13, 6, 'missile', 2], [19, 6, 'pulse', 2], [12, 6, 'laser', 2], [19, 7, 'ice', 2],
        [8, 4, 'tesla', 2], [24, 6, 'missile', 2], [8, 11, 'pulse', 2], [24, 11, 'railgun', 2],
      ]);
      this.turrets.forEach(t => { t.cool = 99; t.kick = 0; });
      this.enemies = [];
      (this.paths || []).forEach((route, pi) => {
        if (!this.siegeGateOpen(pi)) return;
        ['wraith', 'hive', 'fighter', 'armored'].forEach((tp, i) => this.spawn(tp, route.total * (0.22 + i * 0.16), pi));
      });
      this._freezeSim = true;
    } else if (id === 'siegescore') {
      this.setLevel('siege'); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      this.siegeApplyPhase(21);
      this.waveIndex = 19; this.wavesCleared = 18; this.waveActive = false;
      this.siegeScore = 31240;
      this.siegeParts = { kills: 18400, waves: 6840, hull: 2520, early: 480, bosses: 3000 };
      this.levelStats = { kills: 268, earned: 4120, early: 240, t0: this.T - 418 };
      this.hull = 0;
      this.over = 'lose';
      this.bossLine = null;
      this.openSiegeScore();
      this.score.isNew = true;
      this.score.best = 31240;
      this._freezeSim = true;
    } else if (id === 'nebulareply' || id === 'nebulaline') {
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
      this.holdBossLine('nebula');
      this.heroHint = null;
      this.banner = null;
      this._freezeSim = true;
    } else if (id === 'siegetaunt' || id === 'siegegate') {
      this.setLevel('siege'); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      this.siegeApplyPhase(11);
      this.waveIndex = 11; this.wavesCleared = 10; this.waveActive = true;
      this.siegeScore = 12400;
      this.credits = 280;
      this.shop = null; this.picked = null; this.heroHint = null; this.banner = null;
      const plant = (list) => {
        this.turrets = [];
        for (const [tx, ty, k, lv] of list) {
          const pad = this.padAt(tx, ty);
          if (pad && pad.premium) pad.open = true;
          if (this.canPlace(tx, ty) || this.occupied(tx, ty) || this.shot) this.place(tx, ty, k, lv);
        }
      };
      plant([
        [14, 7, 'laser', 3], [18, 7, 'ice', 3], [14, 10, 'railgun', 3], [18, 11, 'tesla', 3],
        [13, 6, 'missile', 2], [19, 6, 'pulse', 2], [12, 6, 'laser', 2], [19, 7, 'ice', 2],
      ]);
      this.turrets.forEach(tr => { tr.cool = 99; tr.kick = 0; });
      this.enemies = [];
      (this.paths || []).forEach((route, pi) => {
        if (!this.siegeGateOpen(pi)) return;
        ['fighter', 'armored'].forEach((tp, i) => this.spawn(tp, route.total * (0.36 + i * 0.2), pi));
      });
      this.showSiegeTaunt('gate3');
      this.holdBossLine('edisar');
      this._freezeSim = true;
    } else if (id === 'joeupgrade' || id === 'joematch') {
      this.setLevel(0); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      this.credits = 260;
      this.shop = null; this.picked = null; this.heroHint = null; this.banner = null; this.bossLine = null;
      this.groups = []; this.waveActive = true; this.waveIndex = 3;
      const pads = [[4, 5, 'laser', 3], [8, 10, 'ice', 2], [15, 5, 'tesla', 2], [19, 8, 'railgun', 1], [10, 8, 'missile', 2]];
      this.turrets = [];
      for (const [tx, ty, k, lv] of pads) {
        const pad = this.padAt(tx, ty);
        if (pad && pad.premium) pad.open = true;
        if (this.canPlace(tx, ty) || this.occupied(tx, ty) || this.shot) this.place(tx, ty, k, lv);
      }
      this.turrets.forEach(tr => { tr.cool = 99; tr.kick = 0; });
      this.enemies = [];
      ['fighter', 'armored', 'scout'].forEach((tp, i) => this.spawn(tp, 220 + i * 140));
      this.picked = this.turrets.find(tr => tr.kind === 'laser') || this.turrets[0];
      this.showJoeLine("Twin beams! I told you one wasn't enough.");
      this.holdBossLine('joe');
      this._freezeSim = true;
    } else if (id === 'joenebula' || id === 'joenebulaplace') {
      this.setLevel(2); this.reset(); this.spawnHero('oakens');
      if (this.hero) this.hero.cool = 99;
      plantNear(6);
      this.credits = 340;
      this.shop = null; this.picked = null; this.heroHint = null; this.banner = null;
      let nebPad = null;
      for (const p of this.pads || []) {
        if (this.occupied(p.tx, p.ty)) continue;
        if (this.canPlace(p.tx, p.ty) || this.shot) { nebPad = p; break; }
      }
      if (nebPad) {
        if (nebPad.premium) nebPad.open = true;
        this.place(nebPad.tx, nebPad.ty, 'nebula', 1);
      }
      this.turrets.forEach(tr => { tr.cool = 99; tr.kick = 0; });
      this.enemies = [];
      ['fighter', 'shielded', 'armored'].forEach((tp, i) => this.spawn(tp, 260 + i * 150));
      this.waveIndex = 3; this.waveActive = true; this.groups = [];
      this.showJoeLine("Oh hell. She's here. Edisar, start writing your will.", { ignoreGap: true, portrait: 'joeValio' });
      this.holdBossLine('joe');
      this._freezeSim = true;
    } else if (id === 'title') {
      // unused here
    }
  }

  sim(seconds) {
    const step = 1 / 60;
    for (let t = 0; t < seconds; t += step) this.update(step);
  }
};

SD.runBalance = function (mode, levelIndex, opt) {
  opt = opt || {};
  const d = new SD.Defense({ levelIndex: levelIndex || 0, hero: 'oakens', auto: true, bought: Array.isArray(opt.bought) ? opt.bought : [] });
  const nebulaMix = mode === 'mixed+nebula' || mode === 'mixednebula';
  const kinds = (mode === 'mixed' || nebulaMix) ? ['pulse', 'laser', 'tesla', 'missile', 'railgun', 'ice'] : [mode];
  const cap = (levelIndex || 0) >= 6 ? 14 : (levelIndex || 0) === 0 ? 8 : 10;
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
    maxHull: d.maxHull,
    credits: d.credits,
    waves: d.waveIndex,
    stars: d.score ? d.score.stars : 0,
    kills: d.score ? d.score.kills : (d.levelStats && d.levelStats.kills) || 0,
    earned: d.score ? d.score.earned : (d.levelStats && d.levelStats.earned) || 0,
    early: d.score ? d.score.early : (d.levelStats && d.levelStats.early) || 0,
    turrets: d.turrets.map(t => t.kind + t.level),
    time: Math.round(d.T),
  };
};


SD.runSiege = function (opt) {
  opt = opt || {};
  const d = new SD.Defense({ siege: true, hero: 'oakens', auto: true, bought: Array.isArray(opt.bought) ? opt.bought : [] });
  const kinds = ['pulse', 'laser', 'tesla', 'missile', 'railgun', 'ice'];
  const cap = 16;
  const maxLv = (t) => (C().turrets[t.kind] && C().turrets[t.kind].maxLevel) || 3;
  const spend = () => {
    if (d.turrets.length >= 3 && d.turrets.length < cap) {
      const cheapest = Math.min(...kinds.map(k => d.costOf(k)));
      for (const p of d.nearPads(cap + 6)) {
        if (p.open || !p.premium) continue;
        if (d.credits >= (p.cost || 0) + cheapest) { d.tryUnlock(p.tx, p.ty); break; }
      }
    }
    if (d.canShop('nebula') && d.canBuild('nebula') && d.turrets.length < cap) {
      for (const p of d.nearPads(cap)) {
        if (d.occupied(p.tx, p.ty) || !d.canPlace(p.tx, p.ty)) continue;
        d.shop = 'nebula';
        if (d.tryPlace(p.tx, p.ty)) break;
      }
    }
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
    const reserve = !d.hasNebula() ? 1 : 0;
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
  const limit = 30 * 60 * 24;
  const waveCap = opt.waveCap || 40;
  while (!d.score && !d.over && guard < limit && (d.wavesCleared || 0) < waveCap) {
    acc += step;
    if (acc >= 0.45) { spend(); acc = 0; }
    if (!d.waveActive && !d.score && !d.over) {
      const needBuild = d.waveIndex > 0 && d.waveTimer > 13;
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
    result: d.score ? 'lose' : (d.over || ((d.wavesCleared || 0) >= waveCap ? 'cap' : 'timeout')),
    waves: d.wavesCleared || 0,
    waveIndex: d.waveIndex,
    score: d.siegeScore || (d.score && d.score.points) || 0,
    parts: d.siegeParts || (d.score && d.score.parts) || {},
    hull: d.hull,
    maxHull: d.maxHull,
    kills: (d.levelStats && d.levelStats.kills) || 0,
    turrets: d.turrets.map(t => t.kind + t.level),
    gates: d.siegeGates,
    phase: d.siegePhase,
    time: Math.round(d.T),
  };
};


})();

