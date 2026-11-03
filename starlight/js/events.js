/* Tiny event bus so future features can subscribe without touching core game code.
   Events emitted by Survival: 'start', 'tick'(dt), 'fire'(bullets), 'asteroidSpawned'(a),
   'asteroidDestroyed'({asteroid, points, byPlayer}), 'playerHit'({lives}), 'gameOver'({score,best}) */
SL.Events = (() => {
  const map = new Map();
  return {
    on(ev, fn) { if (!map.has(ev)) map.set(ev, new Set()); map.get(ev).add(fn); return () => map.get(ev).delete(fn); },
    off(ev, fn) { map.has(ev) && map.get(ev).delete(fn); },
    emit(ev, data) { if (map.has(ev)) for (const fn of map.get(ev)) { try { fn(data); } catch (e) { console.error(e); } } },
  };
})();
