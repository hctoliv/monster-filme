(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const ZAP = '5511932311327';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width:700px)').matches;

  /* loader */
  const loader = $('#loader'), fill = $('#loaderFill'), num = $('#loaderNum');
  let p = 0, ready = false;
  addEventListener('load', () => (ready = true));
  setTimeout(() => (ready = true), 3500);
  const tick = () => {
    p = Math.min(ready ? 100 : 88, p + (ready ? 4 : 1.4));
    fill.style.width = p + '%'; num.textContent = Math.round(p);
    if (p < 100) requestAnimationFrame(tick);
    else setTimeout(() => { loader.classList.add('done'); intro(); }, 220);
  };
  requestAnimationFrame(tick);

  /* header */
  const hd = $('#hd'); let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    hd.classList.toggle('scrolled', y > 40);
    hd.classList.toggle('hide', y > lastY && y > 500 && !hd.classList.contains('open'));
    lastY = y;
  }, { passive: true });
  $('#burger').addEventListener('click', () => {
    const o = hd.classList.toggle('open');
    $('#burger').setAttribute('aria-expanded', o);
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => hd.classList.remove('open')));

  /* hero: película clareia em volta do cursor */
  const hero = $('.hero'), tint = $('#heroTint');
  let tx = innerWidth * .62, ty = innerHeight * .42, cx = tx, cy = ty, r = 0, tr = mobile ? 0 : 230;
  hero.addEventListener('pointermove', e => {
    const b = hero.getBoundingClientRect(); tx = e.clientX - b.left; ty = e.clientY - b.top; tr = 260;
  });
  hero.addEventListener('pointerleave', () => (tr = 170));
  const t0 = performance.now();
  (function loop(now) {
    if (mobile) { // no celular a película "passa" sozinha
      const t = (now - t0) / 1000;
      tx = innerWidth * (.5 + .32 * Math.sin(t * .5)); ty = innerHeight * (.38 + .12 * Math.cos(t * .7)); tr = 150;
    }
    cx += (tx - cx) * .12; cy += (ty - cy) * .12; r += (tr - r) * .06;
    tint.style.setProperty('--x', cx + 'px'); tint.style.setProperty('--y', cy + 'px'); tint.style.setProperty('--r', r + 'px');
    requestAnimationFrame(loop);
  })(t0);

  /* manifesto palavra por palavra */
  const man = $('#manifesto');
  man.innerHTML = man.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = $$('.w', man);

  /* vídeos lazy: tocam só quando aparecem */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); }
    else v.pause();
  }), { rootMargin: '200px' });
  $$('video[data-lazy], .hero video').forEach(v => vio.observe(v));
  // iOS em modo pouca energia bloqueia autoplay: no primeiro toque, solta os vídeos que estão na tela
  const kick = () => $$('.hero video, video[data-lazy]').forEach(v => {
    const r = v.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight && v.paused && v.muted) v.play().catch(() => {});
  });
  ['touchend', 'click', 'scroll'].forEach(ev => addEventListener(ev, kick, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  /* monster club: cada plano abre o zap já com o plano escrito */
  $$('[data-plan]').forEach(b => b.addEventListener('click', () => {
    const msg = 'Oi Monster! Vi o site e quero entrar no Monster Club, plano ' + b.dataset.plan + '.';
    open('https://wa.me/' + ZAP + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  }));

  /* simulador */
  const notes = [
    [12, 'Bem fechado. Quase não se vê nada de fora, por dentro escurece mais à noite.'],
    [27, 'Privacidade boa de dia, visão tranquila por dentro.'],
    [42, 'Equilíbrio: corta calor e reflexo sem fechar muito.'],
    [60, 'Leve. Tira o brilho do sol e mantém o carro claro.'],
    [101, 'Quase transparente. Proteção UV e conforto sem mudar o visual.']
  ];
  const range = $('#simRange'), stepBtns = $$('#simSteps button');
  let film = 20;
  const setFilm = g => {
    film = g; range.value = g;
    const out = .94 - (g - 5) / 65 * .66;           // de fora: G5 quase preto, G70 ainda escurece um pouco
    const inn = .62 - (g - 5) / 65 * .5;            // de dentro: sempre mais claro
    $('#filmOut').style.opacity = out.toFixed(3);
    $('#filmIn').style.opacity = inn.toFixed(3);
    const near = [5, 20, 35, 50, 70].reduce((a, b) => Math.abs(b - g) < Math.abs(a - g) ? b : a);
    $('#simG').textContent = 'G' + g; $('#simPct').textContent = g;
    $('#simNote').textContent = notes.find(n => g < n[0])[1];
    stepBtns.forEach(b => { const on = +b.dataset.g === near && Math.abs(near - g) < 3; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    $('#osBar').style.opacity = out.toFixed(3);
  };
  range.addEventListener('input', () => setFilm(+range.value));
  stepBtns.forEach(b => b.addEventListener('click', () => setFilm(+b.dataset.g)));
  $('#simPick').addEventListener('click', () => {
    const near = [5, 20, 35, 50, 70].reduce((a, b) => Math.abs(b - film) < Math.abs(a - film) ? b : a);
    $('#fFilm').value = 'G' + near; check('Insulfilm'); renderOS();
  });
  setFilm(20);

  /* reels com som */
  $$('[data-reel]').forEach(ph => {
    const v = $('video', ph), b = $('.phone__play', ph);
    b.addEventListener('click', () => {
      if (v.paused) {
        $$('[data-reel] video').forEach(o => { if (o !== v) { o.pause(); o.closest('.phone').classList.remove('playing'); } });
        v.muted = false; v.preload = 'auto'; v.play(); ph.classList.add('playing');
      } else { v.pause(); ph.classList.remove('playing'); }
    });
  });

  /* contadores */
  const fmt = n => n.toLocaleString('pt-BR');
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, s = performance.now();
    (function f(t) { const k = Math.min(1, (t - s) / 1600); el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f); })(s);
  }), { threshold: .4 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* orçamento + ordem de serviço ao vivo */
  const form = $('#orcForm');
  const chosen = () => $$('#chips input:checked').map(i => i.value);
  const check = v => { const i = $$('#chips input').find(i => i.value === v); if (i) i.checked = true; };
  const renderOS = () => {
    $('#osNome').textContent = $('#fNome').value.trim() || '—';
    $('#osCarro').textContent = $('#fCarro').value.trim() || '—';
    const s = chosen(); $('#osSvc').textContent = s.length ? s.join(', ') : 'escolhe ao lado';
    const f = $('#fFilm').value; $('#osFilm').textContent = f || 'a definir';
    const g = parseInt(f.slice(1)) || 35;
    $('#osBar').style.opacity = (.95 - (g - 5) / 65 * .6).toFixed(3);
  };
  form.addEventListener('input', renderOS); form.addEventListener('change', renderOS);
  $$('[data-pick]').forEach(a => a.addEventListener('click', () => { check(a.dataset.pick); renderOS(); }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const s = chosen(), err = $('#orcErr');
    if (!s.length) { err.textContent = 'Escolhe pelo menos um serviço.'; return; }
    err.textContent = '';
    const nome = $('#fNome').value.trim(), carro = $('#fCarro').value.trim(), f = $('#fFilm').value, obs = $('#fObs').value.trim();
    const msg = [
      `Oi Monster! ${nome ? 'Aqui é ' + nome + '. ' : ''}Vi o site e quero um orçamento.`,
      `Serviço: ${s.join(', ')}`,
      carro && `Carro: ${carro}`,
      s.includes('Insulfilm') && f && `Película: ${f}`,
      obs && `Obs: ${obs}`
    ].filter(Boolean).join('\n');
    open(`https://wa.me/${ZAP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
  renderOS();

  /* animações com GSAP */
  function intro() {
    if (!window.gsap || reduce) return;
    gsap.from('.hero__title .line>span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .08 });
    gsap.from('.hero__kicker, .hero__foot', { opacity: 0, y: 24, duration: 1, delay: .45, ease: 'power3.out', stagger: .1 });
    gsap.from('.hero__reel', { clipPath: 'inset(100% 0 0 0)', duration: 1.3, ease: 'expo.inOut', stagger: .1 });
  }

  addEventListener('DOMContentLoaded', () => {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis && !reduce && !location.search.includes('nosmooth')) {
      const lenis = new Lenis({ lerp: .1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
        const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: 0 });
      }));
    }
    if (reduce) { words.forEach(w => w.classList.add('on')); return; }

    // hero: reels afundam e o título sobe ao rolar
    gsap.to('.hero__reels', { scale: 1.12, yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // manifesto
    ScrollTrigger.create({
      trigger: man, start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: s => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < n)); }
    });
    gsap.to('.manifesto__clip', { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top 70%', end: 'center center', scrub: true } });

    // serviços: faixa horizontal presa
    const mm = gsap.matchMedia();
    mm.add('(min-width:701px)', () => {
      const track = $('#svcTrack'), cards = $$('.svc', track);
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.servicos', start: 'top top', end: () => '+=' + dist(), pin: '.servicos__pin', scrub: .6, invalidateOnRefresh: true,
          onUpdate: s => { $('#svcNow').textContent = String(Math.min(cards.length, 1 + Math.floor(s.progress * cards.length * .999))).padStart(2, '0'); }
        }
      });
    });
    mm.add('(max-width:700px)', () => {
      $$('.svc').forEach(c => gsap.from(c, { y: 60, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
    });

    // R$ 99,90 sobe
    gsap.from('.net__price', { scale: .6, opacity: 0, duration: 1.1, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.net__price', start: 'top 85%' } });
    gsap.to('.net__marquee', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.net', start: 'top bottom', end: 'bottom top', scrub: true } });

    // telefones
    gsap.from('.phone', { y: 120, rotate: (i) => [-6, 0, 6][i], opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.phones', start: 'top 85%' } });

    // reveals genéricos
    $$('.h2, .sim__stage, .sim__ctrl, .os__card, .loja__addr, .loja__ctas, .ft__big').forEach(el =>
      gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));

    // garagem: carros sobem em cascata, colunas com velocidades diferentes
    mm.add('(min-width:701px)', () => {
      $$('.car').forEach((el, i) => gsap.fromTo(el, { y: 80 + (i % 3) * 50 }, { y: -(i % 3) * 30, ease: 'none', scrollTrigger: { trigger: '.garagem__grid', start: 'top bottom', end: 'bottom top', scrub: true } }));
    });
    gsap.from('.car', { opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: '.garagem__grid', start: 'top 85%' } });

    // ppf: vídeo abre de cima pra baixo como a película sendo puxada
    gsap.from('.ppf__media', { clipPath: 'inset(0 0 100% 0)', ease: 'none', scrollTrigger: { trigger: '.ppf', start: 'top 80%', end: 'top 20%', scrub: true } });
    gsap.from('.ppf__price b', { scale: .7, opacity: 0, duration: 1.1, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.ppf__price', start: 'top 85%' } });

    // arquitetônico, acessórios e club
    gsap.from('.arq__v', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.arq__wall', start: 'top 85%' } });
    gsap.from('.acc__chips li', { y: 20, opacity: 0, duration: .5, ease: 'power2.out', stagger: .03, scrollTrigger: { trigger: '.acc__chips', start: 'top 88%' } });
    gsap.from('.plan', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.plans', start: 'top 85%' } });

    // loja: vídeo abre como vitrine
    gsap.from('.loja__media', { clipPath: 'inset(0 100% 0 0)', ease: 'none', scrollTrigger: { trigger: '.loja', start: 'top 85%', end: 'top 25%', scrub: true } });
  });
})();
