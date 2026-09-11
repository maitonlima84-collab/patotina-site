/* ================================================================
   PATOTINA — interações e efeitos 💙🤍❤️
   ================================================================ */
(function () {
  'use strict';
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHATSAPP = '5534988658518';

  /* ---------- Preloader ---------- */
  function ready() {
    if (document.body.classList.contains('ready')) return;
    document.body.classList.add('ready');
    const l = $('#loader');
    if (l) { l.classList.add('done'); setTimeout(() => l.remove(), 700); }
  }
  window.addEventListener('load', () => setTimeout(ready, RM ? 0 : 1100));
  setTimeout(ready, 2600);

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 40);
    const h = document.documentElement;
    $('#progress').style.width = (scrollY / (h.scrollHeight - innerHeight) * 100) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger'), links = $('#nav-links');
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -40px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- Contadores ---------- */
  const fmt = n => n.toLocaleString('pt-BR');
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const end = +e.target.dataset.count, t0 = performance.now(), dur = 1500;
    const step = t => {
      const p = Math.min((t - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
      e.target.textContent = fmt(Math.round(end * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    RM ? e.target.textContent = fmt(end) : requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- Pré-matrícula → WhatsApp ---------- */
  /* Sem backend: a idade sugere a turma e o formulário vira uma mensagem
     pronta no WhatsApp do professor. O responsável confere e envia. */
  const form = $('#mform');
  if (form) {
    const idade = form.elements.idade, out = $('#turma-out');
    const turmaPor = n => {
      if (!n || n < 3) return null;
      if (n <= 6) return 'Fut Baby (4 a 6 anos) · sexta 18h · Campo do Clube';
      if (n <= 9) return 'Iniciação (7 a 9 anos) · segunda e sexta';
      if (n <= 14) return 'Formação (10 anos ou mais) · terça e sexta · Campo Raimundão';
      return 'Fale com o professor para ver a melhor opção';
    };
    idade.addEventListener('input', () => { out.value = turmaPor(+idade.value) || '—'; });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      ['crianca', 'idade', 'resp'].forEach(n => {
        const el = form.elements[n], bad = !el.value.trim();
        el.classList.toggle('err', bad);
        if (bad) ok = false;
      });
      if (!ok) { form.querySelector('.err').focus(); return; }
      const v = n => form.elements[n].value.trim();
      const linhas = [
        'Olá, Lucas! Quero fazer a pré-matrícula na Escolinha Patotina.',
        '',
        `👦 Criança: ${v('crianca')}`,
        `🎂 Idade: ${v('idade')} anos`,
        `⚽ Turma sugerida: ${turmaPor(+v('idade')) || '—'}`,
        `👤 Responsável: ${v('resp')}`
      ];
      if (v('obs')) linhas.push(`📝 Obs.: ${v('obs')}`);
      linhas.push('', 'Enviado pelo site 💙🤍❤️');
      open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
    });
  }

  /* ---------- Partículas (hero) ---------- */
  const pc = $('#particles');
  if (pc && !RM) {
    const ctx = pc.getContext('2d');
    let W, H, ps = [], run = true;
    const N = innerWidth < 700 ? 38 : 75;
    const resize = () => { W = pc.width = pc.offsetWidth; H = pc.height = pc.offsetHeight; };
    const mk = () => ({
      x: Math.random() * W, y: H + Math.random() * H * .3,
      r: .6 + Math.random() * 1.9, vy: .18 + Math.random() * .45,
      sway: Math.random() * 2 * Math.PI, sv: .004 + Math.random() * .012,
      a: .15 + Math.random() * .5, gold: Math.random() < .7
    });
    resize(); addEventListener('resize', resize);
    for (let i = 0; i < N; i++) { const p = mk(); p.y = Math.random() * H; ps.push(p); }
    (function loop(t) {
      requestAnimationFrame(loop);
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.y -= p.vy; p.sway += p.sv; p.x += Math.sin(p.sway) * .35;
        if (p.y < -8) Object.assign(p, mk());
        const tw = p.a * (0.7 + 0.3 * Math.sin(t * .002 + p.sway * 6));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = p.gold ? `rgba(232,176,24,${tw})` : `rgba(244,241,232,${tw * .8})`;
        ctx.shadowColor = p.gold ? 'rgba(232,176,24,.8)' : 'rgba(255,255,255,.6)';
        ctx.shadowBlur = p.r * 3; ctx.fill(); ctx.shadowBlur = 0;
      }
    })(0);
    new IntersectionObserver(es => run = es[0].isIntersecting).observe($('.hero'));
  }

  /* ---------- Brilho que segue o mouse ---------- */
  if (!RM && matchMedia('(pointer:fine)').matches) {
    const glow = $('#cursor-glow');
    let mx = -600, my = -600, gx = mx, gy = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; document.body.classList.add('has-mouse'); }, { passive: true });
    (function follow() {
      gx += (mx - gx) * .08; gy += (my - gy) * .08;
      glow.style.transform = `translate(${gx - 260}px,${gy - 260}px)`;
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- Brilho pelo giroscópio (celular) ---------- */
  if (!RM && matchMedia('(pointer:coarse)').matches) {
    const glow = $('#cursor-glow');
    let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my, base = null, running = false;
    const start = () => {
      if (running) return;
      running = true; document.body.classList.add('has-tilt');
      const r = (glow.offsetWidth || 520) / 2;
      (function follow() {
        gx += (mx - gx) * .08; gy += (my - gy) * .08;
        glow.style.transform = `translate(${gx - r}px,${gy - r}px)`;
        requestAnimationFrame(follow);
      })();
    };
    const MAX = 30, clamp = v => Math.max(-MAX, Math.min(MAX, v));
    const onTilt = e => {
      if (e.gamma == null || e.beta == null) return;
      if (!base) base = { g: e.gamma, b: e.beta };
      const dg = clamp(e.gamma - base.g), db = clamp(e.beta - base.b);
      mx = innerWidth / 2 + (dg / MAX) * innerWidth * .55;
      my = innerHeight / 2 + (db / MAX) * innerHeight * .40;
      start();
    };
    addEventListener('touchmove', e => { const t = e.touches && e.touches[0]; if (!t) return; mx = t.clientX; my = t.clientY; start(); }, { passive: true });
    const listen = () => addEventListener('deviceorientation', onTilt, { passive: true });
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      const ask = () => { removeEventListener('touchend', ask); DOE.requestPermission().then(r => { if (r === 'granted') listen(); }).catch(() => {}); };
      addEventListener('touchend', ask, { once: true, passive: true });
    } else if (DOE) listen();
    addEventListener('visibilitychange', () => { if (!document.hidden) base = null; });
  }

  /* ---------- Tilt 3D nos cards ---------- */
  if (!RM && matchMedia('(pointer:fine)').matches) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = `rotateY(${(px - .5) * 10}deg) rotateX(${(.5 - py) * 8}deg) translateY(-4px)`;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .5s cubic-bezier(.2,.75,.2,1)';
        card.style.transform = '';
        setTimeout(() => card.style.transition = '', 500);
      });
    });
  }

  /* ---------- Confete nos troféus 🏆 ---------- */
  const cvs = $('#confetti-canvas'), cctx = cvs.getContext('2d');
  let pieces = [], confRun = false;
  const sizeConf = () => { cvs.width = innerWidth; cvs.height = innerHeight; };
  sizeConf(); addEventListener('resize', sizeConf);
  const COLORS = ['#E8B018', '#F4F1E8', '#B8121A', '#002838', '#FFFFFF'];
  function burst(x, y) {
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * 2 * Math.PI, v = 4 + Math.random() * 9;
      pieces.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLORS[i % COLORS.length], life: 1 });
    }
    if (!confRun) { confRun = true; confLoop(); }
  }
  function confLoop() {
    cctx.clearRect(0, 0, cvs.width, cvs.height);
    pieces = pieces.filter(p => p.life > 0 && p.y < cvs.height + 20);
    for (const p of pieces) {
      p.vy += .22; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .004;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot);
      cctx.globalAlpha = Math.max(p.life, 0); cctx.fillStyle = p.c;
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cctx.restore();
    }
    if (pieces.length) requestAnimationFrame(confLoop);
    else { confRun = false; cctx.clearRect(0, 0, cvs.width, cvs.height); }
  }
  $$('[data-confetti]').forEach(el => el.addEventListener('click', e => {
    if (RM) return;
    const r = el.getBoundingClientRect();
    burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
  }));

  $('#ano').textContent = new Date().getFullYear();
})();
