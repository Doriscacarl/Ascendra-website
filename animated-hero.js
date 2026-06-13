/* AnimatedHeroBackground - Ascendra premium canvas hero animations
   Usage: new AnimatedHeroBackground(canvasEl, 'services'|'projects'|'process'|'about'|'contact')
*/
(function () {
  'use strict';

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function rand(min, max) { return min + Math.random() * (max - min); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut3(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function easeInOut3(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var TWO_PI = Math.PI * 2;

  // ─── Class ────────────────────────────────────────────────────────────────
  function AnimatedHeroBackground(canvas, type) {
    this.canvas = canvas;
    this.type   = type;
    this.ctx    = canvas.getContext('2d');
    this.dpr    = Math.min(window.devicePixelRatio || 1, 2);
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.rafId  = null;
    this.lastTs = 0;
    this.t      = 0;
    this.W      = 1;
    this.H      = 1;

    this._initState();
    this.resize();

    var self = this;

    // Pause/resume RAF based on intersection with viewport
    this._observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { self._startLoop(); }
        else { self._stopLoop(); }
      });
    }, { threshold: 0 });
    this._observer.observe(canvas);

    this._onResize = function () {
      self.isMobile = window.matchMedia('(max-width: 768px)').matches;
      self.resize();
    };
    window.addEventListener('resize', this._onResize, { passive: true });

    if (this.reducedMotion) {
      this._drawStaticFallback();
    }
  }

  // ── Sizing ──────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype.resize = function () {
    var parent = this.canvas.parentElement;
    if (!parent) return;
    var w = parent.offsetWidth;
    var h = parent.offsetHeight;
    if (w < 1 || h < 1) return;

    this.canvas.width  = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this.W = w;
    this.H = h;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.type === 'process' && this.processState) {
      this._calcProcessNodePositions();
    }
  };

  // ── State Init ──────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._initState = function () {
    var glowPos = {
      services: [0.70, 0.30],
      projects: [0.60, 0.40],
      process:  [0.18, 0.60],
      about:    [0.30, 0.50],
      contact:  [0.50, 0.30],
    };
    var gp = glowPos[this.type] || [0.5, 0.5];
    this.glowCx = gp[0];
    this.glowCy = gp[1];

    // Shared particles
    var count = this.isMobile ? 20 : 45;
    this.particles = [];
    for (var i = 0; i < count; i++) {
      this.particles.push({
        x: rand(0, 1440),
        y: rand(0, 900),
        vx: rand(-0.06, 0.06),
        vy: rand(-0.14, -0.04),
        r: rand(0.7, 2.0),
        opacity: rand(0.15, 0.55),
        phase: rand(0, TWO_PI),
      });
    }

    // Shared light beams (desktop only)
    this.beams = [
      { angleDeg: -22, period: 62, widthFrac: 0.13, offset: 0.0  },
      { angleDeg: -31, period: 51, widthFrac: 0.09, offset: 0.58 },
    ];

    switch (this.type) {
      case 'services': this._initServices(); break;
      case 'projects': this._initProjects(); break;
      case 'process':  this._initProcess();  break;
      case 'about':    this._initAbout();    break;
      case 'contact':  this._initContact();  break;
    }
  };

  // ── Services init ──────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._initServices = function () {
    this.serviceState = { panels: [], nextSpawnAt: 1.0 };
  };

  // ── Projects init ──────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._initProjects = function () {
    var layerOpacity = [0.04, 0.085, 0.16];
    var count  = this.isMobile ? 4 : 7;
    var frames = [];
    // Pre-distribute frames across normalized canvas space
    var positions = [
      [0.22, 0.35], [0.62, 0.22], [0.85, 0.52],
      [0.38, 0.70], [0.75, 0.75], [0.10, 0.65],
      [0.55, 0.48],
    ];
    for (var i = 0; i < count; i++) {
      var layer = i < 2 ? 0 : i < 5 ? 1 : 2;
      var pos   = positions[i] || [rand(0.1, 0.9), rand(0.1, 0.9)];
      frames.push({
        baseX:  pos[0],
        baseY:  pos[1],
        w:      rand(190, 310),
        h:      rand(145, 235),
        layer:  layer,
        opacity: layerOpacity[layer],
        ampX:   rand(5, 18),
        ampY:   rand(4, 12),
        freqX:  rand(0.05, 0.11),
        freqY:  rand(0.04, 0.09),
        phaseX: rand(0, TWO_PI),
        phaseY: rand(0, TWO_PI),
      });
    }
    frames.sort(function (a, b) { return a.layer - b.layer; });
    this.projectState = { frames: frames };
  };

  // ── Process init ──────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._initProcess = function () {
    this.processState = {
      nodes: [
        { label: '01', x: 0, y: 0, appearedAt: null },
        { label: '02', x: 0, y: 0, appearedAt: null },
        { label: '03', x: 0, y: 0, appearedAt: null },
        { label: '04', x: 0, y: 0, appearedAt: null },
        { label: '05', x: 0, y: 0, appearedAt: null },
      ],
      nextNodeIdx:      0,
      nextNodeAt:       1.8,
      packets:          [],
      nextPacketCheckAt: 0,
    };
    this._calcProcessNodePositions();
  };

  AnimatedHeroBackground.prototype._calcProcessNodePositions = function () {
    var state = this.processState;
    if (!state) return;
    var W = this.W || 1200;
    var H = this.H || 600;
    var timelineY = H * 0.72;
    for (var i = 0; i < state.nodes.length; i++) {
      state.nodes[i].x = W * (0.10 + i * 0.20);
      state.nodes[i].y = timelineY;
    }
  };

  // ── About init ────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._initAbout = function () {
    var shapes = [];
    var types  = ['circle', 'triangle', 'line'];
    var count  = this.isMobile ? 6 : 12;
    for (var i = 0; i < count; i++) {
      shapes.push({
        type:     types[i % 3],
        baseX:    rand(0.05, 0.95),
        baseY:    rand(0.05, 0.95),
        size:     rand(18, 78),
        angle:    rand(0, TWO_PI),
        rotSpeed: rand(-0.06, 0.06),
        ampX:     rand(5, 16),
        ampY:     rand(5, 14),
        freqX:    rand(0.04, 0.10),
        freqY:    rand(0.03, 0.08),
        phaseX:   rand(0, TWO_PI),
        phaseY:   rand(0, TWO_PI),
        opacity:  rand(0.03, 0.09),
      });
    }
    this.aboutState = {
      shapes: shapes,
      rays: [
        { angleDeg: -25, period: 46, widthFrac: 0.09, offset: 0.00 },
        { angleDeg: -14, period: 37, widthFrac: 0.06, offset: 0.38 },
        { angleDeg: -36, period: 56, widthFrac: 0.05, offset: 0.73 },
      ],
    };
  };

  // ── Contact init ──────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._initContact = function () {
    var nodes = [];
    var cols = 5, rows = 3;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (Math.random() > 0.22) {
          nodes.push({
            baseX:      clamp((c + 0.5 + rand(-0.22, 0.22)) / cols, 0.04, 0.96),
            baseY:      clamp((r + 0.5 + rand(-0.28, 0.28)) / rows, 0.04, 0.96),
            pulsePhase: rand(0, TWO_PI),
            pulseSpeed: rand(0.45, 0.85),
            isPulsing:  false,
          });
        }
      }
    }
    // Mark 4 nodes as pulsing
    var step = Math.floor(nodes.length / 4);
    for (var p = 0; p < 4 && p * step < nodes.length; p++) {
      nodes[p * step].isPulsing = true;
    }

    // Build edges between nearby nodes
    var edges = [];
    var threshold = 0.40;
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].baseX - nodes[j].baseX;
        var dy = nodes[i].baseY - nodes[j].baseY;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
          edges.push({
            from: i, to: j,
            packets: [],
            nextPacketAt: rand(1, 7),
          });
        }
      }
    }

    // Ghost form field rectangles (normalized positions)
    var fields = [
      { nx: 0.54, ny: 0.20, nw: 0.30, nh: 0.08, phase: 0.0 },
      { nx: 0.54, ny: 0.40, nw: 0.30, nh: 0.08, phase: 1.6 },
      { nx: 0.54, ny: 0.60, nw: 0.22, nh: 0.13, phase: 3.1 },
    ];

    this.contactState = { nodes: nodes, edges: edges, fields: fields };
  };

  // ── RAF ────────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._startLoop = function () {
    if (this.rafId || this.reducedMotion) return;
    var self = this;
    this.lastTs = performance.now();
    var loop = function (ts) {
      self.rafId = requestAnimationFrame(loop);
      var dt = Math.min((ts - self.lastTs) / 1000, 0.05);
      self.lastTs = ts;
      self.t += dt;
      self._frame(dt);
    };
    this.rafId = requestAnimationFrame(loop);
  };

  AnimatedHeroBackground.prototype._stopLoop = function () {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  // ── Main Frame ─────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._frame = function (dt) {
    var ctx = this.ctx, W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);

    // Shared layers
    this._drawGrid(ctx, W, H, 80);
    this._drawGlow(ctx, W, H);
    if (!this.isMobile) this._drawBeams(ctx, W, H);
    this._drawParticles(ctx, W, H, dt);

    // Page-specific layer
    switch (this.type) {
      case 'services': this._drawServices(ctx, W, H, dt); break;
      case 'projects': this._drawProjects(ctx, W, H, dt); break;
      case 'process':  this._drawProcess (ctx, W, H, dt); break;
      case 'about':    this._drawAbout   (ctx, W, H, dt); break;
      case 'contact':  this._drawContact (ctx, W, H, dt); break;
    }
  };

  // ── Shared: Grid ───────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawGrid = function (ctx, W, H, step) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.028)';
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    for (var x = 0; x <= W; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (var y = 0; y <= H; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  // ── Shared: Glow ───────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawGlow = function (ctx, W, H) {
    var cx   = W * this.glowCx;
    var cy   = H * this.glowCy;
    var r    = Math.max(W, H) * 0.72;
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0,   'rgba(173,198,255,0.058)');
    grad.addColorStop(0.4, 'rgba(173,198,255,0.022)');
    grad.addColorStop(1,   'rgba(173,198,255,0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  // ── Shared: Beams ──────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawBeams = function (ctx, W, H) {
    ctx.save();
    for (var b = 0; b < this.beams.length; b++) {
      var beam = this.beams[b];
      var ang  = beam.angleDeg * Math.PI / 180;
      var pos  = ((this.t / beam.period) + beam.offset) % 1.0;
      var cx   = -W * 0.2 + W * 1.4 * pos;
      var bw   = W * beam.widthFrac;
      var bh   = H * 3.5;

      ctx.save();
      ctx.translate(cx, H * 0.5);
      ctx.rotate(ang);

      var grad = ctx.createLinearGradient(-bw, 0, bw, 0);
      grad.addColorStop(0,   'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.016)');
      grad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(-bw, -bh / 2, bw * 2, bh);
      ctx.restore();
    }
    ctx.restore();
  };

  // ── Shared: Particles ──────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawParticles = function (ctx, W, H, dt) {
    ctx.save();
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.x += p.vx * dt * 28;
      p.y += p.vy * dt * 28;
      p.phase += dt * 0.45;

      if (p.x < -4)    p.x = W + 4;
      if (p.x > W + 4) p.x = -4;
      if (p.y < -4)    p.y = H + 4;
      if (p.y > H + 4) p.y = -4;

      var alpha = p.opacity * (0.38 + 0.62 * Math.abs(Math.sin(p.phase)));
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  // ────────────────────────────────────────────────────────────────────────
  // SERVICES - Wireframe UI Panels Assembling
  // ────────────────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawServices = function (ctx, W, H, dt) {
    var state     = this.serviceState;
    var maxPanels = this.isMobile ? 4 : 8;

    if (this.t >= state.nextSpawnAt && state.panels.length < maxPanels) {
      state.panels.push(this._spawnServicePanel(W, H));
      state.nextSpawnAt = this.t + rand(2.8, 4.5);
    }

    var alive = [];
    for (var i = 0; i < state.panels.length; i++) {
      if (this._drawServicePanel(ctx, W, H, state.panels[i])) {
        alive.push(state.panels[i]);
      }
    }
    state.panels = alive;
  };

  AnimatedHeroBackground.prototype._spawnServicePanel = function (W, H) {
    var w = rand(175, 275);
    var h = rand(115, 195);

    // Pick position - avoid text region (left side on desktop)
    var x, y, attempts = 0;
    do {
      x = rand(16, W - w - 16);
      y = rand(16, H - h - 16);
      attempts++;
    } while (!this.isMobile && x < W * 0.44 && y < H * 0.55 && attempts < 12);

    // Slide-in from nearest edge
    var slideX = 0, slideY = 0;
    var edgeChoice = Math.floor(rand(0, 4));
    if (edgeChoice === 0) { slideX = -28; }
    else if (edgeChoice === 1) { slideX =  28; }
    else if (edgeChoice === 2) { slideY = -20; }
    else                       { slideY =  20; }

    var fadeIn  = rand(1.6, 2.4);
    var visible = rand(10, 15);
    var fadeOut = rand(1.4, 2.2);

    return {
      x: x, y: y, w: w, h: h,
      bornAt:    this.t,
      fadeInDur: fadeIn,
      visibleDur: visible,
      fadeOutDur: fadeOut,
      totalDur:  fadeIn + visible + fadeOut,
      slideX0:   slideX,
      slideY0:   slideY,
      lineWidths: [rand(0.28, 0.68), rand(0.38, 0.78), rand(0.22, 0.55)],
    };
  };

  AnimatedHeroBackground.prototype._drawServicePanel = function (ctx, W, H, p) {
    var age = this.t - p.bornAt;
    if (age >= p.totalDur) return false;

    // Alpha
    var alpha;
    if (age < p.fadeInDur) {
      alpha = easeOut3(age / p.fadeInDur);
    } else if (age < p.fadeInDur + p.visibleDur) {
      alpha = 1;
    } else {
      alpha = 1 - easeOut3((age - p.fadeInDur - p.visibleDur) / p.fadeOutDur);
    }

    // Slide
    var slideP = easeOut3(clamp(age / p.fadeInDur, 0, 1));
    var sx = p.x + p.slideX0 * (1 - slideP);
    var sy = p.y + p.slideY0 * (1 - slideP);

    var base = alpha * 0.10;

    ctx.save();

    // Outer rect
    ctx.globalAlpha = base;
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(sx, sy, p.w, p.h);

    // Header fill
    ctx.globalAlpha = base * 0.7;
    ctx.fillStyle   = 'rgba(255,255,255,0.07)';
    ctx.fillRect(sx + 0.5, sy + 0.5, p.w - 1, 24);

    // Header separator
    ctx.globalAlpha = base;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 0.3;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 24);
    ctx.lineTo(sx + p.w, sy + 24);
    ctx.stroke();

    // Header dots
    for (var d = 0; d < 3; d++) {
      ctx.globalAlpha = base * 1.2;
      ctx.fillStyle   = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(sx + 10 + d * 10, sy + 12, 2.5, 0, TWO_PI);
      ctx.fill();
    }

    // Content lines
    ctx.lineWidth = 0.8;
    var lineYs = [sy + 38, sy + 52, sy + 66];
    for (var l = 0; l < 3; l++) {
      ctx.globalAlpha = base * 0.8;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.moveTo(sx + 10, lineYs[l]);
      ctx.lineTo(sx + 10 + p.w * p.lineWidths[l], lineYs[l]);
      ctx.stroke();
    }

    // Small corner accent (top-right)
    ctx.globalAlpha = base * 0.6;
    ctx.strokeStyle = 'rgba(173,198,255,1)';
    ctx.lineWidth   = 0.6;
    ctx.beginPath();
    ctx.moveTo(sx + p.w - 14, sy + 1);
    ctx.lineTo(sx + p.w - 1,  sy + 1);
    ctx.lineTo(sx + p.w - 1,  sy + 14);
    ctx.stroke();

    // Scanline during visible phase
    if (age > p.fadeInDur) {
      var visAge   = age - p.fadeInDur;
      var cycleDur = p.visibleDur * 0.55;
      var scanP    = (visAge % cycleDur) / cycleDur;
      var scanY    = sy + 26 + scanP * (p.h - 32);
      ctx.globalAlpha = base * 0.55;
      ctx.fillStyle   = 'rgba(173,198,255,0.1)';
      ctx.fillRect(sx + 1, scanY - 0.5, p.w - 2, 2);
    }

    ctx.restore();
    return true;
  };

  // ────────────────────────────────────────────────────────────────────────
  // PROJECTS - Floating Browser Frames
  // ────────────────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawProjects = function (ctx, W, H, dt) {
    var frames = this.projectState.frames;
    for (var i = 0; i < frames.length; i++) {
      var f  = frames[i];
      var fx = f.baseX * W + Math.sin(this.t * f.freqX * TWO_PI + f.phaseX) * f.ampX;
      var fy = f.baseY * H + Math.sin(this.t * f.freqY * TWO_PI + f.phaseY) * f.ampY;
      var x  = fx - f.w * 0.5;
      var y  = fy - f.h * 0.5;
      this._drawBrowserFrame(ctx, x, y, f.w, f.h, f.opacity);
    }
  };

  AnimatedHeroBackground.prototype._drawBrowserFrame = function (ctx, x, y, w, h, opacity) {
    var chromeH = 26;
    ctx.save();
    ctx.globalAlpha = opacity;

    // Chrome fill
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, w, chromeH);

    // Chrome border
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(x, y, w, chromeH);

    // Traffic light dots
    for (var d = 0; d < 3; d++) {
      ctx.beginPath();
      ctx.arc(x + 9 + d * 11, y + chromeH * 0.5, 3.5, 0, TWO_PI);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth   = 0.4;
      ctx.stroke();
    }

    // URL bar
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth   = 0.4;
    ctx.strokeRect(x + 48, y + 7, w - 58, 12);

    // Content area
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(x, y + chromeH, w, h - chromeH);

    // Content lines
    var lineW = [0.78, 0.52, 0.68, 0.38];
    for (var l = 0; l < 4; l++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + chromeH + 14 + l * 15);
      ctx.lineTo(x + 10 + w * lineW[l], y + chromeH + 14 + l * 15);
      ctx.stroke();
    }

    // Inner image placeholder
    if (h > 160) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth   = 0.4;
      ctx.strokeRect(x + 10, y + chromeH + 76, w - 20, h - chromeH - 92);
    }

    // Top-left corner accent
    ctx.strokeStyle = 'rgba(173,198,255,0.8)';
    ctx.lineWidth   = 0.6;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 14);
    ctx.lineTo(x + 1, y + 1);
    ctx.lineTo(x + 14, y + 1);
    ctx.stroke();

    ctx.restore();
  };

  // ────────────────────────────────────────────────────────────────────────
  // PROCESS - Timeline Flow
  // ────────────────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawProcess = function (ctx, W, H, dt) {
    var state = this.processState;
    var nodes = state.nodes;

    // Trigger next node appearance
    if (state.nextNodeIdx < nodes.length && this.t >= state.nextNodeAt) {
      nodes[state.nextNodeIdx].appearedAt = this.t;
      state.nextNodeIdx++;
      state.nextNodeAt = this.t + rand(3.2, 4.8);
    }

    // Ghost baseline timeline
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 9]);
    ctx.beginPath();
    ctx.moveTo(nodes[0].x - 18, nodes[0].y);
    ctx.lineTo(nodes[nodes.length - 1].x + 18, nodes[nodes.length - 1].y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw connecting segments between appeared nodes
    for (var i = 0; i < nodes.length - 1; i++) {
      var n0 = nodes[i], n1 = nodes[i + 1];
      if (n0.appearedAt === null || n1.appearedAt === null) continue;
      var segAge  = this.t - n1.appearedAt;
      var segProg = easeInOut3(segAge / 1.5);
      var endX    = lerp(n0.x, n1.x, segProg);

      ctx.save();
      ctx.strokeStyle = 'rgba(173,198,255,0.4)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(n0.x, n0.y);
      ctx.lineTo(endX, n0.y);
      ctx.stroke();
      ctx.restore();
    }

    // Draw nodes
    for (var ni = 0; ni < nodes.length; ni++) {
      var node = nodes[ni];
      if (node.appearedAt === null) continue;
      var age   = this.t - node.appearedAt;
      var scale = easeOut3(Math.min(age / 0.55, 1));

      // Pulse ring
      var cycleDur = 3.8;
      var cyclePos = (age % cycleDur) / cycleDur;
      ctx.save();
      ctx.globalAlpha = (1 - cyclePos) * 0.20;
      ctx.strokeStyle = 'rgba(173,198,255,1)';
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.arc(node.x, node.y, (8 + cyclePos * 24) * scale, 0, TWO_PI);
      ctx.stroke();
      ctx.restore();

      // Outer ring
      ctx.save();
      ctx.globalAlpha = clamp(age / 0.55, 0, 1) * 0.38;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8 * scale, 0, TWO_PI);
      ctx.stroke();
      ctx.restore();

      // Inner dot
      ctx.save();
      ctx.globalAlpha = clamp(age / 0.35, 0, 1) * 0.88;
      ctx.fillStyle   = 'rgba(173,198,255,1)';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3 * scale, 0, TWO_PI);
      ctx.fill();
      ctx.restore();

      // Label
      ctx.save();
      ctx.globalAlpha = clamp(age / 1.2, 0, 1) * 0.40;
      ctx.fillStyle   = 'rgba(232,230,228,1)';
      ctx.font        = '500 10px Geist, "Geist Mono", monospace';
      ctx.textAlign   = 'center';
      ctx.fillText(node.label, node.x, node.y - 22);
      ctx.restore();
    }

    // Spawn packets on completed segments
    if (this.t >= state.nextPacketCheckAt) {
      var completedSegs = [];
      for (var ci = 0; ci < nodes.length - 1; ci++) {
        var cn0 = nodes[ci], cn1 = nodes[ci + 1];
        if (cn0.appearedAt !== null && cn1.appearedAt !== null &&
            this.t - cn1.appearedAt > 1.7) {
          completedSegs.push(ci);
        }
      }
      if (completedSegs.length > 0) {
        var segIdx = completedSegs[Math.floor(rand(0, completedSegs.length))];
        state.packets.push({ segIdx: segIdx, progress: 0, speed: rand(0.14, 0.28) });
      }
      state.nextPacketCheckAt = this.t + rand(1.4, 2.8);
    }

    // Update and draw packets
    var alivePackets = [];
    for (var pi = 0; pi < state.packets.length; pi++) {
      var pkt = state.packets[pi];
      pkt.progress += dt * pkt.speed;
      if (pkt.progress >= 1) continue;
      var pn0 = nodes[pkt.segIdx];
      var pn1 = nodes[pkt.segIdx + 1];
      var px  = lerp(pn0.x, pn1.x, pkt.progress);
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.fillStyle   = 'rgba(173,198,255,1)';
      ctx.beginPath();
      ctx.arc(px, pn0.y, 2.5, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
      alivePackets.push(pkt);
    }
    state.packets = alivePackets;
  };

  // ────────────────────────────────────────────────────────────────────────
  // ABOUT - Design Studio Grid
  // ────────────────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawAbout = function (ctx, W, H, dt) {
    // Fine 40px grid
    this._drawGrid(ctx, W, H, 40);

    // Measurement ticks at every 160px intersection
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    for (var tx = 0; tx <= W; tx += 160) {
      for (var ty = 0; ty <= H; ty += 160) {
        ctx.moveTo(tx - 5, ty);
        ctx.lineTo(tx + 5, ty);
        ctx.moveTo(tx, ty - 5);
        ctx.lineTo(tx, ty + 5);
      }
    }
    ctx.stroke();
    ctx.restore();

    // 3 diagonal rays (subtler than shared beams)
    if (!this.isMobile) {
      ctx.save();
      for (var ri = 0; ri < this.aboutState.rays.length; ri++) {
        var ray  = this.aboutState.rays[ri];
        var ang  = ray.angleDeg * Math.PI / 180;
        var pos  = ((this.t / ray.period) + ray.offset) % 1.0;
        var rcx  = -W * 0.2 + W * 1.4 * pos;
        var rw   = W * ray.widthFrac;
        var rh   = H * 3.5;

        ctx.save();
        ctx.translate(rcx, H * 0.5);
        ctx.rotate(ang);

        var grad = ctx.createLinearGradient(-rw, 0, rw, 0);
        grad.addColorStop(0,   'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.012)');
        grad.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-rw, -rh / 2, rw * 2, rh);
        ctx.restore();
      }
      ctx.restore();
    }

    // Abstract geometric shapes
    for (var si = 0; si < this.aboutState.shapes.length; si++) {
      var s   = this.aboutState.shapes[si];
      var sx  = s.baseX * W + Math.sin(this.t * s.freqX * TWO_PI + s.phaseX) * s.ampX;
      var sy  = s.baseY * H + Math.sin(this.t * s.freqY * TWO_PI + s.phaseY) * s.ampY;
      var rot = s.angle + this.t * s.rotSpeed;
      var sz  = s.size * 0.5;

      ctx.save();
      ctx.globalAlpha = s.opacity;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth   = 0.5;
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.beginPath();

      if (s.type === 'circle') {
        ctx.arc(0, 0, sz, 0, TWO_PI);
        ctx.stroke();
      } else if (s.type === 'triangle') {
        for (var v = 0; v < 3; v++) {
          var va = (v / 3) * TWO_PI - Math.PI / 2;
          var vx = Math.cos(va) * sz;
          var vy = Math.sin(va) * sz;
          if (v === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.moveTo(-sz, 0);
        ctx.lineTo(sz, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // CONTACT - Network Graph
  // ────────────────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._drawContact = function (ctx, W, H, dt) {
    var state = this.contactState;
    var nodes = state.nodes;
    var edges = state.edges;

    // Compute actual positions from normalized coords
    var positions = [];
    for (var ni = 0; ni < nodes.length; ni++) {
      positions.push({
        x: nodes[ni].baseX * W,
        y: nodes[ni].baseY * H,
        isPulsing:  nodes[ni].isPulsing,
        pulsePhase: nodes[ni].pulsePhase,
        pulseSpeed: nodes[ni].pulseSpeed,
      });
    }

    // Draw edges
    ctx.save();
    ctx.strokeStyle = 'rgba(173,198,255,1)';
    ctx.lineWidth   = 0.5;
    for (var ei = 0; ei < edges.length; ei++) {
      var from = positions[edges[ei].from];
      var to   = positions[edges[ei].to];
      ctx.globalAlpha = 0.07;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    ctx.restore();

    // Update and draw packets on edges
    for (var epi = 0; epi < edges.length; epi++) {
      var edge = edges[epi];
      if (this.t >= edge.nextPacketAt) {
        edge.packets.push({ progress: 0, speed: rand(0.18, 0.45) });
        edge.nextPacketAt = this.t + rand(3.0, 7.5);
      }
      var alive = [];
      for (var pki = 0; pki < edge.packets.length; pki++) {
        var pkt = edge.packets[pki];
        pkt.progress += dt * pkt.speed;
        if (pkt.progress >= 1) continue;
        var efrom = positions[edge.from];
        var eto   = positions[edge.to];
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.fillStyle   = 'rgba(173,198,255,1)';
        ctx.beginPath();
        ctx.arc(
          lerp(efrom.x, eto.x, pkt.progress),
          lerp(efrom.y, eto.y, pkt.progress),
          2, 0, TWO_PI
        );
        ctx.fill();
        ctx.restore();
        alive.push(pkt);
      }
      edge.packets = alive;
    }

    // Draw nodes
    for (var di = 0; di < positions.length; di++) {
      var pos = positions[di];

      // Pulse ring
      if (pos.isPulsing) {
        var cyclePos = ((this.t * pos.pulseSpeed + pos.pulsePhase / TWO_PI) % 1.0);
        ctx.save();
        ctx.globalAlpha = (1 - cyclePos) * 0.19;
        ctx.strokeStyle = 'rgba(173,198,255,1)';
        ctx.lineWidth   = 0.7;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4 + cyclePos * 22, 0, TWO_PI);
        ctx.stroke();
        ctx.restore();
      }

      // Outer ring
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = 'rgba(173,198,255,1)';
      ctx.lineWidth   = 0.6;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, TWO_PI);
      ctx.stroke();
      ctx.restore();

      // Inner dot
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle   = 'rgba(173,198,255,1)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 1.5, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }

    // Ghost form fields (desktop only)
    if (!this.isMobile) {
      ctx.save();
      for (var fi = 0; fi < state.fields.length; fi++) {
        var f      = state.fields[fi];
        var alpha  = 0.045 + 0.032 * Math.sin(this.t * 0.5 + f.phase);
        var fAlpha = clamp(alpha, 0.01, 0.09);
        ctx.globalAlpha = fAlpha;
        ctx.strokeStyle  = 'rgba(255,255,255,1)';
        ctx.lineWidth    = 0.4;
        ctx.strokeRect(f.nx * W, f.ny * H, f.nw * W, f.nh * H);

        // Label line above
        ctx.globalAlpha = fAlpha * 0.65;
        ctx.fillStyle   = 'rgba(255,255,255,1)';
        ctx.fillRect(f.nx * W, f.ny * H - 10, f.nw * W * 0.4, 1);
      }
      ctx.restore();
    }
  };

  // ── Static Fallback (prefers-reduced-motion) ───────────────────────────
  AnimatedHeroBackground.prototype._drawStaticFallback = function () {
    var self = this;
    requestAnimationFrame(function () {
      var W  = self.W || (self.canvas.parentElement ? self.canvas.parentElement.offsetWidth : 1200);
      var H  = self.H || (self.canvas.parentElement ? self.canvas.parentElement.offsetHeight : 500);
      var cx = W * self.glowCx;
      var cy = H * self.glowCy;
      var r  = Math.max(W, H) * 0.65;
      var grad = self.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(173,198,255,0.04)');
      grad.addColorStop(1, 'rgba(173,198,255,0)');
      self.ctx.fillStyle = grad;
      self.ctx.fillRect(0, 0, W, H);
    });
  };

  // ── Destroy ────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype.destroy = function () {
    this._stopLoop();
    if (this._observer) this._observer.disconnect();
    window.removeEventListener('resize', this._onResize);
  };

  // ── Expose ────────────────────────────────────────────────────────────
  window.AnimatedHeroBackground = AnimatedHeroBackground;

}());
