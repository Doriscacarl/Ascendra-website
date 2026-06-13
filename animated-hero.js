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
      insights: [0.78, 0.28],
      home:     [0.72, 0.25],
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
      case 'services':  this._initServices();  break;
      case 'projects':  this._initProjects();  break;
      case 'process':   this._initProcess();   break;
      case 'about':     this._initAbout();     break;
      case 'contact':   this._initContact();   break;
      case 'insights':  this._initInsights();  break;
      case 'home':      this._initHome();      break;
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
      case 'services':  this._drawServices(ctx, W, H, dt); break;
      case 'projects':  this._drawProjects(ctx, W, H, dt); break;
      case 'process':   this._drawProcess (ctx, W, H, dt); break;
      case 'about':     this._drawAbout   (ctx, W, H, dt); break;
      case 'contact':   this._drawContact (ctx, W, H, dt); break;
      case 'insights':  this._drawInsights(ctx, W, H, dt); break;
      case 'home':      this._drawHome    (ctx, W, H, dt); break;
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

  // ────────────────────────────────────────────────────────────────────────
  // HOME - Digital System Being Engineered
  // ────────────────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._initHome = function () {
    this.homeState = {
      panels:       [],
      nextSpawnAt:  0.5,
      lines:        [],
      nextLineAt:   1.5,
    };
  };

  AnimatedHeroBackground.prototype._drawHome = function (ctx, W, H, dt) {
    var state     = this.homeState;
    var maxPanels = this.isMobile ? 3 : 7;
    var maxLines  = this.isMobile ? 0 : 5;

    if (this.t >= state.nextSpawnAt && state.panels.length < maxPanels) {
      state.panels.push(this._spawnHomePanel(W, H));
      state.nextSpawnAt = this.t + rand(3.5, 6.0);
    }

    if (!this.isMobile && this.t >= state.nextLineAt && state.lines.length < maxLines) {
      state.lines.push(this._spawnHomeLine(W, H));
      state.nextLineAt = this.t + rand(4.0, 7.0);
    }

    var alivePanels = [];
    for (var i = 0; i < state.panels.length; i++) {
      if (this._drawHomePanel(ctx, W, H, state.panels[i])) {
        alivePanels.push(state.panels[i]);
      }
    }
    state.panels = alivePanels;

    var aliveLines = [];
    for (var j = 0; j < state.lines.length; j++) {
      if (this._drawHomeLine(ctx, W, H, state.lines[j])) {
        aliveLines.push(state.lines[j]);
      }
    }
    state.lines = aliveLines;
  };

  AnimatedHeroBackground.prototype._spawnHomePanel = function (W, H) {
    var types = ['card', 'nav', 'stat', 'bracket'];
    var type  = types[Math.floor(rand(0, types.length))];
    var w, h;
    if (type === 'nav')     { w = rand(200, 320); h = rand(36, 52); }
    else if (type === 'stat')    { w = rand(100, 160); h = rand(80, 120); }
    else if (type === 'bracket') { w = rand(140, 220); h = rand(100, 160); }
    else                         { w = rand(160, 260); h = rand(110, 180); }

    var x, y, attempts = 0;
    do {
      x = rand(16, W - w - 16);
      y = rand(16, H - h - 16);
      attempts++;
    } while (!this.isMobile && x < W * 0.46 && y < H * 0.65 && attempts < 12);

    var edge = Math.floor(rand(0, 4));
    var slideX = 0, slideY = 0;
    if (edge === 0)      slideX = -24;
    else if (edge === 1) slideX =  24;
    else if (edge === 2) slideY = -18;
    else                 slideY =  18;

    return {
      x: x, y: y, w: w, h: h, type: type,
      bornAt:     this.t,
      fadeInDur:  rand(1.8, 2.8),
      visibleDur: rand(10, 18),
      fadeOutDur: rand(1.4, 2.2),
      slideX: slideX, slideY: slideY,
      isGold: Math.random() < 0.22,
    };
  };

  AnimatedHeroBackground.prototype._drawHomePanel = function (ctx, W, H, p) {
    var age       = this.t - p.bornAt;
    var totalLife = p.fadeInDur + p.visibleDur + p.fadeOutDur;
    if (age > totalLife) return false;

    var alpha;
    if (age < p.fadeInDur) {
      alpha = easeOut3(age / p.fadeInDur);
    } else if (age < p.fadeInDur + p.visibleDur) {
      alpha = 1;
    } else {
      alpha = 1 - easeOut3((age - p.fadeInDur - p.visibleDur) / p.fadeOutDur);
    }
    if (alpha <= 0) return false;

    var slideT = age < p.fadeInDur ? easeOut3(age / p.fadeInDur) : 1;
    var px = p.x + p.slideX * (1 - slideT);
    var py = p.y + p.slideY * (1 - slideT);
    var pw = p.w, ph = p.h;

    var base = alpha * 0.10;
    // Accent color RGB components
    var ar = p.isGold ? 196 : 173;
    var ag = p.isGold ? 165 : 198;
    var ab = p.isGold ? 100 : 255;

    ctx.save();

    if (p.type === 'card') {
      // Outer border
      ctx.globalAlpha = base;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, pw, ph);
      // Header fill
      ctx.globalAlpha = base * 0.6;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(px + 0.5, py + 0.5, pw - 1, 20);
      // Header separator
      ctx.globalAlpha = base;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.moveTo(px, py + 20); ctx.lineTo(px + pw, py + 20); ctx.stroke();
      // Data rows
      ctx.globalAlpha = base * 0.85;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(px + 10, py + 34); ctx.lineTo(px + 10 + pw * 0.62, py + 34); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 10, py + 48); ctx.lineTo(px + 10 + pw * 0.46, py + 48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 10, py + 62); ctx.lineTo(px + 10 + pw * 0.71, py + 62); ctx.stroke();
    } else if (p.type === 'nav') {
      // Full border
      ctx.globalAlpha = base;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, pw, ph);
      // Dot indicators
      for (var d = 0; d < 4; d++) {
        ctx.globalAlpha = base * 1.1;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(px + 12 + d * (pw - 24) / 3, py + ph * 0.5, 2, 0, TWO_PI);
        ctx.fill();
      }
    } else if (p.type === 'stat') {
      // Corner brackets
      var bLen = 12;
      ctx.globalAlpha = base * 1.2;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(px + bLen, py); ctx.lineTo(px, py); ctx.lineTo(px, py + bLen);
      ctx.moveTo(px + pw - bLen, py); ctx.lineTo(px + pw, py); ctx.lineTo(px + pw, py + bLen);
      ctx.moveTo(px, py + ph - bLen); ctx.lineTo(px, py + ph); ctx.lineTo(px + bLen, py + ph);
      ctx.moveTo(px + pw - bLen, py + ph); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px + pw, py + ph - bLen);
      ctx.stroke();
      // Number block + label line
      ctx.globalAlpha = base * 0.85;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(px + 16, py + 26); ctx.lineTo(px + 16 + pw * 0.55, py + 26); ctx.stroke();
      ctx.globalAlpha = base * 0.5;
      ctx.beginPath(); ctx.moveTo(px + 16, py + 44); ctx.lineTo(px + 16 + pw * 0.35, py + 44); ctx.stroke();
    } else {
      // Side bracket outlines
      var bLen2 = 14;
      ctx.globalAlpha = base;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(px + bLen2, py);  ctx.lineTo(px, py);  ctx.lineTo(px, py + ph);  ctx.lineTo(px + bLen2, py + ph);
      ctx.moveTo(px + pw - bLen2, py); ctx.lineTo(px + pw, py); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px + pw - bLen2, py + ph);
      ctx.stroke();
      // Content lines
      ctx.lineWidth = 0.7;
      var rows = Math.floor(ph / 18);
      for (var row = 0; row < Math.min(rows, 5); row++) {
        ctx.globalAlpha = base * (0.5 + 0.4 * Math.abs(Math.sin(row * 1.3 + p.bornAt)));
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.moveTo(px + 20, py + 16 + row * 16);
        ctx.lineTo(px + 20 + pw * (0.30 + Math.abs(Math.sin(row * 1.3 + p.bornAt)) * 0.35), py + 16 + row * 16);
        ctx.stroke();
      }
    }

    // Accent corner mark (top-right) using page accent color
    ctx.globalAlpha = base * 0.7;
    ctx.strokeStyle = 'rgba(' + ar + ',' + ag + ',' + ab + ',1)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(px + pw - 12, py + 1); ctx.lineTo(px + pw - 1, py + 1); ctx.lineTo(px + pw - 1, py + 12);
    ctx.stroke();

    // Pulsing accent dot — top-right corner
    var pulse = 0.5 + 0.5 * Math.sin(this.t * 1.8 + p.bornAt);
    ctx.globalAlpha = alpha * 0.5 * pulse;
    ctx.fillStyle = 'rgba(' + ar + ',' + ag + ',' + ab + ',1)';
    ctx.beginPath();
    ctx.arc(px + pw - 5, py + 5, 1.5, 0, TWO_PI);
    ctx.fill();

    ctx.restore();
    return true;
  };

  AnimatedHeroBackground.prototype._spawnHomeLine = function (W, H) {
    var x1, y1, attempts = 0;
    do {
      x1 = rand(W * 0.25, W * 0.95);
      y1 = rand(H * 0.05, H * 0.95);
      attempts++;
    } while (x1 < W * 0.46 && y1 < H * 0.65 && attempts < 10);

    var x2 = clamp(x1 + rand(-200, 200), 10, W - 10);
    var y2 = clamp(y1 + rand(-120, 120), 10, H - 10);

    return {
      x1: x1, y1: y1, x2: x2, y2: y2,
      bornAt:   this.t,
      traceDur: rand(2.0, 3.5),
      holdDur:  rand(4.0, 8.0),
      fadeDur:  rand(1.2, 2.0),
      isGold:   Math.random() < 0.25,
    };
  };

  AnimatedHeroBackground.prototype._drawHomeLine = function (ctx, W, H, ln) {
    var age       = this.t - ln.bornAt;
    var totalLife = ln.traceDur + ln.holdDur + ln.fadeDur;
    if (age > totalLife) return false;

    var alpha;
    if (age < ln.traceDur) {
      alpha = easeOut3(age / ln.traceDur);
    } else if (age < ln.traceDur + ln.holdDur) {
      alpha = 1;
    } else {
      alpha = 1 - easeOut3((age - ln.traceDur - ln.holdDur) / ln.fadeDur);
    }
    if (alpha <= 0) return false;

    var traceP = age < ln.traceDur ? easeOut3(age / ln.traceDur) : 1;
    var ex = ln.x1 + (ln.x2 - ln.x1) * traceP;
    var ey = ln.y1 + (ln.y2 - ln.y1) * traceP;

    var ar = ln.isGold ? 196 : 173;
    var ag = ln.isGold ? 165 : 198;
    var ab = ln.isGold ? 100 : 255;

    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = 'rgba(' + ar + ',' + ag + ',' + ab + ',0.35)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(ln.x1, ln.y1);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = 'rgba(' + ar + ',' + ag + ',' + ab + ',0.65)';
    ctx.beginPath(); ctx.arc(ex, ey, 1.5, 0, TWO_PI); ctx.fill();

    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = 'rgba(' + ar + ',' + ag + ',' + ab + ',0.35)';
    ctx.beginPath(); ctx.arc(ln.x1, ln.y1, 1.0, 0, TWO_PI); ctx.fill();

    ctx.restore();
    return true;
  };

  // ────────────────────────────────────────────────────────────────────────
  // SERVICES - Wireframe UI Panels Assembling (original)
  // ────────────────────────────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────────────────────────────
  // INSIGHTS - Analytics Intelligence
  // ────────────────────────────────────────────────────────────────────────
  AnimatedHeroBackground.prototype._initInsights = function () {
    var nodeCount = this.isMobile ? 7 : 13;
    var nodes = [];
    for (var i = 0; i < nodeCount; i++) {
      nodes.push({
        baseX:      rand(0.04, 0.96),
        baseY:      rand(0.06, 0.94),
        ampX:       rand(5, 15),
        ampY:       rand(4, 11),
        freqX:      rand(0.022, 0.065),
        freqY:      rand(0.018, 0.055),
        phaseX:     rand(0, TWO_PI),
        phaseY:     rand(0, TWO_PI),
        pulsePhase: rand(0, TWO_PI),
        r:          rand(1.2, 2.8),
        opacity:    rand(0.25, 0.60),
      });
    }

    var edges = [];
    var threshold = this.isMobile ? 0.52 : 0.42;
    for (var ii = 0; ii < nodes.length; ii++) {
      for (var jj = ii + 1; jj < nodes.length; jj++) {
        var dx = nodes[ii].baseX - nodes[jj].baseX;
        var dy = nodes[ii].baseY - nodes[jj].baseY;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
          edges.push({ from: ii, to: jj, opacity: rand(0.035, 0.085) });
        }
      }
    }

    var hotspots = [];
    var hCount = this.isMobile ? 2 : 3;
    for (var h = 0; h < hCount; h++) {
      hotspots.push({
        x:       rand(0.15, 0.85),
        y:       rand(0.15, 0.85),
        r:       rand(0.18, 0.32),
        opacity: rand(0.022, 0.048),
        phase:   rand(0, TWO_PI),
      });
    }

    var charts = [];
    if (!this.isMobile) {
      for (var c = 0; c < 2; c++) {
        var bars = [];
        for (var bb = 0; bb < 7; bb++) { bars.push(rand(0.25, 0.90)); }
        charts.push({
          x: rand(0.60, 0.84), y: rand(0.22, 0.50),
          w: 0.14, h: 0.13, bars: bars,
          opacity: rand(0.032, 0.060),
          phase:   rand(0, TWO_PI),
        });
      }
    }

    this.insightsState = { nodes: nodes, edges: edges, hotspots: hotspots, charts: charts };
  };

  AnimatedHeroBackground.prototype._drawInsights = function (ctx, W, H, dt) {
    var state = this.insightsState;

    // Warm heatmap zones
    this._drawInsightsHeatmap(ctx, W, H, state);

    // Compute floating node positions
    var positions = [];
    for (var i = 0; i < state.nodes.length; i++) {
      var n = state.nodes[i];
      positions.push({
        x:          n.baseX * W + Math.sin(this.t * n.freqX * TWO_PI + n.phaseX) * n.ampX,
        y:          n.baseY * H + Math.sin(this.t * n.freqY * TWO_PI + n.phaseY) * n.ampY,
        r:          n.r,
        opacity:    n.opacity,
        pulsePhase: n.pulsePhase,
      });
    }

    // Network connection lines
    ctx.save();
    for (var ei = 0; ei < state.edges.length; ei++) {
      var e    = state.edges[ei];
      var from = positions[e.from];
      var to   = positions[e.to];
      ctx.globalAlpha = e.opacity;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth   = 0.4;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    ctx.restore();

    // The hero graph line
    this._drawInsightsGraph(ctx, W, H, state);

    // Ghost bar charts (desktop only)
    if (!this.isMobile && state.charts.length > 0) {
      this._drawInsightsCharts(ctx, W, H, state);
    }

    // Intelligence nodes
    for (var ni = 0; ni < positions.length; ni++) {
      var pos   = positions[ni];
      var pulse = 0.5 + 0.5 * Math.sin(this.t * 0.75 + pos.pulsePhase);

      // Soft halo
      ctx.save();
      ctx.globalAlpha = pos.opacity * 0.18 * pulse;
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r + 5 + pulse * 7, 0, TWO_PI);
      ctx.stroke();
      ctx.restore();

      // Core dot
      ctx.save();
      ctx.globalAlpha = pos.opacity * (0.55 + 0.45 * pulse);
      ctx.fillStyle   = 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }
  };

  AnimatedHeroBackground.prototype._drawInsightsGraph = function (ctx, W, H, state) {
    // Sits in the lower portion of the hero, away from the headline text
    var graphTop    = H * 0.50;
    var graphBottom = H * 0.88;
    var graphH      = graphBottom - graphTop;
    var nPts        = this.isMobile ? 50 : 90;

    // Smooth organic waveform that scrolls from left to right
    var tScroll = this.t * 0.055;
    var pts = [];
    for (var i = 0; i <= nPts; i++) {
      var xFrac = i / nPts;
      var ph    = xFrac - tScroll;
      var y     = 0;
      y += 0.30 * Math.sin(ph * TWO_PI * 1.10);
      y += 0.18 * Math.sin(ph * TWO_PI * 2.30 + 1.20);
      y += 0.10 * Math.sin(ph * TWO_PI * 4.70 + 2.50);
      y += 0.06 * Math.sin(ph * TWO_PI * 8.00 + 0.70);
      var yNorm = clamp(0.5 + y * 0.58, 0.04, 0.96);
      pts.push({ x: xFrac * W, y: graphTop + yNorm * graphH });
    }

    var buildPath = function (context, points) {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (var pi = 1; pi < points.length - 1; pi++) {
        var mx = (points[pi].x + points[pi + 1].x) * 0.5;
        var my = (points[pi].y + points[pi + 1].y) * 0.5;
        context.quadraticCurveTo(points[pi].x, points[pi].y, mx, my);
      }
      context.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    };

    // Subtle area fill
    ctx.save();
    var fillGrad = ctx.createLinearGradient(0, graphTop, 0, graphBottom);
    fillGrad.addColorStop(0, 'rgba(212,175,115,0.055)');
    fillGrad.addColorStop(1, 'rgba(212,175,115,0)');
    ctx.fillStyle = fillGrad;
    buildPath(ctx, pts);
    ctx.lineTo(W, graphBottom);
    ctx.lineTo(0, graphBottom);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Outer champagne glow
    ctx.save();
    ctx.strokeStyle = 'rgba(212,175,115,0.07)';
    ctx.lineWidth   = 9;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.shadowBlur  = 18;
    ctx.shadowColor = 'rgba(212,175,115,0.28)';
    buildPath(ctx, pts);
    ctx.stroke();
    ctx.restore();

    // Mid glow
    ctx.save();
    ctx.strokeStyle = 'rgba(232,210,168,0.11)';
    ctx.lineWidth   = 3.5;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.shadowBlur  = 9;
    ctx.shadowColor = 'rgba(212,175,115,0.40)';
    buildPath(ctx, pts);
    ctx.stroke();
    ctx.restore();

    // Core line
    ctx.save();
    ctx.strokeStyle = 'rgba(240,225,195,0.22)';
    ctx.lineWidth   = 1.2;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    buildPath(ctx, pts);
    ctx.stroke();
    ctx.restore();

    // Live data dot traveling along the wave
    var dotFrac = ((this.t * 0.04) % 1.0);
    var dotIdx  = Math.min(Math.round(dotFrac * nPts), pts.length - 1);
    var dp      = pts[dotIdx];

    ctx.save();
    ctx.globalAlpha = 0.80;
    ctx.fillStyle   = 'rgba(232,210,168,1)';
    ctx.shadowBlur  = 14;
    ctx.shadowColor = 'rgba(212,175,115,1)';
    ctx.beginPath();
    ctx.arc(dp.x, dp.y, 2.8, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // Faint vertical drop line from dot
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.strokeStyle = 'rgba(212,175,115,1)';
    ctx.lineWidth   = 0.5;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(dp.x, dp.y + 3);
    ctx.lineTo(dp.x, graphBottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  AnimatedHeroBackground.prototype._drawInsightsHeatmap = function (ctx, W, H, state) {
    for (var i = 0; i < state.hotspots.length; i++) {
      var hs    = state.hotspots[i];
      var pulse = 0.5 + 0.5 * Math.sin(this.t * 0.28 + hs.phase);
      var r     = (hs.r + pulse * 0.04) * Math.max(W, H);
      var cx    = hs.x * W;
      var cy    = hs.y * H;
      var a     = hs.opacity * (0.65 + 0.35 * pulse);

      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0,    'rgba(190,155,90,' + a + ')');
      grad.addColorStop(0.45, 'rgba(190,155,90,' + (a * 0.25) + ')');
      grad.addColorStop(1,    'rgba(190,155,90,0)');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  };

  AnimatedHeroBackground.prototype._drawInsightsCharts = function (ctx, W, H, state) {
    for (var i = 0; i < state.charts.length; i++) {
      var ch    = state.charts[i];
      var pulse = 0.5 + 0.5 * Math.sin(this.t * 0.28 + ch.phase);
      var alpha = ch.opacity * (0.55 + 0.45 * pulse);
      var cX    = ch.x * W;
      var cY    = ch.y * H;
      var cW    = ch.w * W;
      var cH    = ch.h * H;
      var gap   = cW / ch.bars.length;
      var bW    = gap * 0.55;

      ctx.save();
      ctx.globalAlpha = alpha;

      for (var b = 0; b < ch.bars.length; b++) {
        var bH = ch.bars[b] * cH * (0.80 + 0.20 * Math.sin(this.t * 0.35 + b * 1.1 + ch.phase));
        ctx.fillStyle = 'rgba(255,255,255,0.60)';
        ctx.fillRect(cX + b * gap + gap * 0.22, cY + cH - bH, bW, bH);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth   = 0.4;
      ctx.beginPath();
      ctx.moveTo(cX, cY + cH);
      ctx.lineTo(cX + cW, cY + cH);
      ctx.stroke();

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
