/* Dark Avrill secret encounter + Avrill support turret (v0.4.7). */
(() => {
  const { W, H, TILE } = SD;
  const C = () => SD.CONFIG;
  const buffRgb = () => (SD.AVRILL_BUFF && SD.AVRILL_BUFF.rgb) || '255,70,200';

  function mixRgb(a, b, t) {
    const pa = String(a || '255,255,255').split(',').map(Number);
    const pb = String(b || buffRgb()).split(',').map(Number);
    return pa.map((v, i) => Math.round(v * (1 - t) + (pb[i] || 0) * t)).join(',');
  }

  function speakerPortrait(who, fallback) {
    if (who === 'nebula') return 'nebula';
    if (who === 'joe') return fallback || 'joe';
    if (who === 'darkavrill') return 'darkAvrill';
    if (who === 'avrill') return 'avrill';
    if (who === 'edisar') return 'edisar';
    return fallback || 'edisar';
  }

  function speakerTitle(who, title) {
    if (title) return title;
    if (who === 'nebula') return 'DR. NEBULA';
    if (who === 'darkavrill') return 'DARK AVRILL';
    if (who === 'avrill') return 'AVRILL';
    return 'EDISAR STARLIGHT';
  }

  function speakerRgb(who, rgb) {
    if (rgb) return rgb;
    if (who === 'nebula') return '255,80,100';
    if (who === 'darkavrill') return '255,70,120';
    if (who === 'avrill') return '180,220,255';
    return '255,205,90';
  }

  const P = SD.Defense.prototype;

  P.avrillUnlocked = function () {
    const p = this.progress || SD.Progress.load();
    return !!(p && (p.avrillTurret || p.avrillKilled));
  };
  P.nebulaSkinOn = function () {
    const p = this.progress || this._progress || SD.Progress.load();
    return !!(p && p.nebulaSkin && p.nebulaSkinOn);
  };
  P.shopKinds = function () {
    const list = ['laser', 'missile', 'ice', 'railgun', 'tesla', 'pulse', 'nebula'];
    if (this.avrillUnlocked()) list.push('avrill');
    return list;
  };
  P.avrillAuraRange = function () {
    const conf = C().turrets.avrill;
    return (conf && (conf.aura || (conf.range && conf.range[0]))) || 168;
  };
  P.avrillTurrets = function () {
    return (this.turrets || []).filter(t => t.kind === 'avrill' && !t.disabledT);
  };
  P.avrillBuffed = function (t) {
    if (!t || t.kind === 'avrill') return false;
    const range = this.avrillAuraRange();
    return this.avrillTurrets().some(a => Math.hypot(a.x - t.x, a.y - t.y) <= range);
  };
  P.shotRgbFor = function (t, base) {
    if (t && this.avrillBuffed(t)) return mixRgb(base, buffRgb(), 0.55);
    return base;
  };

  P.beginCutscene = function (kind, lines, opt) {
    opt = opt || {};
    const items = (lines || []).map(ln => ({
      who: ln.who,
      title: speakerTitle(ln.who, ln.title),
      name: ln.name || '',
      text: ln.text,
      rgb: speakerRgb(ln.who, ln.rgb),
      portrait: speakerPortrait(ln.who, ln.portrait),
      hold: ln.hold || 5.2,
    }));
    this.cutscene = {
      kind,
      items,
      i: 0,
      life: items[0] ? items[0].hold : 0,
      max: items[0] ? items[0].hold : 1,
      tint: opt.tint || 'purple',
      onDone: opt.onDone || null,
    };
    this.bossLine = null;
    this.joePending = null;
  };

  P.tickCutscene = function (dt) {
    const q = this.cutscene;
    if (!q) return;
    q.life -= dt;
    if (q.life > 0) return;
    this.advanceCutscene();
  };

  P.advanceCutscene = function () {
    const q = this.cutscene;
    if (!q) return;
    if (q.items && q.i < q.items.length - 1) {
      q.i += 1;
      const it = q.items[q.i];
      q.max = (it && it.hold) || 5.2;
      q.life = q.max;
    } else {
      this.endCutscene();
    }
  };

  P.skipCutscene = function () {
    if (!this.cutscene) return;
    this.endCutscene();
  };

  P.endCutscene = function () {
    const q = this.cutscene;
    this.cutscene = null;
    if (q && typeof q.onDone === 'function') q.onDone.call(this);
  };

  P.handleCutsceneInput = function () {
    const clicks = SD.Input.takeReleased().filter(u => u.tap && u.button !== 2);
    SD.Input.takeDowns();
    if (SD.Input.hit('Escape')) { this.skipCutscene(); SD.Audio.click(); return; }
    if (SD.Input.confirm() || SD.Input.hit('Space') || clicks.length) {
      this.advanceCutscene();
      SD.Audio.click();
    }
    if (SD.Input.hit('KeyM')) { SD.Audio.toggleMute(); SD.Audio.click(); }
  };

  P.beginAvrillIntro = function () {
    this.avrillSeenThisRun = true;
    if (SD.Audio.playAvrillCut) SD.Audio.playAvrillCut();
    this.beginCutscene('avrill-intro', C().avrillIntro, {
      tint: 'purple',
      onDone: function () { this.spawnDarkAvrillFight(); },
    });
  };

  P.spawnDarkAvrillFight = function () {
    this.avrillFight = true;
    if (SD.Audio.playAvrillFight) SD.Audio.playAvrillFight();
    const open = this.siegeOpenPaths ? this.siegeOpenPaths() : [0];
    const gate = open[open.length - 1] || 0;
    const boss = this.spawn('darkAvrill', 40, gate);
    if (boss) {
      boss.avrillPhase = 1;
      boss.teleportCd = 6;
      boss.saibotCd = 3;
      boss.absorbCd = 0;
    }
    this.spawn('saibot', 80, open[0] || 0);
    if (open[1] != null) this.spawn('saibot', 90, open[1]);
    this.banner = { text: 'DARK AVRILL', life: 2.8, rgb: '255,80,140' };
  };

  P.syncAvrillPhase = function (e) {
    if (!e || e.type !== 'darkAvrill' || e.dead) return;
    const pct = e.hp / e.max;
    const phase = pct > 0.66 ? 1 : pct > 0.33 ? 2 : 3;
    if (phase === (e.avrillPhase || 1)) return;
    const prev = e.avrillPhase || 1;
    e.avrillPhase = phase;
    e.sprite = phase >= 3 ? 'darkAvrill3' : phase >= 2 ? 'darkAvrill2' : 'darkAvrill';
    this.fx.burst(e.x, e.y, '255,60,80', 36, 220, 0.9, 3);
    this.fx.ring(e.x, e.y, '255,40,80', 70, 0.7);
    if (phase === 2 && prev < 2) {
      this.banner = { text: 'CORE EXPOSED', life: 2.2, rgb: '255,80,120' };
      for (let i = 0; i < 3; i++) this.spawnAvrillSaibot(e);
    }
    if (phase === 3 && prev < 3) {
      this.banner = { text: 'SHE WON\'T HOLD', life: 2.2, rgb: '255,60,90' };
      e.speed = (e.speed || 18) * 1.25;
    }
  };

  P.spawnAvrillSaibot = function (boss) {
    const open = this.siegeOpenPaths ? this.siegeOpenPaths() : [0];
    const gate = open[Math.floor(Math.random() * open.length)] || 0;
    const s = this.spawn('saibot', 30 + Math.random() * 80, gate);
    if (s && boss) s.ang = boss.ang;
    return s;
  };

  P.teleportDarkAvrill = function (e) {
    if (!e || e.dead) return;
    const open = this.siegeOpenPaths ? this.siegeOpenPaths() : [0];
    const gate = open[Math.floor(Math.random() * open.length)] || 0;
    const route = this.paths[gate] || this.path;
    if (!route) return;
    this.fx.burst(e.x, e.y, '180,40,120', 22, 160, 0.5, 2.4);
    this.fx.ring(e.x, e.y, '200,60,160', 48, 0.4);
    e.pathI = gate;
    e.route = route;
    e.flight = SD.makeBossFlight ? SD.makeBossFlight(route) : e.flight;
    if (e.flight) {
      e.flightPace = e.flight.total / Math.max(1, route.total || 1);
      const frac = 0.18 + Math.random() * 0.28;
      e.dist = e.flight.total * frac;
      const fp = SD.posOnFlight ? SD.posOnFlight(e.flight, e.dist) : { x: e.x, y: e.y, ang: e.ang };
      e.x = fp.x; e.y = fp.y; e.ang = fp.ang;
    }
    this.fx.burst(e.x, e.y, '255,70,160', 22, 160, 0.5, 2.4);
    this.fx.ring(e.x, e.y, '255,80,180', 48, 0.4);
    if (SD.Audio.boss) SD.Audio.boss();
  };

  P.tickDarkAvrill = function (e, dt) {
    if (!e || e.type !== 'darkAvrill' || e.dead) return;
    this.syncAvrillPhase(e);
    const phase = e.avrillPhase || 1;
    e.teleportCd = (e.teleportCd || 0) - dt;
    if (e.teleportCd <= 0) {
      e.teleportCd = phase >= 3 ? 7 : 10;
      this.teleportDarkAvrill(e);
    }
    e.saibotCd = (e.saibotCd || 0) - dt;
    const saibotGap = phase >= 2 ? 8 : 12;
    const saibotN = phase >= 2 ? 3 : 2;
    if (e.saibotCd <= 0) {
      e.saibotCd = saibotGap;
      const live = (this.enemies || []).filter(s => !s.dead && s.type === 'saibot').length;
      const need = Math.min(saibotN, 8 - live);
      for (let i = 0; i < need; i++) this.spawnAvrillSaibot(e);
    }
    if (phase >= 3) {
      e.absorbCd = (e.absorbCd || 0) - dt;
      if (e.absorbCd <= 0) {
        e.absorbCd = 4;
        let healed = 0;
        for (const s of this.enemies || []) {
          if (s.dead || s.type !== 'saibot') continue;
          if (Math.hypot(s.x - e.x, s.y - e.y) > 150) continue;
          const amt = e.max * 0.04;
          e.hp = Math.min(e.max, e.hp + amt);
          healed += amt;
          this.fx.burst(s.x, s.y, buffRgb(), 10, 80, 0.35, 1.6);
          s.hp = 0;
          this.kill(s, false);
        }
        if (healed > 0) this.floater(e, 'ABSORB', '255,80,140');
      }
    }
    // in-fight lines, rate-limited
    if (!this.cutscene && !this.talkBusy() && !this.shot) {
      e.lineCd = (e.lineCd == null ? 6 : e.lineCd - dt);
      if (e.lineCd <= 0) {
        e.lineCd = 8.5;
        this.sayAvrillFightLine();
      }
    }
  };

  P.sayAvrillFightLine = function () {
    const pool = C().avrillFight || [];
    if (!pool.length) return;
    const ln = pool[Math.floor(Math.random() * pool.length)];
    if (!ln || !ln.text) return;
    if (ln.reply) this.showBossLine(ln.title || 'The Siege', ln.text, ln.reply);
    else {
      const who = ln.who || 'darkavrill';
      this.bossLine = {
        items: [{
          who, title: speakerTitle(who, ln.title), name: ln.name || 'The Siege',
          text: ln.text, rgb: speakerRgb(who), portrait: speakerPortrait(who), hold: 4.4,
        }],
        i: 0, life: 4.4, max: 4.4,
      };
    }
  };

  P.onAvrillKilled = function (e) {
    if (this._avrillEnding) return;
    this._avrillEnding = true;
    this.avrillFight = false;
    // clear remaining saibots
    for (const s of this.enemies || []) {
      if (!s.dead && s.type === 'saibot') this.kill(s, false);
    }
    const rec = this.shot ? { first: false, progress: this.progress || {} } : SD.Progress.recordAvrill();
    this._avrillReward = rec;
    if (this.progress && rec.progress) {
      this.progress.avrillStars = rec.progress.avrillStars;
      this.progress.avrillMedal = rec.progress.avrillMedal;
      this.progress.avrillTurret = rec.progress.avrillTurret;
      this.progress.nebulaSkin = rec.progress.nebulaSkin;
      this.progress.avrillKilled = rec.progress.avrillKilled;
    }
    if (this.endless) {
      this.siegeScore = (this.siegeScore || 0) + 8000;
      this.siegeParts.bosses = (this.siegeParts.bosses || 0) + 8000;
    }
    if (SD.Audio.playAvrillCut) SD.Audio.playAvrillCut();
    const self = this;
    this.beginCutscene('avrill-end', C().avrillEnding, {
      tint: 'purple',
      onDone: function () { self.openAvrillReward(); },
    });
  };

  P.openAvrillReward = function () {
    const first = !!(this._avrillReward && this._avrillReward.first);
    this.avrillReward = { life: 7.5, first, t: 0 };
    this.banner = { text: first ? '+5 ARMORY STARS' : 'DARK AVRILL FALLS', life: 3.2, rgb: '255,180,220' };
    if (SD.Audio.playSiege) SD.Audio.playSiege();
  };

  P.tickAvrillReward = function (dt) {
    if (!this.avrillReward) return;
    this.avrillReward.t += dt;
    this.avrillReward.life -= dt;
    if (this.avrillReward.life <= 0) this.avrillReward = null;
  };

  P.drawAvrillReward = function (g) {
    const r = this.avrillReward;
    if (!r) return;
    const a = Math.min(1, r.t * 3, r.life * 2);
    const x = W / 2, y = 150, w = 520, h = 168;
    g.save();
    g.globalAlpha = 0.92 * a;
    SD.roundRect(g, x - w / 2, y, w, h, 12);
    g.fillStyle = 'rgba(12,6,16,0.88)'; g.fill();
    g.strokeStyle = 'rgba(255,70,200,0.7)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
    SD.neonText(g, 'DARK AVRILL  FALLS', x, y + 36, 22, '255,120,180', { blur: 12, alpha: a });
    const lines = r.first
      ? ['+5 ARMORY STARS', 'MEDAL UNLOCKED', 'DARK NEBULA SKIN  ·  AVRILL TURRET']
      : ['You already claimed the ARMORY rewards.', 'The Avrill turret and dark skin stay yours.'];
    lines.forEach((ln, i) => {
      SD.neonText(g, ln, x, y + 70 + i * 24, 14, '255,200,230', { blur: 6, alpha: a });
    });
  };

  P.drawCutscene = function (g) {
    const q = this.cutscene;
    if (!q || !q.items) return;
    const it = q.items[q.i];
    if (!it) return;
    // purple veil
    g.save();
    g.fillStyle = 'rgba(40,0,60,0.38)';
    g.fillRect(0, 0, W, H - ((C().hud && C().hud.bottom) || 92));
    g.restore();
    const fadeIn = Math.min(1, (q.max - q.life) * 4);
    const fadeOut = Math.min(1, q.life * 3.5);
    const a = Math.min(fadeIn, fadeOut);
    const box = {
      w: Math.min(W - 80, 640),
      por: 72,
      titleSz: 15,
      bodySz: 16,
      lineH: 20,
      radius: 10,
      maxLines: 4,
      pad: 14,
    };
    // temporarily draw a centered toast by using a custom box
    this.drawCutsceneToast(g, {
      alpha: a,
      rgb: it.rgb,
      title: it.title,
      sub: it.name,
      lines: [it.text],
      portrait: it.portrait,
      box,
    });
    const hint = SD.Input.touchMode ? 'TAP TO CONTINUE  ·  HOLD TO SKIP' : 'CLICK / SPACE  ·  ESC TO SKIP';
    SD.neonText(g, hint, W / 2, H - ((C().hud && C().hud.bottom) || 92) - 10, 11, '220,200,255', { blur: 5, alpha: a * 0.8 });
  };

  P.drawCutsceneToast = function (g, opt) {
    const a = opt.alpha;
    if (a <= 0.03) return;
    const box = opt.box;
    const por = opt.portrait ? box.por : 0;
    const pad = box.pad, gap = por ? 12 : 0;
    const textW = box.w - pad * 2 - por - gap;
    g.save();
    g.font = 'bold ' + box.bodySz + 'px ' + (SD.CONFIG.font || 'sans-serif');
    const body = [];
    (opt.lines || []).forEach(ln => this.wrapLine(g, ln, textW).forEach(w => body.push(w)));
    g.restore();
    const lines = body.slice(0, box.maxLines);
    const heading = opt.sub ? (opt.title + '  ·  ' + String(opt.sub).toUpperCase()) : opt.title;
    const h = Math.max(por ? por + 16 : 0, pad + box.titleSz + 6 + lines.length * box.lineH + pad);
    const x = (W - box.w) / 2;
    const barTop = H - ((C().hud && C().hud.bottom) || 92);
    const y = Math.max(80, Math.min(barTop - h - 36, (H - 92) / 2 - h / 2 + 20));
    const textX = x + pad + por + gap;
    const rgb = opt.rgb || '200,220,255';
    g.save();
    g.globalAlpha = 0.94 * a;
    SD.roundRect(g, x, y, box.w, h, box.radius);
    g.fillStyle = 'rgba(10,4,18,0.88)'; g.fill();
    g.strokeStyle = `rgba(${rgb},0.8)`; g.lineWidth = 1.5; g.stroke();
    g.restore();
    if (opt.portrait) {
      const px = x + pad, py = y + (h - por) / 2;
      const im = SD.Portraits && SD.Portraits[opt.portrait];
      g.save();
      g.globalAlpha = a;
      SD.roundRect(g, px, py, por, por, 8);
      g.fillStyle = 'rgba(8,4,20,0.9)'; g.fill();
      g.clip();
      if (im && im.complete && im.naturalWidth) g.drawImage(im, px, py, por, por);
      g.restore();
      g.save();
      g.globalAlpha = a;
      SD.roundRect(g, px, py, por, por, 8);
      g.strokeStyle = `rgba(${rgb},0.95)`; g.lineWidth = 1.6;
      g.shadowColor = `rgba(${rgb},0.7)`; g.shadowBlur = 8 * (SD.view && SD.view.scale || 1);
      g.stroke();
      g.restore();
    }
    let ty = y + pad + box.titleSz;
    SD.neonText(g, heading, textX, ty, box.titleSz, rgb, { blur: 6, alpha: a, align: 'left' });
    ty += 6 + box.lineH;
    lines.forEach((ln, i) => {
      SD.neonText(g, ln, textX, ty + i * box.lineH, box.bodySz, '240,235,245', { blur: 5, alpha: a, align: 'left' });
    });
  };

  P.drawAvrillBuffs = function (g) {
    const sources = this.avrillTurrets();
    if (!sources.length) return;
    const rgb = buffRgb();
    const range = this.avrillAuraRange();
    const pulse = 0.55 + 0.45 * Math.sin((this.T || 0) * 3.2);
    for (const a of sources) {
      // pulsing pink glow on the Avrill turret
      SD.glow(g, a.x, a.y, 34, 34, rgb, 0.28 + 0.22 * pulse);
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.beginPath(); g.arc(a.x, a.y, 26 + 4 * pulse, 0, Math.PI * 2);
      g.strokeStyle = `rgba(${rgb},${0.45 + 0.25 * pulse})`;
      g.lineWidth = 2; g.stroke();
      g.restore();
      for (const t of this.turrets || []) {
        if (t === a || t.kind === 'avrill') continue;
        const d = Math.hypot(t.x - a.x, t.y - a.y);
        if (d > range) continue;
        t._avrillBuff = true;
        // energy link
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = `rgba(${rgb},${0.35 + 0.3 * pulse})`;
        g.lineWidth = 2.2;
        g.shadowColor = `rgba(${rgb},0.9)`;
        g.shadowBlur = 8 * (SD.view && SD.view.scale || 1);
        g.beginPath();
        g.moveTo(a.x, a.y);
        const mx = (a.x + t.x) / 2, my = (a.y + t.y) / 2;
        g.quadraticCurveTo(mx, my - 12, t.x, t.y);
        g.stroke();
        g.restore();
        // glow ring + up-arrow on buffed turret
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.beginPath(); g.arc(t.x, t.y, 22, 0, Math.PI * 2);
        g.strokeStyle = `rgba(${rgb},${0.55 + 0.25 * pulse})`;
        g.lineWidth = 2; g.stroke();
        g.restore();
        const ax = t.x + 16, ay = t.y - 20;
        g.save();
        g.fillStyle = `rgba(${rgb},${0.85})`;
        g.beginPath();
        g.moveTo(ax, ay - 6);
        g.lineTo(ax + 5, ay + 1);
        g.lineTo(ax + 2, ay + 1);
        g.lineTo(ax + 2, ay + 7);
        g.lineTo(ax - 2, ay + 7);
        g.lineTo(ax - 2, ay + 1);
        g.lineTo(ax - 5, ay + 1);
        g.closePath(); g.fill();
        g.restore();
      }
    }
  };

  P.drawAvrillEnemyFx = function (g, e) {
    if (!e || e.type !== 'darkAvrill' || e.dead) return;
    if ((e.avrillPhase || 1) >= 3) {
      const rgb = '255,50,80';
      SD.glow(g, e.x, e.y, 80, 50, rgb, 0.18 + 0.1 * Math.sin((this.T || 0) * 6));
    }
  };

  P.prepareSiegeAt = function (n) {
    n = Math.max(1, n | 0);
    if (this.siegeApplyPhase) this.siegeApplyPhase(n);
    this.waveIndex = n - 1;
    this.wavesCleared = n - 1;
    this.waveActive = false;
    this.waveTimer = 0;
    this.groups = [];
    this.credits = Math.max(this.credits, 2400);
    this.pickingHero = false;
    if (!this.hero) this.spawnHero(this.heroKind || 'oakens');
  };

  P.holdCutsceneLine = function (i) {
    const q = this.cutscene;
    if (!q || !q.items) return;
    q.i = Math.max(0, Math.min(q.items.length - 1, i | 0));
    const it = q.items[q.i];
    q.max = (it && it.hold) || 6;
    q.life = q.max - 0.4;
  };

  SD.mixRgb = mixRgb;
  SD.avrillBuffRgb = buffRgb;
})();
