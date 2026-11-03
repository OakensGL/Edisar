/* Shared visuals: starfield, glow helpers, neon text/buttons, sprites, particles, scanlines. */
(() => {
const { W, H } = SL;
SL.mkCanvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const F = () => SL.CONFIG.font;

/* ---------- parallax starfield scrolling DOWN ---------- */
const TINTS = ['255,255,255', '255,255,255', '255,170,235', '160,200,255', '200,180,255'];
SL.Starfield = class {
  constructor(density = 1) {
    this.layers = [
      { n: 110, speed: 22,  size: [0.5, 1.0], alpha: [.25, .55], streak: 0 },
      { n: 70,  speed: 80,  size: [1.0, 1.7], alpha: [.5, .9],   streak: 0 },
      { n: 28,  speed: 300, size: [1.3, 2.3], alpha: [.55, 1],   streak: 1 },
    ];
    this.stars = [];
    this.layers.forEach((L, li) => { for (let i = 0; i < Math.round(L.n * density); i++) this.stars.push({
      li, x: Math.random() * W, y: Math.random() * H, s: L.size[0] + Math.random() * (L.size[1] - L.size[0]),
      a: L.alpha[0] + Math.random() * (L.alpha[1] - L.alpha[0]), c: TINTS[(Math.random() * TINTS.length) | 0],
      v: L.speed * (0.8 + Math.random() * 0.4), tw: Math.random() * 6.28 }); });
  }
  update(dt, mul = 1) {
    for (const s of this.stars) { s.y += s.v * mul * dt; if (s.y > H + 40) { s.y = -40 * Math.random(); s.x = Math.random() * W; } }
  }
  draw(g, t, mul = 1) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      const L = this.layers[s.li], a = s.a * (0.85 + 0.15 * Math.sin(t * 3 + s.tw));
      if (L.streak) {
        const len = s.v * 0.15 * mul;
        const gr = g.createLinearGradient(s.x, s.y - len, s.x, s.y);
        gr.addColorStop(0, `rgba(${s.c},0)`); gr.addColorStop(1, `rgba(${s.c},${a * .8})`);
        g.strokeStyle = gr; g.lineWidth = s.s * 0.8; g.beginPath(); g.moveTo(s.x, s.y - len); g.lineTo(s.x, s.y); g.stroke();
      }
      g.fillStyle = `rgba(${s.c},${a})`; g.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
    }
    g.restore();
  }
};

/* ---------- glow / text / buttons ---------- */
SL.glow = (g, x, y, rx, ry, rgb, a) => {
  if (a <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.scale(rx, ry);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.45, `rgba(${rgb},${a * .45})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
};
SL.softRect = (g, cx, cy, rx, ry, rgba, hard = .75) => {
  g.save(); g.translate(cx, cy); g.scale(rx, ry);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0, rgba); gr.addColorStop(hard, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, '0)'));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
};
SL.neonText = (g, txt, x, y, size, rgb, opt = {}) => {
  const a = opt.alpha ?? 1;
  g.save();
  g.font = `bold ${size}px ${F()}`; g.textAlign = opt.align || 'center'; g.textBaseline = 'middle';
  g.shadowColor = `rgba(${rgb},${a})`; g.shadowBlur = (opt.blur ?? 14) * (SL.view ? SL.view.scale : 1);
  g.fillStyle = `rgba(${rgb},${a})`; g.fillText(txt, x, y);
  g.shadowBlur = 0; g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,255,255,${0.28 * a})`; g.fillText(txt, x, y);
  g.restore();
};
SL.roundRect = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
/* button: {x,y,w,h,label,rgb,disabled,sub} (x,y = center) */
SL.drawButton = (g, b, selected, t = 0) => {
  const rgb = b.disabled ? '120,110,150' : (b.rgb || '255,80,220');
  const pulse = selected ? 0.75 + 0.25 * Math.sin(t * 6) : 0.45;
  g.save();
  SL.roundRect(g, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
  g.fillStyle = selected ? `rgba(${rgb},0.16)` : 'rgba(8,4,20,0.65)'; g.fill();
  g.lineWidth = selected ? 2.5 : 1.5; g.strokeStyle = `rgba(${rgb},${pulse})`;
  g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = (selected ? 16 : 6) * SL.view.scale; g.stroke();
  g.restore();
  SL.neonText(g, b.label, b.x, b.y + (b.sub ? -6 : 1), b.size || 22, rgb, { alpha: b.disabled ? 0.6 : 1, blur: selected ? 16 : 8 });
  if (b.sub) SL.neonText(g, b.sub, b.x, b.y + 13, 11, b.disabled ? '255,200,90' : rgb, { blur: 6, alpha: 0.9 });
  if (selected && !b.disabled) { SL.neonText(g, '▶', b.x - b.w / 2 + 16, b.y + 1, 14, rgb, { blur: 8 }); }
};
SL.inBtn = (b, p) => Math.abs(p.x - b.x) <= b.w / 2 && Math.abs(p.y - b.y) <= b.h / 2;

/* ---------- sprites (pre-rendered at 2x with glow, cheap to rotate) ---------- */
const SS = 2;
SL.Sprites = {
  ship(rgb = '80,170,255') {
    const size = 80, c = SL.mkCanvas(size * SS, size * SS), g = c.getContext('2d');
    g.scale(SS, SS); g.translate(size / 2, size / 2 - 2); g.lineJoin = 'round';
    const outer = [[0, -28], [8, -7], [26, 13], [23, 18], [9, 10], [5, 16], [-5, 16], [-9, 10], [-23, 18], [-26, 13], [-8, -7]];
    const cockpit = [[0, -15], [4.5, 3], [-4.5, 3]];
    const path = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
    path(outer); g.fillStyle = 'rgba(10,30,70,0.55)'; g.fill();
    g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = 14 * SS;
    g.strokeStyle = `rgba(${rgb},1)`; g.lineWidth = 2.6; path(outer); g.stroke(); path(cockpit); g.stroke();
    g.beginPath(); g.moveTo(8, -7); g.lineTo(9, 10); g.moveTo(-8, -7); g.lineTo(-9, 10); g.lineWidth = 1.4; g.stroke();
    g.shadowBlur = 0; g.strokeStyle = 'rgba(220,240,255,0.9)'; g.lineWidth = 1; path(outer); g.stroke(); path(cockpit); g.stroke();
    return { c, size };
  },
  asteroid(r, rgb) {
    const pad = 16, size = Math.ceil((r * 1.08 + pad) * 2), c = SL.mkCanvas(size * SS, size * SS), g = c.getContext('2d');
    g.scale(SS, SS); g.translate(size / 2, size / 2); g.lineJoin = 'round';
    const n = 7 + ((Math.random() * 4) | 0), outer = [], m = Math.max(3, Math.round(n / 2)), inner = [];
    const off = Math.random() * 6.28;
    for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2 + (Math.random() - .5) * 0.3, rr = r * (0.84 + Math.random() * 0.2); outer.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    for (let i = 0; i < m; i++) { const a = off + 0.4 + i / m * Math.PI * 2, rr = r * (0.42 + Math.random() * 0.12); inner.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    const poly = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
    poly(outer); g.fillStyle = 'rgba(6,2,16,0.55)'; g.fill();
    g.shadowColor = `rgba(${rgb},1)`; g.shadowBlur = 10 * SS;
    // facets: inner ring + spokes to nearest outer vertices (wireframe-polyhedron look)
    g.strokeStyle = `rgba(${rgb},0.6)`; g.lineWidth = 1.2; poly(inner); g.stroke();
    g.beginPath();
    inner.forEach(p => {
      const d = outer.map((q, j) => [Math.hypot(q[0] - p[0], q[1] - p[1]), j]).sort((a, b) => a[0] - b[0]);
      [d[0][1], d[1][1]].forEach(j => { g.moveTo(p[0], p[1]); g.lineTo(outer[j][0], outer[j][1]); });
    });
    g.stroke();
    g.strokeStyle = `rgba(${rgb},1)`; g.lineWidth = r > 20 ? 2.2 : 1.8; poly(outer); g.stroke();
    g.shadowBlur = 0; g.strokeStyle = 'rgba(255,240,255,0.55)'; g.lineWidth = 0.8; poly(outer); g.stroke();
    return { c, size };
  },
};

/* ---------- particles / popups / shake ---------- */
SL.Particles = class {
  constructor() { this.list = []; this.rings = []; }
  burst(x, y, rgb, n = 20, speed = 180, life = 0.7, size = 2) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.25 + Math.random() * 0.9);
      this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.5 + Math.random() * 0.6), max: life, c: Math.random() < .25 ? '255,255,255' : rgb, s: size * (0.6 + Math.random() * 0.8) });
    }
  }
  ring(x, y, rgb, r = 40, life = 0.4) { this.rings.push({ x, y, rgb, r, life, max: life }); }
  update(dt) {
    for (const p of this.list) { p.x += p.vx * dt; p.y += p.vy * dt + 40 * dt; p.vx *= 1 - 1.8 * dt; p.vy *= 1 - 1.8 * dt; p.life -= dt; }
    this.list = this.list.filter(p => p.life > 0);
    for (const r of this.rings) r.life -= dt; this.rings = this.rings.filter(r => r.life > 0);
  }
  draw(g) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of this.list) { const a = Math.min(1, p.life / p.max * 1.6); g.fillStyle = `rgba(${p.c},${a})`; g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
    for (const r of this.rings) { const k = 1 - r.life / r.max; g.strokeStyle = `rgba(${r.rgb},${(1 - k) * 0.8})`; g.lineWidth = 2.5 * (1 - k) + 0.5; g.beginPath(); g.arc(r.x, r.y, r.r * (0.3 + k), 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
};

/* scanlines overlay (pre-rendered) */
let scan = null;
SL.drawScanlines = (g, a = 0.10) => {
  if (!scan) { scan = SL.mkCanvas(W, H); const s = scan.getContext('2d'); s.fillStyle = '#000'; s.globalAlpha = 0.2; for (let y = 0; y < H; y += 3) s.fillRect(0, y, W, 1); }
  g.save(); g.globalAlpha = a / 0.10 * 0.5; g.drawImage(scan, 0, 0); g.restore();
};

/* synthwave space backdrop for gameplay */
let bg = null;
SL.drawSpaceBg = (g) => {
  if (!bg) {
    bg = SL.mkCanvas(W, H); const b = bg.getContext('2d');
    const gr = b.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#05010f'); gr.addColorStop(1, '#0b0320'); b.fillStyle = gr; b.fillRect(0, 0, W, H);
    SL.glow(b, 120, 380, 260, 300, '200,40,180', 0.16); SL.glow(b, 920, 320, 260, 300, '40,90,255', 0.16); SL.glow(b, 520, 0, 420, 140, '140,60,255', 0.10);
    // faint perspective grid at the horizon (bottom) for synthwave flavour
    b.strokeStyle = 'rgba(255,60,200,0.07)'; b.lineWidth = 1;
    for (let i = -12; i <= 12; i++) { b.beginPath(); b.moveTo(W / 2 + i * 18, H - 70); b.lineTo(W / 2 + i * 110, H); b.stroke(); }
  }
  g.drawImage(bg, 0, 0);
};
})();
