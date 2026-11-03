/* Project Starlight — global namespace + tunables. Everything gameplay-related lives here. */
window.SL = window.SL || {};
SL.VERSION = '0.2.0';
SL.W = 1024; SL.H = 576;            // logical design resolution (16:9)

SL.CONFIG = {
  ship: {
    maxSpeed: 430,        // px/s
    response: 9,          // inertia: higher = snappier
    radius: 12,           // collision radius
    fireRate: 0.12,       // seconds between shots (hold to autofire)
    bulletSpeed: 860,
    invuln: 2.0,          // seconds of blink after a hit
    startLives: 3,
    startY: 488,
    color: '80,170,255',  // Oakens' ship, matches the title ship
  },
  asteroid: {
    sizes: {
      L: { r: 44, points: 20,  next: 'M' },
      M: { r: 27, points: 50,  next: 'S' },
      S: { r: 15, points: 100, next: null },
    },
    colors: ['255,70,220', '70,160,255', '170,90,255'],  // pink / blue / purple
  },
  difficulty: {            // continuous ramp, t = seconds survived
    spawnStart: 1.45, spawnMin: 0.30, spawnRamp: 0.017,   // interval = max(min, start - ramp*t)
    speedStart: 65,  speedRamp: 2.0,  speedMax: 240,       // base fall speed
    sideChance: 0.28,                                      // share of spawns that drift in from the sides
    mediumChanceRamp: 0.004,                               // later on, some spawns start as medium (faster)
  },
  score: {
    perSecond: 10,         // points for time survived
    comboStep: 4,          // kills per multiplier step: x2 after 4, x3 after 8, x4 after 12
    comboMax: 4,
  },
  storage: { best: 'starlight.survival.best', muted: 'starlight.muted' },
  font: '"Courier New", Courier, monospace',
};

SL.store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} },
};
SL.pad = (n, len = 6) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
