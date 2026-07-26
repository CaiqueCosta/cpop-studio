(function () {
  var field = document.querySelector(".particle-field");
  var canvas = document.getElementById("particle-canvas");
  if (!field || !canvas) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  var particles = [];
  var mouse = { x: 0, y: 0, active: false };
  var width = 0;
  var height = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var raf = 0;
  var colors = [
    "91, 124, 255",
    "242, 241, 236",
    "255, 180, 120",
    "120, 220, 200",
    "255, 120, 160"
  ];

  function countForSize() {
    return Math.max(28, Math.min(70, Math.floor((width * height) / 16000)));
  }

  function createParticle() {
    var kind = Math.random();
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28 - 0.05,
      r: kind > 0.82 ? 6 + Math.random() * 10 : 1.4 + Math.random() * 3.2,
      pulse: Math.random() * Math.PI * 2,
      color: colors[(Math.random() * colors.length) | 0],
      kind: kind > 0.82 ? "orb" : kind > 0.55 ? "spark" : "dot"
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

    var target = reduceMotion ? Math.floor(countForSize() * 0.5) : countForSize();
    while (particles.length < target) particles.push(createParticle());
    while (particles.length > target) particles.pop();
  }

  function onPointerMove(event) {
    mouse.active = true;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  }

  function onPointerLeave() {
    mouse.active = false;
  }

  function drawSpark(p, alpha) {
    var s = p.r * 1.6;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.pulse * 0.4);
    ctx.strokeStyle = "rgba(" + p.color + "," + alpha + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.stroke();
    ctx.restore();
  }

  function drawOrb(p, alpha) {
    var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, "rgba(" + p.color + "," + (alpha * 0.55) + ")");
    g.addColorStop(0.55, "rgba(" + p.color + "," + (alpha * 0.18) + ")");
    g.addColorStop(1, "rgba(" + p.color + ", 0)");
    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawDot(p, alpha) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(" + p.color + "," + alpha + ")";
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function stepParticles() {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.pulse += 0.018 + p.r * 0.001;

      if (!reduceMotion) {
        if (mouse.active) {
          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var radius = p.kind === "orb" ? 160 : 110;
          if (dist < radius) {
            var force = (radius - dist) / radius;
            p.vx += (dx / dist) * force * 0.42;
            p.vy += (dy / dist) * force * 0.42;
          }
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx + Math.cos(p.pulse) * 0.05;
        p.y += p.vy + Math.sin(p.pulse * 0.7) * 0.06 - 0.02;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }

      var alpha = 0.28 + Math.sin(p.pulse) * 0.18;
      if (p.kind === "orb") drawOrb(p, alpha);
      else if (p.kind === "spark") drawSpark(p, alpha * 1.2);
      else drawDot(p, alpha);
    }
  }

  // Floating soda can
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
      if (mouse.active) {
        var cx = soda.x + soda.w / 2;
        var cy = soda.y + soda.h / 2;
        var dx = cx - mouse.x;
        var dy = cy - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 150) {
          var force = ((150 - dist) / 150) * 0.9;
          soda.vx += (dx / dist) * force;
          soda.vy += (dy / dist) * force;
          soda.vr += (dx / dist) * force * 0.4;
        }
      }

      soda.vy += 0.015;
      soda.vx *= 0.99;
      soda.vy *= 0.99;
      soda.vr *= 0.98;
      soda.x += soda.vx;
      soda.y += soda.vy + Math.sin(performance.now() / 700) * 0.15;
      soda.rot += soda.vr * 0.2;
      soda.rot += Math.sin(performance.now() / 900) * 0.02;

      var maxX = width - soda.w;
      var maxY = height - soda.h;
      if (soda.x < 8) {
        soda.x = 8;
        soda.vx = Math.abs(soda.vx) * 0.85;
        soda.vr *= -1;
      }
      if (soda.x > maxX - 8) {
        soda.x = maxX - 8;
        soda.vx = -Math.abs(soda.vx) * 0.85;
        soda.vr *= -1;
      }
      if (soda.y < 8) {
        soda.y = 8;
        soda.vy = Math.abs(soda.vy) * 0.85;
      }
      if (soda.y > maxY - 8) {
        soda.y = maxY - 8;
        soda.vy = -Math.abs(soda.vy) * 0.75;
      }
    }

    placeCan();
  }

  function step() {
    stepParticles();
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
