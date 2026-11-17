(() => {
  const root = document.documentElement;
  const body = document.body;
  const hdr = document.querySelector('.hdr');
  const hero = document.querySelector('.hero');
  const contact = document.getElementById('contact');
  const menu = document.querySelector('.hdr-menu');
  const nav = document.querySelector('.hdr-nav');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Intro plays once per visit
  const intro = document.querySelector('.intro');
  if (intro && !root.classList.contains('no-intro')) {
    intro.addEventListener('animationend', e => { if (e.animationName === 'intro-up') intro.remove(); });
    try { sessionStorage.setItem('sd-intro', '1'); } catch (e) {}
  }

  // Header: logo hidden over the opening, light text over the green contact block
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const h = hdr.offsetHeight;
    body.classList.toggle('is-top', !!hero && hero.getBoundingClientRect().bottom > h * 2);
    body.classList.toggle('on-green', !!contact && contact.getBoundingClientRect().top < h / 2);
  };
  onScroll();
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);

  // Phone menu
  const setMenu = open => {
    body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'Close' : 'Menu';
  };
  menu.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Section in view marked in the header
  const links = [...nav.querySelectorAll('a')];
  const byId = Object.fromEntries(links.map(a => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    const a = byId[e.target.id];
    if (a && e.isIntersecting) { links.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(byId).forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });

  // Opening slides
  const slides = [...document.querySelectorAll('.hero-slides figure')];
  const cap = document.querySelector('.hero-cap');
  if (slides.length > 1 && !still) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      slides[i].classList.remove('is-on');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-on');
      cap.style.opacity = 0;
      setTimeout(() => { cap.textContent = slides[i].dataset.cap; cap.style.opacity = 1; }, 400);
    }, 5500);
  }

  // Reveal on scroll
  const rv = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); rv.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach(el => rv.observe(el));

  // Images fade in once loaded
  document.querySelectorAll('figure img').forEach(img => {
    const show = () => img.classList.add('is-in');
    if (img.complete && img.naturalWidth) show();
    else { img.addEventListener('load', show, { once: true }); img.addEventListener('error', show, { once: true }); }
  });

  // Project pages slide in from the right; the address bar follows (#signal etc.)
  const panels = Object.fromEntries([...document.querySelectorAll('dialog.panel')].map(d => [d.id, d]));
  let current = null;
  const open = id => {
    const d = panels[id];
    if (!d || d === current) return;
    if (current) { current.classList.remove('is-open'); current.close(); }
    d.scrollTop = 0;
    d.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-open')));
    body.classList.add('panel-open');
    current = d;
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  };
  const close = () => {
    const d = current;
    if (!d) return;
    current = null;
    d.classList.remove('is-open');
    body.classList.remove('panel-open');
    history.replaceState(null, '', location.pathname + location.search);
    const done = () => { if (current !== d && d.open) d.close(); };
    if (still) return done();
    const onEnd = e => { if (e.target === d && e.propertyName === 'transform') { d.removeEventListener('transitionend', onEnd); done(); } };
    d.addEventListener('transitionend', onEnd);
    setTimeout(done, 900); // fallback if the transition does not fire
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open]');
    if (t && panels[t.dataset.open]) { e.preventDefault(); open(t.dataset.open); }
  });
  Object.values(panels).forEach(d => {
    d.querySelector('.panel-close').addEventListener('click', close);
    d.addEventListener('cancel', e => { e.preventDefault(); close(); });
    d.addEventListener('click', e => { if (e.target === d) close(); }); // click on the backdrop
  });
  const fromHash = () => { const id = location.hash.slice(1); if (panels[id]) open(id); };
  addEventListener('hashchange', fromHash);
  fromHash();
})();
