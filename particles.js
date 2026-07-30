(function () {
  var field = document.querySelector(".particle-field");
  var canvas = document.getElementById("particle-canvas");
  if (!field || !canvas) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  var width = 0;
  var height = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var raf = 0;

  // Starlight palette (RGB triplets).
  var starHues = [
    "255, 255, 255",   // white
    "202, 224, 255",   // ice blue
    "196, 181, 253",   // violet
    "160, 232, 255",   // cyan
    "255, 224, 196"    // warm giant (rare)
  ];

  var mouse = { x: 0, y: 0, active: false };
  // Parallax offset, eased toward the mouse position.
  var parallax = { x: 0, y: 0, tx: 0, ty: 0 };

  var stars = [];   // twinkling background field, parallax by depth
  var dust = [];    // cosmic motes that orbit the cursor gravity well
  var beacons = [];  // bright diffraction-spike stars
  var comets = [];  // shooting stars
  var waves = [];   // click shockwaves
  var trail = [];   // stardust shed by the flung soda can

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function starCount() {
    return Math.max(60, Math.min(220, Math.floor((width * height) / 7000)));
  }
  function dustCount() {
    return Math.max(24, Math.min(90, Math.floor((width * height) / 20000)));
  }
  function beaconCount() {
    return Math.max(4, Math.min(12, Math.floor((width * height) / 150000)));
  }

  function makeStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      depth: Math.random(),                 // 0 = far, 1 = near (more parallax)
      r: rand(0.25, 0.9),
      hue: Math.random() < 0.12 ? starHues[4] : pick(starHues),
      base: rand(0.25, 0.7),
      tw: rand(0.008, 0.03),
      phase: Math.random() * Math.PI * 2
    };
  }

  function makeDust() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: rand(-0.12, 0.12),
      vy: rand(-0.12, 0.12),
      r: rand(0.8, 2.2),
      hue: pick(starHues),
      phase: Math.random() * Math.PI * 2
    };
  }

  function makeBeacon() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      depth: rand(0.4, 1),
      r: rand(1.6, 3),
      hue: Math.random() < 0.5 ? starHues[0] : pick(starHues),
      base: rand(0.5, 0.9),
      tw: rand(0.01, 0.025),
      phase: Math.random() * Math.PI * 2
    };
  }

  function spawnComet() {
    // Enter from a random point along the top or left edge, streak down-right.
    var fromTop = Math.random() < 0.5;
    var angle = rand(0.35, 0.85); // radians, heading down-right
    var speed = rand(7, 12);
    return {
      x: fromTop ? rand(0, width * 0.9) : rand(-80, -20),
      y: fromTop ? rand(-80, -20) : rand(0, height * 0.5),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: rand(90, 180),
      hue: Math.random() < 0.4 ? starHues[3] : starHues[0],
      life: 1
    };
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var sTarget = reduceMotion ? Math.floor(starCount() * 0.6) : starCount();
    while (stars.length < sTarget) stars.push(makeStar());
    while (stars.length > sTarget) stars.pop();

    var dTarget = reduceMotion ? 0 : dustCount();
    while (dust.length < dTarget) dust.push(makeDust());
    while (dust.length > dTarget) dust.pop();

    var bTarget = beaconCount();
    while (beacons.length < bTarget) beacons.push(makeBeacon());
    while (beacons.length > bTarget) beacons.pop();
  }

  function onPointerMove(event) {
    mouse.active = true;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    parallax.tx = (event.clientX / width - 0.5);
    parallax.ty = (event.clientY / height - 0.5);
  }

  function onPointerLeave() {
    mouse.active = false;
  }

  function onPointerDown(event) {
    // Ignore clicks that originate on the draggable can.
    if (event.target && event.target.closest && event.target.closest(".soda-can")) return;
    if (reduceMotion) return;
    waves.push({ x: event.clientX, y: event.clientY, r: 0, life: 1 });
  }

  // ---- Drawing ---------------------------------------------------------

  function drawStars() {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.phase += s.tw;
      var tw = s.base + Math.sin(s.phase) * 0.35;
      if (tw < 0.04) tw = 0.04;
      var px = s.x + parallax.x * (6 + s.depth * 34);
      var py = s.y + parallax.y * (6 + s.depth * 34);
      var r = s.r * (1 + s.depth * 0.35);
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + s.hue + "," + tw + ")";
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBeacon(b) {
    b.phase += b.tw;
    var tw = b.base + Math.sin(b.phase) * 0.3;
    if (tw < 0.1) tw = 0.1;
    var px = b.x + parallax.x * (10 + b.depth * 40);
    var py = b.y + parallax.y * (10 + b.depth * 40);
    var spike = b.r * (5 + Math.sin(b.phase) * 1.2);

    // Soft glow.
    var g = ctx.createRadialGradient(px, py, 0, px, py, b.r * 7);
    g.addColorStop(0, "rgba(" + b.hue + "," + (tw * 0.5) + ")");
    g.addColorStop(1, "rgba(" + b.hue + ", 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, b.r * 7, 0, Math.PI * 2);
    ctx.fill();

    // Diffraction spikes.
    ctx.strokeStyle = "rgba(" + b.hue + "," + (tw * 0.8) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - spike, py);
    ctx.lineTo(px + spike, py);
    ctx.moveTo(px, py - spike);
    ctx.lineTo(px, py + spike);
    ctx.stroke();

    // Core.
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255," + Math.min(1, tw + 0.15) + ")";
    ctx.arc(px, py, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function stepDust() {
    for (var i = 0; i < dust.length; i++) {
      var p = dust[i];
      p.phase += 0.02;

      if (mouse.active) {
        var dx = mouse.x - p.x;
        var dy = mouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var R = 240;
        if (dist < R) {
          var f = (1 - dist / R);
          var nx = dx / dist;
          var ny = dy / dist;
          // Inward pull, weakening near the center.
          var pull = f * 0.55;
          // Tangential swirl builds an orbit rather than a collapse.
          var swirl = f * 0.85;
          // Gentle outward pressure very close in, so it doesn't clump.
          var push = dist < 46 ? (1 - dist / 46) * 0.7 : 0;
          p.vx += nx * (pull - push) + (-ny) * swirl;
          p.vy += ny * (pull - push) + (nx) * swirl;
        }
      }

      // Shockwaves shove dust outward.
      for (var w = 0; w < waves.length; w++) {
        var wv = waves[w];
        var wdx = p.x - wv.x;
        var wdy = p.y - wv.y;
        var wd = Math.sqrt(wdx * wdx + wdy * wdy) || 1;
        if (Math.abs(wd - wv.r) < 34) {
          var wf = (1 - Math.abs(wd - wv.r) / 34) * wv.life * 1.4;
          p.vx += (wdx / wd) * wf;
          p.vy += (wdy / wd) * wf;
        }
      }

      p.vx *= 0.94;
      p.vy *= 0.94;
      // Cap speed.
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp > 6) { p.vx = (p.vx / sp) * 6; p.vy = (p.vy / sp) * 6; }
      p.x += p.vx + Math.cos(p.phase) * 0.08;
      p.y += p.vy + Math.sin(p.phase * 0.8) * 0.08;

      if (p.x < -30) p.x = width + 30;
      if (p.x > width + 30) p.x = -30;
      if (p.y < -30) p.y = height + 30;
      if (p.y > height + 30) p.y = -30;

      var alpha = 0.35 + Math.sin(p.phase) * 0.2 + Math.min(0.35, sp * 0.06);
      var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2);
      glow.addColorStop(0, "rgba(" + p.hue + "," + alpha + ")");
      glow.addColorStop(1, "rgba(" + p.hue + ", 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function stepComets() {
    if (!reduceMotion && comets.length < 2 && Math.random() < 0.0045) {
      comets.push(spawnComet());
    }
    for (var i = comets.length - 1; i >= 0; i--) {
      var c = comets[i];
      c.x += c.vx;
      c.y += c.vy;
      var mag = Math.sqrt(c.vx * c.vx + c.vy * c.vy) || 1;
      var tailX = c.x - (c.vx / mag) * c.len;
      var tailY = c.y - (c.vy / mag) * c.len;

      var grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
      grad.addColorStop(0, "rgba(" + c.hue + ", 0.9)");
      grad.addColorStop(0.4, "rgba(" + c.hue + ", 0.25)");
      grad.addColorStop(1, "rgba(" + c.hue + ", 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();

      // Bright head.
      var hg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 6);
      hg.addColorStop(0, "rgba(255,255,255,0.95)");
      hg.addColorStop(1, "rgba(" + c.hue + ", 0)");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();

      if (c.x > width + 200 || c.y > height + 200) comets.splice(i, 1);
    }
  }

  function stepWaves() {
    for (var i = waves.length - 1; i >= 0; i--) {
      var w = waves[i];
      w.r += 9;
      w.life -= 0.02;
      if (w.life <= 0) { waves.splice(i, 1); continue; }
      ctx.strokeStyle = "rgba(143, 176, 255," + (w.life * 0.5) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();

      var g = ctx.createRadialGradient(w.x, w.y, w.r * 0.6, w.x, w.y, w.r);
      g.addColorStop(0, "rgba(183, 157, 255, 0)");
      g.addColorStop(1, "rgba(183, 157, 255," + (w.life * 0.12) + ")");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function stepTrail() {
    for (var i = trail.length - 1; i >= 0; i--) {
      var t = trail[i];
      t.x += t.vx;
      t.y += t.vy;
      t.vx *= 0.95;
      t.vy *= 0.95;
      t.life -= 0.03;
      if (t.life <= 0) { trail.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + t.hue + "," + (t.life * 0.8) + ")";
      ctx.arc(t.x, t.y, t.r * t.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function emitTrail(x, y, vx, vy) {
    if (reduceMotion) return;
    var count = Math.min(3, Math.floor(Math.sqrt(vx * vx + vy * vy) / 6));
    for (var i = 0; i < count; i++) {
      trail.push({
        x: x + rand(-6, 6),
        y: y + rand(-6, 6),
        vx: -vx * 0.05 + rand(-0.6, 0.6),
        vy: -vy * 0.05 + rand(-0.6, 0.6),
        r: rand(1, 2.4),
        hue: pick(starHues),
        life: 1
      });
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    // Ease parallax toward target.
    parallax.x += (parallax.tx - parallax.x) * 0.05;
    parallax.y += (parallax.ty - parallax.y) * 0.05;

    ctx.globalCompositeOperation = "lighter";
    drawStars();
    for (var i = 0; i < beacons.length; i++) drawBeacon(beacons[i]);
    stepDust();
    stepTrail();
    stepComets();
    stepWaves();
    ctx.globalCompositeOperation = "source-over";
  }

  // ---- Floating starlight soda can ------------------------------------

  var can = document.createElement("button");
  can.type = "button";
  can.className = "soda-can";
  can.setAttribute("aria-label", "Floating Sea Pop can — drag me");
  can.innerHTML =
    '<svg viewBox="0 0 96 112" aria-hidden="true">' +
    "<defs>" +
    '<linearGradient id="canSteel" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0%" stop-color="#39334e"/>' +
    '<stop offset="12%" stop-color="#766d9b"/>' +
    '<stop offset="31%" stop-color="#d8e4ff"/>' +
    '<stop offset="47%" stop-color="#f7f8ff"/>' +
    '<stop offset="68%" stop-color="#aab9e5"/>' +
    '<stop offset="86%" stop-color="#645a8c"/>' +
    '<stop offset="100%" stop-color="#2c273d"/>' +
    "</linearGradient>" +
    '<linearGradient id="canRim" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#f4f7ff"/>' +
    '<stop offset="48%" stop-color="#aab2c8"/>' +
    '<stop offset="100%" stop-color="#55596a"/>' +
    "</linearGradient>" +
    '<radialGradient id="canGlow" cx="42%" cy="35%" r="72%">' +
    '<stop offset="0%" stop-color="rgba(255,255,255,0.46)"/>' +
    '<stop offset="55%" stop-color="rgba(165,190,255,0.08)"/>' +
    '<stop offset="100%" stop-color="rgba(255,255,255,0)"/>' +
    "</radialGradient>" +
    "</defs>" +

    // Nearly square, straight-sided steel body.
    '<rect x="13" y="17" width="70" height="78" rx="5" fill="url(#canSteel)"/>' +
    '<rect x="13" y="17" width="70" height="78" rx="5" fill="url(#canGlow)"/>' +
    '<path d="M20 23v65" stroke="rgba(255,255,255,0.28)" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M76 23v65" stroke="rgba(10,8,20,0.18)" stroke-width="3" stroke-linecap="round"/>' +

    // Rolled flat-top seam: unmistakably a can, not a bottle.
    '<rect x="11" y="12" width="74" height="9" rx="4.5" fill="url(#canRim)"/>' +
    '<ellipse cx="48" cy="13" rx="34" ry="5.5" fill="#dfe5f2"/>' +
    '<ellipse cx="48" cy="13" rx="29" ry="3.6" fill="#73798b"/>' +
    '<ellipse cx="48" cy="12.5" rx="27" ry="2.7" fill="#bfc6d6"/>' +
    // Church-key puncture marks typical of flat-top cans.
    '<path d="M31 12l7-1.4-2 3.2zM58 10.8l7 1.5-5 2z" fill="#424654" opacity="0.75"/>' +

    // Bottom rolled seam.
    '<rect x="11" y="91" width="74" height="9" rx="4.5" fill="url(#canRim)"/>' +
    '<ellipse cx="48" cy="99" rx="34" ry="5.5" fill="#666b7d"/>' +
    '<ellipse cx="48" cy="97.5" rx="30" ry="3.2" fill="#c9d0df"/>' +

    // Atomic-age printed graphics in a starlight palette.
    '<rect x="15" y="34" width="66" height="41" fill="rgba(35,29,58,0.32)"/>' +
    '<path d="M22 72c18-31 38-39 57-30-22-1-38 10-50 34z" fill="#7665b3" opacity="0.72"/>' +
    '<path d="M17 59c17-8 39-9 62 2-24-4-43-1-60 7z" fill="#d3e5ff" opacity="0.7"/>' +
    '<path d="M48 38l3.2 10.2L62 46l-8.5 6.7 6.2 8.7L49 56l-5.8 10-1-11.3-11-2.5 10-4.5z" fill="#f7f5d8" opacity="0.92"/>' +
    '<circle cx="48" cy="52" r="3.4" fill="#ffffff"/>' +
    '<circle cx="28" cy="43" r="1.2" fill="#dce8ff"/>' +
    '<circle cx="69" cy="69" r="1" fill="#f2e6ff"/>' +
    '<circle cx="25" cy="81" r="0.8" fill="#ffffff"/>' +
    "</svg>";
  document.body.appendChild(can);

  var soda = {
    x: width * 0.72 || 320,
    y: height * 0.55 || 360,
    vx: 0.35,
    vy: -0.2,
    rot: -8,
    vr: 0,
    w: 43,
    h: 50,
    dragging: false,
    offsetX: 0,
    offsetY: 0
  };

  function placeCan() {
    can.style.transform =
      "translate(" + soda.x + "px, " + soda.y + "px) rotate(" + soda.rot + "deg)";
  }

  function onCanPointerDown(event) {
    event.preventDefault();
    soda.dragging = true;
    can.classList.add("is-dragging");
    soda.offsetX = event.clientX - soda.x;
    soda.offsetY = event.clientY - soda.y;
    soda.vx = 0;
    soda.vy = 0;
    can.setPointerCapture(event.pointerId);
  }

  function onCanPointerMove(event) {
    if (!soda.dragging) return;
    var prevX = soda.x;
    var prevY = soda.y;
    soda.x = event.clientX - soda.offsetX;
    soda.y = event.clientY - soda.offsetY;
    soda.vx = soda.x - prevX;
    soda.vy = soda.y - prevY;
    soda.vr = soda.vx * 0.15;
    emitTrail(soda.x + soda.w / 2, soda.y + soda.h / 2, soda.vx, soda.vy);
    placeCan();
  }

  function onCanPointerUp(event) {
    if (!soda.dragging) return;
    soda.dragging = false;
    can.classList.remove("is-dragging");
    soda.vx *= 1.15;
    soda.vy *= 1.15;
    try {
      can.releasePointerCapture(event.pointerId);
    } catch (err) {}
  }

  can.addEventListener("pointerdown", onCanPointerDown);
  can.addEventListener("pointermove", onCanPointerMove);
  can.addEventListener("pointerup", onCanPointerUp);
  can.addEventListener("pointercancel", onCanPointerUp);

  function stepSoda() {
    if (reduceMotion) {
      placeCan();
      return;
    }

    if (!soda.dragging) {
      var driftSpeed = 0.5;

      // Weightless inertia: it is always drifting in whichever direction it is
      // already heading, with the speed eased toward one calm, constant glide.
      // No gravity, no friction, no timers, no nudging — it just floats.
      var sp = Math.sqrt(soda.vx * soda.vx + soda.vy * soda.vy);
      if (sp < 0.05) {
        // Only reachable from a dead stop (e.g. the very first frame): give it
        // a single heading to set it adrift, then inertia carries it from here.
        var a = Math.random() * Math.PI * 2;
        soda.vx = Math.cos(a) * driftSpeed;
        soda.vy = Math.sin(a) * driftSpeed;
        if (Math.abs(soda.vr) < 0.02) soda.vr = rand(-0.14, 0.14);
      } else {
        // Ease the speed toward the drift pace — this also bleeds a hard throw
        // back down gently rather than stopping it dead — heading untouched.
        var scale = 1 + ((driftSpeed - sp) / sp) * 0.02;
        soda.vx *= scale;
        soda.vy *= scale;
      }

      soda.x += soda.vx;
      soda.y += soda.vy;
      soda.rot += soda.vr * 0.2;

      // Shed stardust only while a throw still carries real momentum.
      if (soda.vx * soda.vx + soda.vy * soda.vy > 4) {
        emitTrail(soda.x + soda.w / 2, soda.y + soda.h / 2, soda.vx, soda.vy);
      }

      // Reflect off the edges like a body drifting in free space: the
      // perpendicular velocity flips, the parallel motion carries straight on,
      // and no energy is lost — so it heads off exactly the way it should.
      var maxX = width - soda.w;
      var maxY = height - soda.h;
      var bounced = false;
      if (soda.x < 8) { soda.x = 8; soda.vx = Math.abs(soda.vx); bounced = true; }
      else if (soda.x > maxX - 8) { soda.x = maxX - 8; soda.vx = -Math.abs(soda.vx); bounced = true; }
      if (soda.y < 8) { soda.y = 8; soda.vy = Math.abs(soda.vy); bounced = true; }
      else if (soda.y > maxY - 8) { soda.y = maxY - 8; soda.vy = -Math.abs(soda.vy); bounced = true; }
      if (bounced) {
        soda.vr *= -1; // the tumble reverses on impact
        // A whisper of variation so it never falls into a fixed, looping path.
        var ja = rand(-0.05, 0.05);
        var ca = Math.cos(ja);
        var sa = Math.sin(ja);
        var nvx = soda.vx * ca - soda.vy * sa;
        soda.vy = soda.vx * sa + soda.vy * ca;
        soda.vx = nvx;
      }
    }

    placeCan();
  }

  function step() {
    drawFrame();
    stepSoda();
    raf = window.requestAnimationFrame(step);
  }

  resize();
  soda.x = width * 0.7;
  soda.y = height * 0.45;
  placeCan();

  window.addEventListener("resize", function () {
    resize();
    soda.x = Math.min(soda.x, width - soda.w - 8);
    soda.y = Math.min(soda.y, height - soda.h - 8);
    placeCan();
  });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("blur", onPointerLeave);
  document.addEventListener("mouseleave", onPointerLeave);
  raf = window.requestAnimationFrame(step);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      window.cancelAnimationFrame(raf);
    } else {
      raf = window.requestAnimationFrame(step);
    }
  });
})();
