/* Survival backdrop zones: procedural planets, tinted washes, enter-zone banner.
   Planet sprites are cached on offscreen canvases (warmup once) so the live game stays smooth. */
(() => {
  const W = SL.W, H = SL.H;

  const rng = (seed) => { let x = seed | 0 || 1; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };

  /* ---------- zone defs (blendable) ---------- */
  const ZONES = {
    normal: {
      id: 'normal', name: 'NORMAL SPACE', rgb: '160,200,255',
      wash: [12, 8, 28, 0], glow: [],
      planet: null,
    },
    fire: {
      id: 'fire', name: 'FIRE ZONE', rgb: '255,140,50',
      wash: [90, 18, 4, 0.22],
      glow: [[780, 500, 340, 280, '255,70,20', 0.28], [512, 600, 500, 180, '255,90,20', 0.16], [200, 80, 220, 120, '255,80,30', 0.07]],
      planet: { kind: 'fire', x: 820, y: 430, r: 196 },
    },
    ice: {
      id: 'ice', name: 'ICE ZONE', rgb: '120,210,255',
      wash: [8, 30, 70, 0.22],
      glow: [[220, 480, 320, 260, '80,180,255', 0.26], [512, 600, 480, 160, '120,200,255', 0.12], [900, 80, 200, 120, '160,220,255', 0.07]],
      planet: { kind: 'ice', x: 210, y: 430, r: 200 },
    },
    earth: {
      id: 'earth', name: 'EARTH ZONE', rgb: '80,200,255',
      wash: [10, 30, 55, 0.12],
      glow: [[200, 430, 280, 240, '40,140,220', 0.16], [512, 80, 300, 120, '120,200,255', 0.06]],
      planet: { kind: 'earth', x: 200, y: 400, r: 172 },
    },
    toxic: {
      id: 'toxic', name: 'TOXIC ZONE', rgb: '150,255,70',
      wash: [28, 62, 8, 0.30],
      glow: [[800, 480, 360, 280, '140,220,30', 0.26], [512, 620, 560, 220, '80,180,20', 0.20], [120, 100, 200, 130, '180,255,40', 0.07]],
      planet: { kind: 'toxic', x: 805, y: 415, r: 188 },
    },
    nebula: {
      id: 'nebula', name: 'NEBULA / BLACK HOLE', rgb: '200,110,255',
      wash: [28, 4, 48, 0.20],
      glow: [[700, 250, 420, 320, '160,40,255', 0.22], [480, 200, 280, 220, '255,60,200', 0.14], [850, 400, 240, 180, '80,40,255', 0.12], [200, 80, 200, 140, '180,80,255', 0.08]],
      planet: { kind: 'hole', x: 700, y: 250, r: 72 },
    },
  };
  /* ---------- procedural planets (cached) ---------- */
  const planetCache = {};
  function planetKey(p) { return p.kind + ':' + p.r; }


  function blob(g, x, y, rx, ry, rot, n, jag, R) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, k = 1 - jag + R() * jag * 2;
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath(); g.fill(); g.restore();
  }

  function makePlanet(kind, r) {
    const pad = kind === 'hole' ? Math.ceil(r * 4.8)
              : (kind === 'toxic' || kind === 'ice') ? Math.ceil(r * 1.95)
              : kind === 'fire' ? Math.ceil(r * 2.25)
              : Math.ceil(r * 0.62) + 24;
    const size = Math.ceil((r + pad) * 2);
    const c = SL.mkCanvas(size, size), g = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    const clip = fn => { g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip(); fn(); g.restore(); };
    const R = rng({ fire: 11, ice: 22, earth: 33, toxic: 44, hole: 55 }[kind] || 7);

    if (kind === 'hole') {
      drawBlackHole(g, cx, cy, r, size);
      return { c, size, cx, cy };
    }

    // atmosphere halo first (behind the body)
    const atmos = {
      fire:  ['255,90,30', 0.70],
      ice:   ['140,210,255', 0.62],
      earth: ['80,170,255', 0.62],
      toxic: ['160,230,40', 0.72],
    }[kind] || ['180,180,255', 0.35];
    const halo = (kind === 'toxic' || kind === 'fire') ? 1.7 : (kind === 'earth' || kind === 'ice') ? 1.55 : 1.45;
    SL.glow(g, cx, cy, r * halo, r * halo, atmos[0], atmos[1]);
    SL.glow(g, cx, cy, r * 1.18, r * 1.18, atmos[0], (kind === 'toxic' || kind === 'earth' || kind === 'fire' || kind === 'ice') ? 0.32 : 0.22);
    if (kind === 'earth') SL.glow(g, cx, cy, r * 1.08, r * 1.08, '140,200,255', 0.18);
    if (kind === 'toxic') SL.glow(g, cx, cy, r * 1.28, r * 1.28, '200,255,60', 0.16);
    if (kind === 'fire') SL.glow(g, cx, cy, r * 1.22, r * 1.22, '255,140,40', 0.22);
    if (kind === 'ice') SL.glow(g, cx, cy, r * 1.10, r * 1.10, '180,230,255', 0.18);

    if (kind === 'toxic') drawToxicRing(g, cx, cy, r, 'back');
    if (kind === 'ice') drawIceRing(g, cx, cy, r, 'back');

    clip(() => {
      if (kind === 'fire') drawFireSurface(g, cx, cy, r, R);
      else if (kind === 'ice') drawIceSurface(g, cx, cy, r, R);
      else if (kind === 'earth') drawEarthSurface(g, cx, cy, r, R);
      else if (kind === 'toxic') drawToxicSurface(g, cx, cy, r, R);
      if (kind === 'earth') finishEarth(g, cx, cy, r, R);
      else if (kind === 'toxic') finishToxic(g, cx, cy, r);
      else if (kind === 'fire') finishFire(g, cx, cy, r, R);
      else if (kind === 'ice') finishIce(g, cx, cy, r, R);
    });

    if (kind === 'toxic') {
      drawToxicRing(g, cx, cy, r, 'front');
      drawToxicMoon(g, cx, cy, r, R);
    }
    if (kind === 'ice') {
      drawIceRing(g, cx, cy, r, 'front');
      drawIceMoon(g, cx, cy, r, R);
    }
    if (kind === 'fire') drawFirePlume(g, cx, cy, r, R);

    // limb glow
    g.save(); g.globalCompositeOperation = 'lighter';
    const fancy = { earth: 1, toxic: 1, fire: 1, ice: 1 }[kind];
    if (fancy) {
      const a0 = Math.atan2(-0.45, -0.55);
      const rim = { earth: ['rgba(160,215,255,0.85)', 4, 'rgba(200,235,255,0.45)', 7],
                    toxic: ['rgba(190,255,70,0.8)', 5.5, 'rgba(230,255,120,0.4)', 9],
                    fire:  ['rgba(255,150,40,0.9)', 5.5, 'rgba(255,220,120,0.45)', 9],
                    ice:   ['rgba(170,230,255,0.88)', 4.5, 'rgba(220,245,255,0.42)', 8] }[kind];
      g.strokeStyle = rim[0]; g.lineWidth = rim[1];
      g.beginPath(); g.arc(cx, cy, r + 0.8, a0 - 1.25, a0 + 1.25); g.stroke();
      g.strokeStyle = rim[2]; g.lineWidth = rim[3];
      g.beginPath(); g.arc(cx, cy, r + 2.5, a0 - 0.9, a0 + 0.9); g.stroke();
    } else {
      g.strokeStyle = `rgba(${atmos[0]},0.55)`; g.lineWidth = 2.2;
      g.beginPath(); g.arc(cx, cy, r - 1, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
    return { c, size, cx, cy };
  }

  function drawFireSurface(g, cx, cy, r, R) {
    const base = g.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r);
    base.addColorStop(0, '#4a160c'); base.addColorStop(0.45, '#220808'); base.addColorStop(1, '#080202');
    g.fillStyle = base; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    // cooled crust plates
    for (let i = 0; i < 18; i++) {
      g.fillStyle = R() < 0.45 ? `rgba(10,3,2,${0.4 + R() * 0.35})` : `rgba(70,22,10,${0.22 + R() * 0.28})`;
      blob(g, cx + (R() - .5) * r * 1.4, cy + (R() - .5) * r * 1.4, r * (0.14 + R() * 0.24), r * (0.10 + R() * 0.18), R() * 6, 9, 0.32, R);
    }
    // darker ridges
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      let x = cx + (R() - 0.5) * r * 1.4, y = cy + (R() - 0.5) * r * 1.4;
      g.strokeStyle = `rgba(8,2,1,${0.35 + R() * 0.3})`;
      g.lineWidth = 2 + R() * 4;
      g.beginPath(); g.moveTo(x, y);
      let dir = R() * Math.PI * 2;
      for (let k = 0; k < 5; k++) {
        dir += (R() - 0.5) * 0.7;
        x += Math.cos(dir) * r * 0.12; y += Math.sin(dir) * r * 0.12;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.restore();
  }

  function finishFire(g, cx, cy, r, R) {
    const lg = g.createLinearGradient(cx - r * 0.2, cy - r * 0.28, cx + r * 0.7, cy + r * 0.36);
    lg.addColorStop(0, 'rgba(255,200,120,0.14)');
    lg.addColorStop(0.38, 'rgba(0,0,0,0)');
    lg.addColorStop(0.60, 'rgba(20,4,0,0.50)');
    lg.addColorStop(1, 'rgba(6,1,0,0.84)');
    g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();

    const strokeRiver = (pts, scale) => {
      const w = scale;
      g.lineCap = 'round'; g.lineJoin = 'round';
      const draw = (rgba, lw) => {
        g.strokeStyle = rgba; g.lineWidth = lw;
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
        g.stroke();
      };
      draw(`rgba(180,30,0,${0.45 * scale})`, 7 * w);
      draw(`rgba(255,80,15,${0.7 * scale})`, 4.2 * w);
      draw(`rgba(255,180,50,${0.85 * scale})`, 2.1 * w);
      draw(`rgba(255,245,180,${0.95 * scale})`, 0.9 * w);
    };
    const walk = (x, y, dir, segs, step) => {
      const pts = [[x, y]];
      for (let k = 0; k < segs; k++) {
        dir += (R() - 0.5) * 0.7;
        x += Math.cos(dir) * step; y += Math.sin(dir) * step;
        pts.push([x, y]);
      }
      return pts;
    };
    g.save(); g.globalCompositeOperation = 'lighter';
    // major lava rivers (plus short tributaries)
    for (let i = 0; i < 6; i++) {
      const ang = R() * Math.PI * 2, d0 = r * (0.05 + R() * 0.45);
      const x0 = cx + Math.cos(ang) * d0, y0 = cy + Math.sin(ang) * d0;
      const pts = walk(x0, y0, ang + (R() - 0.5) * 1.2, 7 + (R() * 4) | 0, r * 0.11);
      strokeRiver(pts, 0.85 + R() * 0.4);
      if (R() < 0.75) {
        const mid = pts[(pts.length * 0.4) | 0];
        strokeRiver(walk(mid[0], mid[1], R() * Math.PI * 2, 4, r * 0.08), 0.5 + R() * 0.25);
      }
    }
    // lava lakes / hot spots
    for (let i = 0; i < 9; i++) {
      const a = R() * Math.PI * 2, d = R() * r * 0.7, rr = r * (0.04 + R() * 0.08);
      const lx = cx + Math.cos(a) * d, ly = cy + Math.sin(a) * d;
      SL.glow(g, lx, ly, rr * 2.2, rr * 1.5, R() < 0.35 ? '255,230,100' : '255,90,20', 0.7);
      g.fillStyle = 'rgba(255,240,160,0.7)';
      g.beginPath(); g.ellipse(lx, ly, rr * 0.55, rr * 0.35, a, 0, Math.PI * 2); g.fill();
    }
    // calderas (one is the plume vent)
    const vents = [[cx - r * 0.28, cy - r * 0.58, r * 0.07], [cx + r * 0.18, cy + r * 0.12, r * 0.05]];
    for (const [vx, vy, vr] of vents) {
      g.fillStyle = 'rgba(10,2,0,0.85)';
      g.beginPath(); g.arc(vx, vy, vr, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,140,30,0.85)'; g.lineWidth = 2.2;
      g.beginPath(); g.arc(vx, vy, vr, 0, Math.PI * 2); g.stroke();
      SL.glow(g, vx, vy, vr * 2.8, vr * 2.8, '255,120,20', 0.7);
      SL.glow(g, vx, vy, vr * 1.2, vr * 1.2, '255,230,120', 0.6);
    }
    // surface embers
    for (let i = 0; i < 40; i++) {
      const a = R() * Math.PI * 2, d = R() * r * 0.92;
      const ex = cx + Math.cos(a) * d, ey = cy + Math.sin(a) * d;
      const s = 0.7 + R() * 1.6;
      g.fillStyle = `rgba(255,${160 + (R() * 80) | 0},60,${0.4 + R() * 0.6})`;
      g.fillRect(ex, ey, s, s);
    }
    g.restore();
  }

  function drawFirePlume(g, cx, cy, r, R) {
    const vx = cx - r * 0.28, vy = cy - r * 0.58;
    g.save(); g.globalCompositeOperation = 'lighter';
    SL.glow(g, vx, vy - r * 0.08, r * 0.35, r * 0.5, '255,80,20', 0.5);
    // flare tongues
    for (let i = 0; i < 5; i++) {
      const spread = -1.15 + (i - 2) * 0.22 + (R() - 0.5) * 0.12;
      const len = r * (0.55 + R() * 0.45);
      const ex = vx + Math.cos(spread) * len, ey = vy + Math.sin(spread) * len;
      const gr = g.createLinearGradient(vx, vy, ex, ey);
      gr.addColorStop(0, 'rgba(255,240,180,0.85)');
      gr.addColorStop(0.25, 'rgba(255,140,30,0.55)');
      gr.addColorStop(0.7, 'rgba(255,50,10,0.2)');
      gr.addColorStop(1, 'rgba(255,30,0,0)');
      g.strokeStyle = gr; g.lineWidth = 7 - i * 0.8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(vx, vy);
      g.quadraticCurveTo(vx + Math.cos(spread - 0.3) * len * 0.4,
                         vy + Math.sin(spread - 0.3) * len * 0.45 - r * 0.08,
                         ex, ey);
      g.stroke();
    }
    // ember spray
    for (let i = 0; i < 36; i++) {
      const a = -1.55 + (R() - 0.5) * 1.1, d = r * (0.15 + R() * 0.85);
      const ex = vx + Math.cos(a) * d, ey = vy + Math.sin(a) * d;
      const s = 0.8 + R() * 2.2, fade = 1 - d / (r * 1.1);
      g.fillStyle = `rgba(255,${140 + (R() * 100) | 0},40,${0.35 + fade * 0.55})`;
      g.fillRect(ex, ey, s, s);
    }
    g.restore();
  }

  function drawIceSurface(g, cx, cy, r, R) {
    const base = g.createRadialGradient(cx - r * 0.22, cy - r * 0.3, r * 0.12, cx, cy, r);
    base.addColorStop(0, '#d8f0ff'); base.addColorStop(0.35, '#8ec0dc'); base.addColorStop(1, '#1a3854');
    g.fillStyle = base; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    // darker ice / frozen seas
    for (let i = 0; i < 12; i++) {
      g.fillStyle = `rgba(16,40,70,${0.22 + R() * 0.28})`;
      blob(g, cx + (R() - .5) * r * 1.3, cy + (R() - .5) * r * 1.3, r * (0.16 + R() * 0.26), r * (0.10 + R() * 0.18), R() * 6, 9, 0.28, R);
    }
    // frost plains
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `rgba(240,250,255,${0.18 + R() * 0.28})`;
      blob(g, cx + (R() - .5) * r * 1.2, cy + (R() - .5) * r * 1.2, r * (0.12 + R() * 0.2), r * (0.08 + R() * 0.14), R() * 6, 9, 0.3, R);
    }
    // pack-ice floes (polygonal plates with bright seams)
    g.save();
    for (let i = 0; i < 16; i++) {
      const a = R() * Math.PI * 2, d = R() * r * 0.7;
      const fx = cx + Math.cos(a) * d, fy = cy + Math.sin(a) * d;
      const n = 5 + (R() * 3) | 0, rad = r * (0.07 + R() * 0.11);
      g.fillStyle = `rgba(200,230,245,${0.12 + R() * 0.18})`;
      g.strokeStyle = `rgba(220,245,255,${0.25 + R() * 0.25})`;
      g.lineWidth = 0.8;
      g.beginPath();
      for (let k = 0; k < n; k++) {
        const aa = a + k / n * Math.PI * 2, rr = rad * (0.75 + R() * 0.4);
        const x = fx + Math.cos(aa) * rr, y = fy + Math.sin(aa) * rr;
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
    // deep crevasses (dark rift + cyan lip)
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 14; i++) {
      let x = cx + (R() - 0.5) * r * 1.5, y = cy + (R() - 0.5) * r * 1.5;
      let dir = R() * Math.PI * 2;
      const pts = [[x, y]];
      for (let k = 0; k < 6; k++) {
        dir += (R() - 0.5) * 0.55;
        x += Math.cos(dir) * r * 0.11; y += Math.sin(dir) * r * 0.11;
        pts.push([x, y]);
      }
      const draw = (rgba, lw) => {
        g.strokeStyle = rgba; g.lineWidth = lw;
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]);
        g.stroke();
      };
      draw('rgba(8,24,48,0.7)', 3.6);
      g.save(); g.globalCompositeOperation = 'lighter';
      draw('rgba(160,220,255,0.45)', 1.4);
      g.restore();
    }
    // fine fracture web
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) {
      let x = cx + (R() - 0.5) * r * 1.5, y = cy + (R() - 0.5) * r * 1.5;
      g.strokeStyle = `rgba(200,240,255,${0.18 + R() * 0.3})`;
      g.lineWidth = 0.6 + R() * 1.1;
      g.beginPath(); g.moveTo(x, y);
      let dir = R() * Math.PI * 2;
      for (let k = 0; k < 4; k++) {
        dir += (R() - 0.5) * 0.8;
        x += Math.cos(dir) * r * 0.08; y += Math.sin(dir) * r * 0.08;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.restore();
    // polar caps
    const cap = (ox, oy, rr) => {
      const gr = g.createRadialGradient(ox, oy, rr * 0.12, ox, oy, rr);
      gr.addColorStop(0, 'rgba(255,255,255,0.92)');
      gr.addColorStop(0.4, 'rgba(230,245,255,0.55)');
      gr.addColorStop(1, 'rgba(200,230,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(ox, oy, rr, 0, Math.PI * 2); g.fill();
    };
    cap(cx - r * 0.04, cy - r * 0.78, r * 0.52);
    cap(cx + r * 0.06, cy + r * 0.80, r * 0.48);
  }

  function finishIce(g, cx, cy, r, R) {
    const lg = g.createLinearGradient(cx - r * 0.2, cy - r * 0.28, cx + r * 0.72, cy + r * 0.36);
    lg.addColorStop(0, 'rgba(230,245,255,0.14)');
    lg.addColorStop(0.36, 'rgba(0,0,0,0)');
    lg.addColorStop(0.55, 'rgba(4,16,36,0.28)');
    lg.addColorStop(0.7, 'rgba(2,8,24,0.68)');
    lg.addColorStop(1, 'rgba(0,4,16,0.88)');
    g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    // polar sheen on top of the terminator
    g.save(); g.globalCompositeOperation = 'lighter';
    SL.glow(g, cx - r * 0.04, cy - r * 0.72, r * 0.28, r * 0.18, '200,230,255', 0.28);
    // tight specular glint
    const sx = cx - r * 0.32, sy = cy - r * 0.40;
    SL.glow(g, sx, sy, r * 0.10, r * 0.07, '255,255,255', 0.7);
    const sp = g.createRadialGradient(sx, sy, 0, sx, sy, r * 0.09);
    sp.addColorStop(0, 'rgba(255,255,255,0.9)');
    sp.addColorStop(0.35, 'rgba(200,230,255,0.35)');
    sp.addColorStop(1, 'rgba(200,230,255,0)');
    g.fillStyle = sp; g.beginPath(); g.ellipse(sx, sy, r * 0.055, r * 0.03, -0.5, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  function drawIceRing(g, cx, cy, r, part) {
    const R = rng(22);
    g.save();
    g.translate(cx, cy);
    g.rotate(-0.30);
    if (part === 'back') { g.beginPath(); g.rect(-800, -800, 1600, 800); g.clip(); }
    if (part === 'front') { g.beginPath(); g.rect(-800, 0, 1600, 800); g.clip(); }
    g.scale(1, 0.25);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 140; i++) {
      const a = (i / 140) * Math.PI * 2 + (R() - 0.5) * 0.08;
      const rad = r * (1.32 + (i % 3) * 0.18 + (R() - 0.5) * 0.08);
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      const w = 2 + R() * 7, h = 0.8 + R() * 1.8;
      g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
      g.fillStyle = `rgba(${180 + (R() * 75) | 0},${220 + (R() * 35) | 0},255,${0.25 + R() * 0.55})`;
      g.fillRect(-w / 2, -h / 2, w, h);
      g.restore();
    }
    g.restore();
  }

  function drawIceMoon(g, cx, cy, r, R) {
    const mx = cx + r * 1.12, my = cy - r * 0.88, mr = r * 0.16;
    SL.glow(g, mx, my, mr * 1.8, mr * 1.8, '160,220,255', 0.28);
    g.save();
    g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.clip();
    const mg = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.35, mr * 0.1, mx, my, mr);
    mg.addColorStop(0, '#e8f6ff'); mg.addColorStop(0.45, '#8eb8d0'); mg.addColorStop(1, '#1a3048');
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
    g.lineCap = 'round';
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      let x = mx + (R() - 0.5) * mr * 1.6, y = my + (R() - 0.5) * mr * 1.6;
      g.strokeStyle = `rgba(200,235,255,${0.3 + R() * 0.4})`; g.lineWidth = 0.7 + R();
      g.beginPath(); g.moveTo(x, y);
      const dir = R() * Math.PI * 2;
      g.lineTo(x + Math.cos(dir) * mr * 0.6, y + Math.sin(dir) * mr * 0.6);
      g.stroke();
    }
    g.restore();
    const sh = g.createLinearGradient(mx - mr * 0.3, my - mr * 0.3, mx + mr * 0.7, my + mr * 0.5);
    sh.addColorStop(0, 'rgba(255,255,255,0.2)'); sh.addColorStop(0.4, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,10,0.7)');
    g.fillStyle = sh; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(180,230,255,0.55)'; g.lineWidth = 1.4;
    g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.stroke();
    g.restore();
  }

  function ortho(lon, lat, lon0, lat0, cx, cy, r) {
    const cl = Math.cos(lat), sl = Math.sin(lat);
    const c0 = Math.cos(lat0), s0 = Math.sin(lat0);
    const dlo = lon - lon0;
    const z = s0 * sl + c0 * cl * Math.cos(dlo);
    if (z < -0.03) return null;
    const x = cl * Math.sin(dlo);
    const y = c0 * sl - s0 * cl * Math.cos(dlo);
    return [cx + x * r, cy - y * r, z];
  }
  function fillLand(g, pts, lon0, lat0, cx, cy, r) {
    let started = false, n = 0;
    g.beginPath();
    for (const [lo, la] of pts) {
      const p = ortho(lo * Math.PI / 180, la * Math.PI / 180, lon0, lat0, cx, cy, r);
      if (!p) { started = false; continue; }
      started ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]);
      started = true; n++;
    }
    if (n > 3) { g.closePath(); g.fill(); }
  }
  function strokeLand(g, pts, lon0, lat0, cx, cy, r) {
    let started = false, n = 0;
    g.beginPath();
    for (const [lo, la] of pts) {
      const p = ortho(lo * Math.PI / 180, la * Math.PI / 180, lon0, lat0, cx, cy, r);
      if (!p) { started = false; continue; }
      started ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]);
      started = true; n++;
    }
    if (n > 3) g.stroke();
  }

  function drawEarthSurface(g, cx, cy, r, R) {
    const lon0 = -30 * Math.PI / 180, lat0 = 10 * Math.PI / 180;
    // oceans with depth — bright shallow tropical water, deep navy basins
    const ocean = g.createRadialGradient(cx - r * 0.28, cy - r * 0.22, r * 0.05, cx, cy, r);
    ocean.addColorStop(0, '#5ec8e8');
    ocean.addColorStop(0.22, '#1e7ec8');
    ocean.addColorStop(0.55, '#0d4a8c');
    ocean.addColorStop(1, '#062040');
    g.fillStyle = ocean; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    // a few deeper basins
    g.fillStyle = 'rgba(4,20,50,0.28)';
    blob(g, cx + r * 0.05, cy + r * 0.12, r * 0.28, r * 0.16, 0.4, 8, 0.2, R); // mid-Atlantic
    blob(g, cx - r * 0.35, cy - r * 0.05, r * 0.18, r * 0.12, -0.3, 8, 0.2, R);

    const NA = [[-158,71],[-141,70],[-127,71],[-105,68],[-88,67],[-85,70],[-80,73],[-70,70],[-62,60],[-65,58],[-60,51],[-55,51],[-64,47],[-70,47],[-66,45],[-67,44],[-74,40],[-74,39],[-76,38],[-76,36],[-81,31],[-81,25],[-80,25],[-82,27],[-83,29],[-85,30],[-89,29],[-94,29],[-97,28],[-97,25],[-97,18],[-95,16],[-93,18],[-91,19],[-90,15],[-87,16],[-84,13],[-83,9],[-80,9],[-79,9],[-81,8],[-84,8],[-87,12],[-91,14],[-95,16],[-99,17],[-103,20],[-106,22],[-110,24],[-115,27],[-117,32],[-120,34],[-122,37],[-124,40],[-125,43],[-124,47],[-128,52],[-136,58],[-153,59],[-162,60],[-168,65],[-166,69],[-158,71]];
    const SA = [[-79,9],[-72,12],[-62,11],[-51,4],[-50,2],[-44,-2],[-35,-5],[-34,-8],[-37,-16],[-39,-20],[-41,-22],[-48,-28],[-49,-30],[-52,-32],[-56,-37],[-62,-40],[-65,-43],[-67,-50],[-71,-55],[-68,-56],[-66,-55],[-68,-52],[-73,-47],[-74,-42],[-73,-37],[-71,-30],[-71,-18],[-73,-16],[-77,-14],[-81,-6],[-81,-2],[-80,1],[-79,9]];
    const AF = [[-5,35],[-2,35],[2,36],[10,37],[11,32],[20,32],[25,32],[33,31],[35,31],[34,27],[40,16],[43,13],[48,14],[51,12],[51,10],[43,11],[44,5],[47,5],[51,2],[48,-1],[42,-1],[41,-4],[40,-8],[42,-16],[38,-18],[35,-20],[33,-25],[29,-32],[27,-33],[20,-35],[18,-33],[18,-29],[14,-22],[12,-18],[13,-13],[10,-4],[9,2],[8,4],[4,5],[-1,5],[-5,5],[-10,6],[-15,11],[-17,15],[-16,20],[-16,24],[-14,27],[-10,29],[-5,35]];
    const IB = [[-9,37],[-9,43],[-7,44],[-2,43],[0,39],[-2,36],[-5,36],[-9,37]];
    const EU = [[-2,43],[3,42],[8,44],[12,45],[14,54],[19,54],[23,55],[19,50],[13,49],[8,49],[4,50],[2,51],[-2,49],[-5,48],[-2,47],[-2,43]];
    const IT = [[8,44],[13,46],[14,42],[18,40],[15,38],[12,38],[9,44]];
    const SC = [[5,58],[10,59],[12,63],[16,69],[24,71],[30,71],[23,66],[19,63],[13,59],[5,58]];
    const GR = [[18,42],[23,41],[28,41],[27,36],[21,37],[23,40],[19,41]];
    const UK = [[-5,58],[1,58],[2,53],[-1,50],[-6,50],[-5,55],[-6,58]];
    const IE = [[-10,54],[-6,55],[-6,52],[-10,52]];
    const GL = [[-73,77],[-60,82],[-22,81],[-20,70],[-44,60],[-50,64],[-65,61],[-73,77]];
    const TR = [[27,36],[28,41],[36,42],[44,40],[35,36],[27,36]];
    const AR = [[33,30],[36,32],[45,30],[55,26],[59,23],[54,17],[48,15],[43,16],[39,21],[33,28]];
    const CU = [[-85,23],[-77,21],[-82,20],[-85,23]];
    const BAJA = [[-110,24],[-110,32],[-114,32],[-112,24],[-110,24]];
    const lands = [NA, SA, AF, IB, EU, IT, SC, GR, UK, IE, TR, CU, BAJA];

    // shallow coastal water (wide soft stroke under the land)
    g.save();
    g.strokeStyle = 'rgba(60,200,210,0.28)';
    g.lineWidth = r * 0.05;
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const poly of lands) strokeLand(g, poly, lon0, lat0, cx, cy, r);
    g.restore();

    g.fillStyle = '#2a7a36';
    for (const poly of lands) fillLand(g, poly, lon0, lat0, cx, cy, r);

    // biome tints
    g.fillStyle = '#1c5a28'; // Amazon / Congo
    fillLand(g, [[-75,4],[-60,4],[-50,-2],[-52,-10],[-70,-12],[-74,-4],[-75,4]], lon0, lat0, cx, cy, r);
    fillLand(g, [[9,4],[16,4],[22,2],[18,-2],[12,-4],[8,2],[9,4]], lon0, lat0, cx, cy, r);
    g.fillStyle = '#c2a05a'; // Sahara, Arabia, SW US, Patagonia hint
    fillLand(g, [[-16,16],[-8,18],[0,20],[12,22],[28,22],[32,18],[28,14],[10,15],[-8,16],[-16,16]], lon0, lat0, cx, cy, r);
    fillLand(g, AR, lon0, lat0, cx, cy, r);
    fillLand(g, [[-117,32],[-104,36],[-100,30],[-108,25],[-117,28],[-117,32]], lon0, lat0, cx, cy, r);
    fillLand(g, [[-72,-40],[-65,-42],[-68,-50],[-72,-48],[-72,-40]], lon0, lat0, cx, cy, r);
    g.fillStyle = '#3d8a3c'; // slightly lighter highlands
    fillLand(g, [[-112,40],[-100,45],[-90,42],[-94,36],[-108,34],[-112,40]], lon0, lat0, cx, cy, r);
    fillLand(g, [[12,8],[28,8],[32,4],[22,0],[12,4],[12,8]], lon0, lat0, cx, cy, r);

    // Greenland as ice (over the land poly)
    g.fillStyle = '#e8f4ff';
    fillLand(g, GL, lon0, lat0, cx, cy, r);

    // polar ice caps
    const cap = (lat0d, fromLat, col0, col1) => {
      const pts = [];
      const step = 10;
      if (fromLat > 0) { for (let lo = -180; lo <= 180; lo += step) pts.push([lo, fromLat]); }
      else { for (let lo = 180; lo >= -180; lo -= step) pts.push([lo, fromLat]); }
      const grdPts = pts.map(([lo, la]) => ortho(lo * Math.PI / 180, la * Math.PI / 180, lon0, lat0, cx, cy, r)).filter(Boolean);
      if (grdPts.length < 5) return;
      const pole = ortho(0, lat0d * Math.PI / 180, lon0, lat0, cx, cy, r);
      if (!pole) return;
      const gr = g.createRadialGradient(pole[0], pole[1], r * 0.04, pole[0], pole[1], r * 0.42);
      gr.addColorStop(0, col0); gr.addColorStop(0.55, col1); gr.addColorStop(1, 'rgba(220,240,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(grdPts[0][0], grdPts[0][1]);
      for (const q of grdPts) g.lineTo(q[0], q[1]);
      g.lineTo(pole[0], pole[1]);
      g.closePath(); g.fill();
    };
    cap(90, 72, 'rgba(255,255,255,0.95)', 'rgba(220,240,255,0.7)');
    cap(-90, -62, 'rgba(255,255,255,0.95)', 'rgba(220,240,255,0.65)');

    // layered "drifting" cloud bands + a couple of cyclones
    const puff = (lo, la, sx, sy, rot, a) => {
      const p = ortho(lo * Math.PI / 180, la * Math.PI / 180, lon0, lat0, cx, cy, r);
      if (!p || p[2] < 0.12) return;
      const k = 0.35 + p[2] * 0.65;
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.save(); g.translate(p[0], p[1]); g.rotate(rot);
      g.beginPath(); g.ellipse(0, 0, sx * k, sy * k, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    const bands = [
      { lat: 22, w: 10, shift: 18, dens: 0.72, a: 0.22 },
      { lat: 8,  w: 8,  shift: -14, dens: 0.55, a: 0.18 },
      { lat: -18, w: 9, shift: 28, dens: 0.62, a: 0.20 },
      { lat: 42, w: 8,  shift: -22, dens: 0.48, a: 0.16 },
      { lat: -32, w: 7, shift: 8,  dens: 0.4,  a: 0.14 },
    ];
    g.save();
    for (const b of bands) {
      for (let lo = -180; lo < 180; lo += 6) {
        if (R() > b.dens) continue;
        puff(lo + b.shift + (R() - 0.5) * 8, b.lat + (R() - 0.5) * b.w,
             r * (0.07 + R() * 0.11), r * (0.018 + R() * 0.025), -0.15 + R() * 0.3, b.a * (0.7 + R() * 0.5));
      }
    }
    // two cyclones
    const storms = [[-58, 18, 1], [8, -14, -1]];
    for (const [lo, la, dir] of storms) {
      const p = ortho(lo * Math.PI / 180, la * Math.PI / 180, lon0, lat0, cx, cy, r);
      if (!p || p[2] < 0.2) continue;
      g.strokeStyle = 'rgba(255,255,255,0.38)'; g.lineWidth = 1.3; g.lineCap = 'round';
      const s = r * 0.11 * p[2];
      for (let arm = 0; arm < 3; arm++) {
        g.beginPath();
        for (let t = 0.12; t <= 1; t += 0.05) {
          const a = arm * 2.1 + dir * t * 5.2;
          const rad = s * t;
          const x = p[0] + Math.cos(a) * rad, y = p[1] + Math.sin(a) * rad * 0.85;
          t < 0.17 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,0.28)';
      g.beginPath(); g.arc(p[0], p[1], s * 0.18, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  function finishEarth(g, cx, cy, r, R) {
    const lon0 = -30 * Math.PI / 180, lat0 = 10 * Math.PI / 180;
    // terminator: day upper-left, night lower-right
    const lg = g.createLinearGradient(cx - r * 0.2, cy - r * 0.28, cx + r * 0.72, cy + r * 0.38);
    lg.addColorStop(0, 'rgba(255,255,230,0.14)');
    lg.addColorStop(0.36, 'rgba(0,0,0,0)');
    lg.addColorStop(0.50, 'rgba(0,8,28,0.22)');
    lg.addColorStop(0.64, 'rgba(0,4,20,0.70)');
    lg.addColorStop(1, 'rgba(0,2,12,0.90)');
    g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    // keep a hint of sphere wrap on the night limb
    const vg = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.2, cx, cy, r);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.78, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = vg; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();

    // faint city lights on the night side
    const cities = [
      [-74,41,12],[-71,42,7],[-77,39,8],[-80,26,6],[-88,42,8],[-79,44,6],
      [-95,30,7],[-99,19,11],[-118,34,10],[-122,37,7],[-87,42,5],
      [-47,-23,10],[-43,-23,8],[-58,-35,8],[-70,-33,5],[-79,9,4],
      [0,51,10],[2,49,9],[13,52,9],[-4,40,6],[12,42,7],[-9,39,4],[8,50,7],[18,48,5],[23,38,5],
      [3,6,7],[31,30,8],[-17,15,4],[-7,33,5],[10,36,5],[18,59,4],[28,-26,7],
      [36,15,5],[32,0,5],[18,-34,7],[-13,8,4],[13,-9,5],
    ];
    const lx = -0.55, ly = 0.45, lz = 0.70, llen = Math.hypot(lx, ly, lz);
    const ndot = (lo, la) => {
      const p = ortho(lo * Math.PI / 180, la * Math.PI / 180, lon0, lat0, cx, cy, r);
      if (!p) return { p: null, lit: 1 };
      // sphere normal in camera frame ≈ (x, -y in canvas→up, z)
      const nx = (p[0] - cx) / r, ny = -(p[1] - cy) / r, nz = p[2];
      return { p, lit: (nx * lx + ny * ly + nz * lz) / llen };
    };
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [lo, la, n] of cities) {
      const { p, lit } = ndot(lo, la);
      if (!p || lit > 0.28) continue;           // night + twilight (lights show best near the terminator)
      const vis = Math.min(1, Math.max(0, 0.4 + (-lit) * 1.15));
      if (vis < 0.15) continue;
      SL.glow(g, p[0], p[1], 4.5 + n * 0.45, 3.0 + n * 0.28, '255,190,80', 0.42 * vis);
      for (let i = 0; i < n; i++) {
        const ox = (R() - 0.5) * 6.5, oy = (R() - 0.5) * 5;
        const a = (0.5 + R() * 0.5) * vis;
        g.fillStyle = R() < 0.3 ? `rgba(255,230,160,${a})` : `rgba(255,180,70,${a})`;
        const s = 0.9 + R() * 1.4;
        g.fillRect(p[0] + ox - s / 2, p[1] + oy - s / 2, s, s);
      }
    }
    g.restore();
  }

  function drawToxicSurface(g, cx, cy, r, R) {
    // banded acid gas-giant, slightly tilted
    g.save();
    g.translate(cx, cy); g.rotate(-0.16);
    const bands = [
      [-1.00, '#101806'], [-0.82, '#3a5a0c'], [-0.64, '#8cb428'], [-0.48, '#24320a'],
      [-0.32, '#c8e048'], [-0.16, '#4a6e12'], [-0.02, '#1a2808'], [0.14, '#6a9418'],
      [0.30, '#d0f060'], [0.46, '#2e4a0c'], [0.62, '#7aa020'], [0.78, '#152008'],
      [1.05, '#4e6e14'],
    ];
    // base fill
    g.fillStyle = '#1a2808';
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < bands.length - 1; i++) {
      const y0 = bands[i][0] * r, y1 = bands[i + 1][0] * r;
      const amp = r * (0.018 + (i % 3) * 0.01);
      const f1 = 3 + (i % 4), f2 = 7 + (i % 3), ph = i * 1.7;
      g.fillStyle = bands[i][1];
      g.beginPath();
      g.moveTo(-r * 1.05, y0);
      for (let x = -r; x <= r; x += r * 0.04) {
        const y = y0 + amp * Math.sin(x / r * f1 + ph) + amp * 0.45 * Math.sin(x / r * f2 + ph * 1.3);
        g.lineTo(x, y);
      }
      for (let x = r; x >= -r; x -= r * 0.04) {
        const y = y1 + amp * 0.85 * Math.sin(x / r * f1 + ph + 0.6) + amp * 0.35 * Math.sin(x / r * f2 + 1);
        g.lineTo(x, y);
      }
      g.closePath(); g.fill();
    }
    // swirling acid storms
    const storms = [
      [r * 0.22, r * 0.06, r * 0.22, r * 0.13, 0],
      [-r * 0.35, -r * 0.28, r * 0.12, r * 0.08, 0.4],
      [r * 0.05, -r * 0.48, r * 0.09, r * 0.06, -0.3],
    ];
    for (const [sx, sy, rw, rh, rot] of storms) {
      g.save(); g.translate(sx, sy); g.rotate(rot);
      const sg = g.createRadialGradient(-rw * 0.2, -rh * 0.2, rh * 0.1, 0, 0, rw);
      sg.addColorStop(0, 'rgba(40,60,8,0.85)');
      sg.addColorStop(0.35, 'rgba(210,255,60,0.7)');
      sg.addColorStop(0.7, 'rgba(80,140,20,0.45)');
      sg.addColorStop(1, 'rgba(80,140,20,0)');
      g.fillStyle = sg; g.beginPath(); g.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2); g.fill();
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = 'rgba(220,255,80,0.45)'; g.lineWidth = 1.3; g.lineCap = 'round';
      for (let arm = 0; arm < 3; arm++) {
        g.beginPath();
        for (let t = 0.15; t <= 1; t += 0.05) {
          const a = arm * 2.1 + t * 5.0;
          const x = Math.cos(a) * rw * t, y = Math.sin(a) * rh * t;
          t < 0.2 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
      g.restore();
    }
    g.restore(); // leave tilt

    // glowing cracks + bubbling pools (in screen space, clipped by caller)
    g.save(); g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      let x = cx + (R() - 0.5) * r * 1.5, y = cy + (R() - 0.5) * r * 1.5;
      g.strokeStyle = `rgba(${R() < 0.4 ? '230,255,80' : '140,255,40'},${0.4 + R() * 0.4})`;
      g.lineWidth = 1 + R() * 2.2;
      g.beginPath(); g.moveTo(x, y);
      let dir = R() * Math.PI * 2;
      for (let k = 0; k < 5; k++) {
        dir += (R() - 0.5) * 0.9;
        x += Math.cos(dir) * r * 0.1; y += Math.sin(dir) * r * 0.1;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const a = R() * Math.PI * 2, d = R() * r * 0.62, rr = r * (0.035 + R() * 0.07);
      SL.glow(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr * 1.8, rr, R() < 0.5 ? '210,255,50' : '80,220,30', 0.55 + R() * 0.3);
    }
    g.restore();
  }

  function finishToxic(g, cx, cy, r) {
    const lg = g.createLinearGradient(cx - r * 0.2, cy - r * 0.28, cx + r * 0.7, cy + r * 0.36);
    lg.addColorStop(0, 'rgba(220,255,140,0.10)');
    lg.addColorStop(0.4, 'rgba(0,0,0,0)');
    lg.addColorStop(0.62, 'rgba(8,16,0,0.45)');
    lg.addColorStop(1, 'rgba(4,10,0,0.78)');
    g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  }

  function drawToxicRing(g, cx, cy, r, part) {
    g.save();
    g.translate(cx, cy);
    g.rotate(-0.36);
    if (part === 'back') { g.beginPath(); g.rect(-800, -800, 1600, 800); g.clip(); }
    if (part === 'front') { g.beginPath(); g.rect(-800, 0, 1600, 800); g.clip(); }
    g.scale(1, 0.26);
    g.globalCompositeOperation = 'lighter';
    const ring = (inner, outer, rgb, a) => {
      const grd = g.createRadialGradient(0, 0, inner, 0, 0, outer);
      grd.addColorStop(0, `rgba(${rgb},0)`);
      grd.addColorStop(0.4, `rgba(${rgb},${a})`);
      grd.addColorStop(0.7, `rgba(${rgb},${a * 0.7})`);
      grd.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = grd;
      g.beginPath(); g.arc(0, 0, outer, 0, Math.PI * 2);
      g.arc(0, 0, inner, 0, Math.PI * 2, true); g.fill();
    };
    ring(r * 1.22, r * 1.48, '180,255,50', 0.38);
    ring(r * 1.58, r * 1.82, '120,200,30', 0.28);
    g.restore();
  }

  function drawToxicMoon(g, cx, cy, r, R) {
    const mx = cx - r * 1.08, my = cy - r * 0.92, mr = r * 0.17;
    SL.glow(g, mx, my, mr * 1.8, mr * 1.8, '160,230,40', 0.22);
    g.save();
    g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.clip();
    const mg = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.35, mr * 0.1, mx, my, mr);
    mg.addColorStop(0, '#6a8a30'); mg.addColorStop(0.55, '#2a3a10'); mg.addColorStop(1, '#0c1004');
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 8; i++) {
      const a = R() * Math.PI * 2, d = R() * mr * 0.7, rr = mr * (0.12 + R() * 0.22);
      g.fillStyle = `rgba(10,16,4,${0.3 + R() * 0.4})`;
      g.beginPath(); g.arc(mx + Math.cos(a) * d, my + Math.sin(a) * d, rr, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(180,220,80,0.15)'; g.lineWidth = 0.8; g.stroke();
    }
    const sh = g.createLinearGradient(mx - mr * 0.3, my - mr * 0.3, mx + mr * 0.7, my + mr * 0.5);
    sh.addColorStop(0, 'rgba(255,255,200,0.08)'); sh.addColorStop(0.4, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = sh; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(180,255,70,0.45)'; g.lineWidth = 1.4;
    g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.stroke();
    g.restore();
  }

  function drawBlackHole(g, cx, cy, r, size) {
    const R = rng(55);
    // layered nebula clouds (behind the hole)
    const clouds = [
      [0, 0, 5.8, 4.0, '140,40,255', 0.28],
      [-2.1, -0.8, 3.2, 2.0, '255,50,200', 0.22],
      [2.3, 1.1, 3.0, 1.9, '60,40,255', 0.20],
      [0.3, -2.0, 2.4, 1.6, '180,80,255', 0.16],
      [-1.2, 1.6, 2.6, 1.7, '100,30,200', 0.14],
      [1.6, -1.4, 2.2, 1.5, '220,80,255', 0.12],
    ];
    for (const [dx, dy, rx, ry, rgb, a] of clouds) {
      SL.glow(g, cx + dx * r, cy + dy * r, rx * r, ry * r, rgb, a);
    }
    const tints = ['160,60,255', '255,50,200', '80,40,220', '200,100,255', '120,30,180', '180,80,255'];
    for (let i = 0; i < 12; i++) {
      SL.glow(g, cx + (R() - 0.5) * r * 6.5, cy + (R() - 0.5) * r * 4.4,
              r * (1.1 + R() * 2.0), r * (0.7 + R() * 1.4), tints[i % tints.length], 0.08 + R() * 0.10);
    }
    // dark dust lanes
    g.save();
    for (let i = 0; i < 5; i++) {
      const a = R() * Math.PI * 2, d = r * (1.2 + R() * 2.0);
      g.fillStyle = `rgba(8,0,20,${0.12 + R() * 0.16})`;
      g.save(); g.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7);
      g.rotate(a + 0.4); g.beginPath();
      g.ellipse(0, 0, r * (0.7 + R() * 0.8), r * (0.08 + R() * 0.1), 0, 0, Math.PI * 2);
      g.fill(); g.restore();
    }
    g.restore();

    // faint bipolar jets (axis perpendicular to the disk)
    const axis = -0.42 + Math.PI / 2;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const sign of [1, -1]) {
      const x0 = cx + Math.cos(axis) * sign * r * 1.15;
      const y0 = cy + Math.sin(axis) * sign * r * 1.15;
      const x1 = cx + Math.cos(axis) * sign * r * 4.4;
      const y1 = cy + Math.sin(axis) * sign * r * 4.4;
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(220,180,255,0.45)');
      gr.addColorStop(0.2, 'rgba(160,80,255,0.22)');
      gr.addColorStop(0.7, 'rgba(80,40,200,0.08)');
      gr.addColorStop(1, 'rgba(40,0,80,0)');
      g.strokeStyle = gr; g.lineCap = 'round';
      g.lineWidth = 6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.lineWidth = 2.2; g.strokeStyle = sign > 0 ? 'rgba(255,230,255,0.28)' : 'rgba(200,180,255,0.22)';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    g.restore();

    const diskRot = -0.42, dopCenter = 0.45;
    const fillAnnulus = (inner, outer, hot) => {
      g.save();
      g.beginPath();
      g.arc(0, 0, outer, 0, Math.PI * 2);
      g.arc(0, 0, inner, 0, Math.PI * 2, true);
      g.closePath(); g.clip();
      const cg = g.createConicGradient(hot, 0, 0);
      cg.addColorStop(0, 'rgba(255,245,210,1)');
      cg.addColorStop(0.10, 'rgba(255,180,80,0.92)');
      cg.addColorStop(0.22, 'rgba(255,90,40,0.55)');
      cg.addColorStop(0.40, 'rgba(140,40,180,0.22)');
      cg.addColorStop(0.50, 'rgba(70,20,120,0.12)');
      cg.addColorStop(0.60, 'rgba(140,40,180,0.22)');
      cg.addColorStop(0.78, 'rgba(255,90,40,0.55)');
      cg.addColorStop(0.90, 'rgba(255,180,80,0.92)');
      cg.addColorStop(1, 'rgba(255,245,210,1)');
      g.fillStyle = cg;
      const s = outer + 4;
      g.fillRect(-s, -s, s * 2, s * 2);
      g.globalCompositeOperation = 'destination-in';
      const rg = g.createRadialGradient(0, 0, inner, 0, 0, outer);
      rg.addColorStop(0, 'rgba(0,0,0,0)');
      rg.addColorStop(0.05, 'rgba(255,255,255,1)');
      rg.addColorStop(0.18, 'rgba(255,255,255,0.95)');
      rg.addColorStop(0.55, 'rgba(255,255,255,0.55)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(-s, -s, s * 2, s * 2);
      g.restore();
    };
    const disk = (part, scaleY, inner, outer) => {
      g.save();
      g.translate(cx, cy); g.rotate(diskRot);
      if (part === 'back') { g.beginPath(); g.rect(-1200, -1200, 2400, 1200); g.clip(); }
      if (part === 'front') { g.beginPath(); g.rect(-1200, 0, 2400, 1200); g.clip(); }
      g.scale(1, scaleY);
      g.globalCompositeOperation = 'lighter';
      fillAnnulus(inner, outer, dopCenter);
      g.restore();
    };

    disk('back', 0.36, r * 1.08, r * 2.75);

    // gravitationally lensed far-side disk (the "handle" over the hole)
    g.save();
    g.translate(cx, cy); g.rotate(diskRot);
    g.scale(1, 0.52);
    g.globalCompositeOperation = 'lighter';
    g.beginPath();
    g.rect(-1200, -1200, 2400, 1200); // back half only (over the top of the hole)
    g.clip();
    fillAnnulus(r * 1.04, r * 1.24, dopCenter);
    g.restore();

    // a few lensed star streaks (concentric arcs)
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(220,200,255,0.22)'; g.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const rad = r * (1.35 + R() * 0.9), a0 = R() * Math.PI * 2, span = 0.3 + R() * 0.7;
      g.globalAlpha = 0.15 + R() * 0.25;
      g.beginPath(); g.arc(cx, cy, rad, a0, a0 + span); g.stroke();
    }
    g.restore();

    // event horizon
    g.save();
    g.fillStyle = '#000';
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.restore();

    // photon ring — tight, Doppler-asymmetric, smooth
    g.save(); g.globalCompositeOperation = 'lighter';
    const pr = r + 1.6;
    const pg = g.createConicGradient(dopCenter + diskRot, cx, cy);
    pg.addColorStop(0, 'rgba(255,245,220,0.95)');
    pg.addColorStop(0.12, 'rgba(255,180,80,0.7)');
    pg.addColorStop(0.5, 'rgba(180,80,200,0.25)');
    pg.addColorStop(0.88, 'rgba(255,180,80,0.7)');
    pg.addColorStop(1, 'rgba(255,245,220,0.95)');
    g.strokeStyle = pg; g.lineWidth = 2.6;
    g.beginPath(); g.arc(cx, cy, pr, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,200,140,0.22)'; g.lineWidth = 5;
    g.beginPath(); g.arc(cx, cy, pr + 1.6, 0, Math.PI * 2); g.stroke();
    g.restore();

    disk('front', 0.36, r * 1.08, r * 2.75);
  }

  function getPlanet(p) {
    const k = planetKey(p);
    if (!planetCache[k]) planetCache[k] = makePlanet(p.kind, p.r);
    return planetCache[k];
  }

  function lerp(a, b, k) { return a + (b - a) * k; }

  function drawWash(g, z, alpha) {
    if (!z || alpha <= 0.001) return;
    const [r, gch, b, a] = z.wash;
    if (a > 0) {
      g.save();
      g.fillStyle = `rgba(${r},${gch},${b},${a * alpha})`;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
    for (const [x, y, rx, ry, rgb, ga] of z.glow) SL.glow(g, x, y, rx, ry, rgb, ga * alpha);
  }

  function drawPlanet(g, z, alpha) {
    if (!z || !z.planet || alpha <= 0.001) return;
    const p = z.planet, spr = getPlanet(p);
    g.save(); g.globalAlpha = alpha;
    g.drawImage(spr.c, p.x - spr.size / 2, p.y - spr.size / 2);
    g.restore();
  }

  function iceMix(fromId, toId, k) {
    // how "icy" the rocks should look (0 = normal palette, 1 = ice)
    const icy = (id) => id === 'ice' ? 1 : 0;
    return lerp(icy(fromId), icy(toId), k);
  }


  function cfg() { return SL.CONFIG.zones; }

  function at(t) {
    const C = cfg(), order = C.order, n = order.length, period = C.period, fade = C.fade;
    const T = Math.max(0, t);
    const step = Math.floor(T / period);
    const pos = T - step * period;
    const id = order[step % n];
    const next = order[(step + 1) % n];
    let k = 0, from = id, to = id;
    if (pos >= period - fade) {
      k = Math.min(1, (pos - (period - fade)) / fade);
      from = id; to = next;
    }
    return { t: T, step, pos, id, from, to, k, name: (k < 0.5 ? ZONES[from] : ZONES[to]).name, rgb: (k < 0.5 ? ZONES[from] : ZONES[to]).rgb };
  }

  SL.Zones = {
    defs: ZONES,
    at,
    iceMix(t) { const s = at(t); return iceMix(s.from, s.to, s.k); },
    warmup() {
      for (const id of Object.keys(ZONES)) {
        const p = ZONES[id].planet;
        if (p) getPlanet(p);
      }
    },
    draw(g, t) {
      if (!planetCache._warm) { this.warmup(); planetCache._warm = 1; }
      const s = at(t), A = ZONES[s.from], B = ZONES[s.to];
      if (s.k < 1) drawPlanet(g, A, 1 - s.k);
      if (s.k > 0) drawPlanet(g, B, s.k);
      if (s.k < 1) drawWash(g, A, 1 - s.k);
      if (s.k > 0) drawWash(g, B, s.k);
    },
    drawBanner(g, t) {
      const C = cfg(), s = at(t), dur = C.bannerTime;
      if (s.pos >= dur) return;
      let a = 1;
      if (s.pos < 0.28) a = s.pos / 0.28;
      else if (s.pos > dur - 0.5) a = Math.max(0, (dur - s.pos) / 0.5);
      const z = ZONES[s.id];
      SL.neonText(g, 'ENTERING: ' + z.name, 512, 200, 28, z.rgb, { blur: 18, alpha: a });
    },
  };
})();
