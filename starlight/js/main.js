/* Boot, letterbox resize, state machine, main loop. */
(() => {
  const { W, H } = SL;
  const stage = document.getElementById('stage'), cv = document.getElementById('c'), g = cv.getContext('2d');
  const credit = document.getElementById('credit');
  SL.view = { scale: 1 };
  function fit() {
    const vw = innerWidth, vh = innerHeight, w = Math.min(vw, vh * 16 / 9), h = w * 9 / 16;
    stage.style.width = w + 'px'; stage.style.height = h + 'px';
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); SL.view.scale = cv.width / W;
  }
  addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200)); fit();
  SL.toLogical = (cx, cy) => { const r = cv.getBoundingClientRect(); return { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H }; };
  SL.Input.attach(cv);

  SL.state = 'title'; SL.game = null;
  SL.start = (s) => {
    if (s === 'play') { SL.state = 'play'; SL.game = new SL.Survival(); }
    else { SL.state = 'title'; SL.game = null; SL.Title.enter(s === 'menu' ? 'menu' : 'press'); }
    credit.style.display = SL.state === 'title' ? '' : 'none';
    SL.Input.takeDowns();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden && SL.game) SL.game.pause(true); });

  let last = 0;
  SL.step = (dt) => {
    if (SL.state === 'title') SL.Title.update(dt); else SL.game.update(dt);
    g.setTransform(SL.view.scale, 0, 0, SL.view.scale, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    if (SL.state === 'title') SL.Title.draw(g); else SL.game.draw(g);
    SL.Input.endFrame();
  };
  function loop(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    SL.step(dt); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
