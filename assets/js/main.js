/* Ésaïe 55:1 — comportements communs à toutes les pages */
(function () {
  'use strict';
  const html = document.documentElement;
  const E = (window.ESAIE = window.ESAIE || {});
  const calme = html.classList.contains('calme');
  const arriveeVague = html.classList.contains('vague-arrivee');
  const fin = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const G = window.gsap;
  E.calme = calme;
  E.fin = fin;
  E.$ = $; E.$$ = $$;

  // Promesse résolue par eau.js (effet d’eau WebGL) ; null si indisponible
  E.eauPret = new Promise((res) => { E._eauResoudre = res; setTimeout(() => res(null), 4000); });

  if (G) {
    G.registerPlugin(ScrollTrigger, SplitText);
    G.defaults({ ease: 'power3.out' });
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* ---------- Défilement fluide ---------- */
  let lenis = null;
  if (!calme && window.Lenis && G) {
    lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  E.lenis = lenis;
  E.allerA = function (cible, opts) {
    const el = typeof cible === 'string' ? $(cible) : cible;
    if (!el) return;
    const o = Object.assign({ offset: -84, duration: 1.5, focus: true }, opts || {});
    const focaliser = o.focus;
    delete o.focus;
    if (lenis) lenis.scrollTo(el, o);
    else {
      const y = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: y, behavior: calme ? 'auto' : 'smooth' });
    }
    // Le clavier suit le défilement : la prochaine tabulation part de la section atteinte
    if (focaliser) {
      if (!el.matches('a[href], button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  };

  /* ---------- Mode calme ---------- */
  $$('[data-calme]').forEach((b) => {
    b.setAttribute('aria-pressed', calme ? 'true' : 'false');
    b.addEventListener('click', () => {
      try { localStorage.setItem('esaie-calme', calme ? '0' : '1'); } catch (e) { /* stockage indisponible */ }
      // On retient la section affichée (et non la position brute, qui change avec les sections épinglées)
      const repere = $$('main [id], footer').find((s) => s.getBoundingClientRect().bottom > 90);
      if (repere) {
        const id = repere.id || '';
        const decalage = Math.round(90 - repere.getBoundingClientRect().top);
        try { sessionStorage.setItem('esaie-defil', JSON.stringify({ id, decalage })); } catch (e) { /* idem */ }
      }
      location.reload();
    });
  });
  try {
    const memo = JSON.parse(sessionStorage.getItem('esaie-defil') || 'null');
    if (memo) {
      sessionStorage.removeItem('esaie-defil');
      window.addEventListener('load', () => setTimeout(() => {
        const cible = memo.id ? document.getElementById(memo.id) : $('footer');
        if (!cible) return;
        const y = cible.getBoundingClientRect().top + window.scrollY - 90 + Math.max(0, memo.decalage);
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
      }, 60));
    }
  } catch (e) { /* idem */ }

  /* ---------- En-tête : fond, masquage, couleur selon la section ---------- */
  const entete = $('[data-entete]');
  const sections = $$('main [data-theme], footer[data-theme]');
  let dernierY = window.scrollY, menuOuvert = false, tickEntete = false;
  function majEntete() {
    tickEntete = false;
    const y = window.scrollY;
    entete.classList.toggle('est-defile', y > 30);
    // Masqué en descendant, réaffiché en remontant ; les petits mouvements de fin de défilement ne changent rien
    if (!menuOuvert && y > dernierY + 4 && y > 520) entete.classList.add('est-cache');
    else if (y < dernierY - 4 || y <= 520) entete.classList.remove('est-cache');
    if (Math.abs(y - dernierY) > 4 || y <= 520) dernierY = y;
    const ligne = 36;
    let theme = 'sombre';
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= ligne && r.bottom > ligne) { theme = s.dataset.theme; break; }
    }
    entete.classList.toggle('sur-clair', theme === 'clair' && !menuOuvert);
  }
  const demanderEntete = () => { if (!tickEntete) { tickEntete = true; requestAnimationFrame(majEntete); } };
  window.addEventListener('scroll', demanderEntete, { passive: true });
  lenis && lenis.on('scroll', demanderEntete);
  window.addEventListener('resize', demanderEntete);
  majEntete();

  /* ---------- Menu mobile ---------- */
  const boutonMenu = $('[data-menu]');
  const panneau = $('[data-menu-panneau]');
  function basculerMenu(ouvrir) {
    menuOuvert = ouvrir;
    boutonMenu.setAttribute('aria-expanded', String(ouvrir));
    boutonMenu.querySelector('.entete__menu-txt').textContent = ouvrir ? 'Fermer' : 'Menu';
    // Le reste de la page devient inerte tant que le menu est ouvert : la tabulation reste dans le menu
    $$('main, footer, [data-don-flottant]').forEach((el) => { el.inert = ouvrir; });
    if (ouvrir) {
      panneau.hidden = false;
      lenis && lenis.stop();
      document.body.style.overflow = 'hidden';
      entete.classList.remove('est-cache', 'sur-clair');
      if (G && !calme) {
        G.fromTo(panneau, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' });
        G.from($$('.menu-mobile__liens li', panneau), { yPercent: 60, opacity: 0, duration: 0.7, stagger: 0.05, delay: 0.1, ease: 'expo.out' });
      }
      const premier = $('a', panneau); premier && premier.focus({ preventScroll: true });
    } else {
      panneau.hidden = true;
      lenis && lenis.start();
      document.body.style.overflow = '';
      majEntete();
    }
    E.majDonFlottant && E.majDonFlottant();
  }
  boutonMenu && boutonMenu.addEventListener('click', () => basculerMenu(!menuOuvert));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOuvert) { basculerMenu(false); boutonMenu.focus(); }
  });
  panneau && panneau.addEventListener('click', (e) => { if (e.target.closest('a')) basculerMenu(false); });

  /* ---------- Curseur goutte et ondes au clic ---------- */
  if (fin && !calme && G) {
    const curseur = $('.curseur');
    const anneau = $('.curseur__anneau', curseur);
    const point = $('.curseur__point', curseur);
    const ax = G.quickTo(anneau, 'x', { duration: 0.5, ease: 'power3' });
    const ay = G.quickTo(anneau, 'y', { duration: 0.5, ease: 'power3' });
    const px = G.quickTo(point, 'x', { duration: 0.12, ease: 'power3' });
    const py = G.quickTo(point, 'y', { duration: 0.12, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      curseur.classList.remove('est-cache');
      ax(e.clientX); ay(e.clientY); px(e.clientX); py(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      curseur.classList.toggle('est-lien', !!e.target.closest('a, button, label, select, [data-tilt]'));
    });
    document.documentElement.addEventListener('pointerleave', () => curseur.classList.add('est-cache'));
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      const o = document.createElement('span');
      o.className = 'onde-clic';
      o.style.left = e.clientX + 'px'; o.style.top = e.clientY + 'px';
      document.body.appendChild(o);
      G.fromTo(o, { scale: 0.4, opacity: 1 }, { scale: 6, opacity: 0, duration: 0.9, ease: 'power2.out', onComplete: () => o.remove() });
    });
  }

  /* ---------- Boutons magnétiques ---------- */
  if (fin && !calme && G) {
    $$('.btn[data-magnet]').forEach((b) => {
      const s = $('span', b);
      const bx = G.quickTo(b, 'x', { duration: 0.6, ease: 'power3' });
      const by = G.quickTo(b, 'y', { duration: 0.6, ease: 'power3' });
      const sx = G.quickTo(s, 'x', { duration: 0.6, ease: 'power3' });
      const sy = G.quickTo(s, 'y', { duration: 0.6, ease: 'power3' });
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        bx(dx * 0.22); by(dy * 0.32); sx(dx * 0.1); sy(dy * 0.12);
      });
      b.addEventListener('pointerleave', () => { bx(0); by(0); sx(0); sy(0); });
    });
  }

  /* ---------- Cartes inclinées en 3D ---------- */
  if (fin && !calme && G) {
    $$('[data-tilt]').forEach((c) => {
      const cible = c.firstElementChild || c;
      const rx = G.quickTo(cible, 'rotationX', { duration: 0.7, ease: 'power3' });
      const ry = G.quickTo(cible, 'rotationY', { duration: 0.7, ease: 'power3' });
      G.set(cible, { transformPerspective: 900 });
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 12);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
      });
      c.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ---------- Vague de passage entre les pages ---------- */
  const vague = $('[data-vague]');
  const vagueSvg = vague && $('svg', vague);
  const vaguePath = vague && $('path', vague);
  function dessinerVague(p, t, montee) {
    const w = window.innerWidth, h = window.innerHeight;
    vagueSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const amp = Math.sin(Math.PI * Math.min(1, Math.max(0, p))) * Math.min(90, h * 0.1);
    const base = montee ? h * (1 - p) : h * (1 - p);
    const n = 28;
    let d = `M0 ${h + 2} L0 ${base.toFixed(1)}`;
    for (let i = 0; i <= n; i++) {
      const x = (w * i) / n;
      const y = base + Math.sin((i / n) * Math.PI * 2.2 + t * 3) * amp * 0.55 + Math.sin((i / n) * Math.PI * 5.1 - t * 4) * amp * 0.18 - amp * 0.3;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    d += ` L${w} ${h + 2} Z`;
    vaguePath.setAttribute('d', d);
  }
  function normaliser(p) { return p.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/'; }

  function partirVers(href) {
    if (calme || !G || !vague) { location.href = href; return; }
    vague.classList.add('est-active');
    const etat = { p: 0 };
    let parti = false;
    const partir = () => {
      if (parti) return;
      parti = true;
      try { sessionStorage.setItem('esaie-vague', '1'); } catch (e) { /* stockage indisponible */ }
      location.href = href;
    };
    // Filet de sécurité : sur un appareil lent, on ne fait jamais attendre la page suivante
    setTimeout(partir, 1100);
    G.to(etat, {
      p: 1, duration: 0.75, ease: 'power2.inOut',
      onUpdate: () => dessinerVague(etat.p, G.ticker.time, true),
      onComplete: partir
    });
  }
  function arriverVague() {
    if (!html.classList.contains('vague-arrivee') || !G || !vague) { html.classList.remove('vague-arrivee'); return; }
    vague.classList.add('est-active');
    dessinerVague(1, 0, false);
    html.classList.remove('vague-arrivee');
    const etat = { p: 1 };
    G.to(etat, {
      p: 0, duration: 1, ease: 'power2.inOut', delay: 0.05,
      onUpdate: () => dessinerVague(etat.p, G.ticker.time, false),
      onComplete: () => vague.classList.remove('est-active')
    });
  }
  arriverVague();
  window.addEventListener('pageshow', (e) => { if (e.persisted && vague) vague.classList.remove('est-active'); });

  /* ---------- Clics sur les liens : vague, ancres, préremplissages ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href);
    if (url.origin !== location.origin) return;
    if (a.dataset.objet) { const s = $('[data-objet-select]'); if (s) { s.value = a.dataset.objet; s.dispatchEvent(new Event('change', { bubbles: true })); } }
    if (a.dataset.affecter) { const s = $('[data-affectation]'); if (s) { s.value = a.dataset.affecter; s.dispatchEvent(new Event('change', { bubbles: true })); } }
    const memePage = normaliser(url.pathname) === normaliser(location.pathname);
    if (memePage && url.hash) {
      const cible = $(url.hash);
      if (cible) { e.preventDefault(); E.allerA(cible); history.replaceState(null, '', url.hash); }
      return;
    }
    if (!memePage) { e.preventDefault(); partirVers(url.href); }
  });

  /* ---------- Adresses propres sur le site en ligne (évite une redirection à chaque page) ---------- */
  const enLigne = /^https?:$/.test(location.protocol) && !/^(localhost|127\.|\[?::1)/.test(location.hostname) && !/claude/.test(location.hostname);
  if (enLigne) {
    $$('a[href]').forEach((a) => {
      const h = a.getAttribute('href');
      const m = h.match(/^(?:\/)?([\w-]+)\.html([?#].*)?$/);
      if (m) a.setAttribute('href', (m[1] === 'index' ? '/' : '/' + m[1]) + (m[2] || ''));
    });
  }
  // Préchargement de la page visée au survol ou au focus
  const prechargees = new Set();
  const precharger = (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    const url = new URL(a.href);
    if (url.origin !== location.origin || normaliser(url.pathname) === normaliser(location.pathname) || prechargees.has(url.pathname)) return;
    prechargees.add(url.pathname);
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url.pathname;
    document.head.appendChild(l);
  };
  document.addEventListener('pointerover', precharger, { passive: true });
  document.addEventListener('focusin', precharger);

  // Arrivée avec une ancre depuis une autre page
  if (location.hash && $(location.hash)) {
    window.addEventListener('load', () => setTimeout(() => E.allerA(location.hash, { immediate: false, duration: 1.2 }), 350));
  }

  /* ---------- Titres de section : lignes qui montent de l’eau ---------- */
  function animerTitres() {
    if (calme || !G) return;
    $$('.titre-section').forEach((t) => {
      SplitText.create(t, {
        type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'ligne',
        onSplit(self) {
          return G.from(self.lines, { yPercent: 112, duration: 1.15, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: t, start: 'top 88%', once: true } });
        }
      });
    });
  }

  /* ---------- Titre d’ouverture et parallaxe de l’ouverture ---------- */
  E.decouperTitreOuverture = function () {
    const t = $('[data-titre-ouverture]');
    if (!t || calme || !G) return null;
    return SplitText.create(t, { type: 'words,chars', mask: 'words', wordsClass: 'mot' });
  };
  E.animerTitreOuverture = function (split, delai) {
    if (!split) return;
    G.from(split.chars, { yPercent: 115, rotate: 4, duration: 1.25, ease: 'expo.out', stagger: 0.016, delay: delai || 0 });
    const suite = $$('.ouverture__ref, .ouverture__intro, .ouverture__actions, .ouverture__defiler, .ouverture__indice');
    G.from(suite, { y: 24, opacity: 0, duration: 1, stagger: 0.08, delay: (delai || 0) + 0.45 });
  };
  function parallaxeOuverture() {
    const o = $('.ouverture');
    if (!o || calme || !G) return;
    G.to('.ouverture__contenu', { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: o, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Reflets d’eau (pied de page, versets) ---------- */
  function animerReflets() {
    const bruit = $('[data-reflet-bruit]');
    // Animé seulement sur ordinateur : sur téléphone le reflet reste immobile pour économiser la batterie
    if (!bruit || calme || !G || !fin) return;
    let visibles = 0, compte = 0;
    const io = new IntersectionObserver((ent) => ent.forEach((x) => { visibles += x.isIntersecting ? 1 : -1; visibles = Math.max(0, visibles); }));
    $$('[data-reflet]').forEach((el) => io.observe(el));
    G.ticker.add((t) => {
      if (!visibles || (compte++ % 3)) return;
      bruit.setAttribute('baseFrequency', `${(0.003 + Math.sin(t * 0.7) * 0.0012).toFixed(4)} ${(0.05 + Math.sin(t * 1.3) * 0.014).toFixed(4)}`);
    });
  }

  /* ---------- Récipient d’eau qui se remplit ---------- */
  class Recipient {
    constructor(el) {
      this.el = el;
      this.c = $('canvas', el);
      this.ctx = this.c.getContext('2d');
      this.max = +el.dataset.max || 100;
      this.niveau = 0; this.cible = 0; this.agitation = 0.4; this.gouttes = [];
      this.sombre = el.hasAttribute('data-sombre') || !!el.closest('[data-theme="sombre"]') || !!el.closest('.formules__detail');
      this.visible = true;
      this.taille();
      new ResizeObserver(() => { this.taille(); this.dessiner(0); }).observe(el);
      new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }).observe(el);
      if (!calme && G) G.ticker.add((t, dt) => this.visible && this.dessiner(t, dt));
    }
    taille() {
      const r = this.el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(10, r.width); this.h = Math.max(10, r.height);
      this.c.width = this.w * dpr; this.c.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    valeur(v) {
      const f = Math.max(0, Math.min(1, v / this.max));
      if (Math.abs(f - this.cible) > 0.001 && !calme) this.gouttes.push({ y: -0.05, v: 0 });
      this.cible = f;
      if (calme || !G) { this.niveau = f; this.dessiner(0); }
    }
    forme(ctx) {
      const w = this.w, h = this.h;
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.03);
      ctx.lineTo(w * 0.66, h * 0.03);
      ctx.lineTo(w * 0.66, h * 0.13);
      ctx.bezierCurveTo(w * 0.66, h * 0.2, w * 0.95, h * 0.2, w * 0.95, h * 0.33);
      ctx.lineTo(w * 0.95, h * 0.88);
      ctx.quadraticCurveTo(w * 0.95, h * 0.98, w * 0.83, h * 0.98);
      ctx.lineTo(w * 0.17, h * 0.98);
      ctx.quadraticCurveTo(w * 0.05, h * 0.98, w * 0.05, h * 0.88);
      ctx.lineTo(w * 0.05, h * 0.33);
      ctx.bezierCurveTo(w * 0.05, h * 0.2, w * 0.34, h * 0.2, w * 0.34, h * 0.13);
      ctx.closePath();
    }
    dessiner(t, dt) {
      const ctx = this.ctx, w = this.w, h = this.h;
      const s = Math.min(0.1, (dt || 16) / 1000);
      if (!calme) this.niveau += (this.cible - this.niveau) * (1 - Math.exp(-s * 3.2));
      this.agitation += (0.35 - this.agitation) * (1 - Math.exp(-s * 1.8));
      const haut = h * 0.24, bas = h * 0.96;
      const surface = bas - (bas - haut) * this.niveau;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      this.forme(ctx);
      ctx.fillStyle = this.sombre ? 'rgba(238,244,241,0.06)' : 'rgba(19,41,58,0.05)';
      ctx.fill();
      ctx.clip();
      const amp = 3 + this.agitation * 6;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const y = surface + Math.sin(x * 0.045 + t * 2.2) * amp * 0.6 + Math.sin(x * 0.11 - t * 3.1) * amp * 0.25;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, surface, 0, h);
      g.addColorStop(0, '#3E98A8'); g.addColorStop(1, '#14394B');
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = surface + Math.sin(x * 0.045 + t * 2.2) * amp * 0.6 + Math.sin(x * 0.11 - t * 3.1) * amp * 0.25;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(242,213,154,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
      for (let i = this.gouttes.length - 1; i >= 0; i--) {
        const d = this.gouttes[i];
        d.v += 2.6 * s; d.y += d.v * s;
        const gy = d.y * h;
        if (gy >= surface) { this.gouttes.splice(i, 1); this.agitation = 1.6; continue; }
        ctx.beginPath(); ctx.fillStyle = '#E3B65C';
        ctx.arc(w / 2, gy, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      this.forme(ctx);
      ctx.strokeStyle = this.sombre ? 'rgba(238,244,241,0.55)' : 'rgba(19,41,58,0.35)';
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.4); ctx.lineTo(w * 0.14, h * 0.78);
      ctx.strokeStyle = this.sombre ? 'rgba(238,244,241,0.25)' : 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    }
  }
  E.Recipient = Recipient;

  /* ---------- Aides communes ---------- */
  // « a, b et c »
  E.liste = (arr) => (arr.length < 2 ? arr[0] || '' : arr.slice(0, -1).join(', ') + ' et ' + arr[arr.length - 1]);
  // Rend inerte tout le reste de la page pendant qu’une fenêtre est ouverte
  E.inerte = (actif, sauf) => { Array.from(document.body.children).forEach((el) => { if (el !== sauf && el.tagName !== 'SCRIPT') el.inert = actif; }); };

  /* ---------- Formats ---------- */
  const nf = new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 0 });
  E.montant = (v) => nf.format(v) + ' C$';

  /* ---------- Bouton de don flottant (téléphone) ---------- */
  function donFlottant() {
    const bouton = $('[data-don-flottant]');
    if (!bouton) return;
    const page = document.body.dataset.page;
    if (page === 'erreur') { bouton.remove(); return; }
    if (page === 'parrainage') { bouton.setAttribute('href', '#formules'); $('span', bouton).textContent = 'Choisir ma formule'; }
    const ouverture = $('.ouverture');
    const masques = $$(page === 'parrainage' ? '#formules, #inscription, .pied' : '#don, #contact, .pied');
    const visibles = new Set();
    let apresOuverture = false;
    const maj = () => bouton.classList.toggle('est-visible', apresOuverture && visibles.size === 0 && !menuOuvert);
    if (ouverture) new IntersectionObserver((e) => { apresOuverture = !e[0].isIntersecting; maj(); }).observe(ouverture);
    const io = new IntersectionObserver((ent) => { ent.forEach((x) => (x.isIntersecting ? visibles.add(x.target) : visibles.delete(x.target))); maj(); }, { rootMargin: '0px 0px -10% 0px' });
    masques.forEach((m) => io.observe(m));
    E.majDonFlottant = maj;
  }

  /* ---------- Démarrage ---------- */
  function demarrer() {
    donFlottant();
    animerTitres();
    parallaxeOuverture();
    animerReflets();
    if (!html.classList.contains('intro')) {
      const split = E.decouperTitreOuverture();
      E.animerTitreOuverture(split, arriveeVague ? 0.5 : 0.15);
    }
    if (G) {
      document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
      window.addEventListener('load', () => ScrollTrigger.refresh());
    }
  }
  E.demarrer = demarrer;
  document.addEventListener('DOMContentLoaded', () => { if (!E.demarrageManuel) demarrer(); });
})();
