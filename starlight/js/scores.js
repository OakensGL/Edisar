/* High scores. SL.Scores is backend-agnostic: today a LocalBackend (localStorage, per device).
   A future online leaderboard only needs another backend with the same async interface:
     load(mode) -> Promise<Entry[]>,  submit(mode, entry) -> Promise<Entry[]>
   Entry = { name, score, time (s), kills, date (ISO) } */
SL.Scores = (() => {
  const MAX = 10, NAME_MAX = 10;
  const KEY = mode => `starlight.${mode}.top10`, LAST = 'starlight.lastName';
  const sanitizeName = s => String(s || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').slice(0, NAME_MAX).trim();
  const clean = e => ({
    name: sanitizeName(e.name) || '---',
    score: Math.max(0, Math.floor(+e.score || 0)), time: Math.max(0, Math.floor(+e.time || 0)),
    kills: Math.max(0, Math.floor(+e.kills || 0)), level: Math.max(0, Math.min(999, Math.floor(+e.level || 0))), date: isNaN(Date.parse(e.date)) ? new Date().toISOString() : new Date(e.date).toISOString(),
  });
  // survival: by points; story: by furthest level reached, tiebreak points
  const cmp = mode => mode === 'story' ? (a, b) => b.level - a.level || b.score - a.score || a.date.localeCompare(b.date)
                                       : (a, b) => b.score - a.score || a.date.localeCompare(b.date);
  let sortMode = 'survival';
  const sortTrim = (l, mode = sortMode) => l.sort(cmp(mode)).slice(0, MAX);

  const LocalBackend = {
    name: 'local',
    loadSync(mode) {
      let list = [];
      try { const raw = JSON.parse(SL.store.get(KEY(mode), '[]')); if (Array.isArray(raw)) list = raw.map(clean); } catch (e) {}
      // one-time migration of the v0.1 single best score
      if (mode === 'survival') {
        const old = parseInt(SL.store.get(SL.CONFIG.storage.best, '0'), 10) || 0;
        if (old > 0) {
          if (!list.some(e => e.score === old)) list.push(clean({ name: 'OAKENS', score: old, time: 0, kills: 0, date: new Date().toISOString() }));
          try { localStorage.removeItem(SL.CONFIG.storage.best); } catch (e) {}
          list = sortTrim(list); this.saveSync(mode, list);
        }
      }
      return sortTrim(list, mode);
    },
    saveSync(mode, list) { SL.store.set(KEY(mode), JSON.stringify(list)); },
    load(mode) { return Promise.resolve(this.loadSync(mode)); },
    submit(mode, entry) { const l = sortTrim([...this.loadSync(mode), entry], mode); this.saveSync(mode, l); return Promise.resolve(l); },
  };

  let backend = LocalBackend;
  const cache = {};
  const list = (mode = 'survival') => (cache[mode] ||= backend.loadSync(mode));
  return {
    MAX, NAME_MAX, sanitizeName,
    setBackend(b) { backend = b; for (const k in cache) delete cache[k]; },   // e.g. an OnlineBackend later
    list,
    best: (mode = 'survival') => (list(mode)[0] || { score: 0 }).score,
    /* accepts a score number (survival) or an entry {score, level} */
    qualifies(e, mode = 'survival') {
      const en = typeof e === 'number' ? { score: e, level: 0 } : e, l = list(mode);
      if (!(en.score > 0)) return false;
      if (l.length < MAX) return true;
      const probe = clean({ ...en, date: '9999-12-31T00:00:00.000Z' });
      return sortTrim([...l, probe], mode).includes(probe);
    },
    /* returns the 0-based rank of the new entry */
    add(entry, mode = 'survival') {
      const e = clean(entry);
      const l = sortTrim([...list(mode), e], mode);
      cache[mode] = l; backend.saveSync ? backend.saveSync(mode, l) : backend.submit(mode, e);
      return l.indexOf(e);
    },
    get lastName() { return sanitizeName(SL.store.get(LAST, '')) || 'OAKENS'; },
    set lastName(n) { SL.store.set(LAST, sanitizeName(n)); },
  };
})();
SL.getBest = () => SL.Scores.best();

/* Neon Top-10 table renderer (shared by game over + menu) */
SL.drawScoreTable = (g, list, y0, hi = -1, T = 0, mode = 'survival') => {
  const story = mode === 'story';
  const cols = story ? [{ x: 290, a: 'right' }, { x: 312, a: 'left' }, { x: 520, a: 'right' }, { x: 640, a: 'right' }, { x: 740, a: 'right' }, { x: 770, a: 'left' }]
                     : [{ x: 290, a: 'right' }, { x: 312, a: 'left' }, { x: 610, a: 'right' }, { x: 680, a: 'right' }, { x: 740, a: 'right' }, { x: 770, a: 'left' }];
  const head = story ? ['#', 'NAME', 'LEVEL', 'SCORE', 'KILLS', 'DATE'] : ['#', 'NAME', 'SCORE', 'TIME', 'KILLS', 'DATE'];
  head.forEach((h, i) => SL.neonText(g, h, cols[i].x, y0, 12, '160,200,255', { align: cols[i].a, blur: 4, alpha: 0.8 }));
  g.fillStyle = 'rgba(170,90,255,0.35)'; g.fillRect(270, y0 + 10, 484 + 30, 1);
  for (let i = 0; i < SL.Scores.MAX; i++) {
    const e = list[i], y = y0 + 28 + i * 22, isHi = i === hi;
    if (isHi) { g.fillStyle = `rgba(255,220,90,${0.10 + 0.08 * Math.sin(T * 6)})`; g.fillRect(270, y - 10, 514, 20); }
    const rgb = isHi ? '255,220,90' : i === 0 ? '255,80,220' : i < 3 ? '200,150,255' : '150,190,255';
    const m = e ? `${Math.floor(e.time / 60)}:${String(e.time % 60).padStart(2, '0')}` : '';
    const d = e ? e.date.slice(0, 10) : '';
    const vals = story ? [String(i + 1), e ? e.name : '----------', e ? String(e.level) : '--', e ? SL.pad(e.score) : '------', e ? String(e.kills) : '', d]
                       : [String(i + 1), e ? e.name : '----------', e ? SL.pad(e.score) : '------', m, e ? String(e.kills) : '', d];
    vals.forEach((v, c) => SL.neonText(g, v, cols[c].x, y, c === 5 ? 12 : 16, rgb, { align: cols[c].a, blur: isHi ? 10 : 5, alpha: e ? 1 : 0.3 }));
  }
};

/* Real <input> overlay for name entry (reliable native keyboard on mobile, typing on PC). */
SL.NameEntry = (() => {
  let wrap, input, btn, onDone = null;
  function build() {
    wrap = document.createElement('div'); wrap.id = 'nameEntry';
    input = document.createElement('input');
    Object.assign(input, { type: 'text', maxLength: SL.Scores.NAME_MAX, autocomplete: 'off', spellcheck: false });
    input.setAttribute('autocapitalize', 'characters'); input.setAttribute('autocorrect', 'off');
    input.setAttribute('enterkeyhint', 'done'); input.setAttribute('aria-label', 'Your name');
    btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'CONFIRM';
    wrap.append(input, btn); document.getElementById('stage').append(wrap);
    input.addEventListener('input', () => {
      const pos = input.selectionStart, v = input.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, SL.Scores.NAME_MAX);
      if (v !== input.value) { input.value = v; try { input.setSelectionRange(pos, pos); } catch (e) {} }
    });
    input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); done(); } });
    input.addEventListener('keyup', e => e.stopPropagation());
    btn.addEventListener('click', done);
    btn.addEventListener('pointerdown', e => e.stopPropagation());
  }
  function done() {
    if (!onDone) return; const cb = onDone; onDone = null;
    const name = SL.Scores.sanitizeName(input.value) || '---';
    wrap.style.display = 'none'; input.blur(); SL.Audio.sfx.blip(880); cb(name);
  }
  return {
    open(def, cb) {
      if (!wrap) build();
      input.value = SL.Scores.sanitizeName(def); onDone = cb; wrap.style.display = 'flex';
      if (!SL.Input.touchMode) setTimeout(() => { input.focus(); input.select(); }, 30);  // mobile: tap the field to open the keyboard
    },
    close() { if (wrap) wrap.style.display = 'none'; onDone = null; },
    get active() { return !!onDone; },
  };
})();
