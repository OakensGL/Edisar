/* v0.4.2 Story cutscenes (current build v0.4.5): portrait dialogue boxes with typewriter text.
   Tap / click / Space / Enter advances (first press completes a line still typing); SKIP ends the scene.
   Music is never paused here: callers only pick a track via SL.Audio.playTrack (single-player system). */
(() => {
const SPEAKERS = {
  edisar:  { name: 'COMMANDER EDISAR', img: 'assets/edisar.jpg', rgb: '90,160,255' },
  radio:   { name: 'COMMANDER EDISAR · RADIO', img: 'assets/edisar.jpg', rgb: '90,160,255', radio: true },
  avrill:  { name: 'AVRILL', img: 'assets/avrill.jpg', rgb: '255,80,220' },
  private: { name: 'AVRILL · PRIVATE CHANNEL', img: 'assets/avrill.jpg', rgb: '190,120,255', private: true },
  nebula:  { name: 'Dr. Nebula', img: 'assets/nebula.jpg', rgb: '255,70,70' },
};
// Exact script approved by Juan Carlos. Keys: 'intro' (before level 1) or the boss level number.
const SCENES = {
  intro: { lines: [
    ['edisar', 'The belt is a threat to our world, Oakens. Clear it. No questions.'],
    ['avrill', "Copy that, Commander. Let's make him proud, Oakens."] ] },
  5: { capsule: true, lines: [
    ['avrill', "He dropped something... encrypted. I'll keep it."] ] },
  10: { lines: [
    ['avrill', 'These are old Fleet reports. Signed by... Edisar?'],
    ['radio', "Stay focused, pilots. That data is Nebula's lies."] ] },
  15: { lines: [
    ['nebula', 'Look at your scanners, boy. Every rock you break, the shield gets thinner.'],
    ['avrill', 'Oakens... the radiation levels are rising.'] ] },
  20: { lines: [
    ['private', 'Private channel, Oakens. Just you and me.'],
    ['private', "Those reports... the dates, the signatures. Something doesn't add up."] ] },
};
const imgs = {};
const img = src => { if (!imgs[src]) { const i = new Image(); i.src = src; imgs[src] = i; } return imgs[src]; };
Object.values(SPEAKERS).forEach(s => img(s.img));
const wrap = (text, max) => { const out = []; let line = ''; for (const w of text.split(' ')) { if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; };
const CPS = 38;

SL.Cutscene = class {
  static has(id) { return !!SCENES[id]; }
  static get SCENES() { return SCENES; }
  constructor(id, onDone) {
    this.id = id; this.scene = SCENES[id]; this.onDone = onDone; this.i = 0; this.t = 0; this.T = 0; this.done = false;
    this.stars = new SL.Starfield(0.9); this.lastN = 0;
    this.skipBtn = { label: 'SKIP ▶▶', x: 940, y: 34, w: 140, h: 40, rgb: '160,200,255', size: 16 };
    SL.store.set('starlight.story.seen.' + id, '1');          // 'seen' flag (replays still show it, skippable)
    SL.Events.emit('cutscene', id);
  }
  get line() { return this.scene.lines[this.i]; }
  get typedAll() { return this.t * CPS >= this.line[1].length; }
  advance() {
    if (!this.typedAll) { this.t = this.line[1].length / CPS + 0.01; return; }
    SL.Audio.sfx.blip(700);
    if (++this.i >= this.scene.lines.length) this.finish(); else { this.t = 0; this.lastN = 0; }
  }
  finish() { if (this.done) return; this.done = true; this.onDone && this.onDone(); }
  update(dt) {
    this.T += dt; this.t += dt; this.stars.update(dt, 0.25);
    const I = SL.Input, downs = I.takeDowns();
    if (I.hit('KeyM')) SL.Audio.toggleMute();
    if (I.hitAny('Escape', 'Backspace')) { SL.Audio.sfx.blip(520); return this.finish(); }
    for (const d of downs) { if (SL.inBtn(this.skipBtn, d)) { SL.Audio.sfx.blip(520); return this.finish(); } }
    if (this.T > 0.35 && (I.hitAny('Space', 'Enter', 'NumpadEnter') || downs.length)) { this.advance(); if (this.done) return; }
    const n = Math.min(this.line[1].length, Math.floor(this.t * CPS));
    if (n > this.lastN) { if (n % 3 === 0 && this.line[1][n - 1] !== ' ') SL.Audio.sfx.tick(); this.lastN = n; }
  }
  draw(g) {
    const W = SL.W, H = SL.H, [who, text] = this.line, S = SPEAKERS[who], T = this.T;
    SL.drawSpaceBg(g); this.stars.draw(g, T, 0.5);
    g.fillStyle = 'rgba(2,1,8,0.55)'; g.fillRect(0, 0, W, H);
    // optional visual: Nebula's data capsule floating (scene after level 5)
    if (this.scene.capsule) {
      const x = 700, y = 170 + Math.sin(T * 1.6) * 10, a = T * 0.6;
      SL.glow(g, x, y, 70, 70, '120,255,200', 0.22 + 0.08 * Math.sin(T * 4));
      g.save(); g.translate(x, y); g.rotate(Math.sin(a) * 0.4);
      SL.roundRect(g, -34, -14, 68, 28, 14); g.fillStyle = 'rgba(20,40,40,0.95)'; g.fill();
      g.strokeStyle = 'rgba(140,255,210,1)'; g.lineWidth = 2.5; g.shadowColor = 'rgba(120,255,200,1)'; g.shadowBlur = 16 * SL.view.scale; g.stroke();
      g.fillStyle = 'rgba(160,255,220,0.9)'; g.fillRect(-4, -14, 8, 28); g.restore();
    }
    // portrait (left, big)
    const px = 46, py = 92, ps = 230, im = img(S.img);
    g.save(); SL.roundRect(g, px, py, ps, ps, 14); g.fillStyle = 'rgba(8,4,20,0.9)'; g.fill(); g.clip();
    if (im.complete && im.naturalWidth) {
      if (S.radio) g.globalAlpha = 0.82 + 0.18 * Math.sin(T * 37);
      g.drawImage(im, px, py, ps, ps); g.globalAlpha = 1;
      if (S.private) { g.fillStyle = 'rgba(120,60,255,0.18)'; g.fillRect(px, py, ps, ps); }
      if (S.radio) { g.fillStyle = 'rgba(80,140,255,0.12)'; g.fillRect(px, py, ps, ps); g.fillStyle = 'rgba(255,255,255,0.10)'; const yy = py + ((T * 140) % ps); g.fillRect(px, yy, ps, 6); }
      g.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = py; y < py + ps; y += 4) g.fillRect(px, y, ps, 1.5);
    }
    g.restore();
    g.save(); SL.roundRect(g, px, py, ps, ps, 14); g.strokeStyle = `rgba(${S.rgb},1)`; g.lineWidth = 3; g.shadowColor = `rgba(${S.rgb},1)`; g.shadowBlur = 18 * SL.view.scale; g.stroke(); g.restore();
    if (S.radio) SL.neonText(g, '◉ INCOMING TRANSMISSION', px + ps / 2, py + ps + 20, 12, S.rgb, { blur: 6, alpha: 0.6 + 0.4 * Math.sin(T * 6) });
    if (S.private) SL.neonText(g, 'ENCRYPTED LINK', px + ps / 2, py + ps + 20, 12, S.rgb, { blur: 6, alpha: 0.85 });
    // dialogue box
    const bx = 30, by = 362, bw = W - 60, bh = 182;
    g.save(); SL.roundRect(g, bx, by, bw, bh, 14); g.fillStyle = 'rgba(8,3,20,0.92)'; g.fill();
    g.strokeStyle = `rgba(${S.rgb},0.95)`; g.lineWidth = 2.5; g.shadowColor = `rgba(${S.rgb},1)`; g.shadowBlur = 16 * SL.view.scale; g.stroke(); g.restore();
    SL.neonText(g, S.name, bx + 26, by + 30, 22, S.rgb, { align: 'left', blur: 10 });
    const lines = wrap(text, 52); let n = Math.floor(this.t * CPS);
    lines.forEach((ln, k) => { const part = ln.slice(0, Math.max(0, n)); n -= ln.length + 1; if (part) SL.neonText(g, part, bx + 26, by + 74 + k * 34, 25, '255,245,255', { align: 'left', blur: 6 }); });
    if (this.typedAll && Math.floor(T * 3) % 2) SL.neonText(g, '▼', bx + bw - 30, by + bh - 24, 18, S.rgb, { blur: 8 });
    SL.neonText(g, `${this.i + 1}/${this.scene.lines.length}`, bx + bw - 26, by + 30, 13, '160,200,255', { align: 'right', blur: 4, alpha: 0.7 });
    SL.neonText(g, SL.Input.touchMode ? 'TAP TO CONTINUE' : 'SPACE / ENTER / CLICK TO CONTINUE · ESC SKIP', 512, 562, 11, '160,200,255', { blur: 3, alpha: 0.6 });
    SL.drawButton(g, this.skipBtn, false, T);
    SL.drawScanlines(g);
  }
};
})();
