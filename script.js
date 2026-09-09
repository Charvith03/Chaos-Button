(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const root = document.documentElement;
  const startScreen = $('#start-screen');
  const gameScreen = $('#game-screen');
  const gameOverScreen = $('#game-over-screen');
  const startButton = $('#start-button');
  const againButton = $('#again-button');
  const homeButton = $('#home-button');
  const quitButton = $('#quit-button');
  const chaosButton = $('#chaos-button');
  const fakeButton = $('#fake-button');
  const arena = $('#arena');
  const gameShell = $('#app-shell');

  const levelNames = ['CALM', 'GETTING WEIRD', 'CHAOS', 'ABSOLUTE CHAOS', 'REALITY ERROR', '???'];
  const levelEvents = [
    'The calm before the storm', 'Movement detected', 'Things are getting weird',
    'Reality is negotiable', 'No rules. Just vibes.', 'You found the void'
  ];
  const state = {
    active: false, score: 0, level: 1, combo: 1, peakCombo: 1, timeLeft: 30,
    lastClick: 0, lastMove: 0, lastEvent: 0, clickCount: 0, runStart: 0,
    timer: null, best: Number(localStorage.getItem('chaos-button-best') || 0),
    sound: localStorage.getItem('chaos-button-sound') !== 'off',
    theme: localStorage.getItem('chaos-button-theme') || 'dark',
    fakeActive: false, secretClicks: 0, fakeTimeout: null, textTimeout: null, shakeTimeout: null
  };

  root.dataset.theme = state.theme;
  $('#best-value').textContent = pad(state.best);
  updateSoundUI();
  $('#theme-icon').textContent = state.theme === 'dark' ? '☼' : '☾';

  function pad(value) { return String(Math.max(0, Math.floor(value))).padStart(4, '0'); }
  function random(min, max) { return Math.random() * (max - min) + min; }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function showScreen(screen) {
    [startScreen, gameScreen, gameOverScreen].forEach((item) => item.classList.add('hidden'));
    screen.classList.remove('hidden');
  }
  function setText(id, value) { const element = $(id); if (element) element.textContent = value; }

  function startGame() {
    clearInterval(state.timer);
    clearTimeout(state.fakeTimeout); clearTimeout(state.textTimeout); clearTimeout(state.shakeTimeout);
    Object.assign(state, { active:true, score:0, level:1, combo:1, peakCombo:1, timeLeft:30, lastClick:0, lastMove:0, lastEvent:0, clickCount:0, runStart:performance.now(), fakeActive:false, secretClicks:0 });
    chaosButton.className = 'chaos-button';
    chaosButton.style.left = '50%';
    chaosButton.style.top = '50%';
    fakeButton.classList.remove('visible');
    gameScreen.classList.remove('chaos-mode');
    showScreen(gameScreen);
    updateUI();
    announce('Chaos started. Click the core to score.');
    playTone(330, .08, 'sine');
    state.timer = setInterval(tick, 100);
  }

  function tick() {
    if (!state.active) return;
    state.timeLeft = Math.max(0, 30 - (performance.now() - state.runStart) / 1000);
    if (state.timeLeft <= 0) endGame();
    updateUI();
    const now = performance.now();
    const moveDelay = Math.max(620, 1900 - state.level * 185);
    const eventDelay = Math.max(1900, 5200 - state.level * 420);
    if (now - state.lastMove > moveDelay) moveButton();
    if (now - state.lastEvent > eventDelay && state.level >= 2) triggerChaosEvent();
    if (state.lastClick && now - state.lastClick > 1300 && state.combo > 1) {
      state.combo = 1; setText('#combo-status', 'Build it up'); updateUI();
    }
  }

  function updateUI() {
    setText('#score-value', pad(state.score));
    setText('#level-value', String(state.level).padStart(2, '0'));
    setText('#level-name', levelNames[state.level - 1] || levelNames[5]);
    setText('#combo-value', `x${state.combo}`);
    setText('#time-value', state.timeLeft.toFixed(1));
    $('#timer-bar').style.width = `${(state.timeLeft / 30) * 100}%`;
    if (state.timeLeft < 8) $('#timer-bar').style.background = 'var(--danger)';
    else if (state.timeLeft < 15) $('#timer-bar').style.background = 'var(--accent-2)';
    else $('#timer-bar').style.background = 'var(--cyan)';
  }

  function scoreClick(event) {
    if (!state.active) return;
    event?.preventDefault();
    const now = performance.now();
    const fast = state.lastClick && now - state.lastClick < 1100;
    state.combo = fast ? state.combo + 1 : 1;
    state.peakCombo = Math.max(state.peakCombo, state.combo);
    state.lastClick = now;
    state.clickCount++;
    const points = Math.max(1, Math.round(state.combo * (state.level > 3 ? 1.25 : 1)));
    state.score += points;
    state.secretClicks++;
    if (state.secretClicks === 13) showToast('13 clicks. Suspiciously lucky.');
    if (state.secretClicks === 42) showToast('The answer was always click.');
    const nextLevel = Math.floor(state.score / 14) + 1;
    if (nextLevel > state.level) levelUp(nextLevel);
    updateUI();
    showScoreFeedback(points, event);
    setText('#combo-status', state.combo > 1 ? 'Keep the rhythm' : 'Build it up');
    if (state.combo >= 2) {
      const comboPop = $('#combo-pop'); comboPop.textContent = `COMBO x${state.combo}`; comboPop.classList.remove('show'); void comboPop.offsetWidth; comboPop.classList.add('show');
    }
    createParticles(event);
    chaosButton.classList.remove('pressed'); void chaosButton.offsetWidth; chaosButton.classList.add('pressed');
    playTone(240 + state.combo * 32, .055, state.combo > 4 ? 'triangle' : 'sine');
    if (state.level >= 2 && Math.random() < Math.min(.72, .28 + state.level * .03)) moveButton();
    if (state.level >= 3 && Math.random() < Math.min(.14, .05 + state.level * .01)) triggerChaosEvent();
  }

  function levelUp(newLevel) {
    state.level = newLevel;
    setText('#level-banner', `LEVEL ${String(newLevel).padStart(2, '0')} — ${levelNames[newLevel - 1] || '???'}`);
    const banner = $('#level-banner'); banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
    setText('#event-status', levelEvents[newLevel - 1] || levelEvents[5]);
    gameScreen.classList.toggle('chaos-mode', newLevel >= 3);
    showToast(`Level up: ${levelNames[newLevel - 1] || '???'}`);
    playTone(390 + newLevel * 55, .16, 'square');
    moveButton();
  }

  function moveButton() {
    if (!state.active) return;
    state.lastMove = performance.now();
    const buttonRect = chaosButton.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();
    const padding = Math.min(42, 18 + state.level * 3);
    const halfW = buttonRect.width / 2;
    const halfH = buttonRect.height / 2;
    const minX = halfW + padding; const maxX = arenaRect.width - halfW - padding;
    const minY = halfH + padding; const maxY = arenaRect.height - halfH - padding;
    const x = random(minX, Math.max(minX, maxX)); const y = random(minY, Math.max(minY, maxY));
    chaosButton.style.left = `${x}px`; chaosButton.style.top = `${y}px`;
    setText('#target-hint', state.level >= 3 ? 'FIND THE CORE' : 'TAP THE CORE');
  }

  function triggerChaosEvent() {
    state.lastEvent = performance.now();
    const events = ['shrink', 'swap', 'fake', 'shake', 'text'];
    const event = events[Math.floor(Math.random() * events.length)];
    if (event === 'shrink') { chaosButton.classList.toggle('small'); showToast('The core is getting twitchy'); }
    if (event === 'swap') { chaosButton.classList.toggle('square'); moveButton(); showToast('Shape shift detected'); }
    if (event === 'fake') { spawnFake(); showToast('Trust issues enabled'); }
    if (event === 'shake') { gameShell.classList.remove('shake'); void gameShell.offsetWidth; gameShell.classList.add('shake'); document.body.classList.add('is-shaking'); clearTimeout(state.shakeTimeout); state.shakeTimeout = setTimeout(() => document.body.classList.remove('is-shaking'), 300); showToast('Hold steady'); }
    if (event === 'text') { const labels = ['NOPE', 'CLICK?', 'AGAIN', 'YES', 'CORE']; setText('#chaos-label', labels[Math.floor(Math.random() * labels.length)]); showToast('The button has opinions'); clearTimeout(state.textTimeout); state.textTimeout = setTimeout(() => setText('#chaos-label', 'CLICK ME'), 1400); }
    playTone(130, .1, 'sawtooth');
  }

  function spawnFake() {
    if (state.fakeActive) return;
    state.fakeActive = true; fakeButton.classList.add('visible');
    const rect = arena.getBoundingClientRect();
    const realRect = chaosButton.getBoundingClientRect();
    const realX = realRect.left - rect.left + realRect.width / 2;
    const realY = realRect.top - rect.top + realRect.height / 2;
    let x = 20; let y = 20;
    for (let attempt = 0; attempt < 12; attempt++) {
      x = random(20, Math.max(20, rect.width - 125)); y = random(20, Math.max(20, rect.height - 62));
      if (Math.hypot(x - realX, y - realY) > realRect.width * .8) break;
    }
    fakeButton.style.left = `${x}px`; fakeButton.style.top = `${y}px`;
    clearTimeout(state.fakeTimeout); state.fakeTimeout = setTimeout(() => { fakeButton.classList.remove('visible'); state.fakeActive = false; }, 2300);
  }

  function fakeClick(event) { event.preventDefault(); showToast('Nice try. The core is orange.'); fakeButton.animate([{ transform:'rotate(-4deg) scale(1.06)' }, { transform:'rotate(4deg) scale(1)' }], { duration:220 }); playTone(90, .08, 'square'); }

  function createParticles(event) {
    const rect = arena.getBoundingClientRect();
    const x = event?.clientX ? event.clientX - rect.left : rect.width / 2;
    const y = event?.clientY ? event.clientY - rect.top : rect.height / 2;
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('i'); p.className = 'particle'; p.style.left = `${x}px`; p.style.top = `${y}px`; p.style.setProperty('--x', `${random(-65,65)}px`); p.style.setProperty('--y', `${random(-65,65)}px`); p.style.background = i % 2 ? 'var(--cyan)' : 'var(--accent)'; $('#particle-layer').appendChild(p); setTimeout(() => p.remove(), 650);
    }
  }

  function showScoreFeedback(points, event) {
    const rect = arena.getBoundingClientRect();
    const feedback = document.createElement('span');
    feedback.className = 'score-pop'; feedback.textContent = `+${points}`;
    feedback.style.left = `${event?.clientX ? event.clientX - rect.left : rect.width / 2}px`;
    feedback.style.top = `${event?.clientY ? event.clientY - rect.top : rect.height / 2}px`;
    $('#particle-layer').appendChild(feedback);
    setTimeout(() => feedback.remove(), 650);
  }

  function showToast(message) { const toast = $('#event-toast'); toast.textContent = message; toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show'); }
  function announce(message) { $('#live-region').textContent = message; }

  function endGame() {
    if (!state.active) return;
    state.active = false; clearInterval(state.timer); clearTimeout(state.fakeTimeout); clearTimeout(state.textTimeout); clearTimeout(state.shakeTimeout); fakeButton.classList.remove('visible'); state.fakeActive = false; state.timeLeft = 0; updateUI();
    const isNew = state.score > state.best;
    if (isNew) { state.best = state.score; localStorage.setItem('chaos-button-best', String(state.best)); }
    setText('#final-score', pad(state.score)); setText('#final-combo', `x${state.peakCombo}`); setText('#final-level', String(state.level).padStart(2,'0')); setText('#best-value', pad(state.best));
    $('#new-record').classList.toggle('hidden', !isNew);
    setText('#over-copy', isNew ? 'You bent the rules and broke the record.' : state.score > 70 ? 'Honestly? That was almost controlled.' : 'The chaos got you this time.');
    showScreen(gameOverScreen); playTone(isNew ? 620 : 180, .25, isNew ? 'triangle' : 'sine'); announce(`Run complete. Final score ${state.score}.`);
  }

  function toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = state.theme; localStorage.setItem('chaos-button-theme', state.theme); $('#theme-icon').textContent = state.theme === 'dark' ? '☼' : '☾'; }
  function updateSoundUI() { $('#sound-icon').textContent = state.sound ? '◖))' : '×))'; $('#sound-toggle').setAttribute('aria-label', state.sound ? 'Mute sound' : 'Unmute sound'); }
  function toggleSound() { state.sound = !state.sound; localStorage.setItem('chaos-button-sound', state.sound ? 'on' : 'off'); updateSoundUI(); if (state.sound) playTone(420,.1,'sine'); }
  let audioContext;
  function playTone(frequency, duration, type) { if (!state.sound) return; try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); const osc = audioContext.createOscillator(); const gain = audioContext.createGain(); osc.type = type; osc.frequency.value = frequency; gain.gain.setValueAtTime(.045, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration); osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration); } catch (_) { /* Sound is optional. */ } }

  startButton.addEventListener('click', startGame); againButton.addEventListener('click', startGame); homeButton.addEventListener('click', () => showScreen(startScreen)); quitButton.addEventListener('click', endGame); chaosButton.addEventListener('click', scoreClick); chaosButton.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault(); }); fakeButton.addEventListener('click', fakeClick); fakeButton.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') fakeClick(event); }); $('#theme-toggle').addEventListener('click', toggleTheme); $('#sound-toggle').addEventListener('click', toggleSound);
  document.addEventListener('keydown', (event) => { if (event.key.toLowerCase() === 'm') toggleSound(); if (event.key.toLowerCase() === 't') toggleTheme(); });
  window.addEventListener('resize', () => { if (state.active) moveButton(); });
})();
