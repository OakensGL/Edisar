/* v0.7.0 Skin Store: coins, unlocks, procedural skins, boosts, store screen. */
(() => {
  const { W, H } = SL;
  const K = {
    coins: 'starlight.coins',
    owned: 'starlight.skins.owned',
    equipped: 'starlight.skins.equipped',
    asteroids: 'starlight.stats.asteroids',
    cleanRun: 'starlight.story.cleanRun',
    beatEdisar: 'starlight.story.beatEdisar',
  };
  const int = (k, d = 0) => { const n = parseInt(SL.store.get(k, String(d)), 10); return isNaN(n) ? d : n; };
  const parseList = (k, d) => { try { const v = JSON.parse(SL.store.get(k, 'null')); return Array.isArray(v) ? v : d; } catch (e) { return d; } };

  const RATES = { gold: 8, story: 20, storyBoss: 35, storyFinal: 50, survivalEvery: 5 };
  const HUNTER_NEED = 5000, GHOST_STREAK = 120;

  const SKINS = [
    { id: 'default', name: 'Oakens Blue', short: 'DEFAULT', fill: '12,28,64', edge: '80,170,255', accent: '200,230,255',
      shot: '80,170,255', shotHi: '200,240,255', trail: ['180,230,255', '80,170,255', '40,80,200'],
      hint: 'The Fleet standard. Always yours.' },
    { id: 'supernova', name: 'Supernova', short: 'SUPERNOVA', fill: '80,16,48', edge: '255,62,165', accent: '255,210,122',
      shot: '255,110,199', shotHi: '255,200,230', trail: ['255,179,222', '255,62,165', '255,40,140'],
      hint: 'Unlock by finishing Story Mode.', star: true },
    { id: 'fleet', name: 'Fleet Commander', short: 'FLEET', fill: '245,243,238', edge: '212,175,55', accent: '27,42,74',
      shot: '255,213,79', shotHi: '255,240,180', trail: ['255,230,140', '255,201,64', '212,140,40'],
      hint: 'Unlock by defeating Commander Edisar (Level 30).', chevrons: true, cape: true },
    { id: 'rogue', name: 'Nebula Rogue', short: 'ROGUE', fill: '18,5,31', edge: '75,26,122', accent: '57,255,20',
      shot: '57,255,20', shotHi: '200,255,160', trail: ['124,255,79', '57,255,20', '75,26,122'],
      hint: 'Unlock by defeating every Nebula boss (Levels 5, 10, 15, 20, 25).', spikes: true, cracks: true },
    { id: 'hunter', name: 'Asteroid Hunter', short: 'HUNTER', fill: '28,26,28', edge: '255,106,0', accent: '255,195,0',
      shot: '255,140,26', shotHi: '255,220,120', trail: ['255,195,0', '255,69,0', '120,30,0'],
      hint: 'Unlock by destroying 5,000 asteroids.', lava: true },
    { id: 'ghost', name: 'Ghost', short: 'GHOST', fill: '191,233,255', edge: '255,255,255', accent: '127,184,255',
      shot: '224,246,255', shotHi: '255,255,255', trail: ['220,245,255', '191,233,255', '120,180,230'],
      hint: 'Buy for 150 coins, or survive 2:00 in Survival without taking damage.',
      price: 150, ghost: true },
    { id: 'retro', name: 'Neon Retro', short: 'RETRO', fill: '10,10,20', edge: '255,46,151', accent: '0,240,255',
      shot: '255,46,151', shotHi: '0,240,255', trail: ['255,46,151', '0,240,255', '80,20,120'],
      hint: 'Buy for 90 coins.', price: 90, retro: true, altShot: '0,240,255' },
    { id: 'gold', name: 'Gold', short: 'GOLD', fill: '184,134,11', edge: '255,215,0', accent: '17,17,17',
      shot: '255,230,128', shotHi: '255,255,220', trail: ['255,240,180', '255,215,0', '160,100,20'],
      hint: 'Unlock by finishing Story Mode with no deaths.', crown: true, chrome: true },
  ];
  const BY_ID = {}; SKINS.forEach(s => { BY_ID[s.id] = s; });
  const IDS = SKINS.map(s => s.id);

  function ownedList() {
    const list = parseList(K.owned, ['default']);
    if (!list.includes('default')) list.unshift('default');
    return list;
  }
  function skinOf(id) { return BY_ID[id] || BY_ID.default; }

  const cache = {};
  const OUTER = [[0, -28], [8, -7], [26, 13], [23, 18], [9, 10], [5, 16], [-5, 16], [-9, 10], [-23, 18], [-26, 13], [-8, -7]];
  const COCKPIT = [[0, -15], [4.5, 3], [-4.5, 3]];
  function path(g, pts) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); }
  function star(g, x, y, r, n, rgb, a = 1) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * 0.45 : r;
      const fn = i ? 'lineTo' : 'moveTo'; g[fn](x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
    }
    g.closePath(); g.fillStyle = `rgba(${rgb},${a})`; g.fill();
  }

  function paintShip(g, id, t = 0) {
    const S = skinOf(id);
    const pulse = 0.55 + 0.45 * Math.sin(t * 3);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // cape (Fleet) behind the hull
    if (S.cape) {
      g.fillStyle = 'rgba(27,42,74,0.85)'; g.strokeStyle = 'rgba(212,175,55,0.9)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(-9, 10); g.quadraticCurveTo(-22, 22, -16, 30); g.quadraticCurveTo(-8, 20, -5, 16); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(9, 10); g.quadraticCurveTo(22, 22, 16, 30); g.quadraticCurveTo(8, 20, 5, 16); g.closePath(); g.fill(); g.stroke();
    }
    if (S.spikes) {
      g.fillStyle = `rgba(${S.fill},1)`; g.strokeStyle = `rgba(${S.accent},0.95)`; g.lineWidth = 1.3;
      [[26, 8, 34, 16, 23, 18], [-26, 8, -34, 16, -23, 18], [26, -2, 33, 4, 26, 10], [-26, -2, -33, 4, -26, 10]].forEach(p => {
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[2], p[3]); g.lineTo(p[4], p[5]); g.closePath(); g.fill(); g.stroke();
      });
    }
    const bodyA = S.ghost ? 0.42 + 0.1 * Math.sin(t * 4) : 1;
    path(g, OUTER);
    if (S.retro) {
      const wg = g.createLinearGradient(-26, 8, 26, 8);
      wg.addColorStop(0, '#FF2E97'); wg.addColorStop(0.5, '#2A1030'); wg.addColorStop(1, '#00F0FF');
      g.fillStyle = wg; g.globalAlpha = 0.95; g.fill(); g.globalAlpha = 1;
    } else if (S.chrome) {
      const cg = g.createLinearGradient(-20, -28, 24, 20);
      cg.addColorStop(0, '#FFF3A0'); cg.addColorStop(0.35, '#FFD700'); cg.addColorStop(0.55, '#B8860B'); cg.addColorStop(0.8, '#FFE680'); cg.addColorStop(1, '#8A6A08');
      g.fillStyle = cg; g.fill();
    } else {
      g.fillStyle = `rgba(${S.fill},${bodyA})`; g.fill();
    }
    if (S.lava || S.cracks) {
      g.save(); path(g, OUTER); g.clip();
      g.strokeStyle = S.lava ? `rgba(255,106,0,${0.55 + 0.4 * pulse})` : `rgba(57,255,20,${0.7 + 0.25 * pulse})`;
      g.lineWidth = 1.6; g.beginPath();
      g.moveTo(-8, -6); g.lineTo(-4, 2); g.lineTo(-10, 8); g.lineTo(-6, 16);
      g.moveTo(6, -8); g.lineTo(3, 0); g.lineTo(10, 6); g.lineTo(7, 14);
      g.moveTo(-2, -18); g.lineTo(2, -8); g.lineTo(-1, 4);
      g.stroke(); g.restore();
    }
    g.shadowColor = `rgba(${S.edge},1)`; g.shadowBlur = 14;
    g.strokeStyle = `rgba(${S.edge},${S.ghost ? 0.95 : 1})`; g.lineWidth = S.ghost ? 2 : 2.6;
    path(g, OUTER); g.stroke(); path(g, COCKPIT); g.stroke();
    g.beginPath(); g.moveTo(8, -7); g.lineTo(9, 10); g.moveTo(-8, -7); g.lineTo(-9, 10); g.lineWidth = 1.4; g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = S.ghost ? `rgba(255,255,255,0.85)` : `rgba(${S.accent},0.9)`; g.lineWidth = 1;
    path(g, OUTER); g.stroke(); path(g, COCKPIT); g.stroke();
    // cockpit glass
    path(g, COCKPIT);
    g.fillStyle = S.ghost ? `rgba(224,246,255,${0.25 + 0.15 * pulse})` : `rgba(${S.accent},0.35)`;
    g.fill();
    if (S.star) star(g, 0, -22, 4.2, 5, S.accent, 0.95);
    if (S.chevrons) {
      g.strokeStyle = 'rgba(212,175,55,0.95)'; g.lineWidth = 1.6;
      [[-6, 6, 0, 2, 6, 6], [-7, 11, 0, 7, 7, 11]].forEach(p => { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[2], p[3]); g.lineTo(p[4], p[5]); g.stroke(); });
    }
    if (S.crown) {
      g.fillStyle = 'rgba(17,17,17,0.9)'; g.strokeStyle = 'rgba(255,215,0,1)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-5, -20); g.lineTo(-5, -26); g.lineTo(-2, -23); g.lineTo(0, -28); g.lineTo(2, -23); g.lineTo(5, -26); g.lineTo(5, -20); g.closePath(); g.fill(); g.stroke();
    }
    if (S.chrome) {
      g.save(); path(g, OUTER); g.clip();
      const x = -30 + ((t * 40) % 70);
      const sh = g.createLinearGradient(x, -28, x + 16, 16);
      sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sh; g.fillRect(-30, -32, 70, 64); g.restore();
    }
    if (S.retro) {
      g.strokeStyle = 'rgba(0,240,255,0.8)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(-20, 8); g.lineTo(-8, -4); g.moveTo(20, 8); g.lineTo(8, -4); g.stroke();
    }
  }

  function makeSprite(id) {
    const size = 80, SS = 2, c = SL.mkCanvas(size * SS, size * SS), g = c.getContext('2d');
    g.scale(SS, SS); g.translate(size / 2, size / 2 - 2);
    paintShip(g, id, 0.4);
    return { c, size };
  }

  const toasts = [];
  function toast(msg, rgb = '255,210,70') { toasts.push({ msg, rgb, t: 0, life: 2.6 }); }

  const Coins = {
    rates: RATES,
    get() { return Math.max(0, int(K.coins, 0)); },
    set(n) { SL.store.set(K.coins, String(Math.max(0, Math.floor(n)))); },
    add(n) { if (!n) return this.get(); this.set(this.get() + Math.floor(n)); return this.get(); },
    spend(n) { if (this.get() < n) return false; this.set(this.get() - n); return true; },
    awardGold(g) {
      if (!g || g.debug) return 0;
      this.add(RATES.gold);
      return RATES.gold;
    },
    awardStory(level, boss, isFinal, debug) {
      if (debug) return 0;
      const n = isFinal ? RATES.storyFinal : boss ? RATES.storyBoss : RATES.story;
      this.add(n); return n;
    },
    awardSurvival(seconds, debug) {
      if (debug) return 0;
      const n = Math.floor(Math.max(0, seconds) / RATES.survivalEvery);
      if (n) this.add(n);
      return n;
    },
    draw(g, x, y, opt = {}) {
      const align = opt.align || 'right', size = opt.size || 18, v = this.get();
      const label = String(v);
      g.font = `bold ${size}px "DejaVu Sans", Verdana, Arial, sans-serif`;
      const tw = g.measureText(label).width, cx = align === 'left' ? x + 11 : x - tw - 4;
      g.save();
      g.fillStyle = 'rgba(255,210,70,1)'; g.strokeStyle = 'rgba(255,240,180,0.9)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(cx, y + 1, 9, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = 'rgba(80,50,0,0.95)'; g.font = `bold ${size - 6}px "DejaVu Sans", Verdana, Arial, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('C', cx, y + 1);
      g.restore();
      SL.neonText(g, label, align === 'left' ? x + 24 : x, y, size, '255,220,90', { align, blur: 8 });
    },
  };

  const Skins = {
    list: SKINS,
    get: skinOf,
    equipped() { const id = SL.store.get(K.equipped, 'default'); return BY_ID[id] ? id : 'default'; },
    color() { return skinOf(this.equipped()).edge; },
    owned() { return ownedList(); },
    owns(id) { return ownedList().includes(id); },
    sprite(id) { const k = id || this.equipped(); return cache[k] || (cache[k] = makeSprite(k)); },
    paint: paintShip,
    shotRgb(g) {
      const S = skinOf(this.equipped());
      if (S.altShot) { g._skinFlip = !g._skinFlip; return g._skinFlip ? S.altShot : S.shot; }
      return S.shot;
    },
    shotHi(id) { return skinOf(id || this.equipped()).shotHi; },
    grant(id) {
      if (!BY_ID[id]) return false;
      const list = ownedList();
      if (list.includes(id)) return false;
      list.push(id); SL.store.set(K.owned, JSON.stringify(list));
      toast('UNLOCKED: ' + skinOf(id).name, skinOf(id).edge);
      SL.Audio && SL.Audio.sfx && SL.Audio.sfx.blip(980);
      return true;
    },
    equip(id) {
      if (!this.owns(id)) return false;
      SL.store.set(K.equipped, id);
      if (SL.Map) SL.Map._ship = null;
      return true;
    },
    buy(id) {
      const S = skinOf(id);
      if (!S.price || this.owns(id)) return false;
      if (!Coins.spend(S.price)) return false;
      this.grant(id); this.equip(id); return true;
    },
    asteroids() { return int(K.asteroids, 0); },
    addAsteroids(n, debug) {
      if (debug || !n) return this.asteroids();
      SL.store.set(K.asteroids, String(this.asteroids() + n));
      this.checkUnlocks();
      return this.asteroids();
    },
    setCleanRun(on) { SL.store.set(K.cleanRun, on ? '1' : '0'); },
    cleanRun() { return SL.store.get(K.cleanRun, '0') === '1'; },
    markEdisar() { SL.store.set(K.beatEdisar, '1'); },
    beatEdisar() { return SL.store.get(K.beatEdisar, '0') === '1' || !!(SL.Progress && SL.Progress.completed); },
    nebulaBeaten() {
      const u = SL.Progress ? SL.Progress.unlocked : 1;
      const done = !!(SL.Progress && SL.Progress.completed);
      return [5, 10, 15, 20, 25].filter(L => done || u > L).length;
    },
    checkUnlocks() {
      if (SL.Progress && SL.Progress.completed) this.grant('supernova');
      if (this.beatEdisar()) this.grant('fleet');
      if (this.nebulaBeaten() >= 5) this.grant('rogue');
      if (this.asteroids() >= HUNTER_NEED) this.grant('hunter');
      if (this.cleanRun() && SL.Progress && SL.Progress.completed) this.grant('gold');
    },
    ghostStreak(seconds, debug) {
      if (debug) return;
      if (seconds >= GHOST_STREAK) this.grant('ghost');
    },
    thumbHint(id) {
      const S = skinOf(id), own = this.owns(id);
      if (id === 'default') return 'OWNED';
      if (own) return this.equipped() === id ? 'EQUIPPED' : 'OWNED';
      if (S.price && id === 'ghost') return S.price + ' OR 2:00';
      if (S.price) return String(S.price);
      if (id === 'hunter') return this.asteroids() + ' / ' + HUNTER_NEED;
      if (id === 'rogue') return this.nebulaBeaten() + ' / 5';
      if (id === 'supernova') return 'FINISH STORY';
      if (id === 'fleet') return 'DEFEAT EDISAR';
      if (id === 'gold') return 'NO-DEATH STORY';
      return 'LOCKED';
    },
    condition(id) {
      const S = skinOf(id);
      if (id === 'hunter') return `Destroy ${HUNTER_NEED.toLocaleString()} asteroids.  ${this.asteroids().toLocaleString()} / ${HUNTER_NEED.toLocaleString()}`;
      if (id === 'ghost') return `Buy for ${S.price} coins, or survive 2:00 in Survival without taking damage.`;
      if (id === 'rogue') return `Defeat all Nebula bosses (Levels 5, 10, 15, 20, 25).  ${this.nebulaBeaten()} / 5`;
      return S.hint;
    },
    hunterNeed: HUNTER_NEED,
    ghostStreakNeed: GHOST_STREAK,
    updateToasts(dt) { for (const t of toasts) t.t += dt; while (toasts.length && toasts[0].t > toasts[0].life) toasts.shift(); },
    drawToasts(g) {
      toasts.forEach((t, i) => {
        const e = Math.min(1, t.t / 0.2, (t.life - t.t) / 0.4);
        const y = 118 + i * 34;
        g.save(); g.globalAlpha = Math.max(0, e);
        SL.softRect && SL.softRect(g, 512, y, 260, 16, 'rgba(4,2,14,0.88)');
        if (!SL.softRect) { g.fillStyle = 'rgba(4,2,14,0.88)'; g.fillRect(252, y - 16, 520, 32); }
        SL.neonText(g, t.msg, 512, y, 20, t.rgb, { blur: 14 });
        g.restore();
      });
    },
    drawTrail(g, game, s, T) {
      const S = skinOf(this.equipped());
      const f = 0.75 + 0.25 * (Math.sin(T * 31.7) * .5 + Math.sin(T * 53.1) * .3 + Math.sin(T * 97.3) * .2);
      const len = 18 + 12 * f + Math.max(0, -s.vy) * 0.03, y0 = s.y + 14;
      g.save(); g.globalCompositeOperation = 'lighter';
      const draw = (cols, ox, scale) => {
        const gr = g.createLinearGradient(0, y0, 0, y0 + len * scale);
        gr.addColorStop(0, `rgba(255,255,255,${.7 * f})`);
        gr.addColorStop(.28, `rgba(${cols[0]},${.6 * f})`);
        gr.addColorStop(.7, `rgba(${cols[1]},${.45 * f})`);
        gr.addColorStop(1, `rgba(${cols[2] || cols[1]},0)`);
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(s.x + ox - 5, y0); g.quadraticCurveTo(s.x + ox - 4, y0 + len * scale * .6, s.x + ox, y0 + len * scale);
        g.quadraticCurveTo(s.x + ox + 4, y0 + len * scale * .6, s.x + ox + 5, y0); g.fill();
      };
      if (S.retro) { draw([S.edge, S.edge, S.accent], -4, 1); draw([S.accent, S.accent, S.edge], 4, 0.92); }
      else if (S.ghost) { draw(S.trail, 0, 1.15); }
      else draw(S.trail, 0, 1);
      if (S.star && Math.random() < 0.4) {
        g.fillStyle = `rgba(255,210,122,${0.5 * f})`;
        g.fillRect(s.x + (Math.random() - 0.5) * 10, y0 + 6 + Math.random() * len * 0.6, 2, 2);
      }
      if (S.chrome && Math.random() < 0.5) {
        g.fillStyle = `rgba(255,230,128,${0.6 * f})`;
        g.fillRect(s.x + (Math.random() - 0.5) * 8, y0 + 4 + Math.random() * len * 0.5, 2, 2);
      }
      if (S.lava && Math.random() < 0.45) {
        g.fillStyle = `rgba(255,195,0,${0.6 * f})`;
        g.fillRect(s.x + (Math.random() - 0.5) * 8, y0 + 6 + Math.random() * len * 0.7, 2, 2);
      }
      g.restore();
      SL.glow(g, s.x, y0 + 8, 16 + 4 * f, 22 + 6 * f, S.trail[1], 0.25 * f + 0.08);
    },
  };

  const BK = { inv: 'starlight.boosts.inv', armed: 'starlight.boosts.armed' };
  const BOOSTS = [
    { id: 'bomb1',  name: '+1 BOMB',      short: '+1 BOMB',  price: 20, rgb: '255,210,70',
      hint: 'One extra bomb at the start (max 3).',
      apply(g) { const M = SL.CONFIG.bombs.max; g.bombs = Math.min(M, (g.bombs || 0) + 1); } },
    { id: 'bomb2',  name: '+2 BOMBS',     short: '+2 BOMBS', price: 35, rgb: '255,200,80',
      hint: 'Two extra bombs at the start (max 3).',
      apply(g) { const M = SL.CONFIG.bombs.max; g.bombs = Math.min(M, (g.bombs || 0) + 2); } },
    { id: 'bomb3',  name: 'FULL BOMBS',   short: 'FULL BOMBS', price: 45, rgb: '255,180,60',
      hint: 'Start with a full set of 3 bombs.',
      apply(g) { g.bombs = SL.CONFIG.bombs.max; } },
    { id: 'assist', name: 'AVRILL READY', short: 'AVRILL', price: 40, rgb: '255,80,220',
      hint: 'Avrill assist starts fully charged.',
      apply(g) {
        const max = SL.CONFIG.assist.max;
        g.assist = g.assist || {};
        Object.assign(g.assist, { energy: max, ready: true, phase: 'idle', t: 0, cleared: false });
      } },
    { id: 'shield', name: 'START SHIELD', short: 'SHIELD', price: 30, rgb: '80,220,255',
      hint: 'Start with a Shield already up.',
      apply(g) { g.shield = true; } },
    { id: 'random', name: 'RANDOM BOOST', short: 'RANDOM', price: 25, rgb: '170,90,255',
      hint: 'Start with a random weapon or utility.',
      apply(g) {
        const types = ['triple', 'laser', 'rapid', 'shield', 'magnet', 'ricochet', 'missiles', 'slowmo'];
        const type = types[(Math.random() * types.length) | 0];
        const s = g.ship || { x: W / 2, y: 400 };
        SL.Features.collect(g, { type, x: s.x, y: s.y - 10 });
      } },
  ];
  const BOOST_BY = {}; BOOSTS.forEach(b => { BOOST_BY[b.id] = b; });

  function invObj() {
    try { const v = JSON.parse(SL.store.get(BK.inv, '{}')); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
    catch (e) { return {}; }
  }
  function setInv(o) { SL.store.set(BK.inv, JSON.stringify(o)); }

  const Boosts = {
    list: BOOSTS,
    get: id => BOOST_BY[id],
    inv() { return invObj(); },
    count(id) { return Math.max(0, invObj()[id] | 0); },
    armed() { return parseList(BK.armed, []).filter(id => BOOST_BY[id] && (invObj()[id] | 0) > 0); },
    setArmed(ids) { SL.store.set(BK.armed, JSON.stringify(ids.filter(id => BOOST_BY[id]))); },
    isArmed(id) { return this.armed().includes(id); },
    toggle(id) {
      if (!BOOST_BY[id] || this.count(id) <= 0) return false;
      const cur = this.armed();
      const i = cur.indexOf(id);
      if (i >= 0) cur.splice(i, 1); else cur.push(id);
      this.setArmed(cur); return true;
    },
    buy(id) {
      const B = BOOST_BY[id]; if (!B) return false;
      if (!Coins.spend(B.price)) return false;
      const o = invObj(); o[id] = (o[id] | 0) + 1; setInv(o);
      toast('BOUGHT: ' + B.name, B.rgb);
      SL.Audio && SL.Audio.sfx && SL.Audio.sfx.blip(880);
      return true;
    },
    apply(g) {
      if (!g || g.debug || g._boostsApplied) return [];
      const used = [], o = invObj(), names = [];
      for (const id of this.armed()) {
        if ((o[id] | 0) <= 0) continue;
        const B = BOOST_BY[id]; if (!B) continue;
        B.apply(g);
        o[id]--; if (o[id] <= 0) delete o[id];
        used.push(id); names.push(B.short);
      }
      if (used.length) {
        setInv(o); this.setArmed([]);
        g._boostsApplied = used;
        const s = g.ship || { x: W / 2, y: 360 };
        if (g.popup) g.popup(names.join('  ·  '), s.x, s.y - 52, '255,210,70');
      }
      return used;
    },
  };

  const Store = (() => {
    let T = 0, tab = 'skins', sel = 0, bsel = 0, denyAt = -1;
    const backBtn = { id: 'back', label: 'BACK', x: 86, y: 36, w: 120, h: 36, rgb: '70,160,255' };
    const tabBtns = [
      { id: 'skins',  label: 'SKINS',  x: 412, y: 70, w: 170, h: 36, rgb: '255,80,220' },
      { id: 'boosts', label: 'BOOSTS', x: 612, y: 70, w: 170, h: 36, rgb: '255,210,70' },
    ];
    const actionBtn = { id: 'action', label: 'EQUIP', x: 512, y: 358, w: 220, h: 40, rgb: '255,80,220' };

    const thumbs = () => {
      const n = IDS.length, tw = 78, gap = 10, total = n * tw + (n - 1) * gap;
      const x0 = (W - total) / 2 + tw / 2;
      return IDS.map((id, i) => ({ id, i, x: x0 + i * (tw + gap), y: 490, w: tw, h: 72 }));
    };
    function primary() {
      const S = skinOf(IDS[sel]);
      if (Skins.owns(S.id)) return Skins.equipped() === S.id
        ? { label: 'EQUIPPED', rgb: '80,220,140', act: 'equipped' }
        : { label: 'EQUIP', rgb: '70,160,255', act: 'equip' };
      if (S.price) return { label: 'BUY  ' + S.price, rgb: '255,210,70', act: 'buy' };
      return { label: 'LOCKED', rgb: '160,150,180', act: 'locked' };
    }
    function activate() {
      const S = skinOf(IDS[sel]), p = primary();
      if (p.act === 'equip') { Skins.equip(S.id); SL.Audio.sfx.blip(820); }
      else if (p.act === 'buy') {
        if (!Skins.buy(S.id)) { denyAt = T; SL.Audio.sfx.deny && SL.Audio.sfx.deny(); }
      } else if (p.act === 'locked' || p.act === 'equipped') { denyAt = T; SL.Audio.sfx.deny && SL.Audio.sfx.deny(); }
    }
    function boostCards() {
      const CW = 288, CH = 176, GAPX = 20, GAPY = 14;
      const ox = (W - (3 * CW + 2 * GAPX)) / 2, oy = 120;
      return BOOSTS.map((b, i) => {
        const col = i % 3, row = (i / 3) | 0;
        return { i, id: b.id, x: ox + col * (CW + GAPX) + CW / 2, y: oy + row * (CH + GAPY) + CH / 2, w: CW, h: CH };
      });
    }
    function boostBtns(card) {
      return {
        buy: { id: 'buy', label: 'BUY', x: card.x - 64, y: card.y + 62, w: 112, h: 30, rgb: '255,210,70' },
        arm: { id: 'arm', label: Boosts.isArmed(card.id) ? 'ARMED' : 'ARM', x: card.x + 64, y: card.y + 62, w: 112, h: 30,
               rgb: Boosts.isArmed(card.id) ? '80,220,140' : '70,160,255' },
      };
    }
    function switchTab(id) {
      if (tab === id) return;
      tab = id; denyAt = -1;
      SL.Audio.sfx.blip(620);
    }
    function buyBoost(id) {
      if (!Boosts.buy(id)) { denyAt = T; SL.Audio.sfx.deny && SL.Audio.sfx.deny(); }
    }
    function armBoost(id) {
      if (!Boosts.toggle(id)) { denyAt = T; SL.Audio.sfx.deny && SL.Audio.sfx.deny(); }
      else SL.Audio.sfx.blip(780);
    }

    return {
      enter(opt = {}) { T = 0; tab = opt.tab === 'boosts' ? 'boosts' : 'skins'; sel = Math.max(0, IDS.indexOf(Skins.equipped())); bsel = 0; denyAt = -1; Skins.checkUnlocks(); SL.Audio.playTrack('main'); },
      leave() {},
      update(dt) {
        T += dt;
        const I = SL.Input, downs = I.takeDowns();
        SL.Vol.handle(downs); SL.Vol.tick();
        if (SL.Vol.keys(I) || SL.Vol.open) return;
        if (I.hitAny('Escape', 'Backspace')) { SL.Audio.sfx.blip(520); SL.start('title'); return; }
        if (I.hit('Tab') || I.hit('KeyQ') || I.hit('KeyE')) { switchTab(tab === 'skins' ? 'boosts' : 'skins'); }
        for (const d of downs) {
          if (d.used) continue;
          if (SL.inBtn(backBtn, d)) { SL.Audio.sfx.blip(520); SL.start('title'); return; }
          tabBtns.forEach(b => { if (SL.inBtn(b, d)) switchTab(b.id); });
        }
        if (tab === 'skins') {
          if (I.hitAny('ArrowLeft', 'KeyA')) { sel = (sel + IDS.length - 1) % IDS.length; SL.Audio.sfx.blip(620); }
          if (I.hitAny('ArrowRight', 'KeyD')) { sel = (sel + 1) % IDS.length; SL.Audio.sfx.blip(620); }
          if (I.confirm()) activate();
          for (const d of downs) {
            if (d.used) continue;
            if (SL.inBtn(actionBtn, d)) { activate(); return; }
            thumbs().forEach(th => { if (SL.inBtn(th, d)) { if (sel !== th.i) SL.Audio.sfx.blip(620); sel = th.i; } });
          }
        } else {
          const cards = boostCards();
          if (I.hitAny('ArrowLeft', 'KeyA')) { bsel = (bsel + 5) % 6; SL.Audio.sfx.blip(620); }
          if (I.hitAny('ArrowRight', 'KeyD')) { bsel = (bsel + 1) % 6; SL.Audio.sfx.blip(620); }
          if (I.hitAny('ArrowUp', 'KeyW')) { bsel = (bsel + 3) % 6; SL.Audio.sfx.blip(620); }
          if (I.hitAny('ArrowDown', 'KeyS')) { bsel = (bsel + 3) % 6; SL.Audio.sfx.blip(620); }
          if (I.hit('KeyB')) buyBoost(BOOSTS[bsel].id);
          if (I.confirm()) {
            const id = BOOSTS[bsel].id;
            if (Boosts.count(id) > 0) armBoost(id); else buyBoost(id);
          }
          for (const d of downs) {
            if (d.used) continue;
            for (const card of cards) {
              const bt = boostBtns(card);
              if (SL.inBtn(bt.buy, d)) { bsel = card.i; buyBoost(card.id); return; }
              if (SL.inBtn(bt.arm, d)) { bsel = card.i; armBoost(card.id); return; }
              if (SL.inBtn(card, d)) { if (bsel !== card.i) SL.Audio.sfx.blip(620); bsel = card.i; }
            }
          }
        }
      },
      draw(g) {
        SL.drawSpaceBg(g);
        const stars = SL.Store._stars || (SL.Store._stars = new SL.Starfield());
        stars.update(1 / 60, 0.45); stars.draw(g, T, 0.55, 0);
        SL.drawButton(g, backBtn, false, T);
        SL.neonText(g, 'STORE', 512, 28, 34, '255,80,220', { blur: 18 });
        Coins.draw(g, 860, 28, { size: 20 });
        tabBtns.forEach(b => {
          const on = tab === b.id;
          SL.drawButton(g, Object.assign({}, b, { rgb: on ? b.rgb : '120,110,160' }), on, T);
        });

        if (tab === 'skins') {
          const S = skinOf(IDS[sel]), p = primary();
          const pedY = 268;
          g.save();
          const ped = g.createLinearGradient(512, pedY - 18, 512, pedY + 28);
          ped.addColorStop(0, 'rgba(80,200,255,0.0)'); ped.addColorStop(0.45, `rgba(${S.edge},0.35)`); ped.addColorStop(1, 'rgba(10,16,40,0.0)');
          g.fillStyle = ped; g.beginPath(); g.ellipse(512, pedY, 118, 22, 0, 0, Math.PI * 2); g.fill();
          g.strokeStyle = `rgba(${S.edge},0.55)`; g.lineWidth = 2; g.stroke();
          g.restore();
          const bob = Math.sin(T * 2.2) * 6, yaw = Math.sin(T * 1.1) * 0.18;
          g.save(); g.translate(512, 200 + bob); g.rotate(yaw); g.scale(2.15, 2.15);
          paintShip(g, S.id, T); g.restore();
          SL.neonText(g, S.name.toUpperCase(), 512, 300, 22, S.edge, { blur: 12 });
          SL.neonText(g, Skins.condition(S.id), 512, 326, 13, '200,210,255', { blur: 4, alpha: 0.9 });
          actionBtn.label = p.label; actionBtn.rgb = p.rgb;
          const shake = (p.act === 'buy' || p.act === 'locked') && (T - denyAt) < 0.28 ? Math.sin((T - denyAt) * 40) * 5 : 0;
          SL.drawButton(g, Object.assign({}, actionBtn, { x: actionBtn.x + shake }), true, T);
          thumbs().forEach(th => {
            const Sk = skinOf(th.id), own = Skins.owns(th.id), eq = Skins.equipped() === th.id, on = sel === th.i;
            g.save();
            g.globalAlpha = own ? 1 : 0.55;
            g.fillStyle = on ? 'rgba(255,80,220,0.18)' : 'rgba(8,10,28,0.55)';
            g.strokeStyle = eq ? 'rgba(80,220,140,0.95)' : on ? `rgba(${Sk.edge},0.95)` : 'rgba(120,140,180,0.4)';
            g.lineWidth = eq || on ? 2.2 : 1;
            g.beginPath(); g.roundRect(th.x - th.w / 2, th.y - th.h / 2, th.w, th.h, 8); g.fill(); g.stroke();
            g.save(); g.translate(th.x, th.y - 6); g.scale(0.72, 0.72); paintShip(g, th.id, T); g.restore();
            const tag = eq ? 'ON' : own ? 'OWN' : Skins.thumbHint(th.id);
            SL.neonText(g, tag, th.x, th.y + 26, 9, eq ? '80,220,140' : own ? '200,210,255' : '255,210,90', { blur: 3, alpha: 0.95 });
            g.restore();
          });
          SL.neonText(g, SL.Input.touchMode ? 'TAP A SKIN  ·  BUY / EQUIP  ·  BOOSTS TAB  ·  BACK' : '◀ ▶ SELECT  ·  ENTER BUY/EQUIP  ·  Q/E OR TAB FOR BOOSTS  ·  ESC BACK', 512, 560, 11, '160,200,255', { blur: 4, alpha: 0.7 });
        } else {
          const cards = boostCards();
          cards.forEach(card => {
            const B = BOOST_BY[card.id], on = bsel === card.i, n = Boosts.count(card.id), armed = Boosts.isArmed(card.id);
            g.save();
            g.fillStyle = on ? 'rgba(255,210,70,0.12)' : 'rgba(8,10,28,0.62)';
            g.strokeStyle = armed ? 'rgba(80,220,140,0.95)' : on ? `rgba(${B.rgb},0.95)` : 'rgba(120,140,180,0.4)';
            g.lineWidth = armed || on ? 2.2 : 1;
            g.beginPath(); g.roundRect(card.x - card.w / 2, card.y - card.h / 2, card.w, card.h, 10); g.fill(); g.stroke();
            g.restore();
            SL.neonText(g, B.name, card.x, card.y - 62, 16, B.rgb, { blur: 8 });
            SL.neonText(g, B.price + ' COINS', card.x, card.y - 38, 13, '255,230,140', { blur: 4 });
            SL.neonText(g, B.hint, card.x, card.y - 10, 11, '200,210,255', { blur: 3, alpha: 0.88 });
            SL.neonText(g, n ? ('OWNED ×' + n) : 'NOT OWNED', card.x, card.y + 22, 12, n ? '80,220,140' : '160,170,200', { blur: 4, alpha: 0.95 });
            const bt = boostBtns(card);
            const shake = on && (T - denyAt) < 0.28 ? Math.sin((T - denyAt) * 40) * 4 : 0;
            SL.drawButton(g, Object.assign({}, bt.buy, { x: bt.buy.x + shake }), on, T);
            if (n > 0) SL.drawButton(g, bt.arm, armed || on, T);
            else {
              g.save(); g.globalAlpha = 0.35; SL.drawButton(g, Object.assign({}, bt.arm, { label: 'ARM', rgb: '120,130,150' }), false, T); g.restore();
            }
          });
          const armed = Boosts.armed().map(id => BOOST_BY[id].short);
          SL.neonText(g, armed.length ? ('ARMED FOR NEXT RUN:  ' + armed.join('   ·   ')) : 'ARM OWNED BOOSTS TO USE THEM AT THE START OF THE NEXT RUN OR LEVEL', 512, 500, 13, armed.length ? '80,220,140' : '200,210,255', { blur: 6, alpha: 0.9 });
          SL.neonText(g, SL.Input.touchMode ? 'BUY TO STOCK  ·  ARM FOR THE NEXT RUN  ·  SKINS TAB  ·  BACK' : '◀ ▶ SELECT  ·  ENTER ARM/BUY  ·  B BUY  ·  SPACE ARM  ·  Q/E OR TAB FOR SKINS  ·  ESC BACK', 512, 560, 11, '160,200,255', { blur: 4, alpha: 0.7 });
        }
      },
    };
  })();

  SL.Coins = Coins;
  SL.Skins = Skins;
  SL.Boosts = Boosts;
  SL.Store = Store;
  if (SL.Features) {
    SL.Features.store = {
      enabled: true,
      get current() { return Skins.equipped(); },
      shipColor() { return Skins.color(); },
      skins: BY_ID,
    };
  }
})();
