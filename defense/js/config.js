/* Starlight: Last Station — global namespace + tunables. */
window.SD = window.SD || {};
SD.VERSION = '0.4.5';
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
  bossLineTime: 5.6,
  replyLineTime: 4.6,
  joeLineTime: 4.2,
  joeLineGap: 7,
  bossEmpLine: "Power down. Let's see those towers fight in the dark.",
  bossEmpReply: "Cute trick. My dark energy works just fine in the dark, darling.",
  siegeLines: {
    open: {
      edisar: "Two gates, opposite headings. This is your last damn station, Oakens — and I will tear it open from both ends.",
      nebula: "Tear it open? You tried that already. Get in line, Edisar — this station bites back.",
    },
    gate3: {
      edisar: "A third gate just came online. Did you really think two fronts were enough, you stubborn bastards? Hell is arriving from a new heading.",
      nebula: "A new heading. How original. I'll be there before your fleet finishes the speech.",
    },
    gate4: {
      edisar: "Four gates. You're surrounded. Nowhere left to hide, nowhere left to run. I opened every damn door — this station falls today.",
      nebula: "Every damn door? Good. Saves me the walk. Come get us.",
    },
    shift: [
      {
        edisar: "New sky. Same end. I brought a darker fleet this time — try not to blink, you bastards.",
        nebula: "Darker fleet, same loud captain. Blink if you want. I won't.",
      },
      {
        edisar: "Another shift, another wave. You held the last ten? Cute. Hell is only getting started.",
        nebula: "Hell's getting started? Cute. We already live here.",
      },
      {
        edisar: "I can do this forever. Can you? The gates stay open, and I am not done with this station.",
        nebula: "Forever? Please. I've got better things to do than listen to you monologue.",
      },
      {
        edisar: "Look at that sky. Pretty, isn't it? It will be the last damn thing your precious station ever sees.",
        nebula: "Pretty sky. Shame your face is in it. This station isn't going anywhere.",
      },
    ],
  },
  bossSlowFloor: 0.75,
  bossMinSpeed: 12,
  bossIceFreezeCap: 0.3,
  bossIceFreezeCd: 2.4,
  bossHeroFreeze: 0.5,
  bossHeroFreezeCd: 4,
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
      tip: {
        role: 'Rapid-fire beam. Laser damage.',
        effect: 'Fast single-target shots. Twin beams at MK III. Armory can add faster fire, crits, and a glancing beam.',
        vs: 'Good vs Scouts and Interceptors.',
        resist: 'Armored ships, Juggernauts, and bosses resist it.',
      },
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
      tip: {
        role: 'Splash bombardment. Missile damage.',
        effect: 'Slow rockets with splash. Cluster warheads at MK III. Armory can widen the blast and speed up rockets.',
        vs: 'Good vs Armored ships and Juggernauts.',
        resist: 'Scouts and Interceptors resist it.',
      },
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
      tip: {
        role: 'Crowd control. Ice damage.',
        effect: 'Slows ships in range. Brief hard freeze at MK III. Armory can deepen the slow and add a rime field. Bosses strongly resist slow and freeze.',
        vs: 'Interceptors are slowed hard.',
        resist: 'Cryo ships are immune. Juggernauts barely slow.',
      },
    },
    railgun: {
      name: 'RAILGUN', short: 'RAIL', rgb: '255,210,90',
      cost: 120, upCost: 90, upCost2: 140,
      range: [230, 260, 290], damage: [58, 82, 110], rate: [1.85, 1.55, 1.35],
      pierce: [3, 4, 99],
      blurb: 'Long-range piercing slug',
      upBlurb: 'Heavier slug, more pierce',
      upBlurb2: 'Pierces the whole line',
      tip: {
        role: 'Long-range sniper. Railgun damage.',
        effect: 'Piercing slug. MK III goes through the whole line. Armory can add pierce, a faster charge, and sabot rounds.',
        vs: 'Good vs Armored ships and Juggernauts.',
        resist: 'Weak against shields until they drop.',
      },
    },
    tesla: {
      name: 'TESLA', short: 'TESLA', rgb: '180,140,255',
      cost: 95, upCost: 80, upCost2: 125,
      range: [108, 128, 148], damage: [15, 22, 24], rate: [0.72, 0.58, 0.50],
      chain: [3, 4, 6], jump: [70, 82, 96],
      blurb: 'Arc that chains to nearby ships',
      upBlurb: 'Longer arc, more jumps',
      upBlurb2: 'Chains further still',
      tip: {
        role: 'Chaining arc. Tesla damage.',
        effect: 'Jumps from ship to ship and punches through shields. Armory can extend the chain and briefly stun light ships.',
        vs: 'Good vs Shielded ships and Interceptors.',
        resist: 'No hull type resists the arc.',
      },
    },
    pulse: {
      name: 'PULSE', short: 'PULSE', rgb: '80,255,180',
      cost: 75, upCost: 65, upCost2: 110,
      range: [84, 102, 120], damage: [14, 20, 22], rate: [1.25, 1.05, 0.90],
      poison: [5, 8, 12], poisonTime: [2.0, 2.6, 3.2], poisonMax: [2, 3, 3],
      poisonSpread: [0, 0, 52],
      blurb: 'Shockwave that strips shields and poisons hulls',
      upBlurb: 'Wider blast, stronger toxin',
      upBlurb2: 'Toxin spreads to nearby ships',
      tip: {
        role: 'Shield-breaker. Pulse damage.',
        effect: 'Strips shields and poisons hulls. MK III toxin spreads. Armory can strengthen the toxin, punch shields harder, or cut the build cost.',
        vs: 'Good vs Shielded ships.',
        resist: 'Low burst vs heavy hulls until the toxin stacks.',
      },
    },
    nebula: {
      name: 'NEBULA', short: 'NEBULA', rgb: '255,70,70',
      cost: 300, upCost: 0, upCost2: 0, maxLevel: 1, unique: 1, minLevel: 2,
      range: [220], damage: [240], rate: [2.55], pierce: [99],
      ignoreResist: true,
      blurb: 'High Level Performance',
      tip: {
        role: 'High Level Performance',
      },
    },
  },
  abilities: {
    orbital: { id: 'orbital', name: 'ORBITAL', sub: 'STRIKE', rgb: '255,180,80', cd: 42, dmg: 170, radius: 78 },
    drones:  { id: 'drones',  name: 'DRONES',  sub: 'HOLD',   rgb: '80,200,255', cd: 38, radius: 70, hold: 1.35 },
    emp:     { id: 'emp',     name: 'EMP',     sub: 'SHIELDS', rgb: '200,230,255', cd: 32, radius: 92 },
  },
  heroes: {
    oakens: {
      id: 'oakens', name: 'OAKENS', rgb: '80,170,255',
      hp: 110, range: 102, damage: 14, rate: 0.34, moveCd: 3.2, moveSpeed: 230,
      specialCd: 28, special: 'missiles', specialDmg: 32, specialR: 70, respawn: 12,
    },
    nebula: {
      id: 'nebula', name: 'NEBULA', rgb: '255,70,70',
      hp: 95, range: 122, damage: 20, rate: 0.62, moveCd: 3.2, moveSpeed: 210,
      specialCd: 32, special: 'lightning', specialDmg: 40, specialRange: 200, respawn: 12,
    },
  },
  enemies: {
    scout: {
      name: 'Scout', hp: 22, speed: 88, reward: 4, hull: 1, r: 11, rgb: '255,80,220',
      resist: { laser: 1.5, missile: 0.35, ice: 1, railgun: 1, tesla: 1, pulse: 1 },
      weak: ['LASER'], resists: ['MISSILES'],
    },
    fighter: {
      name: 'Fighter', hp: 48, speed: 58, reward: 8, hull: 1, r: 14, rgb: '90,200,255',
      resist: { laser: 1, missile: 1, ice: 1, railgun: 1, tesla: 1, pulse: 1 },
      weak: [], resists: [],
    },
    armored: {
      name: 'Armored', hp: 145, speed: 36, reward: 12, hull: 2, r: 18, rgb: '255,205,90',
      resist: { laser: 0.4, missile: 1.5, ice: 1, railgun: 1.55, tesla: 1, pulse: 1 },
      weak: ['MISSILES', 'RAILGUN'], resists: ['LASER'],
    },
    shielded: {
      name: 'Shielded', hp: 55, shield: 95, speed: 48, reward: 11, hull: 2, r: 16, rgb: '120,200,255',
      resist: { laser: 1, missile: 1, ice: 1, railgun: 1, tesla: 1.2, pulse: 1.35 },
      weak: ['TESLA', 'PULSE'], resists: ['UNSHIELDED FIRE'],
      notes: 'Shield resists almost everything until Tesla or Pulse breaks it.',
    },
    cryo: {
      name: 'Cryo Engine', hp: 90, speed: 50, reward: 10, hull: 2, r: 16, rgb: '160,230,255',
      resist: { laser: 1, missile: 1, ice: 0.25, railgun: 1, tesla: 1, pulse: 1 },
      weak: [], resists: ['ICE'],
      iceImmune: true,
      notes: 'Immune to ice slow and freeze.',
    },
    interceptor: {
      name: 'Interceptor', hp: 14, speed: 194, reward: 5, hull: 1, r: 10, rgb: '255,150,60',
      resist: { laser: 1.6, missile: 0.7, ice: 1.25, railgun: 1, tesla: 1.5, pulse: 1 },
      weak: ['LASER', 'TESLA', 'ICE'], resists: ['MISSILES'],
      iceSlowMul: 1.45,
      notes: 'Very fast. Ice slows them hard.',
    },
    juggernaut: {
      name: 'Juggernaut', hp: 360, speed: 20, reward: 17, hull: 3, r: 24, rgb: '180,170,130',
      resist: { laser: 0.5, missile: 1.55, ice: 0.85, railgun: 1.65, tesla: 1, pulse: 1 },
      weak: ['RAILGUN', 'MISSILES'], resists: ['LASER', 'ICE SLOW'],
      iceSlowMul: 0.45,
      notes: 'Heavy tank. Ice only slows it partially.',
    },
    flagship1: {
      name: 'Raid Cruiser', hp: 1600, shield: 500, speed: 24, reward: 115, hull: 12, r: 40, rgb: '255,200,110',
      resist: { laser: 0.7, missile: 1.15, ice: 1, railgun: 1.2, tesla: 1.15, pulse: 1.25 },
      weak: ['MISSILES', 'RAILGUN', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 10, radius: 100, duration: 3.0, max: 1, delay: 5 },
      boss: true, scale: 0.86, sprite: 'flagship1',
      line: "So this is the last station? Oakens, Nebula... you built a fortress out of scrap. Cute. Let my cruiser show you what real firepower looks like.",
      reply: "Scrap with excellent taste in targets. Come closer, Edisar. I'll show you mine.",
    },
    flagship2: {
      name: 'Siege Dreadnought', hp: 2400, shield: 650, speed: 22, reward: 130, hull: 16, r: 44, rgb: '255,210,120',
      resist: { laser: 0.7, missile: 1.15, ice: 1, railgun: 1.25, tesla: 1.1, pulse: 1.15 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 9.5, radius: 110, duration: 3.2, max: 1, delay: 4.5 },
      boss: true, scale: 0.94, sprite: 'flagship2',
      line: "You keep surviving. Avrill did too, until she didn't. My Dreadnought will grind your little towers into dust.",
      reply: "Leave Avrill out of your mouth. Your dreadnought can eat a railgun.",
    },
    flagship: {
      name: "Edisar's Flagship", hp: 3600, shield: 900, speed: 22, reward: 144, hull: 20, r: 46, rgb: '255,220,120',
      resist: { laser: 0.65, missile: 1.2, ice: 0.85, railgun: 1.3, tesla: 1.15, pulse: 1.2 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 9, radius: 120, duration: 3.4, max: 2, delay: 4 },
      boss: true, scale: 1, sprite: 'flagship',
      line: "I crawled back from the edge of the solar system for this moment. No more fleets, no more tricks. Face me yourselves... and fall.",
      reply: "You crawled back for a speech? Disappointing. Fall in, then — we're not going anywhere.",
    },
    flagship4: {
      name: 'Sunlance Frigate', hp: 4000, shield: 1000, speed: 21, reward: 158, hull: 18, r: 44, rgb: '255,200,110',
      resist: { laser: 0.65, missile: 1.15, ice: 0.9, railgun: 1.25, tesla: 1.15, pulse: 1.2 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 9, radius: 130, duration: 3.5, max: 2, delay: 4 },
      boss: true, scale: 1.00, sprite: 'flagship4',
      line: "You thought the moon was the end of it? I left a second fleet in the solar docks. They're hungry, and they remember your names.",
      reply: "They can remember this, too: the docks fall, and so do you.",
    },
    flagship5: {
      name: 'Twin-Spear Vanguard', hp: 4800, shield: 1200, speed: 21, reward: 180, hull: 20, r: 46, rgb: '255,210,120',
      resist: { laser: 0.65, missile: 1.2, ice: 0.9, railgun: 1.3, tesla: 1.15, pulse: 1.2 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 8.5, radius: 140, duration: 3.8, max: 2, delay: 3.5 },
      boss: true, scale: 1.04, sprite: 'flagship5',
      line: "Two gates, one grave. I will come at you from every heading until there is nothing left of your precious station.",
      reply: "Two gates, one very irritated scientist. Pick a heading and get it over with.",
    },
    flagship6: {
      name: 'The Eclipse', hp: 5800, shield: 1400, speed: 20, reward: 202, hull: 22, r: 48, rgb: '255,220,130',
      resist: { laser: 0.6, missile: 1.2, ice: 0.85, railgun: 1.3, tesla: 1.2, pulse: 1.2 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 8, radius: 150, duration: 4.0, max: 2, delay: 3.5 },
      boss: true, scale: 1.08, sprite: 'flagship6',
      line: "This is the fleet I hid in the dark. Avrill's light doesn't reach this far, Oakens. Step into the eclipse and be extinguished.",
      reply: "He doesn't need to say a word. I brought my own light — and it burns.",
    },
    wraith: {
      name: 'Wraith', hp: 70, speed: 62, reward: 11, hull: 2, r: 13, rgb: '180,120,255',
      resist: { laser: 1.1, missile: 0.85, ice: 0.9, railgun: 1, tesla: 1.15, pulse: 1.1 },
      weak: ['TESLA', 'MISSILES'], resists: ['LOCK-ON'],
      iceSlowMul: 0.85,
      phase: { visible: 2.6, hidden: 1.15 },
      notes: 'Phases out of turret lock for a moment, then reappears.',
    },
    hive: {
      name: 'Hive Pod', hp: 110, speed: 38, reward: 14, hull: 2, r: 16, rgb: '160,220,80',
      resist: { laser: 0.9, missile: 1.2, ice: 1, railgun: 1.15, tesla: 1, pulse: 0.95 },
      weak: ['MISSILES', 'RAILGUN'], resists: ['LASER'],
      splitOnDeath: { type: 'swarmer', count: 3 },
      notes: 'Bursts into three Swarmers when destroyed.',
    },
    swarmer: {
      name: 'Swarmer', hp: 16, speed: 96, reward: 2, hull: 1, r: 8, rgb: '200,255,90',
      resist: { laser: 1.35, missile: 0.75, ice: 1.2, railgun: 1, tesla: 1.4, pulse: 1 },
      weak: ['LASER', 'TESLA', 'ICE'], resists: ['MISSILES'],
      notes: 'Tiny and fast. Hatches from a destroyed Hive Pod.',
    },
    flagship7: {
      name: 'Comet Reaver', hp: 7000, shield: 1600, speed: 20, reward: 220, hull: 24, r: 48, rgb: '255,180,90',
      resist: { laser: 0.6, missile: 1.2, ice: 0.85, railgun: 1.3, tesla: 1.2, pulse: 1.2 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 7.5, radius: 165, duration: 4.1, max: 2, delay: 3.2 },
      boss: true, scale: 1.10, sprite: 'flagship7',
      line: "Your scrap will decorate my hull. I combed this wreck yard for a reason — to watch you join it.",
      reply: "Decorate this, you pompous bastard. The wreck yard's got room for one more.",
    },
    flagship8: {
      name: 'Storm Lance', hp: 7600, shield: 1680, speed: 19, reward: 240, hull: 22, r: 50, rgb: '200,220,255',
      resist: { laser: 0.6, missile: 1.2, ice: 0.85, railgun: 1.3, tesla: 1.15, pulse: 1.2 },
      weak: ['RAILGUN', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 7.5, radius: 170, duration: 4.0, max: 2, delay: 3 },
      boss: true, scale: 1.12, sprite: 'flagship8',
      line: "The ion storm is already inside your grid. Three bolts. No shelters. Hold still.",
      reply: "Hold still? Not a chance. I eat ion storms for breakfast.",
    },
    flagship9: {
      name: 'The Triad', hp: 7200, shield: 1600, speed: 18, reward: 265, hull: 24, r: 52, rgb: '255,210,120',
      resist: { laser: 0.55, missile: 1.25, ice: 0.8, railgun: 1.35, tesla: 1.2, pulse: 1.25 },
      weak: ['RAILGUN', 'TESLA', 'PULSE'], resists: ['LASER'],
      iceSlowMul: 0.4,
      emp: { cd: 7.2, radius: 180, duration: 4.1, max: 2, delay: 3 },
      boss: true, scale: 1.16, sprite: 'flagship9',
      line: "Three gates. One grave. This is the last station, and I will take it from every heading at once.",
      reply: "Take it? Over my smoking wreck, and not a damn second sooner.",
    },
  },
  levels: [
    {
      id: 'orbital', name: 'ORBITAL STATION', short: 'Orbital', variant: 'orbital',
      blurb: 'Hold the last orbital platform.',
      path: [[0, 4], [6, 4], [6, 11], [13, 11], [13, 4], [20, 4], [20, 12], [28, 12], [31, 12]],
      pads: [
        {tx:4,ty:5},{tx:7,ty:5},{tx:5,ty:8},{tx:8,ty:10},{tx:10,ty:10},
        {tx:14,ty:9},{tx:15,ty:5},{tx:19,ty:8},{tx:23,ty:11},{tx:26,ty:11},
        {tx:7,ty:8,premium:1,cost:80},{tx:12,ty:8,premium:1,cost:100},{tx:21,ty:11,premium:1,cost:120},
      ],
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
      pads: [
        {tx:3,ty:7},{tx:6,ty:6},{tx:6,ty:4},{tx:10,ty:4},{tx:11,ty:6},
        {tx:13,ty:8},{tx:13,ty:11},{tx:16,ty:12},{tx:18,ty:8},{tx:20,ty:8},
        {tx:23,ty:7},{tx:26,ty:11},
        {tx:6,ty:5,premium:1,cost:80},{tx:13,ty:10,premium:1,cost:100},
        {tx:20,ty:7,premium:1,cost:110},{tx:24,ty:11,premium:1,cost:120},
      ],
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
      pads: [
        {tx:5,ty:4},{tx:8,ty:5},{tx:8,ty:7},{tx:5,ty:9},{tx:5,ty:12},
        {tx:9,ty:12},{tx:12,ty:12},{tx:16,ty:11},{tx:16,ty:8},{tx:18,ty:6},
        {tx:21,ty:7},{tx:23,ty:9},
        {tx:6,ty:6,premium:1,cost:90},{tx:14,ty:12,premium:1,cost:110},
        {tx:16,ty:6,premium:1,cost:120},{tx:21,ty:10,premium:1,cost:100},
      ],
      hpMul: 1.58, waves: [
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
    {
      id: 'dock', name: 'SOLAR DRYDOCK', short: 'Drydock', variant: 'dock',
      blurb: 'A second fleet waits in the solar yards.',
      path: [[0, 5], [5, 5], [5, 2], [11, 2], [11, 9], [4, 9], [4, 13], [13, 13], [13, 7], [19, 7], [19, 3], [25, 3], [25, 12], [31, 12]],
      pads: [
        {tx:3,ty:4},{tx:6,ty:4},{tx:6,ty:3},{tx:9,ty:3},{tx:10,ty:6},
        {tx:10,ty:8},{tx:6,ty:10},{tx:6,ty:12},{tx:10,ty:12},{tx:14,ty:12},
        {tx:14,ty:9},{tx:16,ty:8},{tx:20,ty:6},{tx:20,ty:4},{tx:23,ty:4},
        {tx:24,ty:8},{tx:26,ty:11},{tx:28,ty:11},
        {tx:10,ty:4,premium:1,cost:90},{tx:12,ty:10,premium:1,cost:110},
        {tx:18,ty:6,premium:1,cost:120},{tx:24,ty:11,premium:1,cost:100},
      ],
      hpMul: 1.78, waves: [
        { name: 'YARD SCOUTS',          groups: [['scout', 18, 0.40], ['fighter', 10, 0.50]] },
        { name: 'DOCK FIGHTERS',        groups: [['fighter', 16, 0.40], ['interceptor', 12, 0.24]] },
        { name: 'ARMOR GANTRY',         groups: [['armored', 14, 0.48], ['cryo', 10, 0.46], ['juggernaut', 3, 1.20]] },
        { name: 'SHIELD SCAFFOLD',      groups: [['shielded', 16, 0.46], ['scout', 18, 0.24]] },
        { name: 'MIXED SHIFT',          groups: [['fighter', 20, 0.34], ['armored', 14, 0.46], ['cryo', 12, 0.42]] },
        { name: 'SWARM LANE',           groups: [['scout', 26, 0.18], ['interceptor', 16, 0.16], ['shielded', 14, 0.44]] },
        { name: 'HEAVY HOIST',          groups: [['armored', 16, 0.44], ['juggernaut', 5, 1.15], ['cryo', 14, 0.40], ['fighter', 12, 0.34]] },
        { name: 'DRYDOCK WING',         groups: [['shielded', 20, 0.40], ['armored', 16, 0.44], ['cryo', 14, 0.40]] },
        { name: 'SUNLANCE LINE',        groups: [['armored', 16, 0.40], ['shielded', 16, 0.40], ['juggernaut', 5, 1.10], ['interceptor', 14, 0.22], ['cryo', 12, 0.38]] },
        { name: 'SUNLANCE FRIGATE',     groups: [['flagship4', 1, 0.10], ['armored', 10, 0.60], ['shielded', 10, 0.48], ['juggernaut', 4, 1.20], ['interceptor', 12, 0.26], ['cryo', 8, 0.44]] },
      ],
    },
    {
      id: 'canyon', name: 'TWIN GATES', short: 'Twin Gates', variant: 'canyon',
      blurb: 'Two invasion corridors merge on the station.',
      paths: [
        [[0, 3], [7, 3], [7, 8], [14, 8], [14, 5], [21, 5], [21, 11], [31, 11]],
        [[0, 13], [7, 13], [7, 8], [14, 8], [14, 11], [21, 11], [31, 11]],
      ],
      pads: [
        {tx:5,ty:4},{tx:8,ty:4},{tx:8,ty:6},{tx:5,ty:12},{tx:8,ty:12},
        {tx:8,ty:10},{tx:10,ty:7},{tx:10,ty:9},{tx:12,ty:7},{tx:12,ty:9},
        {tx:15,ty:6},{tx:15,ty:9},{tx:17,ty:6},{tx:18,ty:10},{tx:20,ty:7},
        {tx:22,ty:9},{tx:24,ty:10},{tx:27,ty:10},
        {tx:6,ty:8,premium:1,cost:100},{tx:13,ty:7,premium:1,cost:120},
        {tx:13,ty:9,premium:1,cost:120},{tx:20,ty:10,premium:1,cost:110},
      ],
      hpMul: 1.68, waves: [
        { name: 'SPLIT SCOUTS',         groups: [['scout', 20, 0.36], ['fighter', 12, 0.48]] },
        { name: 'DUAL FIGHTERS',        groups: [['fighter', 18, 0.36], ['interceptor', 14, 0.22]] },
        { name: 'CANYON ARMOR',         groups: [['armored', 16, 0.46], ['cryo', 12, 0.44], ['juggernaut', 3, 1.18]] },
        { name: 'TWIN SHIELDS',         groups: [['shielded', 18, 0.44], ['scout', 20, 0.22]] },
        { name: 'MERGED FLEET',         groups: [['fighter', 22, 0.32], ['armored', 16, 0.44], ['cryo', 14, 0.40]] },
        { name: 'CROSS SWARM',          groups: [['scout', 28, 0.16], ['interceptor', 18, 0.16], ['shielded', 16, 0.42]] },
        { name: 'HEAVY FORK',           groups: [['armored', 18, 0.42], ['juggernaut', 5, 1.12], ['cryo', 14, 0.40], ['fighter', 12, 0.32]] },
        { name: 'BOTH GATES',           groups: [['shielded', 22, 0.40], ['armored', 18, 0.42], ['cryo', 14, 0.40]] },
        { name: 'VANGUARD TIDE',        groups: [['armored', 18, 0.40], ['shielded', 18, 0.40], ['juggernaut', 5, 1.08], ['interceptor', 16, 0.20], ['cryo', 12, 0.36]] },
        { name: 'TWIN-SPEAR VANGUARD',  groups: [['flagship5', 1, 0.10], ['armored', 12, 0.56], ['shielded', 12, 0.46], ['juggernaut', 4, 1.16], ['interceptor', 14, 0.24], ['cryo', 10, 0.42]] },
      ],
    },
    {
      id: 'void', name: 'ECLIPSE RIM', short: 'Eclipse Rim', variant: 'void',
      blurb: 'Edisar hid a last fleet in the dark.',
      paths: [
        [[0, 3], [10, 3], [10, 7], [5, 7], [5, 11], [13, 11], [13, 6], [20, 6], [20, 11], [31, 11]],
        [[0, 13], [9, 13], [9, 9], [16, 9], [16, 13], [23, 13], [23, 7], [27, 7], [27, 11], [31, 11]],
      ],
      pads: [
        {tx:5,ty:4},{tx:8,ty:4},{tx:11,ty:4},{tx:11,ty:6},{tx:8,ty:6},
        {tx:6,ty:8},{tx:6,ty:10},{tx:8,ty:12},{tx:11,ty:12},{tx:11,ty:10},
        {tx:14,ty:10},{tx:14,ty:7},{tx:17,ty:7},{tx:18,ty:5},{tx:19,ty:8},
        {tx:17,ty:12},{tx:21,ty:12},{tx:21,ty:8},{tx:24,ty:8},{tx:25,ty:10},
        {tx:26,ty:10},{tx:28,ty:10},
        {tx:9,ty:5,premium:1,cost:100},{tx:12,ty:10,premium:1,cost:120},
        {tx:19,ty:10,premium:1,cost:120},{tx:24,ty:9,premium:1,cost:110},
      ],
      hpMul: 1.72, waves: [
        { name: 'VOID SCOUTS',          groups: [['scout', 22, 0.32], ['fighter', 14, 0.44]] },
        { name: 'DARK FIGHTERS',        groups: [['fighter', 20, 0.34], ['interceptor', 16, 0.20]] },
        { name: 'ECLIPSE ARMOR',        groups: [['armored', 18, 0.44], ['cryo', 14, 0.42], ['juggernaut', 4, 1.14]] },
        { name: 'BLACK SHIELDS',        groups: [['shielded', 20, 0.42], ['scout', 22, 0.20]] },
        { name: 'UMBRAL MIX',           groups: [['fighter', 24, 0.30], ['armored', 18, 0.42], ['cryo', 16, 0.38]] },
        { name: 'NIGHT SWARM',          groups: [['scout', 30, 0.16], ['interceptor', 20, 0.15], ['shielded', 18, 0.40]] },
        { name: 'HEAVY DARK',           groups: [['armored', 20, 0.40], ['juggernaut', 6, 1.10], ['cryo', 16, 0.38], ['fighter', 14, 0.30]] },
        { name: 'RIM WING',             groups: [['shielded', 24, 0.38], ['armored', 20, 0.40], ['cryo', 16, 0.38]] },
        { name: 'ECLIPSE TIDE',         groups: [['armored', 20, 0.38], ['shielded', 20, 0.38], ['juggernaut', 6, 1.06], ['interceptor', 18, 0.18], ['cryo', 14, 0.36]] },
        { name: 'THE ECLIPSE',          groups: [['flagship6', 1, 0.10], ['armored', 14, 0.52], ['shielded', 14, 0.44], ['juggernaut', 5, 1.12], ['interceptor', 16, 0.22], ['cryo', 12, 0.40]] },
      ],
    },
    {
      id: 'wreck', name: 'WRECK YARD', short: 'Wreck Yard', variant: 'wreck',
      blurb: 'A debris field of dead hulls. Wraiths hunt the lanes.',
      paths: [
        [[0, 3], [6, 3], [6, 8], [14, 8], [14, 4], [22, 4], [22, 11], [31, 11]],
        [[0, 13], [8, 13], [8, 9], [16, 9], [16, 13], [24, 13], [24, 11], [31, 11]],
      ],
      pads: [
        {tx:3,ty:5},{tx:4,ty:8},{tx:8,ty:5},{tx:9,ty:6},{tx:10,ty:11},{tx:12,ty:6},
        {tx:12,ty:11},{tx:15,ty:6},{tx:18,ty:6},{tx:18,ty:11},{tx:19,ty:8},{tx:20,ty:8},
        {tx:4,ty:11},{tx:9,ty:11},{tx:26,ty:8},{tx:26,ty:13},{tx:20,ty:2},
        {tx:13,ty:6,premium:1,cost:110},{tx:21,ty:8,premium:1,cost:120},{tx:26,ty:9,premium:1,cost:120},
      ],
      hpMul: 1.92, waves: [
        { name: 'YARD SCOUTS',          groups: [['scout', 24, 0.30], ['fighter', 16, 0.42]] },
        { name: 'SALVAGE WING',         groups: [['fighter', 22, 0.32], ['interceptor', 16, 0.20]] },
        { name: 'PHANTOM WATCH',        groups: [['wraith', 10, 0.50], ['scout', 18, 0.22]] },
        { name: 'RUST ARMOR',           groups: [['armored', 16, 0.44], ['cryo', 12, 0.42], ['wraith', 8, 0.48]] },
        { name: 'DEBRIS MIX',           groups: [['fighter', 22, 0.30], ['shielded', 16, 0.40], ['wraith', 10, 0.46]] },
        { name: 'GHOST SWARM',          groups: [['scout', 28, 0.16], ['interceptor', 18, 0.16], ['wraith', 12, 0.42]] },
        { name: 'HEAVY SALVAGE',        groups: [['armored', 18, 0.40], ['juggernaut', 5, 1.10], ['wraith', 10, 0.44], ['fighter', 14, 0.30]] },
        { name: 'HAUNT WING',           groups: [['shielded', 20, 0.38], ['armored', 16, 0.40], ['wraith', 14, 0.40], ['cryo', 12, 0.38]] },
        { name: 'YARD TIDE',            groups: [['armored', 18, 0.38], ['shielded', 18, 0.38], ['juggernaut', 5, 1.08], ['interceptor', 16, 0.20], ['wraith', 12, 0.40]] },
        { name: 'COMET REAVER',         groups: [['flagship7', 1, 0.10], ['armored', 12, 0.52], ['shielded', 12, 0.44], ['juggernaut', 4, 1.12], ['wraith', 10, 0.42], ['interceptor', 14, 0.22]] },
      ],
    },
    {
      id: 'storm', name: 'STORM NEEDLE', short: 'Storm Needle', variant: 'storm',
      blurb: 'Crossing paths under an ion storm. Hive Pods seed the choke.',
      paths: [
        [[0, 3], [18, 3], [18, 13], [24, 13], [24, 11], [31, 11]],
        [[0, 13], [10, 13], [10, 6], [26, 6], [26, 11], [31, 11]],
      ],
      pads: [
        {tx:4,ty:5},{tx:8,ty:5},{tx:12,ty:5},{tx:16,ty:5},{tx:6,ty:8},{tx:8,ty:8},
        {tx:12,ty:8},{tx:14,ty:8},{tx:16,ty:8},{tx:4,ty:11},{tx:7,ty:11},{tx:13,ty:11},
        {tx:16,ty:11},{tx:20,ty:8},{tx:20,ty:11},{tx:22,ty:8},{tx:22,ty:4},{tx:28,ty:8},
        {tx:28,ty:13},
        {tx:17,ty:8,premium:1,cost:120},{tx:21,ty:8,premium:1,cost:120},{tx:25,ty:8,premium:1,cost:130},
      ],
      hpMul: 2.06, waves: [
        { name: 'NEEDLE SCOUTS',        groups: [['scout', 26, 0.28], ['fighter', 16, 0.40]] },
        { name: 'ION WING',             groups: [['fighter', 24, 0.30], ['interceptor', 18, 0.18]] },
        { name: 'POD BURST',            groups: [['hive', 6, 0.74], ['scout', 20, 0.20]] },
        { name: 'STORM ARMOR',          groups: [['armored', 16, 0.44], ['hive', 6, 0.70], ['cryo', 12, 0.40]] },
        { name: 'CROSSFIRE',            groups: [['fighter', 22, 0.30], ['shielded', 16, 0.40], ['wraith', 8, 0.46]] },
        { name: 'SWARM NEEDLE',         groups: [['hive', 8, 0.64], ['scout', 26, 0.16], ['interceptor', 16, 0.16]] },
        { name: 'HEAVY CELL',           groups: [['armored', 18, 0.40], ['juggernaut', 5, 1.10], ['hive', 6, 0.68], ['wraith', 8, 0.44]] },
        { name: 'THUNDER WING',         groups: [['shielded', 18, 0.38], ['armored', 16, 0.40], ['hive', 8, 0.64], ['cryo', 12, 0.38]] },
        { name: 'STORM TIDE',           groups: [['armored', 16, 0.38], ['shielded', 16, 0.38], ['hive', 7, 0.62], ['juggernaut', 5, 1.08], ['interceptor', 14, 0.20], ['wraith', 8, 0.42]] },
        { name: 'STORM LANCE',          groups: [['flagship8', 1, 0.10], ['armored', 12, 0.52], ['hive', 6, 0.66], ['shielded', 12, 0.44], ['juggernaut', 4, 1.12], ['interceptor', 14, 0.22], ['wraith', 8, 0.42]] },
      ],
    },
    {
      id: 'apex', name: 'SHATTER GATE', short: 'Shatter Gate', variant: 'apex',
      blurb: 'Three invasion gates converge on the last station.',
      paths: [
        [[0, 2], [8, 2], [8, 6], [18, 6], [18, 11], [31, 11]],
        [[0, 8], [12, 8], [12, 4], [22, 4], [22, 11], [31, 11]],
        [[0, 13], [8, 13], [8, 10], [16, 10], [16, 13], [24, 13], [24, 11], [31, 11]],
      ],
      pads: [
        {tx:3,ty:4},{tx:5,ty:4},{tx:11,ty:2},{tx:14,ty:2},{tx:16,ty:2},
        {tx:4,ty:10},{tx:6,ty:10},{tx:9,ty:4},{tx:14,ty:8},{tx:16,ty:8},
        {tx:3,ty:11},{tx:5,ty:11},{tx:11,ty:12},{tx:13,ty:12},{tx:20,ty:8},
        {tx:20,ty:12},{tx:26,ty:8},{tx:26,ty:13},{tx:28,ty:8},{tx:28,ty:13},
        {tx:17,ty:8,premium:1,cost:130},{tx:21,ty:8,premium:1,cost:140},{tx:25,ty:9,premium:1,cost:140},
      ],
      hpMul: 2.18, waves: [
        { name: 'TRIPLE SCOUTS',        groups: [['scout', 30, 0.26], ['fighter', 18, 0.38]] },
        { name: 'THREE SPEARS',         groups: [['fighter', 26, 0.28], ['interceptor', 20, 0.16]] },
        { name: 'PHASE AND POD',        groups: [['wraith', 10, 0.46], ['hive', 6, 0.68], ['scout', 20, 0.18]] },
        { name: 'GATE ARMOR',           groups: [['armored', 18, 0.42], ['hive', 6, 0.66], ['cryo', 12, 0.40], ['wraith', 8, 0.44]] },
        { name: 'CROWN MIX',            groups: [['fighter', 24, 0.28], ['shielded', 18, 0.38], ['hive', 8, 0.62], ['wraith', 8, 0.44]] },
        { name: 'SWARM CROWN',          groups: [['scout', 30, 0.16], ['interceptor', 20, 0.16], ['hive', 8, 0.60], ['wraith', 8, 0.42]] },
        { name: 'HEAVY TRIAD',          groups: [['armored', 18, 0.38], ['juggernaut', 5, 1.08], ['hive', 8, 0.62], ['wraith', 8, 0.42], ['cryo', 12, 0.38]] },
        { name: 'APEX WING',            groups: [['shielded', 20, 0.36], ['armored', 18, 0.38], ['hive', 9, 0.58], ['wraith', 10, 0.40]] },
        { name: 'SHATTER TIDE',         groups: [['armored', 18, 0.36], ['shielded', 18, 0.36], ['juggernaut', 5, 1.04], ['hive', 9, 0.58], ['interceptor', 16, 0.18], ['wraith', 10, 0.40], ['cryo', 12, 0.36]] },
        { name: 'THE TRIAD',            groups: [['flagship9', 1, 0.10], ['armored', 12, 0.50], ['shielded', 12, 0.42], ['hive', 7, 0.60], ['juggernaut', 5, 1.08], ['interceptor', 16, 0.20], ['wraith', 10, 0.40], ['cryo', 10, 0.40]] },
      ],
    },
  ],
  siege: {
    id: 'siege', name: 'LAST STAND', short: 'Last Stand', variant: 'siege',
    blurb: 'Endless siege. Four corner gates spiral in on the station.',
    subtitle: 'Endless Siege',
    startCredits: 220,
    unlockAfter: 3,
    // Open NW+SE first (opposite), then NE at wave 11, then SW at wave 21.
    gateOrder: [0, 2, 1, 3],
    paths: [
      [[0, 2], [10, 2], [10, 5], [16, 5], [16, 8]],
      [[31, 2], [31, 5], [22, 5], [22, 8], [16, 8]],
      [[31, 13], [22, 13], [22, 10], [16, 10], [16, 8]],
      [[0, 13], [0, 10], [10, 10], [10, 8], [16, 8]],
    ],
    pads: [
      {tx:13,ty:6},{tx:14,ty:6},{tx:18,ty:6},{tx:19,ty:6},
      {tx:13,ty:7},{tx:19,ty:7},{tx:14,ty:9},{tx:18,ty:9},
      {tx:13,ty:11},{tx:19,ty:11},{tx:14,ty:11},
      {tx:3,ty:4},{tx:6,ty:4},{tx:8,ty:4},{tx:12,ty:3},{tx:12,ty:6},{tx:8,ty:6},
      {tx:28,ty:3},{tx:26,ty:3},{tx:24,ty:3},{tx:24,ty:6},{tx:28,ty:7},{tx:26,ty:7},
      {tx:3,ty:12},{tx:6,ty:12},{tx:8,ty:12},{tx:4,ty:8},{tx:8,ty:11},{tx:12,ty:12},
      {tx:28,ty:12},{tx:26,ty:12},{tx:24,ty:12},{tx:28,ty:8},{tx:24,ty:11},{tx:20,ty:12},
      {tx:14,ty:7,premium:1,cost:120},{tx:18,ty:7,premium:1,cost:120},
      {tx:14,ty:10,premium:1,cost:130},{tx:18,ty:11,premium:1,cost:130},
    ],
  },
};

SD.store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} },
};
SD.pad = (n, len = 2) => String(Math.max(0, Math.floor(n))).padStart(len, '0');

SD.Progress = {
  empty() {
    const n = (SD.CONFIG.levels && SD.CONFIG.levels.length) || 6;
    return { unlocked: 1, stars: Array.from({ length: n }, () => 0), bought: [], siegeBest: 0, siegeBestWave: 0, siegeStars: 0 };
  },
  load() {
    const base = SD.Progress.empty();
    try {
      const v = JSON.parse(SD.store.get(SD.CONFIG.storage.progress, ''));
      if (v && typeof v === 'object') {
        base.unlocked = Math.max(1, v.unlocked | 0);
        base.stars = base.stars.map((_, i) => (v.stars && v.stars[i]) || 0);
        base.bought = SD.StarShop.migrate(Array.isArray(v.bought) ? v.bought : []);
        base.siegeBest = Math.max(0, v.siegeBest | 0);
        base.siegeBestWave = Math.max(0, v.siegeBestWave | 0);
        base.siegeStars = Math.max(0, Math.min(3, v.siegeStars | 0));
      }
    } catch (e) {}
    return base;
  },
  save(p) { SD.store.set(SD.CONFIG.storage.progress, JSON.stringify(p)); },
  record(levelIndex, stars) {
    const p = SD.Progress.load();
    p.stars[levelIndex] = Math.max(p.stars[levelIndex] || 0, stars);
    p.unlocked = Math.max(p.unlocked, levelIndex + 2);
    SD.Progress.save(p);
    return p;
  },
  siegeUnlocked(p) {
    const need = (SD.CONFIG.siege && SD.CONFIG.siege.unlockAfter) || 3;
    return !!(p && (p.unlocked | 0) > need);
  },
  recordSiege(score, wave, stars) {
    const p = SD.Progress.load();
    const prev = p.siegeBest || 0;
    const pts = Math.max(0, score | 0);
    p.siegeBest = Math.max(prev, pts);
    p.siegeBestWave = Math.max(p.siegeBestWave || 0, wave | 0);
    p.siegeStars = Math.max(p.siegeStars || 0, Math.max(0, Math.min(3, stars | 0)));
    SD.Progress.save(p);
    return { progress: p, isNew: pts > prev };
  },
};

SD.StarShop = {
  kinds: ['laser', 'missile', 'ice', 'railgun', 'tesla', 'pulse'],
  mk4: {
    laser:   { name: 'FOCUS FIRE',   blurb: 'Damage ramps on the same target, up to +40%.' },
    missile: { name: 'BARRAGE',      blurb: 'Every 4th volley fires a second rocket.' },
    ice:     { name: 'SHATTER',      blurb: 'Slowed ships take +20% damage from all turrets.' },
    railgun: { name: 'CHARGED SLUG', blurb: 'First shot at a target, or every 8s, deals +50%.' },
    tesla:   { name: 'OVERVOLT',     blurb: '+1 chain jump. The primary hit shreds some shield.' },
    pulse:   { name: 'VIRULENT',     blurb: '+1 poison stack and +1s. A light spread at every MK.' },
  },
  items: [],
  item(id) { return this.items.find(it => it.id === id) || null; },
  owns(p, id) { return !!(p && p.bought && p.bought.indexOf(id) >= 0); },
  earned(p) { return (p.stars || []).reduce((a, s) => a + (s | 0), 0); },
  spent(p) { return (p.bought || []).reduce((a, id) => { const it = this.item(id); return a + (it ? it.cost : 0); }, 0); },
  available(p) { return this.earned(p) - this.spent(p); },
  locked(p, it) { return !!this.lockReason(p, it); },
  lockReason(p, it) {
    if (!it) return '';
    const missing = (it.req || []).filter(r => !this.owns(p, r));
    if (missing.length) {
      return 'NEED ' + missing.map(r => (this.item(r) && this.item(r).name) || r).join(' + ');
    }
    const taken = (it.mutex || []).filter(r => this.owns(p, r));
    if (taken.length) return 'RESPEC TO SWITCH';
    return '';
  },
  canBuy(p, id) {
    const it = this.item(id);
    if (!it || this.owns(p, id) || this.locked(p, it)) return false;
    return this.available(p) >= it.cost;
  },
  buy(p, id) {
    if (!this.canBuy(p, id)) return false;
    p.bought = (p.bought || []).concat([id]);
    SD.Progress.save(p);
    return true;
  },
  respec(p) {
    p.bought = [];
    SD.Progress.save(p);
    return p;
  },
  perksOf(p, kind) {
    const bits = [];
    if (kind !== 'nebula') {
      for (const key of ['power', 'reach', 'economy', 'mk4']) {
        const it = this.item(kind + '-' + key);
        if (it && this.owns(p, it.id)) bits.push(it.perk || it.name);
      }
    } else if (this.owns(p, 'nebula-core')) bits.push('DARK CORE');
    return bits;
  },
  /* v0.4.2 keeps the same ids so existing bought arrays stay valid.
     Effects and display names changed in place; this is an identity
     filter today and a hook if a later version ever remaps an id. */
  migrate(bought) {
    const ids = new Set(this.items.map(it => it.id));
    const out = [], seen = new Set();
    for (const id of (bought || [])) {
      if (typeof id === 'string' && ids.has(id) && !seen.has(id)) { seen.add(id); out.push(id); }
    }
    return out;
  },
};

(function buildStarShop() {
  const items = [];
  const nodes = {
    laser: {
      power:   { name: 'OVERCLOCK',  icon: 'overclock',  blurb: 'Fire rate +8%. The beam stays cool; no overheat.' },
      reach:   { name: 'HOTSHOT',    icon: 'hotshot',    blurb: '10% chance for a critical beam that deals ×1.45 damage.' },
      economy: { name: 'PRISM',      icon: 'prism',      blurb: 'The beam glances to a nearby ship for 30% damage.' },
    },
    missile: {
      power:   { name: 'WARHEADS',   icon: 'warheads',   blurb: 'Splash radius +30%.' },
      reach:   { name: 'BOOSTERS',   icon: 'boosters',   blurb: 'Rockets fly 45% faster.' },
      economy: { name: 'AUTOLOAD',   icon: 'autoload',   blurb: 'Reload 18% faster.' },
    },
    ice: {
      power:   { name: 'DEEP FREEZE', icon: 'deepfreeze', blurb: 'Slow is 18% stronger and lasts +0.8s. Bosses still resist the worst of it.' },
      reach:   { name: 'WHITEOUT',    icon: 'whiteout',   blurb: 'Ice range +16%, so the slow covers a wider lane.' },
      economy: { name: 'RIMEFIELD',   icon: 'rimefield',  blurb: 'Hits splash a slow field around the target. No extra freeze on bosses.' },
    },
    railgun: {
      power:   { name: 'PIERCE',       icon: 'pierce',      blurb: 'Slugs punch through one extra ship (MK III already clears the line).' },
      reach:   { name: 'QUICK CHARGE', icon: 'quickcharge', blurb: 'Charge time −16%, so the rail fires more often.' },
      economy: { name: 'SABOT',        icon: 'sabot',       blurb: '+20% damage vs armored hulls. +8% vs bosses.' },
    },
    tesla: {
      power:   { name: 'ARC SPAN', icon: 'arcspan', blurb: 'Chain jump range +28%.' },
      reach:   { name: 'FORKED',   icon: 'forked',  blurb: 'The arc jumps to one extra ship.' },
      economy: { name: 'STATIC',   icon: 'static',  blurb: '16% chance to briefly stun hull-1 ships. Bosses are immune.' },
    },
    pulse: {
      power:   { name: 'NEUROTOXIN', icon: 'neurotoxin', blurb: 'Poison DPS +30% and duration +0.7s.' },
      reach:   { name: 'ION SPIKE',  icon: 'ionspike',   blurb: '+25% damage dealt to shields.' },
      economy: { name: 'STOCKPILE',  icon: 'stockpile',  blurb: 'Pulse build cost −15%.' },
    },
  };
  for (const kind of SD.StarShop.kinds) {
    const name = (SD.CONFIG.turrets[kind] && SD.CONFIG.turrets[kind].short) || kind.toUpperCase();
    const n = nodes[kind];
    items.push({ id: kind + '-power',   col: kind, name: n.power.name,   cost: 1, icon: n.power.icon,   blurb: name + '  ' + n.power.name + '  —  ' + n.power.blurb });
    items.push({ id: kind + '-reach',   col: kind, name: n.reach.name,   cost: 1, icon: n.reach.icon,   blurb: name + '  ' + n.reach.name + '  —  ' + n.reach.blurb });
    items.push({ id: kind + '-economy', col: kind, name: n.economy.name, cost: 2, icon: n.economy.icon, blurb: name + '  ' + n.economy.name + '  —  ' + n.economy.blurb });
    const mk = SD.StarShop.mk4[kind];
    items.push({
      id: kind + '-mk4', col: kind, name: 'MK IV', perk: mk.name, cost: 3,
      req: [kind + '-power', kind + '-reach'],
      blurb: name + '  ' + mk.name + '  —  ' + mk.blurb,
    });
  }
  items.push({ id: 'nebula-core', col: 'station', name: 'DARK CORE', cost: 2, blurb: 'NEBULA  +15% damage. Still one per map.' });
  items.push({ id: 'funds',  col: 'station', name: 'RESERVE FUNDS',    cost: 2, blurb: 'Start every level with 230 credits (was 180).' });
  items.push({ id: 'hull',   col: 'station', name: 'REINFORCED HULL',  cost: 2, blurb: 'Start every level with 24 hull (was 20).' });
  items.push({ id: 'charge', col: 'station', name: 'RAPID CHARGE',     cost: 3, blurb: 'ORBITAL, DRONES and EMP cooldown −18%.' });
  items.push({ id: 'hero',   col: 'station', name: 'HERO PROTOCOL',    cost: 3, blurb: 'Hero +25 HP, +15% damage, special −3s, respawn −2s. Unlocks a specialization.' });
  items.push({
    id: 'hero-freeze', col: 'station', name: 'FREEZE', cost: 3,
    req: ['hero'], mutex: ['hero-overload'],
    blurb: 'FREEZE  —  The hero special also freezes every ship for 2.5s. Bosses freeze for 0.5s.',
  });
  items.push({
    id: 'hero-overload', col: 'station', name: 'OVERLOAD', cost: 3,
    req: ['hero'], mutex: ['hero-freeze'],
    blurb: 'OVERLOAD  —  Hero special damage +50%. Pick Freeze or Overload; respec to switch.',
  });
  SD.StarShop.items = items;
})();
