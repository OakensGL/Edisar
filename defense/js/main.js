/* Boot, letterbox resize, state machine, main loop. */
(() => {
  const { W, H } = SD;
  const stage = document.getElementById('stage'), cv = document.getElementById('c'), g = cv.getContext('2d');
  const credit = document.getElementById('credit');
  SD.view = { scale: 1 };
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  function insets() {
    if (!standalone()) return { t: 0, r: 0, b: 0, l: 0 };
    const s = getComputedStyle(document.documentElement), n = v => parseFloat(s.getPropertyValue(v)) || 0;
    return { t: n('--sat'), r: n('--sar'), b: n('--sab'), l: n('--sal') };
  }
  function fit() {
    const ins = insets(), vw = Math.max(1, innerWidth - ins.l - ins.r), vh = Math.max(1, innerHeight - ins.t - ins.b);
    const w = Math.min(vw, vh * 16 / 9), h = w * 9 / 16;
    stage.style.width = w + 'px'; stage.style.height = h + 'px'; stage.style.setProperty('--u', (h / H) + 'px');
    stage.style.left = (ins.l + vw / 2) + 'px'; stage.style.top = (ins.t + vh / 2) + 'px';
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); SD.view.scale = cv.width / W;
  }
  addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200)); fit();
  SD.toLogical = (cx, cy) => { const r = cv.getBoundingClientRect(); return { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H }; };
  SD.Input.attach(cv);

  SD.state = 'title';
  SD.game = new SD.Title();
  const shot = /[?&]shot=([a-z0-9]+)/.exec(location.search);
  if (shot && shot[1] === 'crawl') {
    SD.game = new SD.Crawl({ shot: true });
    SD.state = 'crawl';
    if (credit) credit.style.display = 'none';
    if (SD.Audio.playCrawl) SD.Audio.playCrawl();
  } else if (shot && shot[1] === 'levelselect') {
    SD.game = new SD.LevelSelect({ shot: true });
    SD.state = 'levels';
    if (credit) credit.style.display = 'none';
    if (SD.Audio.playTitle) SD.Audio.playTitle();
  } else if (shot && shot[1] !== 'title') {
    SD.game = new SD.Defense({ shot: shot[1] });
    SD.state = 'play';
    if (credit) credit.style.display = 'none';
    if (SD.Audio.stopMusic) SD.Audio.stopMusic({ dur: 0.2 });
  } else if (SD.Audio.playTitle) {
    SD.Audio.playTitle();
  }

  SD.start = (s, opt = {}) => {
    if (s === 'play' || s === 'level') {
      SD.state = 'play';
      SD.game = new SD.Defense({ levelIndex: opt.index || 0, hero: opt.hero, auto: opt.auto });
      if (credit) credit.style.display = 'none';
      if (SD.Audio.stopMusic) SD.Audio.stopMusic();
    } else if (s === 'levels') {
      SD.state = 'levels';
      SD.game = new SD.LevelSelect();
      if (credit) credit.style.display = 'none';
      if (SD.Audio.playTitle) SD.Audio.playTitle();
    } else if (s === 'crawl') {
      SD.state = 'crawl';
      SD.game = new SD.Crawl();
      if (credit) credit.style.display = 'none';
      if (SD.Audio.playCrawl) SD.Audio.playCrawl();
    } else {
      SD.state = 'title';
      SD.game = new SD.Title();
      if (credit) credit.style.display = '';
      if (SD.Audio.playTitle) SD.Audio.playTitle();
    }
    SD.Input.takeDowns(); SD.Input.takeClicks();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden && SD.game && SD.game.pause) SD.game.pause(true); });

  let last = 0;
  function loop(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    SD.game.update(dt);
    const scr = SD.game;
    g.setTransform(SD.view.scale, 0, 0, SD.view.scale, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    scr.draw(g);
    SD.Input.endFrame();
    SD.Audio.tick();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
