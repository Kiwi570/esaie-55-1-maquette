/* Ésaïe 55:1 — page d’accueil */
(function () {
  'use strict';
  const E = window.ESAIE;
  const G = window.gsap;
  const { $, $$ } = E;
  const html = document.documentElement;
  const calme = E.calme;

  /* ---------- 1. La goutte d’ouverture ---------- */
  function ouverture() {
    if (!html.classList.contains('intro') || !G) { html.classList.remove('intro'); return; }
    // L’ouverture complète ne se joue qu’une fois par visite
    try { sessionStorage.setItem('esaie-intro', '1'); } catch (e) { /* stockage indisponible */ }
    const voile = $('[data-goutte-intro]');
    const goutte = $('.goutte-intro__goutte', voile);
    const onde = $('.goutte-intro__onde', voile);
    const split = E.decouperTitreOuverture();
    if (split) G.set(split.chars, { yPercent: 115 });
    G.set('.ouverture__ref, .ouverture__intro, .ouverture__actions, .ouverture__defiler, .ouverture__indice', { opacity: 0 });
    const imgOuverture = $('.eau img');
    const imagePrete = imgOuverture && imgOuverture.decode ? imgOuverture.decode().catch(() => {}) : Promise.resolve();
    const delai = new Promise((r) => setTimeout(r, 1200));
    Promise.race([Promise.all([imagePrete, E.eauPret]), delai]).then(() => lancer(E.eau || null));

    function lancer(eau) {
      E.introLancee = true;
      const tl = G.timeline({ onComplete: () => { html.classList.remove('intro'); voile.remove(); } });
      tl.to(goutte, { y: window.innerHeight / 2 + 40, duration: 0.6, ease: 'power2.in' })
        .add(() => {
          if (eau) { eau.reveler(1.4); eau.goutte(0.5, 0.5, 2); }
        })
        .set(goutte, { opacity: 0 })
        .fromTo(onde, { scale: 0.2, opacity: 1 }, { scale: 16, opacity: 0, duration: 1.1, ease: 'power2.out' }, '<')
        .to(voile, { backgroundColor: 'rgba(12,31,44,0)', duration: eau ? 0.15 : 0.9, ease: 'power1.out' }, '<');
      tl.add(() => {
        if (split) G.to(split.chars, { yPercent: 0, rotate: 0, duration: 1.3, ease: 'expo.out', stagger: 0.018 });
        G.fromTo('.ouverture__ref, .ouverture__intro, .ouverture__actions, .ouverture__defiler, .ouverture__indice',
          { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08, delay: 0.5 });
      }, '<+0.15');
    }
  }

  /* ---------- 2. Bienvenue : les mots s’éclairent, l’image se révèle par un niveau d’eau ---------- */
  function bienvenue() {
    if (calme || !G) return;
    const titre = $('[data-eclaire]');
    if (titre) {
      SplitText.create(titre, {
        type: 'words', wordsClass: 'mot', autoSplit: true,
        onSplit(self) {
          return G.fromTo(self.words, { opacity: 0.22 }, { opacity: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: titre, start: 'top 82%', end: 'bottom 58%', scrub: true } });
        }
      });
    }
    const niveau = $('[data-niveau]');
    if (!niveau) return;
    const img = $('.niveau__img', niveau);
    const svg = $('.niveau__ligne', niveau);
    const ligne = $('[data-niveau-ligne]', niveau);
    let p = 0, actif = false;
    ScrollTrigger.create({
      trigger: niveau, start: 'top 88%', end: 'center 42%', scrub: true,
      onUpdate: (s) => { p = s.progress; },
      onToggle: (s) => { actif = s.isActive || (s.progress > 0 && s.progress < 1); }
    });
    G.set(img, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' });
    G.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: niveau, start: 'top bottom', end: 'bottom top', scrub: true } });
    let pLisse = 0, hNiveau = niveau.clientHeight;
    new ResizeObserver(() => { hNiveau = niveau.clientHeight; }).observe(niveau);
    G.ticker.add((t) => {
      pLisse += (p - pLisse) * 0.12;
      if (!actif && Math.abs(p - pLisse) < 0.0005 && (pLisse <= 0.0005 || pLisse >= 0.9995)) {
        if (pLisse >= 0.9995) { img.style.clipPath = 'none'; svg.style.opacity = 0; }
        return;
      }
      const nivo = (1 - pLisse) * 100;
      const amp = Math.sin(Math.PI * pLisse) * 3.2;
      const pts = [];
      const lig = [];
      for (let i = 0; i <= 20; i++) {
        const x = i * 5;
        const y = nivo + Math.sin(i / 20 * Math.PI * 2.4 + t * 2.4) * amp + Math.sin(i / 20 * Math.PI * 5 - t * 3.2) * amp * 0.35;
        pts.push(`${x}% ${y.toFixed(2)}%`);
        lig.push(`${i === 0 ? 'M' : 'L'}${x} ${(5 + (y - nivo) * 0.9).toFixed(2)}`);
      }
      img.style.clipPath = `polygon(${pts.join(',')}, 100% 100%, 0% 100%)`;
      svg.style.transform = `translateY(${(nivo / 100) * hNiveau - 13}px)`;
      svg.style.opacity = pLisse > 0.02 && pLisse < 0.98 ? 1 : 0;
      ligne.setAttribute('d', lig.join(' '));
    });
  }

  /* ---------- 3. Pour qui : lignes d’eau, image flottante au survol ---------- */
  function publics() {
    const liste = $('[data-publics]');
    if (!liste || !G) return;
    const items = $$('.public', liste);
    if (!calme) {
      items.forEach((li) => {
        G.from($('.public__trait', li), { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 90%', once: true } });
        G.from($('.public__nom', li), { yPercent: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 92%', once: true } });
      });
    }
    const flottant = $('[data-flottant]');
    if (!E.fin || calme || !flottant || getComputedStyle(flottant).display === 'none') return;
    const images = [];
    new IntersectionObserver((ent, obs) => {
      if (!ent[0].isIntersecting) return;
      obs.disconnect();
      items.forEach((li) => {
        const im = $('img', li).cloneNode();
        im.removeAttribute('loading');
        im.alt = '';
        im.style.opacity = 0;
        flottant.appendChild(im);
        images.push(im);
      });
    }, { rootMargin: '600px 0px' }).observe(liste);
    const fx = G.quickTo(flottant, 'x', { duration: 0.65, ease: 'power3' });
    const fy = G.quickTo(flottant, 'y', { duration: 0.65, ease: 'power3' });
    const fr = G.quickTo(flottant, 'rotation', { duration: 0.8, ease: 'power3' });
    let ancienX = 0;
    liste.addEventListener('pointermove', (e) => {
      fx(e.clientX + 40); fy(e.clientY);
      fr(Math.max(-14, Math.min(14, (e.clientX - ancienX) * 0.6)));
      ancienX = e.clientX;
    });
    liste.addEventListener('pointerenter', (e) => {
      G.set(flottant, { x: e.clientX + 40, y: e.clientY });
      G.to(flottant, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' });
    });
    liste.addEventListener('pointerleave', () => G.to(flottant, { opacity: 0, scale: 0.6, duration: 0.45 }));
    items.forEach((li, i) => li.addEventListener('pointerenter', () => images.forEach((im, j) => { im.style.opacity = i === j ? 1 : 0; })));
  }

  /* ---------- 4. Six axes : galerie horizontale épinglée ---------- */
  function axes() {
    const section = $('#mission');
    const piste = $('[data-piste]');
    const niveau = $('[data-niveau-piste]');
    if (!section || !piste || !niveau) return;
    // Défilement natif (téléphone, écran bas, mode calme) : la barre d’eau suit la position
    const majNatif = () => {
      const max = piste.scrollWidth - piste.clientWidth;
      if (max > 0) niveau.style.transform = `scaleX(${(piste.scrollLeft / max).toFixed(3)})`;
    };
    piste.addEventListener('scroll', majNatif, { passive: true });
    majNatif();
    if (calme || !G) return;
    const mm = G.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 700px)', () => {
      const distance = () => Math.max(0, piste.scrollWidth - window.innerWidth);
      const anim = G.to(piste, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: (s) => G.set(niveau, { scaleX: s.progress })
        }
      });
      // Clavier : amener à l’écran la carte qui reçoit le focus
      const surFocus = (e) => {
        const carte = e.target.closest('.axe-carte, .axes__fin');
        const st = anim.scrollTrigger;
        if (!carte || !st) return;
        const d = distance() || 1;
        const cible = Math.min(d, Math.max(0, carte.offsetLeft - (window.innerWidth - carte.offsetWidth) / 2));
        const y = st.start + (cible / d) * (st.end - st.start);
        if (E.lenis) E.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      };
      piste.addEventListener('focusin', surFocus);
      $$('.axe-carte', piste).forEach((carte) => {
        const im = $('img', carte);
        G.fromTo(im, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: carte, containerAnimation: anim, start: 'left right', end: 'right left', scrub: true } });
        G.from(carte, { y: 80, rotation: 3, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: carte, containerAnimation: anim, start: 'left 96%', once: true } });
      });
      return () => { piste.removeEventListener('focusin', surFocus); G.set(piste, { x: 0 }); };
    });
    G.from('.axes__chiffre', { textContent: 0, duration: 1.6, ease: 'power2.out', snap: { textContent: 1 }, scrollTrigger: { trigger: '.axes__compte', start: 'top 90%', once: true } });
  }

  /* ---------- 5. Le fil Ottawa – Libreville et les horloges ---------- */
  function gabon() {
    const fmt = (tz) => new Intl.DateTimeFormat('fr-CA', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
    const horloges = $$('[data-heure]').map((el) => ({ el, f: fmt(el.dataset.heure) }));
    const maj = () => { const d = new Date(); horloges.forEach((h) => { h.el.textContent = h.f.format(d); h.el.setAttribute('datetime', d.toISOString()); }); };
    maj(); setInterval(maj, 15000);

    if (calme || !G) return;
    const arc = $('[data-arc]');
    const goutte = $('[data-arc-goutte]');
    if (!arc) return;
    const L = arc.getTotalLength();
    G.set(arc, { strokeDasharray: L, strokeDashoffset: L });
    G.to(arc, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: {
        trigger: '[data-carte]', start: 'top 75%', end: 'bottom 55%', scrub: 0.6,
        onUpdate: (s) => {
          const pt = arc.getPointAtLength(L * s.progress);
          goutte.setAttribute('cx', pt.x); goutte.setAttribute('cy', pt.y);
          goutte.style.opacity = s.progress > 0.01 && s.progress < 0.99 ? 1 : 0;
        }
      }
    });
    G.fromTo('.gabon__fond-img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '#gabon', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- 6. Histoires : cartes qui s’empilent ---------- */
  function histoires() {
    if (calme || !G) return;
    const cartes = $$('[data-histoire]');
    G.matchMedia().add('(min-width: 900px) and (min-height: 760px)', () => {
      cartes.forEach((c, i) => {
        const suivante = cartes[i + 1];
        if (!suivante) return;
        G.to(c, { scale: 0.93, '--voile': 0.32, ease: 'none', scrollTrigger: { trigger: suivante, start: 'top 92%', end: 'top 20%', scrub: true } });
      });
    });
    cartes.forEach((c) => {
      const im = $('.histoire__img img', c);
      G.fromTo(im, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 25%', scrub: true } });
    });
  }

  /* ---------- 7. Agir, engagements : parallaxes et lumière sur l’eau ---------- */
  function lumiere() {
    if (!G || calme) return;
    G.fromTo('.agir__img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#agir', start: 'top bottom', end: 'top top', scrub: true } });
    G.fromTo('.engagements__fond-img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#engagements', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.fromTo('.contact__img', { yPercent: -10 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top top', scrub: true } });
    const texte = $('.verset-lumiere__texte');
    if (!texte) return;
    const etat = { x: 50, y: 45 };
    const appliquer = () => { texte.style.setProperty('--mx', etat.x.toFixed(1) + '%'); texte.style.setProperty('--my', etat.y.toFixed(1) + '%'); };
    if (E.fin) {
      $('#engagements').addEventListener('pointermove', (e) => {
        const r = texte.getBoundingClientRect();
        G.to(etat, { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, duration: 0.8, ease: 'power3', overwrite: true, onUpdate: appliquer });
      });
    }
    G.fromTo(etat, { x: 8 }, { x: 92, ease: 'none', onUpdate: appliquer, scrollTrigger: { trigger: texte, start: 'top 85%', end: 'bottom 30%', scrub: true } });
  }

  /* ---------- 8. Équipe : portraits révélés, ondulation au survol ---------- */
  function equipe() {
    if (!G || calme) return;
    ScrollTrigger.batch('.portrait__cadre', {
      start: 'top 88%', once: true,
      onEnter: (els) => G.fromTo(els, { clipPath: 'inset(100% 0% 0% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.4, ease: 'expo.out', stagger: 0.12 })
    });
    const deplacement = $('#filtre-onde feDisplacementMap');
    const bruit = $('#filtre-onde feTurbulence');
    if (!deplacement || !E.fin) return;
    $$('[data-onde]').forEach((c) => c.addEventListener('pointerenter', () => {
      G.timeline()
        .fromTo(deplacement, { attr: { scale: 0 } }, { attr: { scale: 26 }, duration: 0.35, ease: 'power2.out' })
        .to(deplacement, { attr: { scale: 0 }, duration: 1.2, ease: 'power2.out' });
      G.fromTo(bruit, { attr: { baseFrequency: '0.012 0.05' } }, { attr: { baseFrequency: '0.006 0.02' }, duration: 1.5 });
    }));
  }

  /* ---------- 9. Don simulé ---------- */
  function don() {
    const form = $('[data-don]');
    if (!form) return;
    const recipient = new E.Recipient($('[data-recipient]', $('#don')));
    const autre = $('[data-autre]', form);
    const resume = $('[data-resume]', form);
    const dialogue = $('[data-dialogue]');
    const params = new URLSearchParams(location.search);
    if (params.get('projet') && E.affectations[params.get('projet')]) form.affectation.value = params.get('projet');

    function montant() {
      const m = form.querySelector('[name="montant"]:checked');
      if (!m) return 0;
      if (m.value === 'autre') return Math.max(0, Math.round(+form.autre.value || 0));
      return +m.value;
    }
    function maj() {
      const v = montant();
      const freq = form.querySelector('[name="frequence"]:checked').value;
      const pour = E.affectations[form.affectation.value];
      autre.hidden = form.querySelector('[name="montant"]:checked').value !== 'autre';
      if (!v) { resume.textContent = 'Indiquez un montant pour continuer.'; recipient.valeur(0); return; }
      const m = E.montant(v);
      const phrases = {
        unique: `Vous donnez ${m} une fois, ${pour}.`,
        mensuel: `Vous donnez ${m} chaque mois, soit ${E.montant(v * 12)} par an, ${pour}.`,
        annuel: `Vous donnez ${m} chaque année, ${pour}.`
      };
      resume.textContent = phrases[freq];
      recipient.valeur(v);
    }
    form.addEventListener('change', maj);
    form.addEventListener('input', (e) => { if (e.target.name === 'autre') maj(); });
    maj();

    let retour = null;
    function fermer() {
      E.inerte(false, dialogue);
      dialogue.hidden = true;
      E.lenis && E.lenis.start();
      retour && retour.focus();
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = montant();
      if (!v) { resume.textContent = 'Indiquez un montant pour continuer.'; (form.autre.hidden ? form.querySelector('[name="montant"]') : form.autre).focus(); return; }
      const freq = form.querySelector('[name="frequence"]:checked').value;
      const quand = { unique: '', mensuel: ' chaque mois', annuel: ' chaque année' }[freq];
      $('[data-dialogue-txt]', dialogue).textContent = `Votre don de ${E.montant(v)}${quand} serait utilisé ${E.affectations[form.affectation.value]}. Sur le vrai site, vous seriez dirigé vers le formulaire de paiement sécurisé de l’association.`;
      retour = document.activeElement;
      dialogue.hidden = false;
      E.inerte(true, dialogue);
      E.lenis && E.lenis.stop();
      const boite = $('.dialogue__boite', dialogue);
      boite.focus();
      if (G && !calme) G.fromTo(boite, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
    });
    dialogue.addEventListener('click', (e) => { if (e.target.closest('[data-fermer]')) fermer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dialogue.hidden) fermer(); });
    dialogue.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = $$('a, button', dialogue);
      const boite = $('.dialogue__boite', dialogue);
      if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === boite)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }

  /* ---------- 10. Contact : disponibilité en direct et formulaire simulé ---------- */
  function contact() {
    const statut = $('[data-statut]');
    if (statut) {
      const parts = () => {
        const o = {};
        new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
          .formatToParts(new Date()).forEach((p) => { o[p.type] = p.value; });
        return o;
      };
      const heureOttawa = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' });
      const maj = () => {
        const p = parts();
        const jours = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const j = jours.indexOf(p.weekday), h = +p.hour;
        const ouvre = j >= 1 && j <= 5;
        const ouvert = ouvre && h >= 9 && h < 17;
        let txt;
        if (ouvert) txt = `Disponibles en ce moment\u00a0: il est ${heureOttawa.format(new Date())} à Ottawa`;
        else {
          let quand = 'lundi à 9 h';
          if (ouvre && h < 9) quand = 'aujourd’hui à 9 h';
          else if (j >= 1 && j <= 4 && h >= 17) quand = 'demain à 9 h';
          txt = `En dehors des horaires\u00a0: nous vous répondons dès ${quand}, heure de l’Est`;
        }
        statut.classList.toggle('est-ouvert', ouvert);
        statut.classList.toggle('est-ferme', !ouvert);
        $('[data-statut-txt]', statut).textContent = txt;
      };
      maj(); setInterval(maj, 30000);
    }

    const form = $('[data-contact]');
    if (!form) return;
    const retour = $('[data-retour]', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const manquants = [];
      let courrielInvalide = false;
      [['prenom', 'votre prénom'], ['courriel', 'votre courriel'], ['objet', 'l’objet du message']].forEach(([n, lib]) => {
        const champ = form.elements[n];
        const val = champ.value.trim();
        let ok = val !== '';
        if (ok && n === 'courriel' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { ok = false; courrielInvalide = true; }
        champ.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !(n === 'courriel' && courrielInvalide)) manquants.push(lib);
      });
      retour.classList.remove('est-erreur', 'est-ok');
      if (manquants.length || courrielInvalide) {
        retour.classList.add('est-erreur');
        const phrases = [];
        if (manquants.length) phrases.push(`Indiquez ${E.liste(manquants)}.`);
        if (courrielInvalide) phrases.push('Vérifiez l’adresse courriel\u00a0: elle doit ressembler à nom@exemple.ca.');
        retour.textContent = phrases.join(' ');
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }
      retour.classList.add('est-ok');
      retour.textContent = 'Message prêt à être envoyé. Ceci est une démonstration\u00a0: rien n’a été transmis.';
      form.reset();
    });
  }

  ouverture();
  document.addEventListener('DOMContentLoaded', () => {
    bienvenue(); publics(); axes(); gabon(); histoires(); lumiere(); equipe(); don(); contact();
  });
})();
