/* Boot, letterbox resize, state machine, main loop. */
(() => {
  const { W, H } = SL;
  const stage = document.getElementById('stage'), cv = document.getElementById('c'), g = cv.getContext('2d');
  const credit = document.getElementById('credit');
  SL.view = { scale: 1 };
  function fit() {
    const vw = innerWidth, vh = innerHeight, w = Math.min(vw, vh * 16 / 9), h = w * 9 / 16;
    stage.style.width = w + 'px'; stage.style.height = h + 'px'; stage.style.setProperty('--u', (h / H) + 'px');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); SL.view.scale = cv.width / W;
  }
  addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200)); fit();
  SL.toLogical = (cx, cy) => { const r = cv.getBoundingClientRect(); return { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H }; };
  SL.Input.attach(cv);

  SL.state = 'title'; SL.game = null;
  SL.start = (s, opt = {}) => {
    if (s === 'play') { SL.state = 'play'; SL.game = new SL.Survival(); }
    else if (s === 'story') {
      // debug jump: ?level=N (1..99) skips the map. Harmless: debug runs are marked, never ranked, never unlock levels.
      const m = /[?&]level=(\d{1,2})\b/.exec(location.search);
      if (m) { SL.state = 'play'; SL.game = new SL.Story(Math.max(1, Math.min(SL.FINAL_LEVEL - 1, +m[1])), true); }
      else return SL.start('map', { session: null });
    }
    else if (s === 'map') { SL.state = 'map'; SL.game = null; SL.Map.enter(opt); }
    else { SL.state = 'title'; SL.game = null; SL.Title.enter(s === 'menu' ? 'menu' : 'press'); SL.Audio.playTrack('main'); }
    SL.NameEntry.close();
    credit.style.display = SL.state === 'title' ? '' : 'none';
    SL.Input.takeDowns();
  };
  SL.startMission = (L, debug = false, session = null, opts = {}) => {
    SL.state = 'play'; SL.game = new SL.Story(L, debug, session, opts);
    SL.NameEntry.close(); credit.style.display = 'none'; SL.Input.takeDowns();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden && SL.game) SL.game.pause(true); });

  let last = 0;
  SL.step = (dt) => {
    const scr = SL.state === 'title' ? SL.Title : SL.state === 'map' ? SL.Map : SL.game;
    scr.update(dt);
    const now = SL.state === 'title' ? SL.Title : SL.state === 'map' ? SL.Map : SL.game;   // update may switch screens
    g.setTransform(SL.view.scale, 0, 0, SL.view.scale, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    now.draw(g);
    SL.Input.endFrame();
  };
  function loop(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    SL.step(dt); SL.Audio.tick(dt); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
