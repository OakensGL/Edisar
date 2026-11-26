/* Metallic sci-fi UI primitives, lock icon, planets, and screen fades.
   Glow is an accent only — volume comes from shaded metal, not neon. */
(() => {
  const { W, H } = SD;

  SD.drawLockIcon = function (g, x, y, size, rgb, alpha) {
    const a = alpha != null ? alpha : 0.9;
    const s = size || 10;
    g.save();
    g.translate(x, y);
    g.strokeStyle = `rgba(${rgb},${a})`;
    g.fillStyle = `rgba(${rgb},${a * 0.28})`;
    g.lineWidth = Math.max(1.15, s * 0.14);
    g.beginPath();
    g.arc(0, -s * 0.22, s * 0.30, Math.PI * 0.95, Math.PI * 0.05, false);
    g.stroke();
    SD.roundRect(g, -s * 0.40, -s * 0.08, s * 0.80, s * 0.68, s * 0.12);
    g.fill();
    g.stroke();
    g.beginPath();
    g.arc(0, s * 0.18, s * 0.09, 0, Math.PI * 2);
    g.fillStyle = `rgba(${rgb},${a * 0.85})`;
    g.fill();
    g.restore();
  };

  SD.drawMetalPanel = function (g, x, y, w, h, r, opt) {
    opt = opt || {};
    const rgb = opt.rgb || '160,180,200';
    g.save();
    SD.roundRect(g, x, y, w, h, r || 10);
    const gr = g.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, opt.top || 'rgba(48,56,70,0.94)');
    gr.addColorStop(0.45, opt.mid || 'rgba(18,22,30,0.96)');
    gr.addColorStop(1, opt.bot || 'rgba(10,12,18,0.96)');
    g.fillStyle = gr;
    g.fill();
    g.strokeStyle = `rgba(${rgb},${opt.edge != null ? opt.edge : 0.35})`;
    g.lineWidth = opt.line || 1.2;
    g.stroke();
    g.beginPath();
    SD.roundRect(g, x + 1, y + 1, w - 2, Math.max(3, h * 0.18), r || 10);
    g.clip();
    g.fillStyle = 'rgba(220,230,240,0.08)';
    g.fillRect(x, y, w, h);
    g.restore();
  };

  const _oldButton = SD.drawButton;
  SD.drawButton = function (g, b, selected, t = 0) {
    const rgb = b.disabled ? '110,118,128' : (b.rgb || '180,200,220');
    const x = b.x - b.w / 2, y = b.y - b.h / 2, r = b.radius ?? 7;
    g.save();
    if (b.drop) {
      g.shadowColor = 'rgba(0,0,0,0.65)';
      g.shadowBlur = 12 * (SD.view ? SD.view.scale : 1);
      g.shadowOffsetY = 2;
    }
    SD.roundRect(g, x, y, b.w, b.h, r);
    const gr = g.createLinearGradient(x, y, x, y + b.h);
    if (b.disabled) {
      gr.addColorStop(0, 'rgba(40,44,52,0.92)');
      gr.addColorStop(1, 'rgba(16,18,24,0.94)');
    } else if (selected) {
      gr.addColorStop(0, 'rgba(70,80,96,0.96)');
      gr.addColorStop(0.5, 'rgba(28,34,44,0.96)');
      gr.addColorStop(1, 'rgba(14,16,22,0.96)');
    } else {
      gr.addColorStop(0, 'rgba(56,64,78,0.94)');
      gr.addColorStop(0.5, 'rgba(22,26,34,0.95)');
      gr.addColorStop(1, 'rgba(12,14,20,0.95)');
    }
    g.fillStyle = b.fill && !selected ? b.fill : gr;
    g.fill();
    g.shadowColor = 'transparent';
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;
    g.lineWidth = selected ? 1.8 : 1.15;
    g.strokeStyle = `rgba(${rgb},${selected ? 0.85 : 0.42})`;
    if (selected && !b.disabled) {
      g.shadowColor = `rgba(${rgb},0.55)`;
      g.shadowBlur = 8 * (SD.view ? SD.view.scale : 1);
    }
    g.stroke();
    g.restore();
    const labelY = b.labelY != null ? b.labelY : (b.sub ? -7 : 1);
    const subY = b.subY != null ? b.subY : 12;
    const alpha = b.disabled ? 0.5 : 1;
    SD.neonText(g, b.label, b.x, b.y + labelY, b.size || 16, rgb, { alpha, blur: selected ? 6 : 3 });
    if (b.sub) SD.neonText(g, b.sub, b.x, b.y + subY, b.subSize || 11, b.disabled ? '150,155,165' : (b.subRgb || rgb), { blur: 3, alpha: 0.9 });
    if (b.lockedIcon) SD.drawLockIcon(g, b.x + b.w / 2 - 10, b.y - b.h / 2 + 10, 8, rgb, 0.8);
  };
  SD.drawButton._classic = _oldButton;

  SD.drawPlanet = function (g, x, y, r, rgb, opt) {
    opt = opt || {};
    const [R, G, B] = rgb.split(',').map(Number);
    g.save();
    g.beginPath(); g.arc(x, y, r + 3, 0, Math.PI * 2);
    g.fillStyle = `rgba(${rgb},${opt.ring || 0.14})`;
    g.fill();
    const grd = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
    grd.addColorStop(0, `rgb(${Math.min(255, R + 70)},${Math.min(255, G + 70)},${Math.min(255, B + 70)})`);
    grd.addColorStop(0.55, `rgb(${R},${G},${B})`);
    grd.addColorStop(1, `rgb(${Math.max(0, R - 70)},${Math.max(0, G - 70)},${Math.max(0, B - 80)})`);
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = grd; g.fill();
    g.strokeStyle = `rgba(220,230,240,${opt.locked ? 0.2 : 0.35})`;
    g.lineWidth = 1.1; g.stroke();
    if (opt.station) {
      g.strokeStyle = 'rgba(200,210,220,0.55)';
      g.lineWidth = 1;
      g.beginPath(); g.arc(x, y, r * 0.55, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(230,235,240,0.7)';
      g.fillRect(x - 1.2, y - r * 0.85, 2.4, r * 0.5);
    }
    g.restore();
  };

  SD.drawRoute = function (g, pts, opt) {
    opt = opt || {};
    if (!pts || pts.length < 2) return;
    g.save();
    g.lineWidth = opt.width || 2;
    g.strokeStyle = opt.rgb || 'rgba(160,180,200,0.4)';
    g.beginPath();
    pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
    g.stroke();
    g.restore();
  };

  /* Screen fade: dir 1 = fade to black then switch, -1 = fade in. */
  SD.Transition = {
    dir: 0, t: 0, dur: 0.18, pending: null,
    go(s, opt) {
      if (this.dir) { this._apply(s, opt); return; }
      this.pending = { s, opt: opt || {} };
      this.dir = 1; this.t = 0; this.dur = 0.16;
    },
    _apply(s, opt) {
      if (typeof this._start === 'function') this._start(s, opt || {});
    },
    tick(dt) {
      if (!this.dir) return;
      this.t += dt;
      if (this.t >= this.dur) {
        if (this.dir === 1 && this.pending) {
          const p = this.pending; this.pending = null;
          this._apply(p.s, p.opt);
          this.dir = -1; this.t = 0; this.dur = 0.2;
        } else if (this.dir === -1) {
          this.dir = 0; this.t = 0;
        }
      }
    },
    draw(g) {
      if (!this.dir) return;
      const u = Math.max(0, Math.min(1, this.t / this.dur));
      const a = this.dir === 1 ? u : 1 - u;
      g.save();
      g.fillStyle = `rgba(6,8,12,${a})`;
      g.fillRect(0, 0, W, H);
      g.restore();
    },
  };
})();
