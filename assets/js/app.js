/* ОБЪЁМ — поведение страницы. Без зависимостей. */
(() => {
  'use strict';
  const q  = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- языки ---------- */
  const after = [];
  const I = window.I18N;
  const ATTRS = ['alt', 'placeholder', 'aria-label', 'title'];
  let lang = 'ru';

  const snapshot = () => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeValue.trim() && !n.parentElement.closest('script, style')) {
        n.__src = n.nodeValue;
        nodes.push(n);
      }
    }
    const attrs = [];
    qa('[alt], [placeholder], [aria-label], [title]').forEach((el) => {
      ATTRS.forEach((a) => {
        const v = el.getAttribute(a);
        if (v && v.trim()) attrs.push({ el, a, src: v });
      });
    });
    return { nodes, attrs };
  };

  const snap = I ? snapshot() : null;
  const tr = (src) => {
    if (lang === 'ru' || !I) return src;
    const d = I.dict[lang] || {};
    const key = src.trim();
    const hit = d[key];
    if (hit !== undefined) return src.replace(key, hit);
    return src.includes('м²') ? src.replace(/м²/g, 'm²') : src;
  };

  const applyLang = (code, save = true) => {
    lang = code;
    document.documentElement.lang = code;
    snap.nodes.forEach((n) => (n.nodeValue = tr(n.__src)));
    snap.attrs.forEach(({ el, a, src }) => el.setAttribute(a, tr(src)));
    const m = I.meta[code] || I.meta.ru;
    document.title = m.title;
    const md = q('meta[name="description"]');
    if (md) md.content = m.desc;
    qa('.lang__cur').forEach((el) => (el.textContent = code.toUpperCase()));
    qa('[data-lang-switch] [role="option"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.code === code)));
    if (save) try { localStorage.setItem('obyom-lang', code); } catch (e) {}
    after.forEach((fn) => fn());
  };

  if (I) {
    qa('[data-lang-switch]').forEach((box) => {
      const list = q('.lang__list', box);
      list.innerHTML = I.langs.map((l) =>
        `<li><button type="button" role="option" data-code="${l.code}" aria-selected="${l.code === 'ru'}"><b>${l.label}</b><span>${l.name}</span></button></li>`).join('');
      const btn = q('.lang__btn', box);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const open = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!open));
          list.hidden = open;
        });
        document.addEventListener('click', () => { btn.setAttribute('aria-expanded', 'false'); list.hidden = true; });
      }
      list.addEventListener('click', (e) => {
        const b = e.target.closest('[data-code]');
        if (!b) return;
        applyLang(b.dataset.code);
        if (btn) { btn.setAttribute('aria-expanded', 'false'); list.hidden = true; }
      });
    });

    let start = 'ru';
    try { start = localStorage.getItem('obyom-lang') || ''; } catch (e) {}
    if (!start) {
      const nav = (navigator.language || 'ru').slice(0, 2);
      start = I.langs.some((l) => l.code === nav) ? nav : 'ru';
    }
    if (start !== 'ru') applyLang(start, false);
  }

  /* ---------- шапка ---------- */
  const head = q('.hd');
  const darks = qa('.dark, .calc');
  const onScroll = () => {
    head.classList.toggle('stuck', scrollY > 8);
    const mid = head.offsetHeight * 0.55;
    head.classList.toggle('hd--dark', darks.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    }));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- мобильное меню ---------- */
  const burger = q('.burger');
  const mnav = q('.menu');
  const setNav = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    mnav.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setNav(burger.getAttribute('aria-expanded') !== 'true'));
  mnav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mnav.hidden) { setNav(false); burger.focus(); } });

  /* ---------- появление блоков ---------- */
  const reveal = qa('.dark__h, .dark__grid, .fig__h, .fig__row, .team__h, .team__txt, .prs, .arch__h, .arch__grid > *, .proj__hd, .cd, .calc__txt, .form');
  if (!calm && 'IntersectionObserver' in window) {
    reveal.forEach((el) => el.classList.add('rv'));
    const io = new IntersectionObserver((rows) => {
      rows.forEach((row) => {
        if (!row.isIntersecting) return;
        const sibs = [...row.target.parentElement.children].filter((n) => n.classList.contains('rv'));
        row.target.style.transitionDelay = Math.min(sibs.indexOf(row.target), 4) * 70 + 'ms';
        row.target.classList.add('in');
        io.unobserve(row.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveal.forEach((el) => io.observe(el));
  }

  /* ---------- счётчики ---------- */
  const nums = qa('.num');
  if (nums.length && !calm && 'IntersectionObserver' in window) {
    nums.forEach((n) => (n.textContent = '0'));
    const io2 = new IntersectionObserver((rows) => {
      rows.forEach((row) => {
        if (!row.isIntersecting) return;
        const el = row.target;
        const to = +el.dataset.to;
        const t0 = performance.now();
        const tick = (t) => {
          const k = Math.min((t - t0) / 1100, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io2.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io2.observe(n));
  }

  /* ---------- параллакс дома в герое ---------- */
  const house = q('.hero__house');
  if (house && !calm) {
    let ticking = false;
    const move = () => {
      const y = Math.min(scrollY, innerHeight);
      house.style.translate = '0 ' + (y * -0.11).toFixed(1) + 'px';
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(move);
    }, { passive: true });
  }

  /* ---------- форма ---------- */
  const form = q('.form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = qa('input[required]', form).find((i) => !i.value.trim());
      if (bad) { bad.focus(); bad.reportValidity?.(); return; }
      q('.form__ok', form).hidden = false;
      q('.btn', form).textContent = tr('Отправлено');
      form.querySelectorAll('input').forEach((i) => (i.value = ''));
    });
  }
})();
