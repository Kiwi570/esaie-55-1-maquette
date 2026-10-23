/* Ésaïe 55:1 — page Nos projets */
(function () {
  'use strict';
  const E = window.ESAIE;
  const G = window.gsap;
  const { $, $$ } = E;
  const calme = E.calme;
  if (G && window.Flip) G.registerPlugin(Flip);

  /* ---------- Filtrer les 15 actions par axe (réarrangement animé) ---------- */
  function filtres() {
    const boutons = $$('[data-filtre]');
    const items = $$('[data-actions] .action');
    const compte = $('[data-compte-actions]');
    const libelle = $('[data-compte-libelle]');
    let apparitions = [];
    if (!boutons.length) return;
    function appliquer(axe, anime) {
      boutons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtre === axe)));
      // Au premier filtrage, on arrête les apparitions au défilement pour ne pas animer deux fois les cartes
      if (apparitions.length) {
        apparitions.forEach((t) => t.kill());
        apparitions = [];
        if (G) { G.killTweensOf(items); G.set(items, { clearProps: 'opacity,transform' }); }
      }
      const etat = anime && G && !calme ? Flip.getState(items) : null;
      let n = 0;
      items.forEach((it) => {
        const ok = axe === 'tous' || it.dataset.axe === axe;
        it.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      compte.textContent = n;
      if (libelle) libelle.textContent = n > 1 ? 'actions affichées' : 'action affichée';
      if (etat) {
        Flip.from(etat, {
          duration: 0.75, ease: 'power3.inOut', absolute: true, scale: true, nested: true,
          onEnter: (els) => G.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }),
          onLeave: (els) => G.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
          onComplete: () => ScrollTrigger.refresh()
        });
      }
    }
    boutons.forEach((b) => b.addEventListener('click', () => appliquer(b.dataset.filtre, true)));
    const m = location.hash.match(/^#axe-(\w+)$/);
    if (m && boutons.some((b) => b.dataset.filtre === m[1])) appliquer(m[1], false);
    if (!calme && G) {
      apparitions = ScrollTrigger.batch('[data-actions] .action', {
        start: 'top 92%', once: true,
        onEnter: (els) => G.from(els, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.07 })
      });
    }
  }

  /* ---------- Plantations solidaires : les semences germent ---------- */
  function semences() {
    const svg = $('[data-semences]');
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const pousses = [];
    const xs = [40, 92, 150, 206, 268, 330, 386, 448, 506, 560];
    xs.forEach((x, i) => {
      const h = 46 + ((i * 37) % 5) * 14;
      const pench = (i % 2 ? 1 : -1) * (6 + (i % 3) * 4);
      const g = document.createElementNS(NS, 'g');
      const tige = document.createElementNS(NS, 'path');
      const y0 = 184;
      tige.setAttribute('d', `M${x} ${y0} C${x} ${y0 - h * 0.4} ${x + pench} ${y0 - h * 0.7} ${x + pench * 0.6} ${y0 - h}`);
      tige.setAttribute('class', 'tige');
      const top = { x: x + pench * 0.6, y: y0 - h };
      const feuille = (sens, k) => {
        const f = document.createElementNS(NS, 'path');
        const lx = top.x, ly = top.y + k;
        f.setAttribute('d', `M${lx} ${ly} C${lx + 10 * sens} ${ly - 14} ${lx + 26 * sens} ${ly - 10} ${lx + 30 * sens} ${ly - 2} C${lx + 22 * sens} ${ly + 6} ${lx + 8 * sens} ${ly + 6} ${lx} ${ly} Z`);
        f.setAttribute('class', 'feuille' + (i % 4 === 1 && sens > 0 ? ' feuille--or' : ''));
        f.style.transformOrigin = sens > 0 ? '0% 50%' : '100% 50%';
        return f;
      };
      const f1 = feuille(1, 4), f2 = feuille(-1, 14);
      g.append(tige, f1, f2);
      svg.appendChild(g);
      pousses.push({ tige, feuilles: [f1, f2] });
    });
    if (calme || !G) return;
    const tl = G.timeline({ scrollTrigger: { trigger: '.plantations__visuel', start: 'top 80%', end: 'bottom 50%', scrub: 0.8 } });
    pousses.forEach((p, i) => {
      const L = p.tige.getTotalLength();
      G.set(p.tige, { strokeDasharray: L, strokeDashoffset: L });
      G.set(p.feuilles, { scale: 0 });
      tl.to(p.tige, { strokeDashoffset: 0, duration: 1, ease: 'none' }, i * 0.18)
        .to(p.feuilles, { scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.1 }, i * 0.18 + 0.7);
    });
    G.fromTo('.plantations__img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#plantations', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- Projets urgents : accordéon ---------- */
  function urgents() {
    const blocs = $$('[data-urgent]');
    blocs.forEach((b, i) => {
      const bouton = $('.urgent__bouton', b);
      const corps = $('.urgent__corps', b);
      const ouvrir = (o, anime) => {
        bouton.setAttribute('aria-expanded', String(o));
        if (!anime || calme || !G) { corps.hidden = !o; window.ScrollTrigger && ScrollTrigger.refresh(); return; }
        if (o) {
          corps.hidden = false;
          G.fromTo(corps, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.7, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
        } else {
          G.to(corps, { height: 0, opacity: 0, duration: 0.5, ease: 'power3.inOut', onComplete: () => { corps.hidden = true; G.set(corps, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); } });
        }
      };
      ouvrir(i === 0, false);
      bouton.addEventListener('click', () => ouvrir(bouton.getAttribute('aria-expanded') !== 'true', true));
    });
  }

  /* ---------- Transparence : les lignes du registre se tracent ---------- */
  function registre() {
    if (calme || !G) return;
    $$('[data-registre] .registre__ligne').forEach((l, i) => {
      G.fromTo(l, { '--trace': 0 }, { '--trace': 1, duration: 1.4, ease: 'expo.out', delay: i * 0.08, scrollTrigger: { trigger: '[data-registre]', start: 'top 80%', once: true } });
    });
  }

  document.addEventListener('DOMContentLoaded', () => { filtres(); semences(); urgents(); registre(); });
})();
