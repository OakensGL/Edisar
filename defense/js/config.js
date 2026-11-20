/* Starlight: Last Station — global namespace + tunables. */
window.SD = window.SD || {};
SD.VERSION = '0.1.3';
SD.W = 1024; SD.H = 576;            // logical design resolution (16:9)
SD.TILE = 32;

SD.CONFIG = {
  font: '"Courier New", Courier, monospace',
  startCredits: 160,
  startHull: 20,
  sellRefund: 0.70,
  storage: { muted: 'starlight-td.muted' },
  hud: { top: 48, bottom: 86 },
  /* Path in tile coordinates (centers). Spawn at the first point, base at the last. */
  path: [
    [0, 4], [6, 4], [6, 11], [13, 11], [13, 4], [20, 4], [20, 12], [28, 12], [31, 12],
  ],
  turrets: {
    laser: {
      name: 'LASER', short: 'LASER', rgb: '80,170,255',
      cost: 50, upCost: 45,
      range: [112, 136], damage: [8, 14], rate: [0.28, 0.20],
      blurb: 'Fast single-target beam',
      upBlurb: 'Hotter beam, longer reach',
    },
    missile: {
      name: 'MISSILES', short: 'MISSILE', rgb: '255,170,70',
      cost: 85, upCost: 70,
      range: [148, 172], damage: [24, 40], rate: [1.15, 0.90],
      splash: [48, 64], splashMul: [0.55, 0.65],
      speed: [280, 340],
      blurb: 'Slow rockets, splash damage',
      upBlurb: 'Heavier warhead, wider blast',
    },
    ice: {
      name: 'ICE', short: 'ICE', rgb: '140,230,255',
      cost: 60, upCost: 50,
      range: [104, 128], damage: [3, 6], rate: [0.42, 0.32],
      slow: [0.55, 0.38], slowTime: [2.0, 2.6],
      blurb: 'Slows ships in range',
      upBlurb: 'Deeper freeze, longer hold',
    },
  },
  enemies: {
    scout:   { name: 'Scout',   hp: 24,  speed: 82, reward: 10, hull: 1, r: 11, rgb: '255,80,220' },
    fighter: { name: 'Fighter', hp: 48,  speed: 58, reward: 18, hull: 1, r: 14, rgb: '90,200,255' },
    armored: { name: 'Armor',   hp: 130, speed: 36, reward: 30, hull: 2, r: 18, rgb: '255,205,90' },
    flagship:{ name: "Edisar's Flagship", hp: 2800, speed: 22, reward: 250, hull: 20, r: 46, rgb: '255,220,120', boss: true },
  },
  /* 10 waves. Entries are [type, count, gapSeconds]. Groups in a wave spawn in order. */
  waves: [
    { name: 'SCOUT WING',           groups: [['scout', 8, 0.70]] },
    { name: 'FIGHTER ESCORT',       groups: [['scout', 8, 0.55], ['fighter', 4, 0.85]] },
    { name: 'STRIKE FIGHTERS',      groups: [['fighter', 8, 0.75]] },
    { name: 'ARMOR COLUMN',         groups: [['scout', 6, 0.45], ['armored', 4, 1.15]] },
    { name: 'MIXED FLEET',          groups: [['fighter', 8, 0.70], ['armored', 3, 1.00]] },
    { name: 'SCOUT SWARM',          groups: [['scout', 18, 0.32]] },
    { name: 'HEAVY ARMOR',          groups: [['armored', 7, 0.95], ['fighter', 5, 0.70]] },
    { name: 'FULL BATTLE GROUP',    groups: [['scout', 8, 0.40], ['fighter', 8, 0.60], ['armored', 6, 0.90]] },
    { name: 'DREAD LINE',           groups: [['armored', 10, 0.80], ['fighter', 8, 0.55]] },
    { name: 'COMMANDER EDISAR',     groups: [['flagship', 1, 0.10], ['armored', 4, 1.40], ['fighter', 6, 0.70]] },
  ],
};

SD.store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} },
};
SD.pad = (n, len = 2) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
