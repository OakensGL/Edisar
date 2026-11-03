/* Project Starlight — global namespace + tunables. Everything gameplay-related lives here. */
window.SL = window.SL || {};
SL.VERSION = '0.4.2';
SL.FINAL_LEVEL = 30;                // Story ends at level 30 (final mission, not built yet)
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
  /* ---------- v0.3 features ---------- */
  pickups: {
    dropChance: 0.04,          // per asteroid destroyed by the player (gold = guaranteed)
    driftEvery: [20, 32],      // seconds between pickups drifting in from the top
    bombShare: 0.32,           // share of pickups that are bombs (rest = weapon/shield)
    fallSpeed: 75, radius: 15, catchRadius: 30, life: 12,
    types: {
      bomb:   { rgb: '255,90,150', icon: 'B', name: 'BOMB' },
      triple: { rgb: '255,150,50', icon: '3', name: 'TRIPLE SHOT' },
      laser:  { rgb: '90,255,255', icon: 'L', name: 'LASER' },
      rapid:  { rgb: '255,235,80', icon: 'R', name: 'RAPID FIRE' },
      shield: { rgb: '90,255,140', icon: 'S', name: 'SHIELD' },
    },
  },
  powerUps: { duration: 10, tripleSpread: 0.2, rapidMul: 0.5, laserRate: 0.09, laserSpeed: 1400 },
  bombs: { max: 3, start: 1, speed: 520, fuse: 0.55, radius: 240, blastTime: 0.5, fullInvBonus: 250 },
  assist: {
    max: 100, perSecond: 0.6, perKill: 0.8, comboBonus: 0.3,   // ~1 assist per minute of decent play
    sweepTime: 5, fireRate: 0.09, clearHold: 1.2,
    line: 'OAKENS, HERE TO ASSIST!', pilot: 'AVRILL', color: '255,80,220',
    portrait: [150, 292, 170, 170],   // crop (source px of assets/title.jpg) for Avrill's face
  },
  special: {
    goldChance: 0.035, goldMul: 10, goldRgb: '255,210,70',     // gold: M size, no split, 10x points, guaranteed drop
    redChance: 0.06, redAfter: 15, redRadius: 150, redRgb: '255,55,55',  // red: explodes, destroying neighbours
  },
  /* ---------- v0.4 Story mode ---------- */
  story: {
    // v0.4.1 longer levels: a mission lasts a sector timer (60 s at level 1, +5 s per level, max 150 s)
    // and also needs a kill goal (30 at level 1, +5 per level). The warp opens when both are met.
    durBase: 60, durPerLevel: 5, durMax: 150,
    goalBase: 30, goalPerLevel: 5,
    warpTime: 2.3,                                 // warp-exit animation (s) before the recount
    spawnBase: 1.45, spawnPerLevel: 0.07, spawnMin: 0.34, spawnInLevel: 0.0025,
    speedBase: 70, speedPerLevel: 9, speedMax: 250, speedInLevel: 0.35,
    goldPerLevel: 0.004, redPerLevel: 0.012, redFromLevel: 2,
    introTime: 2.4,
    bonus: { perKill: 25, accuracy: 2000, timePerSec: 20, comboStep: 500, bossPerEncounter: 3000, weakPointPerEncounter: 300 },
    boss: {
      every: 5, y: 168, halfW: 190, halfH: 55, shotHalfH: 30,   // shotHalfH: hull area that blocks shots, kept above the weak points
      weakBase: 2, weakMax: 6,                       // weak points = min(max, base + encounter)
      hpBase: 20, hpPerEncounter: 10,                // hits per weak point
      attackBase: 1.7, attackPerEncounter: 0.25, attackMin: 0.55, angerPerPoint: 0.08,
      bulletBase: 170, bulletPerEncounter: 35,
      bombDamage: 8, assistDamage: 0.3,             // assist screen-clear takes 30% of each weak point's max HP
      tauntEvery: [13, 19], asteroidInterval: 2.6,
    },
  },
  storage: { best: 'starlight.survival.best', muted: 'starlight.muted', unlocked: 'starlight.story.unlocked' },
  font: '"Courier New", Courier, monospace',
};

SL.store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} },
};
SL.pad = (n, len = 6) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
SL.CONTROLS_HINT = 'MOVE WASD/ARROWS · FIRE SPACE/J · BOMB F · AVRILL R · PAUSE P/ESC · MUTE M';
