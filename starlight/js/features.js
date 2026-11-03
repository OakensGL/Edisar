/* ==========================================================================
   FUTURE FEATURE HOOKS (v0.1: all disabled, no gameplay effect).
   Survival calls these at fixed points; flip `enabled` and fill in the TODOs.
   ========================================================================== */
SL.Features = {
  /* Bullet power-ups: triple shot, laser, rapid fire, shield */
  powerUps: {
    enabled: false,
    types: {
      triple: { duration: 10, color: '255,70,220' },
      laser:  { duration: 8,  color: '120,255,255' },
      rapid:  { duration: 10, color: '255,230,90' },
      shield: { hits: 1,      color: '70,160,255' },
    },
    active: null,                         // { type, timeLeft }
    dropChance: 0.05,
    maybeDrop(game, x, y) { /* TODO: push a pickup into game.pickups */ },
    modifyFire(game, bullets) { return bullets; },   // e.g. add angled bullets for 'triple'
    fireRateMul(game) { return 1; },                 // e.g. 0.5 for 'rapid'
    absorbHit(game) { return false; },               // return true if shield ate the hit
    update(game, dt) {},
  },
  /* Random bomb pickups + inventory (clear screen) */
  bombs: {
    enabled: false, inventory: 0, max: 3, dropChance: 0.03,
    maybeDrop(game, x, y) {}, use(game) { /* TODO: destroy all asteroids on screen */ },
  },
  /* Avrill assist energy bar (female pilot). Fills on kills; when full, she flies in to help. */
  assist: {
    enabled: false, pilot: 'Avrill', energy: 0, max: 100, line: 'Oakens, here to assist!',
    onKill(game, points) { /* this.energy = Math.min(this.max, this.energy + points / 20) */ },
    trigger(game) { /* game.popup(this.line, ...) + spawn wingman */ },
    update(game, dt) {}, drawHUD(g, game) {},
  },
  /* Story mode: levels and bosses (menu shows COMING SOON) */
  story: { enabled: false, levels: [], bosses: [] },
  /* Special asteroids (armored, explosive, splitting-into-3, golden...) */
  specialAsteroids: {
    enabled: false, types: {},
    pick(game) { return null; },          // return a type key to override a normal spawn
  },
  /* Store / skins */
  store: {
    enabled: false, current: 'default',
    skins: { default: { name: 'Oakens Blue', color: '80,170,255' } },
    shipColor() { return this.skins[this.current].color; },
  },
};
