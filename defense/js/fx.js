/* Shared visuals: starfield, glow, neon text/buttons, sprites, particles, scanlines. */
(() => {
const { W, H } = SD;
SD.mkCanvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const F = () => SD.CONFIG.font;

const TINTS = ['255,255,255', '255,255,255', '255,170,235', '160,200,255', '200,180,255'];
SD.Starfield = class {
  constructor(density = 1) {
    this.layers = [
      { n: 110, speed: 8,  size: [0.5, 1.0], alpha: [.25, .55] },
      { n: 70,  speed: 18, size: [1.0, 1.7], alpha: [.5, .9] },
      { n: 22,  speed: 36, size: [1.3, 2.2], alpha: [.55, 1] },
    ];
    this.stars = [];
    this.layers.forEach((L, li) => { for (let i = 0; i < Math.round(L.n * density); i++) this.stars.push({
      li, x: Math.random() * W, y: Math.random() * H, s: L.size[0] + Math.random() * (L.size[1] - L.size[0]),
      a: L.alpha[0] + Math.random() * (L.alpha[1] - L.alpha[0]), c: TINTS[(Math.random() * TINTS.length) | 0],
      v: L.speed * (0.8 + Math.random() * 0.4), tw: Math.random() * 6.28 }); });
  }
  update(dt) {
    for (const s of this.stars) { s.x -= s.v * dt; if (s.x < -10) { s.x = W + 10 * Math.random(); s.y = Math.random() * H; } }
  }
  draw(g, t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      const a = s.a * (0.85 + 0.15 * Math.sin(t * 3 + s.tw));
      g.fillStyle = `rgba(${s.c},${a})`; g.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
    }
    g.restore();
  }
};

SD.glow = (g, x, y, rx, ry, rgb, a) => {
  if (a <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.scale(rx, ry);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.45, `rgba(${rgb},${a * .45})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
};
SD.neonText = (g, txt, x, y, size, rgb, opt = {}) => {
  const a = opt.alpha ?? 1;
  g.save();
  g.font = `bold ${size}px ${F()}`; g.textAlign = opt.align || 'center'; g.textBaseline = opt.baseline || 'middle';
  g.shadowColor = `rgba(${rgb},${a})`; g.shadowBlur = (opt.blur ?? 14) * (SD.view ? SD.view.scale : 1);
  g.fillStyle = `rgba(${rgb},${a})`; g.fillText(txt, x, y);
  g.shadowBlur = 0; g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,255,255,${0.28 * a})`; g.fillText(txt, x, y);
  g.restore();
};
SD.roundRect = (g, x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + rr, y); g.arcTo(x + w, y, x + w, y + h, rr); g.arcTo(x + w, y + h, x, y + h, rr); g.arcTo(x, y + h, x, y, rr); g.arcTo(x, y, x + w, y, rr); g.closePath();
};
SD.drawButton = (g, b, selected, t = 0) => {
  const rgb = b.disabled ? '120,110,150' : (b.rgb || '255,80,220');
  const pulse = selected ? 0.75 + 0.25 * Math.sin(t * 6) : 0.45;
  g.save();
  const x = b.x - b.w / 2, y = b.y - b.h / 2, r = b.radius ?? 8;
  if (b.drop) {
    g.shadowColor = 'rgba(0,0,0,0.7)';
    g.shadowBlur = 16 * (SD.view ? SD.view.scale : 1);
    g.shadowOffsetY = 3;
  }
  SD.roundRect(g, x, y, b.w, b.h, r);
  g.fillStyle = b.fill || (selected ? `rgba(${rgb},0.18)` : 'rgba(8,4,20,0.72)'); g.fill();
  g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  g.lineWidth = selected ? 2.5 : 1.5; g.strokeStyle = `rgba(${rgb},${pulse})`;
  g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = (selected ? 16 : 6) * (SD.view ? SD.view.scale : 1); g.stroke();
  g.restore();
  SD.neonText(g, b.label, b.x, b.y + (b.sub ? -7 : 1), b.size || 16, rgb, { alpha: b.disabled ? 0.55 : 1, blur: selected ? 16 : 8 });
  if (b.sub) SD.neonText(g, b.sub, b.x, b.y + 12, b.subSize || 11, b.disabled ? '180,170,140' : (b.subRgb || rgb), { blur: 6, alpha: 0.9 });
};
SD.inBtn = (b, p) => Math.abs(p.x - b.x) <= b.w / 2 && Math.abs(p.y - b.y) <= b.h / 2;

/* ---------- particles ---------- */
SD.Particles = class {
  constructor() { this.list = []; this.rings = []; this.floats = []; }
  burst(x, y, rgb, n = 20, speed = 180, life = 0.7, size = 2) {
    const room = Math.max(0, 220 - this.list.length);
    n = Math.min(n, room);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.25 + Math.random() * 0.9);
      this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.5 + Math.random() * 0.6), max: life, c: Math.random() < .25 ? '255,255,255' : rgb, s: size * (0.6 + Math.random() * 0.8) });
    }
  }
  ring(x, y, rgb, r = 40, life = 0.4) {
    if (this.rings.length > 18) this.rings.shift();
    this.rings.push({ x, y, rgb, r, life, max: life });
  }
  float(x, y, text, rgb = '255,220,90') {
    if (this.floats.length > 28) this.floats.shift();
    this.floats.push({ x, y, text, rgb, life: 0.85, max: 0.85 });
  }
  update(dt) {
    for (const p of this.list) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 1.8 * dt; p.vy *= 1 - 1.8 * dt; p.life -= dt; }
    this.list = this.list.filter(p => p.life > 0);
    for (const r of this.rings) r.life -= dt; this.rings = this.rings.filter(r => r.life > 0);
    for (const f of this.floats) { f.y -= 28 * dt; f.life -= dt; }
    this.floats = this.floats.filter(f => f.life > 0);
  }
  draw(g) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of this.list) { const a = Math.min(1, p.life / p.max * 1.6); g.fillStyle = `rgba(${p.c},${a})`; g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
    for (const r of this.rings) { const k = 1 - r.life / r.max; g.strokeStyle = `rgba(${r.rgb},${(1 - k) * 0.8})`; g.lineWidth = 2.5 * (1 - k) + 0.5; g.beginPath(); g.arc(r.x, r.y, r.r * (0.3 + k), 0, Math.PI * 2); g.stroke(); }
    g.restore();
    for (const f of this.floats) SD.neonText(g, f.text, f.x, f.y, 13, f.rgb, { alpha: Math.min(1, f.life / f.max * 1.4), blur: 8 });
  }
};

/* ---------- pre-rendered sprites (2x with glow) ---------- */
const SS = 2;

/* ---------- metallic turret helpers (volume, not neon outlines) ---------- */
const TSS = 3;
function partCanvas(size, draw) {
  const c = SD.mkCanvas(size * TSS, size * TSS), g = c.getContext('2d');
  g.scale(TSS, TSS); g.translate(size / 2, size / 2); g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g, size);
  return { c, size };
}
function metalBox(g, x, y, w, h, r, cols = ['#b0b7c2', '#5c6572', '#262b33']) {
  SD.roundRect(g, x, y, w, h, r);
  const gr = g.createLinearGradient(x, y, x, y + h);
  gr.addColorStop(0, cols[0]); gr.addColorStop(0.4, cols[1]); gr.addColorStop(1, cols[2]);
  g.fillStyle = gr; g.fill();
  g.strokeStyle = '#10131a'; g.lineWidth = 0.75; g.stroke();
  g.save(); SD.roundRect(g, x, y, w, h, r); g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x + r, y + 1.1); g.lineTo(x + w - r, y + 1.1); g.stroke();
  g.restore();
}
function cylinderV(g, x, y, w, h, r) {
  SD.roundRect(g, x, y, w, h, r);
  const gr = g.createLinearGradient(x, y, x + w, y);
  gr.addColorStop(0, '#1a1e24');
  gr.addColorStop(0.18, '#6a7380');
  gr.addColorStop(0.42, '#d5dae3');
  gr.addColorStop(0.62, '#6a7380');
  gr.addColorStop(1, '#161a20');
  g.fillStyle = gr; g.fill();
  g.strokeStyle = '#10131a'; g.lineWidth = 0.7; g.stroke();
}
function bolt(g, x, y, r = 1.3) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  gr.addColorStop(0, '#c5ccd6'); gr.addColorStop(0.55, '#5a6270'); gr.addColorStop(1, '#1a1e24');
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = gr; g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.35; g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 0.45;
  g.beginPath(); g.moveTo(x - r * 0.45, y); g.lineTo(x + r * 0.45, y); g.stroke();
}
function coreGlow(g, x, y, r, rgb) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, 'rgba(255,255,255,0.85)');
  gr.addColorStop(0.35, `rgba(${rgb},0.7)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.restore();
  g.fillStyle = '#f4fbff'; g.beginPath(); g.arc(x - r * 0.12, y - r * 0.12, r * 0.28, 0, Math.PI * 2); g.fill();
}
function drawLaserHead(g, level) {
  const tall = level >= 2;
  // receiver body
  metalBox(g, -8, -2, 16, 14, 2.2, ['#c0c6d0', '#5a6270', '#222830']);
  metalBox(g, -10, 2, 20, 8, 1.6, ['#9aa3b0', '#454c58', '#1c2028']);
  bolt(g, -7.5, 6, 1.1); bolt(g, 7.5, 6, 1.1);
  if (tall) {
    // side capacitors
    for (const sx of [-1, 1]) {
      metalBox(g, sx * 12 - 3.2, -1, 6.4, 10, 1.2, ['#8a93a2', '#3a4250', '#161a20']);
      coreGlow(g, sx * 12, 4.2, 2.4, '80,170,255');
    }
  }
  if (level >= 3) {
    metalBox(g, -14, -2, 28, 14, 2.2, ['#d0d6e0', '#5a6270', '#222830']);
    for (const sx of [-6.4, 6.4]) {
      cylinderV(g, sx - 3.3, -36, 6.6, 38, 1.4);
      metalBox(g, sx - 4.4, -36, 8.8, 3.4, 0.8, ['#e0e5ee', '#7a8490', '#2a3038']);
      coreGlow(g, sx, -35, 3.4, '80,190,255');
    }
    bolt(g, -12, 8, 1.2); bolt(g, 12, 8, 1.2);
    return;
  }
  // barrel
  const top = tall ? -32 : -26;
  const bw = tall ? 7.2 : 6.2;
  cylinderV(g, -bw / 2, top + 4, bw, 8 - top, 1.4);
  // cooling fins
  g.fillStyle = '#2a3038';
  const finN = tall ? 5 : 4;
  for (let i = 0; i < finN; i++) {
    const fy = -4 - i * 3.4;
    g.fillRect(-bw / 2 - 2.2, fy, 2, 2.2);
    g.fillRect(bw / 2 + 0.2, fy, 2, 2.2);
  }
  // focusing collars
  metalBox(g, -bw / 2 - 1.2, top + 6, bw + 2.4, 3.2, 0.8, ['#d0d5de', '#6a7380', '#2a3038']);
  if (tall) metalBox(g, -bw / 2 - 1.2, top + 14, bw + 2.4, 3.2, 0.8, ['#d0d5de', '#6a7380', '#2a3038']);
  // lens housing + energy core (accent glow)
  g.beginPath(); g.arc(0, top + 2, tall ? 4.2 : 3.5, 0, Math.PI * 2);
  const lg = g.createRadialGradient(-1, top + 1, 0, 0, top + 2, 4.2);
  lg.addColorStop(0, '#2a3340'); lg.addColorStop(1, '#0a0e14');
  g.fillStyle = lg; g.fill();
  g.strokeStyle = '#8a93a0'; g.lineWidth = 1; g.stroke();
  coreGlow(g, 0, top + 2, tall ? 4.4 : 3.4, '80,180,255');
}
function drawMissileHead(g, level) {
  const quad = level >= 2;
  const bodyW = quad ? 34 : 26, bodyX = -bodyW / 2;
  // launcher body
  metalBox(g, bodyX, -4, bodyW, 16, 2.4, ['#b8b0a4', '#5a544c', '#24201c']);
  metalBox(g, bodyX + 2, 2, bodyW - 4, 8, 1.4, ['#8a8478', '#3e3a34', '#1a1814']);
  // caution stripe (flat paint)
  g.fillStyle = '#8a5a18';
  g.fillRect(bodyX + 2, 4.2, bodyW - 4, 2.2);
  g.fillStyle = '#d4c090';
  const nStripe = quad ? 8 : 6;
  const span = bodyW - 4;
  for (let i = 0; i < nStripe; i++) g.fillRect(bodyX + 2 + i * (span / nStripe), 4.2, span / nStripe * 0.45, 2.2);
  bolt(g, bodyX + 4, 9, 1.1); bolt(g, -bodyX - 4, 9, 1.1);
  // rear ammo box
  if (quad) metalBox(g, -8, 8, 16, 6, 1.2, ['#9a9488', '#4a463e', '#1c1a16']);
  // tubes — L1 twin, L2 four in a row
  if (level >= 3) {
    metalBox(g, -22, -6, 44, 20, 2.4, ['#c8c0b4', '#5a544c', '#24201c']);
    g.fillStyle = '#8a5a18'; g.fillRect(-20, 4, 40, 3);
    const cluster = [-16, -8, 0, 8, 16];
    for (const ox of cluster) {
      cylinderV(g, ox - 3.2, -30, 6.4, 26, 1.5);
      g.beginPath(); g.ellipse(ox, -28.5, 2.0, 1.5, 0, 0, Math.PI * 2);
      g.fillStyle = '#0a0a0c'; g.fill();
      coreGlow(g, ox, -28, 2.0, '255,170,70');
    }
    return;
  }
  const tubes = quad ? [-12, -4, 4, 12] : [-6, 6];
  const tTop = -26, tH = 24, tW = quad ? 6.4 : 7.2;
  for (const ox of tubes) {
    const x = ox - tW / 2, y = tTop;
    cylinderV(g, x, y, tW, tH, 1.6);
    metalBox(g, x - 0.6, y, tW + 1.2, 3, 0.8, ['#c4beb4', '#6a645c', '#2a2620']);
    g.beginPath(); g.ellipse(ox, y + 1.4, 2.0, 1.5, 0, 0, Math.PI * 2);
    g.fillStyle = '#0a0a0c'; g.fill();
    g.beginPath(); g.moveTo(ox, y - 1); g.lineTo(ox - 1.4, y + 2.2); g.lineTo(ox + 1.4, y + 2.2); g.closePath();
    g.fillStyle = '#6a3a14'; g.fill();
    g.fillStyle = '#c47a30'; g.fillRect(ox - 1.0, y + 2.0, 2.0, 1.2);
  }
}
function drawIceHead(g, level) {
  const big = level >= 2;
  // yoke / gimbal
  metalBox(g, -11, 0, 5, 12, 1.4, ['#a8b4be', '#4a5864', '#1c242c']);
  metalBox(g, 6, 0, 5, 12, 1.4, ['#a8b4be', '#4a5864', '#1c242c']);
  metalBox(g, -8, 8, 16, 6, 1.6, ['#8a98a4', '#3e4a54', '#161c22']);
  bolt(g, -8.5, 11, 1.1); bolt(g, 8.5, 11, 1.1);
  if (big) {
    // side coolant tanks
    for (const sx of [-1, 1]) {
      metalBox(g, sx * 15 - 3.5, 0, 7, 12, 2.4, ['#8aa0b0', '#3a4a56', '#161c22']);
      g.fillStyle = '#2a6a74'; g.fillRect(sx * 15 - 1.5, 2, 3, 7);
      coreGlow(g, sx * 15, 5.5, 2.0, '140,220,230');
    }
  }
  // dish (facing up / toward target)
  const ry = big ? 13 : 11, rx = big ? 15 : 12;
  g.save();
  g.translate(0, -10);
  g.scale(1, 0.55);
  const dish = g.createRadialGradient(-3, -4, 2, 0, 0, rx);
  dish.addColorStop(0, '#d0e0ea'); dish.addColorStop(0.35, '#6a8494'); dish.addColorStop(1, '#1c2a32');
  g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fillStyle = dish; g.fill();
  g.strokeStyle = '#0e1418'; g.lineWidth = 1.1; g.stroke();
  // dish segments
  g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 0.6;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * rx, Math.sin(a) * rx); g.stroke();
  }
  // inner dish
  g.beginPath(); g.arc(0, 0, rx * 0.48, 0, Math.PI * 2);
  g.fillStyle = '#243038'; g.fill();
  g.strokeStyle = '#8aa0b0'; g.lineWidth = 0.8; g.stroke();
  g.restore();
  // crystal core (accent glow)
  coreGlow(g, 0, -10, big ? 7.5 : 5.5, '140,230,255');
  if (big) {
    g.strokeStyle = 'rgba(180,230,245,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.arc(0, -10, 9, 0, Math.PI * 2); g.stroke();
  }
  if (level >= 3) {
    g.beginPath();
    g.moveTo(0, -28); g.lineTo(5, -14); g.lineTo(-5, -14); g.closePath();
    const ig = g.createLinearGradient(0, -28, 0, -10);
    ig.addColorStop(0, '#f0ffff'); ig.addColorStop(1, '#4aa0b8');
    g.fillStyle = ig; g.fill();
    g.strokeStyle = '#d0f0ff'; g.lineWidth = 0.8; g.stroke();
    coreGlow(g, 0, -20, 6, '180,250,255');
    g.strokeStyle = 'rgba(200,245,255,0.4)'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(0, -10, 13, 0, Math.PI * 2); g.stroke();
  }
}

function drawRailgunHead(g, level) {
  const mk = level || 1;
  const top = mk >= 3 ? -46 : mk >= 2 ? -40 : -34;
  metalBox(g, -10, -2, 20, 16, 2.2, ['#c8c0a8', '#5a5440', '#242018']);
  metalBox(g, -12, 4, 24, 8, 1.6, ['#9a9478', '#3e3a2c', '#1a1810']);
  bolt(g, -9, 10, 1.1); bolt(g, 9, 10, 1.1);
  if (mk >= 2) {
    for (const sx of [-1, 1]) {
      metalBox(g, sx * 14 - 3, -2, 6, 14, 1.2, ['#8a8468', '#3a3828', '#16140e']);
      coreGlow(g, sx * 14, 5, 2.2, '255,200,80');
    }
  }
  // twin rails
  const rw = mk >= 3 ? 3.2 : 2.6;
  for (const sx of [-4.2, 4.2]) {
    metalBox(g, sx - rw / 2, top, rw, 8 - top, 0.6, ['#d8d4c0', '#6a6450', '#2a2618']);
  }
  metalBox(g, -6, top + 2, 12, 4, 0.8, ['#e0dcc8', '#7a7460', '#2a2820']);
  if (mk >= 3) {
    metalBox(g, -7, top + 14, 14, 4, 0.8, ['#e8e4d0', '#8a8468', '#2a2820']);
    g.fillStyle = '#c4a15a';
    for (let i = 0; i < 6; i++) g.fillRect(-1.2, top + 8 + i * 4.5, 2.4, 2);
    coreGlow(g, 0, top + 4, 4.5, '255,220,90');
  }
  g.fillStyle = '#0a0a0c';
  g.fillRect(-3.2, top, 6.4, 3);
  coreGlow(g, 0, top + 1, mk >= 3 ? 4.2 : 3.0, '255,210,90');
}
function drawTeslaHead(g, level) {
  const mk = level || 1;
  metalBox(g, -9, 2, 18, 12, 2, ['#b0a8c0', '#4a4458', '#1c1824']);
  bolt(g, -7, 11, 1.1); bolt(g, 7, 11, 1.1);
  const coils = mk >= 3 ? [-9, 0, 9] : mk >= 2 ? [-6, 6] : [0];
  for (const ox of coils) {
    cylinderV(g, ox - 4, -18, 8, 22, 2.2);
    g.strokeStyle = '#6a50a0'; g.lineWidth = 1.1;
    for (let i = 0; i < 5; i++) {
      g.beginPath(); g.ellipse(ox, -14 + i * 3.4, 5.2, 1.6, 0, 0, Math.PI * 2); g.stroke();
    }
  }
  const orbY = -22, orbR = mk >= 3 ? 8 : mk >= 2 ? 6.5 : 5.5;
  g.beginPath(); g.arc(0, orbY, orbR, 0, Math.PI * 2);
  const og = g.createRadialGradient(-2, orbY - 2, 0, 0, orbY, orbR);
  og.addColorStop(0, '#f0e8ff'); og.addColorStop(0.4, '#8a70d0'); og.addColorStop(1, '#201830');
  g.fillStyle = og; g.fill();
  g.strokeStyle = '#c8b8ff'; g.lineWidth = 1; g.stroke();
  coreGlow(g, 0, orbY, orbR + 1, '180,140,255');
  if (mk >= 3) {
    g.strokeStyle = 'rgba(210,190,255,0.55)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-12, -18); g.lineTo(0, -28); g.lineTo(12, -18); g.stroke();
  }
}
function drawNebulaHead(g, level) {
  // Heavy dark-energy projector: long void barrel, red core (matches Nebula's mothership).
  metalBox(g, -10, 6, 20, 12, 3, ['#8a8490', '#2e2830', '#121014']);
  bolt(g, -6, 14, 1.2); bolt(g, 6, 14, 1.2);
  // rear reactor — ship dome: #ffc8c8 / #e6283c / #5a0014, glow 255,80,80
  g.beginPath(); g.arc(0, 12, 7, 0, Math.PI * 2);
  const rx = g.createRadialGradient(-2, 10, 0, 0, 12, 7);
  rx.addColorStop(0, '#ffc8c8'); rx.addColorStop(0.45, '#d4142a'); rx.addColorStop(1, '#5a0014');
  g.fillStyle = rx; g.fill();
  g.strokeStyle = '#0a0810'; g.lineWidth = 1; g.stroke();
  coreGlow(g, 0, 12, 7, '255,80,80');
  // long shrouded barrel (neutral dark metal)
  metalBox(g, -7, -34, 14, 40, 3, ['#6a646c', '#2a2430', '#0e0c14']);
  metalBox(g, -5, -38, 10, 10, 2, ['#9a9098', '#3a3438', '#141014']);
  // coil rings — ship wing / stripe red
  g.strokeStyle = '#a00c1e'; g.lineWidth = 1.4;
  for (const y of [-8, -16, -24]) {
    g.beginPath(); g.ellipse(0, y, 8, 2.4, 0, 0, Math.PI * 2); g.stroke();
  }
  // core slit
  g.fillStyle = '#1a0810';
  g.fillRect(-1.8, -36, 3.6, 30);
  g.fillStyle = '#ffd0d0';
  g.fillRect(-0.8, -35, 1.6, 28);
  coreGlow(g, 0, -30, 6, '255,90,90');
  coreGlow(g, 0, -38, 7, '255,70,70');
}

function drawPulseHead(g, level) {
  const mk = level || 1;
  const R = mk >= 3 ? 18 : mk >= 2 ? 15 : 12;
  metalBox(g, -8, 4, 16, 10, 2, ['#98b0a4', '#3e544c', '#161e1a']);
  bolt(g, -6, 11, 1.1); bolt(g, 6, 11, 1.1);
  g.save();
  g.translate(0, -6);
  const dish = g.createRadialGradient(-3, -3, 1, 0, 0, R);
  dish.addColorStop(0, '#d8fff0'); dish.addColorStop(0.4, '#3a8a6a'); dish.addColorStop(1, '#10241c');
  g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fillStyle = dish; g.fill();
  g.strokeStyle = '#0c1410'; g.lineWidth = 1.1; g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.6;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke();
  }
  g.beginPath(); g.arc(0, 0, R * 0.45, 0, Math.PI * 2);
  g.fillStyle = '#163028'; g.fill();
  g.restore();
  coreGlow(g, 0, -6, mk >= 3 ? 8 : 5.5, '80,255,180');
  if (mk >= 3) {
    g.strokeStyle = 'rgba(120,255,200,0.5)'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(0, -6, R + 3, 0, Math.PI * 2); g.stroke();
    for (const a of [-0.8, 0, 0.8]) {
      g.save(); g.translate(Math.sin(a) * 16, -6 - Math.cos(a) * 16);
      g.fillStyle = '#9affd0'; g.beginPath(); g.moveTo(0, -4); g.lineTo(2.4, 2); g.lineTo(-2.4, 2); g.closePath(); g.fill();
      g.restore();
    }
  }
}


const path = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
function metalPoly(g, pts, x0, y0, x1, y1, cols) {
  path(g, pts);
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [s, c] of cols) gr.addColorStop(s, c);
  g.fillStyle = gr; g.fill();
  g.strokeStyle = '#0c0e12'; g.lineWidth = 0.9; g.stroke();
}
function clipPoly(g, pts, fn) {
  g.save(); path(g, pts); g.clip(); fn(g); g.restore();
}
function dropShadow(g, pts, ox, oy, a = 0.38) {
  g.save(); g.translate(ox, oy);
  path(g, pts); g.fillStyle = `rgba(0,0,0,${a})`; g.fill();
  g.restore();
}
function engineNozzle(g, x, y, rx, ry, rgb) {
  g.beginPath(); g.ellipse(x, y, rx + 1.6, ry + 1.3, 0, 0, Math.PI * 2);
  const rg = g.createLinearGradient(x, y - ry - 2, x, y + ry + 2);
  rg.addColorStop(0, '#c0c6d0'); rg.addColorStop(0.45, '#5a6270'); rg.addColorStop(1, '#1a1e24');
  g.fillStyle = rg; g.fill();
  g.strokeStyle = '#0c0e12'; g.lineWidth = 0.6; g.stroke();
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = '#07080c'; g.fill();
  coreGlow(g, x, y, Math.max(rx, ry) * 1.25, rgb);
}
function canopy(g, x, y, rx, ry, rgb) {
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  const gl = g.createLinearGradient(x, y - ry, x, y + ry);
  gl.addColorStop(0, '#8aa0b4'); gl.addColorStop(0.35, '#1a2834'); gl.addColorStop(1, '#0a1016');
  g.fillStyle = gl; g.fill();
  g.strokeStyle = '#9aa3b0'; g.lineWidth = 0.7; g.stroke();
  g.beginPath(); g.ellipse(x - rx * 0.25, y - ry * 0.3, rx * 0.35, ry * 0.22, -0.4, 0, Math.PI * 2);
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.fill();
  if (rgb) coreGlow(g, x + rx * 0.15, y, Math.min(rx, ry) * 0.55, rgb);
}

function drawScoutBody(g) {
  const hull = [[26, 0], [12, -4.2], [2, -5.4], [-14, -3.4], [-22, -9], [-26, -3], [-26, 3], [-22, 9], [-14, 3.4], [2, 5.4], [12, 4.2]];
  dropShadow(g, hull, -1, 3, 0.4);
  metalPoly(g, hull, 0, -10, 0, 10, [[0, '#c5cad2'], [0.35, '#4a5260'], [1, '#1a1e24']]);
  clipPoly(g, hull, g => {
    g.strokeStyle = 'rgba(0,0,0,0.32)'; g.lineWidth = 0.55;
    g.beginPath(); g.moveTo(16, -2.2); g.lineTo(-12, -2); g.stroke();
    g.beginPath(); g.moveTo(16, 2.2); g.lineTo(-12, 2); g.stroke();
    g.beginPath(); g.moveTo(-4, -5); g.lineTo(-4, 5); g.stroke();
  });
  // magenta livery stripe (flat paint)
  const stripe = [[22, 0], [8, -1.7], [-16, -1.3], [-16, 1.3], [8, 1.7]];
  metalPoly(g, stripe, 0, -2, 0, 2, [[0, '#c07098'], [0.5, '#7a3058'], [1, '#3a1828']]);
  canopy(g, 11, 0, 4.2, 2.6, '200,80,140');
  bolt(g, -10, -3.6, 0.9); bolt(g, -10, 3.6, 0.9);
  engineNozzle(g, -24, -4.2, 2.2, 2.0, '220,80,150');
  engineNozzle(g, -24, 4.2, 2.2, 2.0, '220,80,150');
}

function drawFighterBody(g) {
  const fus = [[30, 0], [16, -5], [2, -6.5], [-16, -5], [-24, -3], [-24, 3], [-16, 5], [2, 6.5], [16, 5]];
  const wingL = [[12, -5], [-2, -20], [-14, -20], [-10, -5]];
  const wingR = [[12, 5], [-2, 20], [-14, 20], [-10, 5]];
  dropShadow(g, [...wingL.slice(0, 2), ...wingR.slice(0, 2).reverse(), ...fus.filter((_, i) => i === 0)], -1, 4, 0.15);
  dropShadow(g, wingL, -1, 3, 0.32);
  dropShadow(g, wingR, -1, 3, 0.32);
  dropShadow(g, fus, -1, 3, 0.36);
  const steel = [[0, '#d8dee8'], [0.35, '#5a6a7c'], [1, '#1a222c']];
  metalPoly(g, wingL, -8, -20, -8, -4, steel);
  metalPoly(g, wingR, -8, 4, -8, 20, steel);
  metalPoly(g, fus, 0, -8, 0, 8, [[0, '#e0e6ee'], [0.4, '#5c6a7a'], [1, '#1c242e']]);
  clipPoly(g, wingL, g => {
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.55;
    g.beginPath(); g.moveTo(6, -7); g.lineTo(-8, -18); g.stroke();
    bolt(g, -4, -14, 1.0); bolt(g, 2, -9, 1.0);
  });
  clipPoly(g, wingR, g => {
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.55;
    g.beginPath(); g.moveTo(6, 7); g.lineTo(-8, 18); g.stroke();
    bolt(g, -4, 14, 1.0); bolt(g, 2, 9, 1.0);
  });
  clipPoly(g, fus, g => {
    g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 0.55;
    g.beginPath(); g.moveTo(18, -3); g.lineTo(-10, -3); g.stroke();
    g.beginPath(); g.moveTo(18, 3); g.lineTo(-10, 3); g.stroke();
  });
  // painted cool-blue inset (not a neon outline)
  g.beginPath(); g.moveTo(22, 0); g.lineTo(8, -2.2); g.lineTo(-8, -2); g.lineTo(-8, 2); g.lineTo(8, 2.2); g.closePath();
  g.fillStyle = 'rgba(40,70,100,0.45)'; g.fill();
  canopy(g, 12, 0, 5.5, 3.2, '80,180,220');
  // wing-root engine pods
  metalBox(g, -22, -16, 12, 7, 1.6, ['#c0c8d2', '#4a5460', '#1a1e24']);
  metalBox(g, -22, 9, 12, 7, 1.6, ['#c0c8d2', '#4a5460', '#1a1e24']);
  engineNozzle(g, -22.2, -12.5, 2.6, 2.2, '80,190,230');
  engineNozzle(g, -22.2, 12.5, 2.6, 2.2, '80,190,230');
}

function drawArmoredBody(g) {
  const hull = [[26, 0], [14, -10], [0, -18], [-16, -16], [-28, -11], [-32, -5], [-32, 5], [-28, 11], [-16, 16], [0, 18], [14, 10]];
  const plow = [[26, 0], [14, -10], [8, -7], [8, 7], [14, 10]];
  const skirtL = [[6, -10], [-6, -22], [-18, -20], [-14, -12]];
  const skirtR = [[6, 10], [-6, 22], [-18, 20], [-14, 12]];
  dropShadow(g, hull, -1.5, 4, 0.42);
  dropShadow(g, skirtL, -1, 3, 0.3);
  dropShadow(g, skirtR, -1, 3, 0.3);
  const bronze = [[0, '#e0d0a8'], [0.35, '#7a6844'], [1, '#2a2218']];
  metalPoly(g, skirtL, 0, -22, 0, -8, bronze);
  metalPoly(g, skirtR, 0, 8, 0, 22, bronze);
  metalPoly(g, hull, 0, -18, 0, 18, [[0, '#ddd3b8'], [0.4, '#6a5a3c'], [1, '#241c14']]);
  metalPoly(g, plow, 20, -10, 20, 10, [[0, '#c8b890'], [0.5, '#5a4a30'], [1, '#1c1810']]);
  clipPoly(g, hull, g => {
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.65;
    for (const x of [8, -2, -14]) { g.beginPath(); g.moveTo(x, -14); g.lineTo(x, 14); g.stroke(); }
    g.beginPath(); g.moveTo(16, -6); g.lineTo(-22, -8); g.stroke();
    g.beginPath(); g.moveTo(16, 6); g.lineTo(-22, 8); g.stroke();
    for (const [x, y] of [[10, -8], [10, 8], [-6, -12], [-6, 12], [-18, -8], [-18, 8]]) bolt(g, x, y, 1.15);
  });
  for (const [x, y] of [[-8, -18], [-8, 18], [-16, -16], [-16, 16]]) bolt(g, x, y, 1.2);
  // dorsal turret
  g.beginPath(); g.arc(-2, 0, 6.5, 0, Math.PI * 2);
  const dg = g.createRadialGradient(-3, -3, 1, -2, 0, 6.5);
  dg.addColorStop(0, '#c8c0a8'); dg.addColorStop(0.55, '#5a5040'); dg.addColorStop(1, '#1c1810');
  g.fillStyle = dg; g.fill();
  g.strokeStyle = '#0c0e12'; g.lineWidth = 0.8; g.stroke();
  metalBox(g, -1, -3, 10, 6, 1.2, ['#c0b898', '#5a5040', '#241c14']);
  // heavy engine housings
  metalBox(g, -36, -14, 14, 11, 2, ['#c8c0a8', '#5a5040', '#1c1810']);
  metalBox(g, -36, 3, 14, 11, 2, ['#c8c0a8', '#5a5040', '#1c1810']);
  engineNozzle(g, -35, -8.5, 3.4, 3.0, '255,150,60');
  engineNozzle(g, -35, 8.5, 3.4, 3.0, '255,150,60');
}

function navyRidge(g, pts, span) {
  metalPoly(g, pts, 0, -span, 0, span, [
    [0, '#0c1420'], [0.16, '#1c2c48'], [0.36, '#4a5c78'],
    [0.5, '#d4dce8'], [0.64, '#4a5c78'], [0.84, '#1c2c48'], [1, '#0c1420'],
  ]);
}
function navyArmor(g, pts, span) {
  metalPoly(g, pts, 0, -span, 0, span, [
    [0, '#080e18'], [0.28, '#162238'], [0.5, '#3a4c68'],
    [0.72, '#162238'], [1, '#080e18'],
  ]);
}
function silverBand(g, pts, span) {
  metalPoly(g, pts, 0, -span, 0, span, [
    [0, '#3a4658'], [0.5, '#eef2f8'], [1, '#3a4658'],
  ]);
}
function edisarTurret(g, x, y) {
  const r = 6.2;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  const tg = g.createRadialGradient(x, y - 2, 1, x, y, r);
  tg.addColorStop(0, '#d8dee8'); tg.addColorStop(0.5, '#4a5668'); tg.addColorStop(1, '#141820');
  g.fillStyle = tg; g.fill();
  g.strokeStyle = '#0a0c10'; g.lineWidth = 0.7; g.stroke();
  g.beginPath(); g.arc(x, y, r - 2.1, 0, Math.PI * 2);
  g.strokeStyle = '#9aa8bc'; g.lineWidth = 1; g.stroke();
  // barrel points along the travel axis (forward)
  const bw = 8.5, bh = 3.2;
  const bx = x + 1, by = y - bh / 2;
  SD.roundRect(g, bx, by, bw, bh, 1);
  const bg = g.createLinearGradient(bx, by, bx, by + bh);
  bg.addColorStop(0, '#e4eaf2'); bg.addColorStop(0.5, '#5a6678'); bg.addColorStop(1, '#161a22');
  g.fillStyle = bg; g.fill();
  g.strokeStyle = '#0a0c10'; g.lineWidth = 0.55; g.stroke();
}
function edisarEngines(g, x, ys, rx, ry, glow) {
  for (const y of ys) {
    // housing, centered on y, opening to the rear
    const hw = 16, hh = Math.max(10, ry * 2 + 5);
    SD.roundRect(g, x - 2, y - hh / 2, hw, hh, 2.4);
    const hg = g.createLinearGradient(x - 2, y - hh / 2, x - 2, y + hh / 2);
    hg.addColorStop(0, '#1a2434'); hg.addColorStop(0.5, '#c0c8d4'); hg.addColorStop(1, '#1a2434');
    g.fillStyle = hg; g.fill();
    g.strokeStyle = '#0a0c10'; g.lineWidth = 0.7; g.stroke();
    engineNozzle(g, x - 2, y, rx, ry, glow);
  }
}
function edisarEmblem(g, x, y, r) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = '#10141c'; g.fill();
  g.strokeStyle = '#c8d0dc'; g.lineWidth = 1.3; g.stroke();
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? r * 0.38 : r * 0.78);
    g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  const sg = g.createLinearGradient(x, y - r, x, y + r);
  sg.addColorStop(0, '#f0f4fa'); sg.addColorStop(0.5, '#9aa8bc'); sg.addColorStop(1, '#3a4658');
  g.fillStyle = sg; g.fill();
}
function edisarPlates(g, hull, xs, yEdge) {
  clipPoly(g, hull, g => {
    g.strokeStyle = 'rgba(8,12,20,0.45)'; g.lineWidth = 0.7;
    for (const x of xs) {
      g.beginPath(); g.moveTo(x, -yEdge); g.lineTo(x, yEdge); g.stroke();
    }
    g.strokeStyle = 'rgba(230,238,250,0.16)'; g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(xs[0] - 4, 0); g.lineTo(xs[xs.length - 1] + 6, 0); g.stroke();
    for (const s of [-1, 1]) {
      for (const x of xs) bolt(g, x, s * Math.max(6, yEdge * 0.45), 1.05);
    }
  });
}

/* Edisar navy/silver capital ships. Nose to +X, mirrored across the travel axis, pivot at the origin. */
function drawEdisarShip(g, kind) {
  const glow = '140,190,255';
  kind = kind || 'flagship';

  const hulls = {
    cruiser: {
      body: [[92, 0], [48, 11], [8, 15], [-36, 14], [-72, 9], [-72, -9], [-36, -14], [8, -15], [48, -11]],
      wing: [[8, 14], [-8, 28], [-40, 30], [-58, 22], [-46, 13], [8, 13]],
      inner: [[70, 0], [36, 6], [-20, 7], [-56, 4], [-56, -4], [-20, -7], [36, -6]],
      stripe: [[80, 0], [40, 2.1], [-50, 2.1], [-50, -2.1], [40, -2.1]],
      span: 16, wingSpan: 30, plates: [-50, -24, 0, 24, 48], plateY: 14,
      turrets: [[28, 16], [-16, 18]],
      engines: { x: -78, ys: [-11, 11], rx: 3.4, ry: 2.8 },
      canopy: [22, 0, 11, 5.5], emblem: [-8, 0, 6.2],
    },
    dreadnought: {
      body: [[88, 0], [52, 16], [16, 22], [-20, 24], [-56, 20], [-80, 12], [-80, -12], [-56, -20], [-20, -24], [16, -22], [52, -16]],
      wing: [[10, 20], [-4, 38], [-36, 46], [-68, 40], [-74, 26], [-50, 18], [10, 18]],
      inner: [[64, 0], [28, 9], [-16, 11], [-52, 8], [-64, 5], [-64, -5], [-52, -8], [-16, -11], [28, -9]],
      stripe: [[74, 0], [36, 2.2], [-48, 2.2], [-48, -2.2], [36, -2.2]],
      span: 24, wingSpan: 46, plates: [-56, -28, 0, 28, 50], plateY: 20,
      turrets: [[36, 20], [4, 26], [-32, 24]],
      engines: { x: -86, ys: [-26, -10, 10, 26], rx: 3.6, ry: 2.8 },
      canopy: [18, 0, 12, 6.2], emblem: [-6, 0, 6.6],
    },
    flagship: {
      body: [[100, 0], [58, 13], [16, 18], [-24, 17], [-62, 13], [-86, 8], [-86, -8], [-62, -13], [-24, -17], [16, -18], [58, -13]],
      wing: [[14, 16], [-6, 36], [-40, 44], [-72, 36], [-70, 18], [-48, 15], [14, 15]],
      inner: [[76, 0], [40, 7], [-8, 8], [-48, 6], [-68, 4], [-68, -4], [-48, -6], [-8, -8], [40, -7]],
      stripe: [[90, 0], [48, 2.3], [-58, 2.3], [-58, -2.3], [48, -2.3]],
      span: 18, wingSpan: 44, plates: [-60, -28, 4, 36, 64], plateY: 16,
      turrets: [[36, 18], [-8, 22], [-40, 26]],
      engines: { x: -92, ys: [-22, -8, 8, 22], rx: 3.8, ry: 3.0 },
      canopy: [24, 0, 13, 6.2], emblem: [0, 0, 7],
    },
    frigate: {
      body: [[110, 0], [70, 8], [24, 13], [-20, 13], [-58, 10], [-84, 6], [-84, -6], [-58, -10], [-20, -13], [24, -13], [70, -8]],
      wing: [[6, 12], [-16, 26], [-50, 28], [-68, 18], [-52, 11], [6, 11]],
      inner: [[86, 0], [44, 5], [-8, 6], [-52, 4], [-70, 3], [-70, -3], [-52, -4], [-8, -6], [44, -5]],
      stripe: [[104, 0], [60, 1.8], [-62, 1.8], [-62, -1.8], [60, -1.8]],
      span: 13, wingSpan: 28, plates: [-52, -20, 12, 48, 78], plateY: 12,
      turrets: [[32, 14], [-24, 16]],
      engines: { x: -90, ys: [-10, 10], rx: 3.5, ry: 2.6 },
      canopy: [28, 0, 11, 5], emblem: [-4, 0, 5.8],
    },
    vanguard: {
      // mid hull; twin spears added below
      body: [[12, 16], [-16, 18], [-52, 16], [-82, 9], [-82, -9], [-52, -16], [-16, -18], [12, -16]],
      wing: [[-8, 16], [-24, 32], [-58, 34], [-74, 22], [-60, 14], [-8, 14]],
      inner: [[4, 0], [-20, 8], [-56, 6], [-70, 3.5], [-70, -3.5], [-56, -6], [-20, -8]],
      stripe: [[8, 0], [-20, 2], [-64, 2], [-64, -2], [-20, -2]],
      span: 18, wingSpan: 34, plates: [-60, -28, -4], plateY: 16,
      turrets: [[-8, 20], [-40, 24]],
      engines: { x: -88, ys: [-20, -8, 8, 20], rx: 3.5, ry: 2.7 },
      canopy: [-8, 0, 11, 6], emblem: [-28, 0, 6.2],
      spears: true,
    },
    eclipse: {
      body: [[96, 0], [50, 16], [10, 24], [-28, 26], [-64, 22], [-90, 12], [-90, -12], [-64, -22], [-28, -26], [10, -24], [50, -16]],
      wing: [[16, 22], [-8, 46], [-44, 54], [-80, 46], [-86, 24], [-58, 20], [16, 20]],
      inner: [[70, 0], [30, 9], [-12, 12], [-48, 10], [-72, 6], [-72, -6], [-48, -10], [-12, -12], [30, -9]],
      stripe: [[82, 0], [40, 2.2], [-56, 2.2], [-56, -2.2], [40, -2.2]],
      span: 26, wingSpan: 54, plates: [-64, -28, 4, 36, 60], plateY: 22,
      turrets: [[36, 22], [4, 30], [-32, 28], [-60, 26]],
      engines: { x: -96, ys: [-32, -16, 0, 16, 32], rx: 3.8, ry: 2.9 },
      canopy: [18, 0, 13, 6.5], emblem: [-4, 0, 7.2],
      dark: true,
    },
  };
  const H = hulls[kind] || hulls.flagship;

  const flipY = (pts) => pts.map(([x, y]) => [x, -y]);
  const wingL = H.wing, wingR = flipY(H.wing);

  // soft centered contact shadow (no directional offset, so rotation stays clean)
  g.save();
  g.scale(1, 0.62);
  const sh = g.createRadialGradient(0, 0, 8, 0, 0, 78);
  sh.addColorStop(0, 'rgba(0,0,0,0.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 78, 0, Math.PI * 2); g.fill();
  g.restore();

  const armor = H.dark ? navyArmor : navyRidge;
  armor(g, wingL, H.wingSpan);
  armor(g, wingR, H.wingSpan);
  armor(g, H.body, H.span + 4);
  if (H.spears) {
    const spear = (s) => [
      [14, s * 8], [14, s * 18], [52, s * 20], [88, s * 16], [108, s * 12], [110, s * 8],
      [88, s * 9], [52, s * 11], [14, s * 9],
    ];
    navyRidge(g, spear(1), 20);
    navyRidge(g, spear(-1), 20);
    silverBand(g, [[110, 8], [80, 10], [30, 10], [30, 8], [80, 8]], 10);
    silverBand(g, [[110, -8], [80, -10], [30, -10], [30, -8], [80, -8]], 10);
  }
  if (H.inner) silverBand(g, H.inner, Math.max(6, H.span * 0.55));
  edisarPlates(g, H.body, H.plates, H.plateY);
  if (H.stripe) silverBand(g, H.stripe, 2.6);

  // canopy / command dome on the spine (centered, not a one-sided tower)
  const [cx, cy, crx, cry] = H.canopy;
  g.beginPath(); g.ellipse(cx, cy, crx, cry, 0, 0, Math.PI * 2);
  const cg = g.createLinearGradient(cx, cy - cry, cx, cy + cry);
  cg.addColorStop(0, '#1a2838'); cg.addColorStop(0.45, '#0a121c'); cg.addColorStop(1, '#1a2838');
  g.fillStyle = cg; g.fill();
  g.strokeStyle = '#9aa8bc'; g.lineWidth = 1.1; g.stroke();
  g.beginPath(); g.ellipse(cx + crx * 0.15, cy, crx * 0.55, cry * 0.45, 0, 0, Math.PI * 2);
  g.fillStyle = 'rgba(160,200,240,0.16)'; g.fill();
  coreGlow(g, cx, cy, Math.min(crx, cry) * 0.7, glow);

  if (H.emblem) edisarEmblem(g, H.emblem[0], H.emblem[1], H.emblem[2]);

  for (const [tx, ty] of H.turrets) {
    edisarTurret(g, tx, ty);
    edisarTurret(g, tx, -ty);
  }
  const E = H.engines;
  edisarEngines(g, E.x, E.ys, E.rx, E.ry, glow);
}



function shipCanvas(size, draw) {
  const c = SD.mkCanvas(size * SS, size * SS), g = c.getContext('2d');
  g.scale(SS, SS); g.translate(size / 2, size / 2); g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g, size);
  return { c, size };
}


function drawShieldedBody(g) {
  const fus = [[28, 0], [14, -6], [0, -7], [-16, -5], [-24, -3], [-24, 3], [-16, 5], [0, 7], [14, 6]];
  dropShadow(g, fus, -1, 3, 0.36);
  metalPoly(g, fus, 0, -8, 0, 8, [[0, '#d8e8f4'], [0.4, '#4a6880'], [1, '#182028']]);
  clipPoly(g, fus, g => {
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.55;
    g.beginPath(); g.moveTo(16, -3); g.lineTo(-10, -3); g.stroke();
    g.beginPath(); g.moveTo(16, 3); g.lineTo(-10, 3); g.stroke();
  });
  // shield generator dish
  g.beginPath(); g.ellipse(6, 0, 7, 5, 0, 0, Math.PI * 2);
  const sg = g.createRadialGradient(4, -1, 0, 6, 0, 7);
  sg.addColorStop(0, '#e8f8ff'); sg.addColorStop(1, '#1a4860');
  g.fillStyle = sg; g.fill();
  coreGlow(g, 6, 0, 5, '80,200,255');
  canopy(g, 16, 0, 4.2, 2.6, '80,200,255');
  metalBox(g, -22, -6, 10, 12, 1.6, ['#c0d0dc', '#4a5c68', '#1a2026']);
  engineNozzle(g, -23, -4, 2.2, 2.0, '80,200,255');
  engineNozzle(g, -23, 4, 2.2, 2.0, '80,200,255');
}

function drawInterceptorBody(g) {
  // Needle-thin dart: long nose, forward-swept blades, one fat afterburner.
  const hull = [[34, 0], [18, -3.2], [4, -3.6], [-12, -2.8], [-22, -2.2], [-22, 2.2], [-12, 2.8], [4, 3.6], [18, 3.2]];
  const finL = [[10, -3], [-2, -16], [-12, -15], [-6, -3]];
  const finR = [[10, 3], [-2, 16], [-12, 15], [-6, 3]];
  dropShadow(g, hull, -1, 3, 0.32);
  dropShadow(g, finL, -1, 2, 0.25);
  dropShadow(g, finR, -1, 2, 0.25);
  const ember = [[0, '#f0d8a8'], [0.4, '#8a5a28'], [1, '#24180c']];
  metalPoly(g, finL, 0, -16, 0, -2, ember);
  metalPoly(g, finR, 0, 2, 0, 16, ember);
  metalPoly(g, hull, 0, -5, 0, 5, [[0, '#f2e6c8'], [0.35, '#7a6a4a'], [1, '#1c1810']]);
  clipPoly(g, hull, g => {
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(22, -1.4); g.lineTo(-14, -1.4); g.stroke();
    g.beginPath(); g.moveTo(22, 1.4); g.lineTo(-14, 1.4); g.stroke();
  });
  // hot livery slash
  const slash = [[26, 0], [8, -1.2], [-10, -0.9], [-10, 0.9], [8, 1.2]];
  metalPoly(g, slash, 0, -1.5, 0, 1.5, [[0, '#ffb070'], [0.5, '#c05020'], [1, '#4a1808']]);
  canopy(g, 14, 0, 3.6, 2.0, '255,160,70');
  // tail engine block + afterburner
  metalBox(g, -26, -5, 10, 10, 1.6, ['#d0c4a8', '#5a4c34', '#1a1610']);
  engineNozzle(g, -26, 0, 3.4, 2.8, '255,140,50');
  coreGlow(g, -26, 0, 4.2, '255,160,60');
}

function drawJuggernautBody(g) {
  // Squat iron brick: layered slabs, battering prow, furnace core. Bigger and slower-looking than Armored.
  const hull = [[30, 0], [18, -14], [2, -20], [-16, -18], [-30, -12], [-36, -6], [-36, 6], [-30, 12], [-16, 18], [2, 20], [18, 14]];
  const prow = [[30, 0], [18, -14], [10, -8], [10, 8], [18, 14]];
  const slabL = [[8, -12], [-4, -26], [-22, -24], [-16, -14]];
  const slabR = [[8, 12], [-4, 26], [-22, 24], [-16, 14]];
  dropShadow(g, hull, -2, 5, 0.45);
  dropShadow(g, slabL, -1, 3, 0.3);
  dropShadow(g, slabR, -1, 3, 0.3);
  const iron = [[0, '#c8c2b8'], [0.4, '#4a4e48'], [1, '#161812']];
  metalPoly(g, slabL, 0, -26, 0, -10, iron);
  metalPoly(g, slabR, 0, 10, 0, 26, iron);
  metalPoly(g, hull, 0, -20, 0, 20, [[0, '#d0cec6'], [0.4, '#3e4440'], [1, '#141614']]);
  metalPoly(g, prow, 18, -14, 18, 14, [[0, '#9aa090'], [0.5, '#3a3e38'], [1, '#10120e']]);
  clipPoly(g, hull, g => {
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.7;
    for (const x of [8, -4, -16]) { g.beginPath(); g.moveTo(x, -16); g.lineTo(x, 16); g.stroke(); }
    g.beginPath(); g.moveTo(16, -7); g.lineTo(-24, -8); g.stroke();
    g.beginPath(); g.moveTo(16, 7); g.lineTo(-24, 8); g.stroke();
    for (const [bx, by] of [[10, -10], [10, 10], [-8, -12], [-8, 12], [-20, -8], [-20, 8]]) bolt(g, bx, by, 1.15);
  });
  // furnace viewport
  g.beginPath(); g.ellipse(2, 0, 6.5, 4.2, 0, 0, Math.PI * 2);
  const fg = g.createRadialGradient(1, -1, 0, 2, 0, 6.5);
  fg.addColorStop(0, '#ffe0a0'); fg.addColorStop(1, '#4a2008');
  g.fillStyle = fg; g.fill();
  coreGlow(g, 2, 0, 5, '255,140,40');
  // heavy rear stacks
  metalBox(g, -34, -11, 12, 8, 1.4, ['#b0b4ac', '#3a3e38', '#121410']);
  metalBox(g, -34, 3, 12, 8, 1.4, ['#b0b4ac', '#3a3e38', '#121410']);
  engineNozzle(g, -34, -7, 2.8, 2.4, '255,120,40');
  engineNozzle(g, -34, 7, 2.8, 2.4, '255,120,40');
}

function drawCryoBody(g) {
  const hull = [[28, 0], [14, -5], [2, -6.5], [-14, -5], [-24, -8], [-28, -3], [-28, 3], [-24, 8], [-14, 5], [2, 6.5], [14, 5]];
  dropShadow(g, hull, -1, 3, 0.36);
  metalPoly(g, hull, 0, -8, 0, 8, [[0, '#e8f4f8'], [0.4, '#6a8a96'], [1, '#1a2830']]);
  clipPoly(g, hull, g => {
    g.strokeStyle = 'rgba(180,230,245,0.25)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(18, -2.5); g.lineTo(-16, -2.5); g.stroke();
    g.beginPath(); g.moveTo(18, 2.5); g.lineTo(-16, 2.5); g.stroke();
  });
  // frost vents
  for (const sy of [-1, 1]) {
    metalBox(g, -8, sy * 7 - 3, 14, 6, 1.4, ['#c8e0e8', '#4a6870', '#182428']);
    g.fillStyle = '#7ec8d8'; g.fillRect(-4, sy * 7 - 1.2, 8, 2.4);
  }
  canopy(g, 12, 0, 5, 3, '140,230,255');
  engineNozzle(g, -27, -4.4, 2.4, 2.0, '160,240,255');
  engineNozzle(g, -27, 4.4, 2.4, 2.0, '160,240,255');
  coreGlow(g, -18, 0, 3.5, '180,245,255');
}

SD.Sprites = {
  /* Modern metallic enemy ships, nose to the right. Glow is engine/canopy accent only. */
  scout() {
    return partCanvas(64, g => drawScoutBody(g));
  },
  fighter() {
    return partCanvas(80, g => drawFighterBody(g));
  },
  armored() {
    return partCanvas(100, g => drawArmoredBody(g));
  },
  flagship()  { return partCanvas(240, g => drawEdisarShip(g, 'flagship')); },
  flagship1() { return partCanvas(240, g => drawEdisarShip(g, 'cruiser')); },
  flagship2() { return partCanvas(240, g => drawEdisarShip(g, 'dreadnought')); },
  flagship4() { return partCanvas(240, g => drawEdisarShip(g, 'frigate')); },
  flagship5() { return partCanvas(240, g => drawEdisarShip(g, 'vanguard')); },
  flagship6() { return partCanvas(240, g => drawEdisarShip(g, 'eclipse')); },
  shielded() {
    return partCanvas(90, g => drawShieldedBody(g));
  },
  cryo() {
    return partCanvas(90, g => drawCryoBody(g));
  },
  interceptor() {
    return partCanvas(80, g => drawInterceptorBody(g));
  },
  juggernaut() {
    return partCanvas(124, g => drawJuggernautBody(g));
  },
  /* Modern metallic sci-fi turrets. Base is static; head/barrel rotates. Glow is accent-only. */
  turretBase(kind, level = 1) {
    const size = 84;
    return partCanvas(size, g => {
      // contact shadow
      g.save();
      g.scale(1, 0.45);
      const sh = g.createRadialGradient(0, 18, 2, 0, 18, 22);
      sh.addColorStop(0, 'rgba(0,0,0,0.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sh; g.beginPath(); g.arc(0, 18, 22, 0, Math.PI * 2); g.fill();
      g.restore();

      const R = level >= 3 ? 20 : level >= 2 ? 18 : 16.5;
      // beveled disk
      const steel = kind === 'ice' ? ['#8aa0b0', '#4a5c6a', '#1c242c']
                  : kind === 'missile' ? ['#8a8478', '#4a463e', '#1c1a16']
                  : kind === 'railgun' ? ['#a09a80', '#545040', '#1e1c14']
                  : kind === 'tesla' ? ['#8a8498', '#4a4458', '#1a1824']
                  : kind === 'pulse' ? ['#7a988c', '#3e5448', '#16201a']
                  : kind === 'nebula' ? ['#6a646c', '#2e282c', '#121014']
                  : ['#8a93a2', '#4a5260', '#1a1e26'];
      const rad = g.createRadialGradient(-5, -6, 2, 0, 0, R + 1);
      rad.addColorStop(0, steel[0]); rad.addColorStop(0.45, steel[1]); rad.addColorStop(1, steel[2]);
      g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fillStyle = rad; g.fill();
      g.strokeStyle = '#0e1014'; g.lineWidth = 1.2; g.stroke();
      // inner bevel ring
      g.beginPath(); g.arc(0, 0, R - 2.2, 0, Math.PI * 2);
      g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1.1; g.stroke();
      g.beginPath(); g.arc(0, 1.2, R - 2.4, 0.15, Math.PI - 0.15);
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.1; g.stroke();

      // armored collar / panel ring
      g.beginPath(); g.arc(0, 0, R - 4.5, 0, Math.PI * 2);
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.7; g.stroke();

      // kind accent as a painted inset ring (flat, not neon)
      const accent = kind === 'laser' ? '#2a4a72' : kind === 'missile' ? '#6a3a18' : kind === 'ice' ? '#2a5a62' : kind === 'railgun' ? '#6a5a18' : kind === 'tesla' ? '#4a3a72' : kind === 'pulse' ? '#1a5a44' : kind === 'nebula' ? '#a00c1e' : '#2a4a72';
      g.beginPath(); g.arc(0, 0, R - 5.4, 0, Math.PI * 2);
      g.strokeStyle = accent; g.lineWidth = 1.6; g.stroke();

      // panel cuts
      g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 0.6;
      const cuts = kind === 'missile' ? 8 : 6;
      for (let i = 0; i < cuts; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / cuts;
        g.beginPath();
        g.moveTo(Math.cos(a) * (R - 7.5), Math.sin(a) * (R - 7.5));
        g.lineTo(Math.cos(a) * (R - 3.2), Math.sin(a) * (R - 3.2));
        g.stroke();
      }

      // bolts
      const bolts = kind === 'missile' ? 8 : 6;
      const br = R - 3.1;
      for (let i = 0; i < bolts; i++) {
        const a = -Math.PI / 2 + (i + 0.5) * Math.PI * 2 / bolts;
        bolt(g, Math.cos(a) * br, Math.sin(a) * br, 1.25);
      }

      if (level >= 2) {
        // extra armor blocks + brass rank ring
        const block = kind === 'ice' ? 3 : 4;
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + i * Math.PI / 2;
          const bx = Math.cos(a) * (R - 1), by = Math.sin(a) * (R - 1);
          g.save(); g.translate(bx, by); g.rotate(a);
          metalBox(g, -5, -2.4, 10, 4.8, 1.1, ['#9aa3b0', '#555e6c', '#242830']);
          g.restore();
        }
        g.beginPath(); g.arc(0, 0, R - 0.2, 0, Math.PI * 2);
        g.strokeStyle = '#8a7340'; g.lineWidth = 1.4; g.stroke();
        g.beginPath(); g.arc(0, 0, R + 0.6, 0, Math.PI * 2);
        g.strokeStyle = '#c4a15a'; g.lineWidth = 0.7; g.stroke();
      }
      if (level >= 3) {
        g.beginPath(); g.arc(0, 0, R + 1.2, 0, Math.PI * 2);
        g.strokeStyle = '#d8e0ea'; g.lineWidth = 1.6; g.stroke();
        g.beginPath(); g.arc(0, 0, R + 2.2, 0, Math.PI * 2);
        g.strokeStyle = '#8aa0b8'; g.lineWidth = 0.7; g.stroke();
        g.fillStyle = '#d0d8e4';
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + (i - 1) * 0.28;
          g.beginPath();
          g.moveTo(Math.cos(a) * (R + 3), Math.sin(a) * (R + 3));
          g.lineTo(Math.cos(a) * (R + 6.5), Math.sin(a) * (R + 6.5));
          g.lineTo(Math.cos(a + 0.12) * (R + 3.5), Math.sin(a + 0.12) * (R + 3.5));
          g.closePath(); g.fill();
        }
      }

      // center well (pivot)
      const well = g.createRadialGradient(-1, -1, 0, 0, 0, 6.5);
      well.addColorStop(0, '#2a3038'); well.addColorStop(1, '#0a0c10');
      g.beginPath(); g.arc(0, 0, 6.5, 0, Math.PI * 2); g.fillStyle = well; g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 0.8; g.stroke();
      // tiny status lamp (accent glow)
      const lamp = kind === 'laser' ? '#5aa8e8' : kind === 'missile' ? '#e09040' : kind === 'ice' ? '#8ad4e8' : kind === 'railgun' ? '#e0c050' : kind === 'tesla' ? '#b090f0' : kind === 'pulse' ? '#50e0a8' : kind === 'nebula' ? '#ff6060' : '#5aa8e8';
      g.beginPath(); g.arc(0, 0, 1.6, 0, Math.PI * 2);
      g.fillStyle = lamp; g.fill();
      g.fillStyle = 'rgba(255,255,255,0.65)'; g.beginPath(); g.arc(-0.4, -0.4, 0.5, 0, Math.PI * 2); g.fill();
    });
  },

  turretHead(kind, level = 1) {
    const size = 84;
    return partCanvas(size, g => {
      if (kind === 'laser') drawLaserHead(g, level);
      else if (kind === 'missile') drawMissileHead(g, level);
      else if (kind === 'ice') drawIceHead(g, level);
      else if (kind === 'railgun') drawRailgunHead(g, level);
      else if (kind === 'tesla') drawTeslaHead(g, level);
      else if (kind === 'nebula') drawNebulaHead(g, level);
      else drawPulseHead(g, level);
    });
  },

  turretFlash(kind) {
    const size = 64;
    return partCanvas(size, g => {
      g.globalCompositeOperation = 'lighter';
      if (kind === 'laser') {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 16);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)');
        gr.addColorStop(0.25, 'rgba(160,220,255,0.7)');
        gr.addColorStop(1, 'rgba(80,160,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 16, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(220,245,255,0.95)';
        g.beginPath(); g.moveTo(-2.2, 6); g.lineTo(0, -16); g.lineTo(2.2, 6); g.closePath(); g.fill();
      } else if (kind === 'missile') {
        const gr = g.createRadialGradient(0, 2, 0, 0, 2, 16);
        gr.addColorStop(0, 'rgba(255,255,230,0.95)');
        gr.addColorStop(0.3, 'rgba(255,170,60,0.7)');
        gr.addColorStop(1, 'rgba(255,80,20,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 2, 16, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,240,200,0.9)';
        g.beginPath(); g.moveTo(-3.5, 8); g.lineTo(0, -14); g.lineTo(3.5, 8); g.closePath(); g.fill();
      } else if (kind === 'railgun') {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 18);
        gr.addColorStop(0, 'rgba(255,255,230,0.95)');
        gr.addColorStop(0.3, 'rgba(255,210,80,0.7)');
        gr.addColorStop(1, 'rgba(255,160,40,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,250,220,0.95)';
        g.fillRect(-1.4, -20, 2.8, 24);
      } else if (kind === 'tesla') {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 18);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)');
        gr.addColorStop(0.3, 'rgba(180,150,255,0.7)');
        gr.addColorStop(1, 'rgba(120,80,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill();
      } else if (kind === 'pulse') {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 20);
        gr.addColorStop(0, 'rgba(230,255,240,0.9)');
        gr.addColorStop(0.35, 'rgba(80,255,180,0.5)');
        gr.addColorStop(1, 'rgba(40,180,120,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 20, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(160,255,210,0.7)'; g.lineWidth = 2;
        g.beginPath(); g.arc(0, 0, 10, 0, Math.PI * 2); g.stroke();
      } else if (kind === 'nebula') {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 22);
        gr.addColorStop(0, 'rgba(255,240,240,0.95)');
        gr.addColorStop(0.25, 'rgba(255,80,80,0.75)');
        gr.addColorStop(1, 'rgba(90,0,20,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,230,230,0.95)';
        g.fillRect(-1.6, -22, 3.2, 28);
      } else {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 18);
        gr.addColorStop(0, 'rgba(255,255,255,0.9)');
        gr.addColorStop(0.3, 'rgba(180,240,255,0.55)');
        gr.addColorStop(1, 'rgba(120,200,230,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(200,245,255,0.55)'; g.lineWidth = 1.4;
        g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.stroke();
      }
    });
  },

  station() {
    const size = 90, c = SD.mkCanvas(size * SS, size * SS), g = c.getContext('2d');
    g.scale(SS, SS); g.translate(size / 2, size / 2); g.lineJoin = 'round'; g.lineCap = 'round';
    // soft earth
    const eg = g.createRadialGradient(-6, -6, 4, 0, 0, 26);
    eg.addColorStop(0, '#4aa0ff'); eg.addColorStop(0.45, '#1e6ad0'); eg.addColorStop(1, '#0a2048');
    g.beginPath(); g.arc(0, 0, 24, 0, Math.PI * 2); g.fillStyle = eg; g.fill();
    g.shadowColor = 'rgba(80,170,255,1)'; g.shadowBlur = 14 * SS;
    g.strokeStyle = 'rgba(80,200,255,1)'; g.lineWidth = 2; g.stroke(); g.shadowBlur = 0;
    // continents (simple)
    g.fillStyle = 'rgba(80,200,120,0.7)';
    g.beginPath(); g.ellipse(-6, -4, 8, 5, -0.4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(6, 6, 7, 4, 0.5, 0, Math.PI * 2); g.fill();
    // ring
    g.save(); g.scale(1, 0.35); g.beginPath(); g.arc(0, 18, 30, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(255,205,90,0.95)'; g.lineWidth = 2.4; g.shadowColor = 'rgba(255,205,90,1)'; g.shadowBlur = 8 * SS; g.stroke(); g.restore();
    // shield halo
    g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(120,240,255,0.45)'; g.lineWidth = 1.2; g.stroke();
    return { c, size };
  },
  gate() {
    const size = 80, c = SD.mkCanvas(size * SS, size * SS), g = c.getContext('2d');
    g.scale(SS, SS); g.translate(size / 2, size / 2);
    g.shadowColor = 'rgba(255,80,220,1)'; g.shadowBlur = 16 * SS;
    g.strokeStyle = 'rgba(255,80,220,1)'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, 0, 10, 26, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(180,120,255,0.9)'; g.lineWidth = 1.6; g.shadowBlur = 8 * SS;
    g.beginPath(); g.ellipse(0, 0, 5, 18, 0, 0, Math.PI * 2); g.stroke();
    g.shadowBlur = 0;
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 20);
    gr.addColorStop(0, 'rgba(255,180,255,0.55)'); gr.addColorStop(1, 'rgba(255,80,220,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2); g.fill();
    return { c, size };
  },
};

let scan = null;
SD.drawScanlines = (g, a = 0.10) => {
  if (!scan) { scan = SD.mkCanvas(W, H); const s = scan.getContext('2d'); s.fillStyle = '#000'; s.globalAlpha = 0.2; for (let y = 0; y < H; y += 3) s.fillRect(0, y, W, 1); }
  g.save(); g.globalAlpha = a / 0.10 * 0.5; g.drawImage(scan, 0, 0); g.restore();
};

const bgs = {};
function paintAsteroids(b) {
  for (let i = 0; i < 14; i++) {
    const x = 60 + (i * 137) % (W - 80), y = 70 + (i * 89) % (H - 100);
    const r = 10 + (i * 5) % 22;
    const ag = b.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
    ag.addColorStop(0, '#8a7a68'); ag.addColorStop(0.55, '#3a322c'); ag.addColorStop(1, '#121014');
    b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fillStyle = ag; b.fill();
  }
}
SD.Sprites.hero = function (kind) {
  const size = 72;
  return SD.Sprites._hero ? SD.Sprites._hero(kind) : (function (kind) {
    const c = SD.mkCanvas(size, size), g = c.getContext('2d');
    g.translate(size / 2, size / 2);
    const red = kind === 'nebula';
    const steel = ['#c8ccd6', '#3a3e48', '#12141a'];
    const accent = red ? '#d4142a' : '#50a8e8';
    const glow = red ? '255,70,70' : '80,170,255';
    // disc pad
    g.beginPath(); g.ellipse(0, 10, 16, 6, 0, 0, Math.PI * 2);
    g.fillStyle = '#1a1c24'; g.fill(); g.strokeStyle = accent; g.lineWidth = 1.2; g.stroke();
    // body
    g.fillStyle = steel[1];
    g.beginPath(); g.moveTo(-7, 8); g.lineTo(-9, -2); g.lineTo(-4, -10); g.lineTo(4, -10); g.lineTo(9, -2); g.lineTo(7, 8); g.closePath(); g.fill();
    g.strokeStyle = '#0a0c10'; g.lineWidth = 1; g.stroke();
    // visor
    g.fillStyle = accent;
    g.beginPath(); g.ellipse(0, -5, 5, 3.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = red ? 'rgba(255,230,230,0.8)' : 'rgba(220,245,255,0.85)';
    g.beginPath(); g.ellipse(-1, -6, 2, 1.2, 0, 0, Math.PI * 2); g.fill();
    // shoulders
    g.fillStyle = steel[0];
    g.fillRect(-11, -1, 6, 4); g.fillRect(5, -1, 6, 4);
    g.fillStyle = accent;
    g.fillRect(-10, 0, 4, 1.4); g.fillRect(6, 0, 4, 1.4);
    // glow
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, -5, 0, 0, -5, 14);
    gr.addColorStop(0, `rgba(${glow},0.45)`); gr.addColorStop(1, `rgba(${glow},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(0, -5, 14, 0, Math.PI * 2); g.fill();
    return { c, size };
  })(kind);
};

SD.drawSpaceBg = (g, variant = 'orbital') => {
  if (!bgs[variant]) {
    const c = SD.mkCanvas(W, H); const b = c.getContext('2d');
    const gr = b.createLinearGradient(0, 0, 0, H);
    if (variant === 'belt') {
      gr.addColorStop(0, '#100806'); gr.addColorStop(0.55, '#1a100c'); gr.addColorStop(1, '#120c08');
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      SD.glow(b, 200, 180, 320, 240, '200,90,40', 0.16);
      SD.glow(b, 820, 400, 280, 220, '180,80,30', 0.12);
      SD.glow(b, 500, 40, 360, 140, '160,80,40', 0.10);
      paintAsteroids(b);
    } else if (variant === 'moon') {
      gr.addColorStop(0, '#07080e'); gr.addColorStop(0.55, '#0c1018'); gr.addColorStop(1, '#10141c');
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      SD.glow(b, 80, 160, 260, 220, '80,100,140', 0.12);
      SD.glow(b, 900, 420, 280, 220, '60,90,130', 0.12);
      const mg = b.createRadialGradient(860, 90, 10, 860, 90, 80);
      mg.addColorStop(0, '#d8dce4'); mg.addColorStop(0.45, '#8a909c'); mg.addColorStop(1, 'rgba(40,48,60,0)');
      b.fillStyle = mg; b.beginPath(); b.arc(860, 90, 80, 0, Math.PI * 2); b.fill();
    } else if (variant === 'dock') {
      gr.addColorStop(0, '#120806'); gr.addColorStop(0.55, '#1a1008'); gr.addColorStop(1, '#100c08');
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      SD.glow(b, 200, 80, 360, 200, '255,160,40', 0.16);
      SD.glow(b, 860, 420, 300, 200, '220,100,30', 0.12);
      SD.glow(b, 512, 40, 280, 120, '255,200,80', 0.10);
    } else if (variant === 'canyon') {
      gr.addColorStop(0, '#0a1214'); gr.addColorStop(0.55, '#10181c'); gr.addColorStop(1, '#0c1412');
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      SD.glow(b, 160, 200, 280, 220, '40,160,150', 0.12);
      SD.glow(b, 860, 80, 300, 180, '80,140,180', 0.12);
      SD.glow(b, 500, 500, 340, 160, '30,80,70', 0.10);
    } else if (variant === 'void') {
      gr.addColorStop(0, '#050206'); gr.addColorStop(0.55, '#0a0408'); gr.addColorStop(1, '#08020a');
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      SD.glow(b, 200, 120, 300, 240, '160,20,40', 0.14);
      SD.glow(b, 850, 400, 320, 240, '80,0,20', 0.16);
      SD.glow(b, 512, 80, 200, 120, '255,60,60', 0.08);
    } else {
      gr.addColorStop(0, '#05010f'); gr.addColorStop(0.55, '#090218'); gr.addColorStop(1, '#0b0320');
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      SD.glow(b, 80, 200, 280, 260, '200,40,180', 0.14);
      SD.glow(b, 940, 360, 280, 260, '40,90,255', 0.16);
      SD.glow(b, 520, 40, 420, 140, '140,60,255', 0.10);
      SD.glow(b, 980, 400, 160, 120, '80,180,255', 0.10);
    }
    bgs[variant] = c;
  }
  g.drawImage(bgs[variant], 0, 0);
};

SD.blit = (g, spr, x, y, ang = 0, scale = 1) => {
  const s = spr.size * scale;
  g.save(); g.translate(x, y); g.rotate(ang);
  g.drawImage(spr.c, -s / 2, -s / 2, s, s);
  g.restore();
};
})();
