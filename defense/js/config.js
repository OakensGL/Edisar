/* Starlight: Last Station — global namespace + tunables. */
window.SD = window.SD || {};
SD.VERSION = '0.2';
SD.W = 1024; SD.H = 576;
SD.TILE = 32;

SD.CONFIG = {
  font: '"Courier New", Courier, monospace',
  crawlFont: '"DejaVu Sans", Verdana, Arial, Helvetica, sans-serif',
  startCredits: 180,
  startHull: 20,
  sellRefund: 0.70,
  waveGap: 22,
  crawlTrack: 53.355,
  storage: { muted: 'starlight-td.muted', progress: 'starlight-td.progress' },
  hud: { top: 48, bottom: 92 },
  turrets: {
    laser: {
      name: 'LASER', short: 'LASER', rgb: '80,170,255',
      cost: 50, upCost: 45, upCost2: 80,
      range: [112, 136, 154], damage: [8, 14, 16], rate: [0.28, 0.20, 0.18],
      blurb: 'Fast single-target beam',
      upBlurb: 'Hotter beam, longer reach',
      upBlurb2: 'Twin beams',
    },
    missile: {
      name: 'MISSILES', short: 'MISSILE', rgb: '255,170,70',
      cost: 85, upCost: 70, upCost2: 115,
      range: [148, 172, 196], damage: [24, 40, 36], rate: [1.15, 0.90, 0.80],
      splash: [48, 64, 52], splashMul: [0.55, 0.65, 0.50],
      speed: [280, 340, 360], cluster: [0, 0, 4],
      blurb: 'Slow rockets, splash damage',
      upBlurb: 'Heavier warhead, wider blast',
      upBlurb2: 'Cluster warheads',
    },
    ice: {
      name: 'ICE', short: 'ICE', rgb: '140,230,255',
      cost: 60, upCost: 50, upCost2: 90,
      range: [104, 128, 146], damage: [3, 6, 8], rate: [0.42, 0.32, 0.28],
      slow: [0.55, 0.38, 0.30], slowTime: [2.0, 2.6, 2.2],
      freeze: [0, 0, 1.0],
      blurb: 'Slows ships in range',
      upBlurb: 'Deeper freeze, longer hold',
      upBlurb2: 'Brief hard freeze',
    },
    railgun: {
      name: 'RAILGUN', short: 'RAIL', rgb: '255,210,90',
      cost: 120, upCost: 90, upCost2: 140,
      range: [230, 260, 290], damage: [58, 82, 110], rate: [1.85, 1.55, 1.35],
      pierce: [3, 4, 99],
      blurb: 'Long-range piercing slug',
      upBlurb: 'Heavier slug, more pierce',
      upBlurb2: 'Pierces the whole line',
    },
    tesla: {
      name: 'TESLA', short: 'TESLA', rgb: '180,140,255',
      cost: 95, upCost: 80, upCost2: 125,
      range: [108, 128, 148], damage: [15, 22, 24], rate: [0.72, 0.58, 0.50],
      chain: [3, 4, 6], jump: [70, 82, 96],
      blurb: 'Arc that chains to nearby ships',
      upBlurb: 'Longer arc, more jumps',
      upBlurb2: 'Chains further still',
    },
    pulse: {
      name: 'PULSE', short: 'PULSE', rgb: '80,255,180',
      cost: 75, upCost: 65, upCost2: 110,
      range: [84, 102, 120], damage: [14, 20, 22], rate: [1.25, 1.05, 0.90],
      stun: [0, 0, 0.85],
      blurb: 'Shockwave that strips shields',
      upBlurb: 'Wider blast, more punch',
      upBlurb2: 'Shockwave stuns ships',
    },
  },
  enemies: {
    scout: {
      name: 'Scout', hp: 38, speed: 88, reward: 10, hull: 1, r: 11, rgb: '255,80,220',
      resist: { laser: 1.5, missile: 0.35, ice: 1, railgun: 1, tesla: 1, pulse: 1 },
      weak: ['LASER'], resists: ['MISSILES'],
    },
    fighter: {
      name: 'Fighter', hp: 80, speed: 58, reward: 18, hull: 1, r: 14, rgb: '90,200,255',
      resist: { laser: 1, missile: 1, ice: 1, railgun: 1, tesla: 1, pulse: 1 },
      weak: [], resists: [],
    },
    armored: {
      name: 'Armored', hp: 240, speed: 36, reward: 30, hull: 2, r: 18, rgb: '255,205,90',
      resist: { laser: 0.4, missile: 1.5, ice: 1, railgun: 1.55, tesla: 1, pulse: 1 },
      weak: ['MISSILES', 'RAILGUN'], resists: ['LASER'],
    },
    shielded: {
      name: 'Shielded', hp: 90, shield: 160, speed: 48, reward: 28, hull: 2, r: 16, rgb: '120,200,255',
      resist: { laser: 1, missile: 1, ice: 1, railgun: 1, tesla: 1.2, pulse: 1.35 },
      weak: ['TESLA', 'PULSE'], resists: ['UNSHIELDED FIRE'],
      notes: 'Shield resists almost everything until Tesla or Pulse breaks it.',
    },
    cryo: {
      name: 'Cryo Engine', hp: 150, speed: 50, reward: 26, hull: 2, r: 16, rgb: '160,230,255',
      resist: { laser: 1, missile: 1, ice: 0.25, railgun: 1, tesla: 1, pulse: 1 },
      weak: [], resists: ['ICE'],
      iceImmune: true,
      notes: 'Immune to ice slow and freeze.',
    },
    flagship1: {
      name: 'Raid Cruiser', hp: 1800, shield: 600, speed: 24, reward: 180, hull: 12, r: 40, rgb: '255,200,110',
      resist: { laser: 0.7, missile: 1.15, ice: 1, railgun: 1.2, tesla: 1.15, pulse: 1.25 },
      weak: ['MISSILES', 'RAILGUN', 'PULSE'], resists: ['LASER'],
      boss: true, scale: 0.82, sprite: 'flagship',
    },
    flagship2: {
      name: 'Siege Dreadnought', hp: 2800, shield: 800, speed: 22, reward: 220, hull: 16, r: 44, rgb: '255,210,120',
      resist: { laser: 0.7, missile: 1.15, ice: 1, railgun: 1.25, tesla: 1.1, pulse: 1.15 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      boss: true, scale: 0.92, sprite: 'flagship',
    },
    flagship: {
      name: "Edisar's Flagship", hp: 4200, shield: 1100, speed: 22, reward: 250, hull: 20, r: 46, rgb: '255,220,120',
      resist: { laser: 0.65, missile: 1.2, ice: 0.85, railgun: 1.3, tesla: 1.15, pulse: 1.2 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      boss: true, scale: 1, sprite: 'flagship',
    },
  },
  levels: [
    {
      id: 'orbital', name: 'ORBITAL STATION', short: 'Orbital', variant: 'orbital',
      blurb: 'Hold the last orbital platform.',
      path: [[0, 4], [6, 4], [6, 11], [13, 11], [13, 4], [20, 4], [20, 12], [28, 12], [31, 12]],
      hpMul: 1, waves: [
        { name: 'SCOUT WING',           groups: [['scout', 8, 0.70]] },
        { name: 'FIGHTER ESCORT',       groups: [['scout', 8, 0.55], ['fighter', 4, 0.85]] },
        { name: 'STRIKE FIGHTERS',      groups: [['fighter', 8, 0.75]] },
        { name: 'ARMOR COLUMN',         groups: [['scout', 6, 0.45], ['armored', 4, 1.15]] },
        { name: 'MIXED FLEET',          groups: [['fighter', 8, 0.70], ['armored', 3, 1.00]] },
        { name: 'SHIELD SCREEN',        groups: [['scout', 6, 0.40], ['shielded', 6, 0.90]] },
        { name: 'COLD ENGINES',         groups: [['cryo', 5, 0.90], ['fighter', 5, 0.70]] },
        { name: 'BATTLE GROUP',         groups: [['scout', 6, 0.40], ['armored', 5, 0.90], ['shielded', 4, 0.95]] },
        { name: 'DREAD LINE',           groups: [['armored', 6, 0.80], ['cryo', 4, 0.80], ['shielded', 5, 0.85]] },
        { name: 'RAID CRUISER',         groups: [['flagship1', 1, 0.10], ['armored', 4, 1.20], ['shielded', 3, 0.90], ['fighter', 4, 0.70]] },
      ],
    },
    {
      id: 'belt', name: 'ASTEROID BELT', short: 'Asteroid Belt', variant: 'belt',
      blurb: 'Ambush lanes through the rocks.',
      path: [[0, 8], [5, 8], [5, 3], [12, 3], [12, 13], [19, 13], [19, 6], [25, 6], [25, 12], [31, 12]],
      hpMul: 1.3, waves: [
        { name: 'BELT SCOUTS',          groups: [['scout', 10, 0.55], ['fighter', 4, 0.80]] },
        { name: 'ROCK FIGHTERS',        groups: [['fighter', 10, 0.65]] },
        { name: 'ARMOR + ICE',          groups: [['armored', 5, 1.00], ['cryo', 4, 0.90]] },
        { name: 'SHIELD WALL',          groups: [['shielded', 6, 0.85], ['scout', 8, 0.40]] },
        { name: 'MIXED DRIFT',          groups: [['fighter', 6, 0.60], ['armored', 4, 0.90], ['cryo', 4, 0.80]] },
        { name: 'SWARM SCREEN',         groups: [['scout', 16, 0.30], ['shielded', 4, 0.90]] },
        { name: 'HEAVY COLUMN',         groups: [['armored', 8, 0.85], ['fighter', 6, 0.65]] },
        { name: 'COLD SHIELDS',         groups: [['cryo', 6, 0.75], ['shielded', 6, 0.85], ['scout', 6, 0.40]] },
        { name: 'FULL GROUP',           groups: [['armored', 6, 0.80], ['shielded', 5, 0.80], ['cryo', 4, 0.75], ['fighter', 5, 0.60]] },
        { name: 'SIEGE DREADNOUGHT',    groups: [['flagship2', 1, 0.10], ['armored', 4, 1.20], ['shielded', 4, 0.90], ['cryo', 3, 0.80]] },
      ],
    },
    {
      id: 'moon', name: 'MOON BASE', short: 'Moon Base', variant: 'moon',
      blurb: 'The last fortress on the lunar rim.',
      path: [[0, 3], [7, 3], [7, 8], [3, 8], [3, 13], [15, 13], [15, 5], [22, 5], [22, 11], [31, 11]],
      hpMul: 1.40, waves: [
        { name: 'LUNAR SCOUTS',         groups: [['scout', 8, 0.55], ['fighter', 4, 0.80]] },
        { name: 'SHIELD TIDE',          groups: [['shielded', 4, 0.95], ['scout', 5, 0.50]] },
        { name: 'CRYO LINE',            groups: [['cryo', 6, 0.80], ['fighter', 5, 0.70]] },
        { name: 'ARMOR STORM',          groups: [['armored', 8, 0.80], ['shielded', 4, 0.85]] },
        { name: 'MIXED ORBIT',          groups: [['fighter', 8, 0.55], ['armored', 5, 0.80], ['cryo', 5, 0.70]] },
        { name: 'SWARM COVER',          groups: [['scout', 20, 0.28], ['shielded', 6, 0.75]] },
        { name: 'HEAVY FROST',          groups: [['armored', 8, 0.75], ['cryo', 7, 0.70], ['fighter', 5, 0.55]] },
        { name: 'FORTRESS WING',        groups: [['shielded', 8, 0.70], ['armored', 6, 0.75], ['cryo', 5, 0.70]] },
        { name: 'DREAD TIDE',           groups: [['armored', 8, 0.70], ['shielded', 8, 0.70], ['cryo', 6, 0.65], ['fighter', 6, 0.50]] },
        { name: 'COMMANDER EDISAR',     groups: [['flagship', 1, 0.10], ['armored', 5, 1.10], ['shielded', 5, 0.85], ['cryo', 4, 0.80], ['fighter', 6, 0.60]] },
      ],
    },
  ],
};

SD.store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} },
};
SD.pad = (n, len = 2) => String(Math.max(0, Math.floor(n))).padStart(len, '0');

SD.Progress = {
  load() {
    try {
      const v = JSON.parse(SD.store.get(SD.CONFIG.storage.progress, ''));
      if (v && typeof v === 'object') {
        return { unlocked: Math.max(1, v.unlocked | 0), stars: [0, 0, 0].map((z, i) => (v.stars && v.stars[i]) || 0) };
      }
    } catch (e) {}
    return { unlocked: 1, stars: [0, 0, 0] };
  },
  save(p) { SD.store.set(SD.CONFIG.storage.progress, JSON.stringify(p)); },
  record(levelIndex, stars) {
    const p = SD.Progress.load();
    p.stars[levelIndex] = Math.max(p.stars[levelIndex] || 0, stars);
    p.unlocked = Math.max(p.unlocked, levelIndex + 2);
    SD.Progress.save(p);
    return p;
  },
};
