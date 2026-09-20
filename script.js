(function () {
  console.log('why are you in here. go spin the fih.');

  const stage   = document.querySelector('.stage');
  const fish    = document.getElementById('fish');
  const hint    = document.getElementById('hint');
  const noaudio = document.getElementById('noaudio');
  const song    = document.getElementById('song');

  // One full 360 degree turn of the fish, cut out of the original meme gif.
  const FRAMES = 22;
  // How long the fish can sit still (while still held) before the music stops.
  const IDLE_MS = 130;
  // Minimum angular movement, in degrees, that counts as "spinning".
  const MIN_DELTA = 0.35;

  // Nobody needs to spin this much. Some people will anyway.
  const MILESTONES = [
    { at: 7200,  msg: 'still going?' },                                   // 20 full turns
    { at: 18000, msg: 'ok you can stop now' },                            // 50 full turns
    { at: 27000, msg: 'impressive. deeply unnecessary. but impressive.' } // 75 full turns
  ];

  let rotation   = 0;      // accumulated yaw, in degrees
  let shown      = -1;     // frame index currently visible
  let lastAngle  = null;   // pointer angle at previous move
  let dragging   = false;
  let lastMoveAt = 0;
  let playing    = false;
  let pointerId  = null;
  let hasAudio   = true;   // flips false if assets/song.mp3 is absent
  let totalSpin  = 0;      // cumulative |degrees| dragged this visit, for the odometer easter egg
  let nextMilestone = 0;   // index into MILESTONES
  let hintResetTimer = null;

  // Build the frame stack. Every frame is layered on top of the last and
  // only one is ever opaque, so swapping is a compositor flip - no decode
  // hitch, no flash of blank, no layout work.
  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const img = document.createElement('img');
    img.className = 'frame';
    img.src = 'assets/frames/' + String(i).padStart(2, '0') + '.png';
    img.alt = '';
    img.draggable = false;
    img.decoding = 'sync';
    fish.appendChild(img);
    frames.push(img);
  }

  // Cross-fades the two nearest frames instead of hard-cutting between
  // them. 22 frames over 360 degrees means each frame is ~16 degrees apart,
  // so a straight swap reads as a slide-projector click instead of a turn.
  let curA = -1, curB = -1; // frame indices currently faded in

  function render() {
    const pos = ((rotation / 360) * FRAMES) % FRAMES;
    const p = pos < 0 ? pos + FRAMES : pos;
    const a = Math.floor(p) % FRAMES;
    const b = (a + 1) % FRAMES;
    const t = p - Math.floor(p); // 0..1 blend toward b

    if (a !== curA) frames[a].style.opacity = 1;
    if (b !== curB) frames[b].style.opacity = 0;
    frames[a].style.opacity = String(1 - t);
    frames[b].style.opacity = String(t);

    if (curA !== -1 && curA !== a && curA !== b) frames[curA].style.opacity = 0;
    if (curB !== -1 && curB !== a && curB !== b) frames[curB].style.opacity = 0;
    curA = a; curB = b;
  }
  render();

  // The repo ships without audio, so a fresh clone has no song.mp3.
  // Say so instead of failing silently. The fish still spins.
  song.addEventListener('error', function () {
    hasAudio = false;
    noaudio.hidden = false;
  });

  function centre() {
    const r = fish.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function angleFrom(cx, cy, px, py) {
    return Math.atan2(py - cy, px - cx) * 180 / Math.PI;
  }

  function startAudio() {
    if (playing || !hasAudio) return;
    playing = true;
    song.play().catch(function () { playing = false; });
  }

  function stopAudio() {
    if (!playing) return;
    playing = false;
    song.pause();
  }

  function checkMilestone() {
    const m = MILESTONES[nextMilestone];
    if (!m || totalSpin < m.at) return;
    nextMilestone++;
    clearTimeout(hintResetTimer);
    hint.textContent = m.msg;
    hint.classList.remove('gone');
    hintResetTimer = setTimeout(function () { hint.classList.add('gone'); }, 2600);
  }

  function onDown(e) {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    dragging = true;
    stage.classList.add('dragging');
    stage.setPointerCapture(pointerId);

    const c = centre();
    lastAngle = angleFrom(c.x, c.y, e.clientX, e.clientY);
    lastMoveAt = 0; // not moving yet, so no sound until they actually spin

    hint.classList.add('gone');
  }

  function onMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;

    const c = centre();
    const a = angleFrom(c.x, c.y, e.clientX, e.clientY);

    let delta = a - lastAngle;
    // unwrap across the -180/180 seam
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngle = a;

    if (Math.abs(delta) < MIN_DELTA) return;

    rotation += delta;
    render();

    lastMoveAt = performance.now();
    startAudio();

    totalSpin += Math.abs(delta);
    checkMilestone();
  }

  function onUp(e) {
    if (e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    lastAngle = null;
    lastMoveAt = 0;
    stage.classList.remove('dragging');
    stopAudio();
  }

  // Pause the moment the fish stops moving, even if still held.
  function tick() {
    if (playing && performance.now() - lastMoveAt > IDLE_MS) stopAudio();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);

  // Stop if the tab is hidden or focus is lost mid-drag.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopAudio();
  });
  window.addEventListener('blur', stopAudio);

  // Kill iOS double-tap zoom / rubber-banding on the stage.
  stage.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
})();
