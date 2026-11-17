/* GOTICO modular input. Desktop: A/D move, mouse aim, LMB fire, Space/W jump, S crouch, RMB bomb.
   Touch: on-screen buttons, auto-aim handled by the game. */
(() => {
  const keys = Object.create(null);
  const tapped = Object.create(null);
  const hold = { l: 0, r: 0, u: 0, d: 0, jump: 0, crouch: 0, shoot: 0, bomb: 0, pause: 0, start: 0 };
  const just = { jump: 0, hop: 0, bomb: 0, pause: 0, start: 0, left: 0, right: 0, up: 0, down: 0 };
  const mouse = {
    x: 160, y: 90, worldX: 160, worldY: 90,
    left: 0, right: 0, on: 0, justLeft: 0, justRight: 0,
  };
  const tHold = { l: 0, r: 0, jump: 0, shoot: 0, bomb: 0 };
  let touchMode = false;
  let cv = null;
  const WANTED = {
    ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1,
    KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1,
    Space: 1, KeyP: 1, Escape: 1, Enter: 1, NumpadEnter: 1,
  };

  function toLogical(clientX, clientY) {
    if (!cv) return { x: 0, y: 0 };
    const r = cv.getBoundingClientRect();
    const w = r.width || 1, h = r.height || 1;
    return {
      x: (clientX - r.left) * cv.width / w,
      y: (clientY - r.top) * cv.height / h,
    };
  }

  function syncMouse(cam) {
    mouse.worldX = mouse.x + (cam || 0);
    mouse.worldY = mouse.y;
  }

  function setMousePos(e) {
    const p = toLogical(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.on = p.x >= -2 && p.x <= cv.width + 2 && p.y >= -2 && p.y <= cv.height + 2;
  }

  function attach(canvas) {
    cv = canvas;
    addEventListener('keydown', e => {
      if (!WANTED[e.code]) return;
      e.preventDefault();
      if (!keys[e.code]) tapped[e.code] = 1;
      keys[e.code] = 1;
    });
    addEventListener('keyup', e => {
      if (!WANTED[e.code]) return;
      e.preventDefault();
      keys[e.code] = 0;
    });
    addEventListener('mousemove', e => { setMousePos(e); });
    addEventListener('mousedown', e => {
      setMousePos(e);
      if (e.button === 0) { mouse.left = 1; mouse.justLeft = 1; }
      if (e.button === 2) { mouse.right = 1; mouse.justRight = 1; }
    });
    addEventListener('mouseup', e => {
      if (e.button === 0) mouse.left = 0;
      if (e.button === 2) mouse.right = 0;
    });
    addEventListener('blur', () => {
      mouse.left = 0; mouse.right = 0;
      for (const k of Object.keys(keys)) keys[k] = 0;
    });
    const blockMenu = e => { e.preventDefault(); };
    cv.addEventListener('contextmenu', blockMenu);
    document.addEventListener('contextmenu', e => {
      if (e.target === cv || cv.contains(e.target)) e.preventDefault();
    });
  }

  function poll() {
    hold.l = !!(keys.ArrowLeft || keys.KeyA);
    hold.r = !!(keys.ArrowRight || keys.KeyD);
    hold.u = !!(keys.ArrowUp || keys.KeyW);
    hold.d = !!(keys.ArrowDown || keys.KeyS);
    hold.jump = !!(keys.Space || keys.KeyW);
    hold.crouch = !!keys.KeyS;
    hold.pause = !!(keys.KeyP || keys.Escape);
    hold.start = !!(keys.Enter || keys.NumpadEnter);
    hold.shoot = 0;
    hold.bomb = 0;
    if (!touchMode) {
      hold.shoot = !!mouse.left;
      just.bomb = just.bomb || mouse.justRight;
    }
    just.jump = just.jump || tapped.Space;
    just.hop = just.hop || tapped.KeyW;
    just.pause = just.pause || tapped.KeyP || tapped.Escape;
    just.start = just.start || tapped.Enter || tapped.NumpadEnter;
    just.left = just.left || tapped.ArrowLeft || tapped.KeyA;
    just.right = just.right || tapped.ArrowRight || tapped.KeyD;
    just.up = just.up || tapped.ArrowUp || tapped.KeyW;
    just.down = just.down || tapped.ArrowDown || tapped.KeyS;
    for (const k in tapped) tapped[k] = 0;
    mouse.justLeft = 0;
    mouse.justRight = 0;
  }

  function mergeTouch() {
    if (!touchMode) return;
    hold.l = hold.l || tHold.l;
    hold.r = hold.r || tHold.r;
    hold.jump = hold.jump || tHold.jump;
    hold.shoot = hold.shoot || tHold.shoot;
    hold.bomb = hold.bomb || tHold.bomb;
  }

  function endFrame() {
    for (const k of Object.keys(just)) just[k] = 0;
  }

  window.GTInput = {
    attach, poll, mergeTouch, endFrame, toLogical, syncMouse,
    keys, tapped, hold, just, mouse, tHold,
    get touchMode() { return touchMode; },
    set touchMode(v) { touchMode = !!v; },
  };
})();
