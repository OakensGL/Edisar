/* PWA: register the service worker and show a one-time install tip on mobile. */
(() => {
  const STORE = 'starlight.installTip';
  const standalone = () =>
    matchMedia('(display-mode: standalone)').matches ||
    matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true;
  const mobile = () => matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const iOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (standalone() || !mobile() || localStorage.getItem(STORE) === '1') return;

  let deferred = null;
  const tip = document.createElement('div');
  tip.id = 'installTip';
  tip.innerHTML = '<span id="installMsg"></span><button type="button" id="installBtn" hidden>Install app</button><button type="button" id="installDismiss" aria-label="Dismiss">×</button>';
  document.body.appendChild(tip);
  const msg = tip.querySelector('#installMsg');
  const btn = tip.querySelector('#installBtn');
  const hide = () => { tip.classList.remove('show'); localStorage.setItem(STORE, '1'); };

  if (iOS()) {
    msg.textContent = 'Tap Share, then Add to Home Screen';
    tip.classList.add('show');
  } else {
    msg.textContent = 'Install this game on your home screen';
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
      tip.classList.add('show');
    });
  }
  btn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (e) {}
    deferred = null;
    hide();
  });
  tip.querySelector('#installDismiss').addEventListener('click', hide);
  window.addEventListener('appinstalled', hide);
})();
