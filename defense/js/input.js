/* Keyboard + pointer (mouse/touch) input. Pointers are in logical (1024x576) coords. */
SD.Input = (() => {
  const keys = new Set(), pressed = new Set(), pointers = new Map();
  let downs = [], released = [], touchMode = /[?&]touch/.test(location.search);
  const mouse = { x: 0, y: 0, over: false };
  const PREVENT = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'];
  addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) return;
    if (PREVENT.includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code); SD.Audio.unlock();
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => { keys.clear(); pointers.clear(); });
  ['gesturestart', 'gesturechange', 'dblclick'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', e => { if (!e.target.closest || !e.target.closest('a,input,button')) e.preventDefault(); }, { passive: false });

  function attach(cv) {
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); cv.focus && cv.focus({ preventScroll: true });
      SD.Audio.unlock();
      if (e.pointerType === 'touch' || e.pointerType === 'pen') touchMode = true;
      const p = SD.toLogical(e.clientX, e.clientY);
      mouse.x = p.x; mouse.y = p.y; mouse.over = true;
      const ptr = { id: e.pointerId, x: p.x, y: p.y, ox: p.x, oy: p.y, type: e.pointerType, button: e.button || 0 };
      pointers.set(e.pointerId, ptr); downs.push(ptr);
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    cv.addEventListener('pointermove', e => {
      const p = SD.toLogical(e.clientX, e.clientY);
      mouse.x = p.x; mouse.y = p.y; mouse.over = true;
      const ptr = pointers.get(e.pointerId); if (ptr) { ptr.x = p.x; ptr.y = p.y; }
    });
    const up = e => {
      const ptr = pointers.get(e.pointerId);
      if (ptr) {
        const p = SD.toLogical(e.clientX, e.clientY);
        ptr.x = p.x; ptr.y = p.y;
        const dx = ptr.x - ptr.ox, dy = ptr.y - ptr.oy;
        const tap = dx * dx + dy * dy < 14 * 14;
        released.push({ x: ptr.x, y: ptr.y, type: ptr.type, tap, id: ptr.id, ox: ptr.ox, oy: ptr.oy, button: ptr.button || 0 });
      }
      pointers.delete(e.pointerId);
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => cv.addEventListener(ev, up));
    cv.addEventListener('pointerleave', () => { if (!pointers.size) mouse.over = false; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  const any = (...codes) => codes.some(c => keys.has(c));
  const hitAny = (...codes) => codes.some(c => pressed.has(c));
  return {
    attach, down: c => keys.has(c), any, hit: c => pressed.has(c), hitAny,
    confirm: () => hitAny('Enter', 'Space', 'NumpadEnter'),
    pointers, mouse,
    takeDowns() { const d = downs; downs = []; return d; },
    takeReleased() { const r = released; released = []; return r; },
    takeClicks() { return this.takeReleased().filter(u => u.tap); },
    endFrame() { pressed.clear(); downs = []; released = []; },
    get touchMode() { return touchMode; },
  };
})();
