/* Keyboard + pointer (mouse/touch) input. Pointers are in logical (1024x576) coords. */
SL.Input = (() => {
  const keys = new Set(), pressed = new Set(), pointers = new Map();
  let downs = [], touchMode = /[?&]touch/.test(location.search);
  const PREVENT = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'];
  addEventListener('keydown', e => {
    if (PREVENT.includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code); SL.Audio.unlock();
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => { keys.clear(); pointers.clear(); });
  // block pinch / double-tap zoom & scroll on touch devices
  ['gesturestart', 'gesturechange', 'dblclick'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', e => { if (!e.target.closest || !e.target.closest('a')) e.preventDefault(); }, { passive: false });

  function attach(cv) {
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); cv.focus && cv.focus({ preventScroll: true });
      SL.Audio.unlock();
      if (e.pointerType === 'touch' || e.pointerType === 'pen') touchMode = true;
      const p = SL.toLogical(e.clientX, e.clientY);
      const ptr = { id: e.pointerId, x: p.x, y: p.y, ox: p.x, oy: p.y, type: e.pointerType, role: null };
      pointers.set(e.pointerId, ptr); downs.push(ptr);
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    cv.addEventListener('pointermove', e => {
      const ptr = pointers.get(e.pointerId); if (!ptr) return;
      const p = SL.toLogical(e.clientX, e.clientY); ptr.x = p.x; ptr.y = p.y;
    });
    const up = e => pointers.delete(e.pointerId);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => cv.addEventListener(ev, up));
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  const any = (...codes) => codes.some(c => keys.has(c));
  const hitAny = (...codes) => codes.some(c => pressed.has(c));
  return {
    attach, down: c => keys.has(c), any, hit: c => pressed.has(c), hitAny,
    axis() {
      return {
        x: (any('ArrowRight', 'KeyD') ? 1 : 0) - (any('ArrowLeft', 'KeyA') ? 1 : 0),
        y: (any('ArrowDown', 'KeyS') ? 1 : 0) - (any('ArrowUp', 'KeyW') ? 1 : 0),
      };
    },
    confirm: () => hitAny('Enter', 'Space', 'NumpadEnter'),
    pointers, takeDowns() { const d = downs; downs = []; return d; },
    endFrame() { pressed.clear(); downs = []; },
    get touchMode() { return touchMode; },
  };
})();
