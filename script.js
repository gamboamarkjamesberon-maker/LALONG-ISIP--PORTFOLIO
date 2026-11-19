(() => {
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const aura = document.getElementById('pointer-aura');
  const dot = document.getElementById('pointer-dot');
  const dockBtns = document.querySelectorAll('.dock-btn');

  let w = 0;
  let h = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const cursor = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    tx: window.innerWidth * 0.5,
    ty: window.innerHeight * 0.5,
    vx: 0,
    vy: 0,
    ripple: 0
  };

  let mode = 'aurora'; // 'aurora' | 'constellation' | 'prism' | 'binary'
  let t = 0;

  let ribbons = [];
  let stars = [];
  let rings = [];
  let drops = [];
  const symbols = '01<>/{}[]#C*+~アイウエオカキクケコ';

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    setupConstellation();
    setupBinary();
  }

  // 1. AURORA SILK (Luminous Flowing Ribbons Following Cursor)
  function setupAurora() {
    ribbons = [];
    const colors = ['#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb7185'];
    for (let i = 0; i < 42; i++) {
      ribbons.push({
        angle: (i / 42) * Math.PI * 2,
        dist: 35 + (i % 9) * 26,
        speed: 0.012 + (i % 5) * 0.004,
        size: 2 + (i % 3) * 1.4,
        color: colors[i % colors.length],
        offset: i * 0.35
      });
    }
  }

  function drawAurora() {
    ctx.fillStyle = 'rgba(11, 8, 18, 0.14)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const glowR = 220 + cursor.ripple * 140;
    const g = ctx.createRadialGradient(cursor.x, cursor.y, 6, cursor.x, cursor.y, glowR);
    g.addColorStop(0, 'rgba(244, 114, 182, 0.28)');
    g.addColorStop(0.45, 'rgba(251, 191, 36, 0.14)');
    g.addColorStop(0.8, 'rgba(167, 139, 250, 0.06)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, glowR, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < ribbons.length; i++) {
      const r = ribbons[i];
      r.angle += r.speed * (1 + cursor.ripple * 2.5);
      const wave = Math.sin(t * 2.5 + r.offset) * 38 + cursor.ripple * 90;
      const radius = r.dist + wave;

      const x = cursor.x + Math.cos(r.angle) * radius * 1.35;
      const y = cursor.y + Math.sin(r.angle * 1.5 + t) * radius * 0.75;

      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.arc(x, y, r.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 2. STARLIGHT GRID (Interactive Constellation Network)
  function setupConstellation() {
    stars = [];
    const count = Math.min(125, Math.max(50, Math.floor((w * h) / 14500)));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        r: 1.6 + Math.random() * 2.4
      });
    }
  }

  function drawConstellation() {
    ctx.fillStyle = '#0b0812';
    ctx.fillRect(0, 0, w, h);

    const linkDist = 140;
    const pointerRange = 230 + cursor.ripple * 130;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x += s.vx;
      s.y += s.vy;

      if (s.x < 0 || s.x > w) s.vx *= -1;
      if (s.y < 0 || s.y > h) s.vy *= -1;

      const dx = cursor.x - s.x;
      const dy = cursor.y - s.y;
      const dist = Math.hypot(dx, dy);

      if (dist < pointerRange && dist > 1) {
        const pull = (1 - dist / pointerRange) * (cursor.ripple > 0.1 ? -5 : 0.6);
        s.x += (dx / dist) * pull;
        s.y += (dy / dist) * pull;

        const alpha = (1 - dist / pointerRange) * 0.85;
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(cursor.x, cursor.y);
        ctx.stroke();
      }

      for (let j = i + 1; j < stars.length; j++) {
        const o = stars[j];
        const d = Math.hypot(s.x - o.x, s.y - o.y);
        if (d < linkDist) {
          const alpha = (1 - d / linkDist) * 0.3;
          ctx.strokeStyle = `rgba(244, 114, 182, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(o.x, o.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = dist < pointerRange ? '#fbbf24' : '#f472b6';
      ctx.beginPath();
      ctx.arc(s.x, s.y, dist < pointerRange ? s.r * 1.45 : s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. PRISM RIPPLE (Geometric Orbit Rings Trail)
  function drawPrism() {
    ctx.fillStyle = 'rgba(11, 8, 18, 0.18)';
    ctx.fillRect(0, 0, w, h);

    if (Math.hypot(cursor.vx, cursor.vy) > 1.2 || cursor.ripple > 0.2 || Math.random() > 0.72) {
      const palette = ['#f472b6', '#fbbf24', '#a78bfa', '#34d399'];
      rings.push({
        x: cursor.x,
        y: cursor.y,
        r: 8,
        maxR: 130 + cursor.ripple * 160,
        sides: 6,
        rot: t * 1.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 0.9
      });
    }

    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      ring.r += 2.6 + cursor.ripple * 3;
      ring.rot += 0.02;
      ring.alpha = 1 - ring.r / ring.maxR;

      if (ring.alpha <= 0) {
        rings.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(ring.x, ring.y);
      ctx.rotate(ring.rot);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = ring.alpha;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let s = 0; s <= ring.sides; s++) {
        const a = (s / ring.sides) * Math.PI * 2;
        const px = Math.cos(a) * ring.r;
        const py = Math.sin(a) * ring.r;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // 4. ROSE CODE RAIN (Interactive Pastel-Neon Code Stream)
  function setupBinary() {
    const size = 16;
    const cols = Math.ceil(w / size);
    drops = [];
    for (let i = 0; i < cols; i++) {
      drops[i] = Math.random() * -50;
    }
  }

  function drawBinary() {
    ctx.fillStyle = 'rgba(11, 8, 18, 0.15)';
    ctx.fillRect(0, 0, w, h);

    const size = 16;
    ctx.font = `600 ${size}px "Fira Code", monospace`;

    for (let i = 0; i < drops.length; i++) {
      const x = i * size;
      const y = drops[i] * size;
      const dist = Math.hypot(x - cursor.x, y - cursor.y);
      const near = dist < 175 + cursor.ripple * 110;

      const ch = symbols.charAt(Math.floor(Math.random() * symbols.length));
      if (near) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = Math.random() > 0.88 ? '#a78bfa' : '#f472b6';
        ctx.shadowBlur = 0;
      }

      ctx.fillText(ch, x, y);
      ctx.shadowBlur = 0;

      if (y > h && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += near ? 1.5 : 0.82;
    }
  }

  function setMode(nextMode) {
    mode = nextMode;
    dockBtns.forEach((b) => b.classList.toggle('active', b.dataset.mode === nextMode));
    const colors = {
      aurora: '#f472b6',
      constellation: '#fbbf24',
      prism: '#a78bfa',
      binary: '#34d399'
    };
    const c = colors[nextMode] || '#f472b6';
    dot.style.background = c;
    dot.style.boxShadow = `0 0 18px ${c}`;
    aura.style.background = `radial-gradient(circle, ${c}2e 0%, transparent 72%)`;

    ctx.fillStyle = '#0b0812';
    ctx.fillRect(0, 0, w, h);
  }

  dockBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setMode(btn.dataset.mode);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === '1') setMode('aurora');
    if (e.key === '2') setMode('constellation');
    if (e.key === '3') setMode('prism');
    if (e.key === '4') setMode('binary');
  });

  window.addEventListener('pointermove', (e) => {
    cursor.tx = e.clientX;
    cursor.ty = e.clientY;
  }, { passive: true });

  window.addEventListener('pointerdown', () => {
    cursor.ripple = 1;
    dot.style.transform = 'translate(-50%, -50%) scale(2.1)';
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    dot.style.transform = 'translate(-50%, -50%) scale(1)';
  }, { passive: true });

  function loop() {
    t += 0.016;
    const px = cursor.x;
    const py = cursor.y;
    cursor.x += (cursor.tx - cursor.x) * 0.16;
    cursor.y += (cursor.ty - cursor.y) * 0.16;
    cursor.vx = cursor.x - px;
    cursor.vy = cursor.y - py;
    cursor.ripple *= 0.92;

    aura.style.left = cursor.x + 'px';
    aura.style.top = cursor.y + 'px';
    dot.style.left = cursor.tx + 'px';
    dot.style.top = cursor.ty + 'px';

    if (mode === 'aurora') drawAurora();
    else if (mode === 'constellation') drawConstellation();
    else if (mode === 'prism') drawPrism();
    else if (mode === 'binary') drawBinary();

    requestAnimationFrame(loop);
  }

  // Certificate Modal
  const certs = {
    csharp: {
      title: 'C# Programming 1',
      date: 'Date issued: Nov. 10, 2026',
      body: 'in 1F3-ITC112-CSharp with a total score of 1285/1315.',
      id: 'Mindoro State University · Certificate #32736',
      link: 'https://minsu.codechum.com/certificates/32736'
    },
    clang: {
      title: 'C Programming 1',
      date: 'Date issued: Nov. 2, 2026',
      body: 'in 1F3-ITC112 with a total score of 1349/1365.',
      id: 'Mindoro State University · Certificate #32063',
      link: 'https://minsu.codechum.com/certificates/32063'
    }
  };

  const modal = document.getElementById('cert-modal');
  const cTitle = document.getElementById('c-title');
  const cDate = document.getElementById('c-date');
  const cBody = document.getElementById('c-body');
  const cId = document.getElementById('c-id');
  const cLink = document.getElementById('c-link');

  document.querySelectorAll('.cert-tile').forEach((tile) => {
    tile.addEventListener('click', () => {
      const item = certs[tile.dataset.cert];
      if (!item) return;
      cTitle.textContent = item.title;
      cDate.textContent = item.date;
      cBody.textContent = item.body;
      cId.textContent = item.id;
      cLink.href = item.link;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  function hideModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('close-x').addEventListener('click', hideModal);
  document.getElementById('modal-dim').addEventListener('click', hideModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });

  // Scroll Reveal & Active Rail Highlight
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));

  const sections = document.querySelectorAll('header[id], section[id]');
  const navLinks = document.querySelectorAll('.rail-link');
  window.addEventListener('scroll', () => {
    let current = 'hero';
    sections.forEach((sec) => {
      if (window.scrollY >= sec.offsetTop - 220) {
        current = sec.id;
      }
    });
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });

  window.addEventListener('resize', resize);
  resize();
  setupAurora();
  setMode('aurora');
  requestAnimationFrame(loop);
})();
