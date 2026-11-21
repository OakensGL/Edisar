/* Starlight: Last Station — global namespace + tunables. */
window.SD = window.SD || {};
SD.VERSION = '0.2.1';
SD.W = 1024; SD.H = 576;
SD.TILE = 32;

SD.CONFIG = {
  font: '"Courier New", Courier, monospace',
  crawlFont: '"DejaVu Sans", Verdana, Arial, Helvetica, sans-serif',
  startCredits: 180,
  startHull: 20,
  sellRefund: 0.70,
  waveGap: 22,
  callAfter: 3,
  bossLineTime: 6,
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
      stun: [0, 0, 0.4],
      stunCooldown: 3,
      blurb: 'Shockwave that strips shields',
      upBlurb: 'Wider blast, more punch',
      upBlurb2: 'Brief stun; bosses resist',
    },
    nebula: {
      name: 'NEBULA', short: 'NEBULA', rgb: '180,80,255',
      cost: 300, upCost: 0, upCost2: 0, maxLevel: 1, unique: 1, minLevel: 2,
      range: [220], damage: [240], rate: [2.55], pierce: [99],
      ignoreResist: true,
      blurb: "Dr. Nebula's dark-energy beam. Pierces a line and ignores shields and resists. One per map.",
    },
  },
  enemies: {
    scout: {
      name: 'Scout', hp: 22, speed: 88, reward: 6, hull: 1, r: 11, rgb: '255,80,220',
      resist: { laser: 1.5, missile: 0.35, ice: 1, railgun: 1, tesla: 1, pulse: 1 },
      weak: ['LASER'], resists: ['MISSILES'],
    },
    fighter: {
      name: 'Fighter', hp: 48, speed: 58, reward: 11, hull: 1, r: 14, rgb: '90,200,255',
      resist: { laser: 1, missile: 1, ice: 1, railgun: 1, tesla: 1, pulse: 1 },
      weak: [], resists: [],
    },
    armored: {
      name: 'Armored', hp: 145, speed: 36, reward: 16, hull: 2, r: 18, rgb: '255,205,90',
      resist: { laser: 0.4, missile: 1.5, ice: 1, railgun: 1.55, tesla: 1, pulse: 1 },
      weak: ['MISSILES', 'RAILGUN'], resists: ['LASER'],
    },
    shielded: {
      name: 'Shielded', hp: 55, shield: 95, speed: 48, reward: 15, hull: 2, r: 16, rgb: '120,200,255',
      resist: { laser: 1, missile: 1, ice: 1, railgun: 1, tesla: 1.2, pulse: 1.35 },
      weak: ['TESLA', 'PULSE'], resists: ['UNSHIELDED FIRE'],
      notes: 'Shield resists almost everything until Tesla or Pulse breaks it.',
    },
    cryo: {
      name: 'Cryo Engine', hp: 90, speed: 50, reward: 14, hull: 2, r: 16, rgb: '160,230,255',
      resist: { laser: 1, missile: 1, ice: 0.25, railgun: 1, tesla: 1, pulse: 1 },
      weak: [], resists: ['ICE'],
      iceImmune: true,
      notes: 'Immune to ice slow and freeze.',
    },
    interceptor: {
      name: 'Interceptor', hp: 14, speed: 194, reward: 7, hull: 1, r: 10, rgb: '255,150,60',
      resist: { laser: 1.6, missile: 0.7, ice: 1.25, railgun: 1, tesla: 1.5, pulse: 1 },
      weak: ['LASER', 'TESLA', 'ICE'], resists: ['MISSILES'],
      iceSlowMul: 1.45,
      notes: 'Very fast. Ice slows them hard.',
    },
    juggernaut: {
      name: 'Juggernaut', hp: 360, speed: 20, reward: 24, hull: 3, r: 24, rgb: '180,170,130',
      resist: { laser: 0.5, missile: 1.55, ice: 0.85, railgun: 1.65, tesla: 1, pulse: 1 },
      weak: ['RAILGUN', 'MISSILES'], resists: ['LASER', 'ICE SLOW'],
      iceSlowMul: 0.45,
      notes: 'Heavy tank. Ice only slows it partially.',
    },
    flagship1: {
      name: 'Raid Cruiser', hp: 1600, shield: 500, speed: 24, reward: 160, hull: 12, r: 40, rgb: '255,200,110',
      resist: { laser: 0.7, missile: 1.15, ice: 1, railgun: 1.2, tesla: 1.15, pulse: 1.25 },
      weak: ['MISSILES', 'RAILGUN', 'PULSE'], resists: ['LASER'],
      boss: true, scale: 0.82, sprite: 'flagship',
      line: "So this is the last station? Oakens, Nebula... you built a fortress out of scrap. Cute. Let my cruiser show you what real firepower looks like.",
    },
    flagship2: {
      name: 'Siege Dreadnought', hp: 2400, shield: 650, speed: 22, reward: 180, hull: 16, r: 44, rgb: '255,210,120',
      resist: { laser: 0.7, missile: 1.15, ice: 1, railgun: 1.25, tesla: 1.1, pulse: 1.15 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      boss: true, scale: 0.92, sprite: 'flagship',
      line: "You keep surviving. Avrill did too, until she didn't. My Dreadnought will grind your little towers into dust.",
    },
    flagship: {
      name: "Edisar's Flagship", hp: 3600, shield: 900, speed: 22, reward: 200, hull: 20, r: 46, rgb: '255,220,120',
      resist: { laser: 0.65, missile: 1.2, ice: 0.85, railgun: 1.3, tesla: 1.15, pulse: 1.2 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      boss: true, scale: 1, sprite: 'flagship',
      line: "I crawled back from the edge of the solar system for this moment. No more fleets, no more tricks. Face me yourselves... and fall.",
    },
  },
  levels: [
    {
      id: 'orbital', name: 'ORBITAL STATION', short: 'Orbital', variant: 'orbital',
      blurb: 'Hold the last orbital platform.',
      path: [[0, 4], [6, 4], [6, 11], [13, 11], [13, 4], [20, 4], [20, 12], [28, 12], [31, 12]],
      hpMul: 1, waves: [
        { name: 'SCOUT WING',           groups: [['scout', 16, 0.50]] },
        { name: 'FIGHTER ESCORT',       groups: [['scout', 16, 0.40], ['fighter', 8, 0.61]] },
        { name: 'STRIKE FIGHTERS',      groups: [['fighter', 12, 0.54], ['interceptor', 8, 0.30]] },
        { name: 'ARMOR COLUMN',         groups: [['scout', 12, 0.32], ['armored', 8, 0.83]] },
        { name: 'MIXED FLEET',          groups: [['fighter', 12, 0.50], ['armored', 6, 0.72], ['interceptor', 8, 0.28]] },
        { name: 'SHIELD SCREEN',        groups: [['scout', 12, 0.29], ['shielded', 12, 0.65]] },
        { name: 'COLD ENGINES',         groups: [['cryo', 10, 0.65], ['fighter', 10, 0.50]] },
        { name: 'BATTLE GROUP',         groups: [['scout', 10, 0.29], ['armored', 8, 0.65], ['shielded', 6, 0.68], ['juggernaut', 2, 1.40]] },
        { name: 'DREAD LINE',           groups: [['armored', 8, 0.58], ['cryo', 6, 0.58], ['shielded', 8, 0.61], ['juggernaut', 3, 1.30], ['interceptor', 8, 0.28]] },
        { name: 'RAID CRUISER',         groups: [['flagship1', 1, 0.10], ['armored', 6, 0.86], ['shielded', 5, 0.65], ['juggernaut', 2, 1.50], ['interceptor', 8, 0.32]] },
      ],
    },
    {
      id: 'belt', name: 'ASTEROID BELT', short: 'Asteroid Belt', variant: 'belt',
      blurb: 'Ambush lanes through the rocks.',
      path: [[0, 8], [5, 8], [5, 3], [12, 3], [12, 13], [19, 13], [19, 6], [25, 6], [25, 12], [31, 12]],
      hpMul: 1.3, waves: [
        { name: 'BELT SCOUTS',          groups: [['scout', 27, 0.34], ['fighter', 11, 0.50]] },
        { name: 'ROCK FIGHTERS',        groups: [['fighter', 18, 0.40], ['interceptor', 14, 0.26]] },
        { name: 'ARMOR + ICE',          groups: [['armored', 10, 0.62], ['cryo', 9, 0.56], ['juggernaut', 3, 1.35]] },
        { name: 'SHIELD WALL',          groups: [['shielded', 16, 0.53], ['scout', 22, 0.25]] },
        { name: 'MIXED DRIFT',          groups: [['fighter', 16, 0.37], ['armored', 11, 0.56], ['cryo', 11, 0.50]] },
        { name: 'SWARM SCREEN',         groups: [['scout', 22, 0.20], ['interceptor', 16, 0.18], ['shielded', 11, 0.56]] },
        { name: 'HEAVY COLUMN',         groups: [['armored', 16, 0.53], ['juggernaut', 4, 1.25], ['fighter', 12, 0.40]] },
        { name: 'COLD SHIELDS',         groups: [['cryo', 16, 0.47], ['shielded', 16, 0.53], ['scout', 16, 0.25]] },
        { name: 'FULL GROUP',           groups: [['armored', 12, 0.50], ['shielded', 12, 0.50], ['juggernaut', 4, 1.20], ['interceptor', 12, 0.24], ['fighter', 10, 0.37]] },
        { name: 'SIEGE DREADNOUGHT',    groups: [['flagship2', 1, 0.10], ['armored', 8, 0.74], ['shielded', 8, 0.56], ['juggernaut', 3, 1.30], ['interceptor', 10, 0.28]] },
      ],
    },
    {
      id: 'moon', name: 'MOON BASE', short: 'Moon Base', variant: 'moon',
      blurb: 'The last fortress on the lunar rim.',
      path: [[0, 3], [7, 3], [7, 8], [3, 8], [3, 13], [15, 13], [15, 5], [22, 5], [22, 11], [31, 11]],
      hpMul: 1.35, waves: [
        { name: 'LUNAR SCOUTS',         groups: [['scout', 12, 0.45], ['fighter', 6, 0.58]] },
        { name: 'SHIELD TIDE',          groups: [['shielded', 6, 0.70], ['scout', 8, 0.40]] },
        { name: 'CRYO LINE',            groups: [['cryo', 12, 0.50], ['fighter', 8, 0.45], ['interceptor', 10, 0.24]] },
        { name: 'ARMOR STORM',          groups: [['armored', 16, 0.46], ['shielded', 10, 0.49], ['juggernaut', 4, 1.20]] },
        { name: 'MIXED ORBIT',          groups: [['fighter', 24, 0.32], ['armored', 15, 0.46], ['cryo', 15, 0.41]] },
        { name: 'SWARM COVER',          groups: [['scout', 28, 0.18], ['interceptor', 18, 0.16], ['shielded', 16, 0.44]] },
        { name: 'HEAVY FROST',          groups: [['armored', 16, 0.44], ['juggernaut', 5, 1.15], ['cryo', 16, 0.41], ['fighter', 10, 0.32]] },
        { name: 'FORTRESS WING',        groups: [['shielded', 24, 0.41], ['armored', 18, 0.44], ['cryo', 15, 0.41]] },
        { name: 'DREAD TIDE',           groups: [['armored', 16, 0.41], ['shielded', 16, 0.41], ['juggernaut', 5, 1.10], ['interceptor', 14, 0.22], ['cryo', 12, 0.38]] },
        { name: 'COMMANDER EDISAR',     groups: [['flagship', 1, 0.10], ['armored', 10, 0.64], ['shielded', 10, 0.49], ['juggernaut', 4, 1.20], ['interceptor', 12, 0.26], ['cryo', 8, 0.46]] },
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
