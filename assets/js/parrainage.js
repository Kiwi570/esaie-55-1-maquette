/* Ésaïe 55:1 — page Parrainage */
(function () {
  'use strict';
  const E = window.ESAIE;
  const G = window.gsap;
  const { $, $$ } = E;
  const calme = E.calme;

  /* ---------- Pourquoi parrainer : la ligne d’eau allume chaque bienfait ---------- */
  function flux() {
    const bloc = $('[data-flux]');
    if (!bloc || calme || !G) return;
    const eau = $('[data-flux-eau]', bloc);
    const items = $$('.flux__item', bloc);
    ScrollTrigger.create({
      trigger: bloc, start: 'top 72%', end: 'bottom 48%', scrub: true,
      onUpdate: (s) => {
        G.set(eau, { scaleY: s.progress });
        items.forEach((it, i) => it.classList.toggle('est-allume', s.progress >= (i + 0.35) / items.length));
      }
    });
    G.fromTo('.pourquoi__img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#pourquoi', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- Formules : le niveau monte avec le montant ---------- */
  const F = E.formules;
  let recipient = null;
  function formules() {
    const groupe = $('[data-formules]');
    if (!groupe) return;
    recipient = new E.Recipient($('[data-recipient]', $('#formules')));
    const champ = $('[data-montant-mensuel]');
    const annuel = $('[data-annuel]');
    const impact = $('[data-impact]');
    const contribue = $('[data-contribue]');
    const recevez = $('[data-recevez]');
    const precision = $('[data-precision]');
    const note = $('[data-note]');
    const detail = $('[data-detail]');
    // Distinguer un choix à la souris ou au doigt d’un choix au clavier (flèches)
    let viaPointeur = false;
    groupe.addEventListener('pointerdown', () => { viaPointeur = true; });
    groupe.addEventListener('keydown', () => { viaPointeur = false; });
    const liste = (ul, arr) => {
      ul.innerHTML = '';
      arr.forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
      ul.parentElement.hidden = arr.length === 0;
    };
    function afficherFormule(lettre) {
      const f = F[lettre];
      impact.textContent = f.impact;
      liste(contribue, f.contribue);
      liste(recevez, f.recevez);
      precision.textContent = f.precision;
    }
    function majMontant() {
      const v = Math.max(0, Math.round(+champ.value || 0));
      // Sous le minimum d’une formule, le soutien bascule en montant libre
      const coche = groupe.querySelector('input:checked');
      if (coche && coche.value !== 'L' && v > 0 && v < +coche.dataset.montant) {
        note.textContent = `En dessous de ${coche.dataset.montant}\u00a0C$ par mois, votre soutien devient un montant libre.`;
        groupe.querySelector('input[value="L"]').checked = true;
        afficherFormule('L');
        synchroniserAssistant('L', v);
      }
      champ.style.width = Math.max(2, String(champ.value || '').length) + 0.7 + 'ch';
      annuel.textContent = v ? `Soit ${E.montant(v * 12)} par an.` : 'Indiquez un montant mensuel.';
      recipient.valeur(v);
      synchroniserAssistant(null, v);
    }
    function choisir(lettre, depuisAssistant) {
      const radio = groupe.querySelector(`input[value="${lettre}"]`);
      radio.checked = true;
      if (lettre !== 'L') champ.value = radio.dataset.montant;
      note.textContent = '';
      afficherFormule(lettre);
      majMontant();
      if (!depuisAssistant) synchroniserAssistant(lettre, +champ.value);
      if (lettre === 'L' && !depuisAssistant && viaPointeur) { champ.focus({ preventScroll: true }); champ.select(); }
      // Sur téléphone, le détail est plus bas : on l’amène doucement à l’écran
      if (!depuisAssistant && viaPointeur && window.innerWidth < 1000) {
        const r = detail.getBoundingClientRect();
        if (r.top > window.innerHeight * 0.7) E.allerA(detail, { offset: -100, duration: 1, focus: false });
      }
      if (G && !calme) G.fromTo('.detail__impact, .detail__colonnes', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'expo.out' });
    }
    groupe.addEventListener('change', (e) => { if (e.target.name === 'formule') choisir(e.target.value); });
    champ.addEventListener('input', majMontant);
    E.choisirFormule = choisir;
    choisir('A', true);
  }

  /* ---------- Les 4 étapes : une goutte descend le fil ---------- */
  function etapes() {
    const bloc = $('[data-etapes]');
    if (!bloc || calme || !G) return;
    const items = $$('[data-etape]', bloc);
    const eau = $('[data-etapes-eau]');
    const goutte = $('[data-etapes-goutte]');
    const fil = $('.etapes__fil');
    const maj = (p) => {
      G.set(eau, { scaleY: p });
      G.set(goutte, { y: p * fil.clientHeight - 7, opacity: p > 0.01 && p < 0.995 ? 1 : 0 });
      items.forEach((it, i) => it.classList.toggle('est-active', p >= i / items.length + 0.02));
    };
    const mm = G.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 720px)', () => {
      ScrollTrigger.create({ trigger: bloc, start: 'top top', end: '+=140%', pin: true, scrub: 0.6, onUpdate: (s) => maj(s.progress) });
    });
    mm.add('(max-width: 899px), (max-height: 719px)', () => {
      ScrollTrigger.create({ trigger: '.etapes__liste', start: 'top 75%', end: 'bottom 45%', scrub: true, onUpdate: (s) => maj(s.progress) });
    });
  }

  /* ---------- Assistant d’inscription en 4 étapes (simulé) ---------- */
  let synchro = false;
  function synchroniserAssistant(lettre, montant) {
    const form = $('[data-assistant]');
    if (!form || synchro) return;
    if (lettre) { const r = form.querySelector(`[name="f"][value="${lettre}"]`); if (r) r.checked = true; }
    if (montant != null) form.elements.m.value = montant || '';
  }
  function assistant() {
    const form = $('[data-assistant]');
    if (!form) return;
    const pas = $$('[data-pas]', form);
    const prec = $('[data-precedent]', form);
    const suiv = $('[data-suivant]', form);
    const eau = $('[data-progression]');
    const noms = $$('[data-progression-etapes] li');
    const retour = $('[data-retour]', form);
    const fin = $('[data-fin]', form);
    let i = 0;

    form.addEventListener('change', (e) => {
      if (e.target.name === 'f' && E.choisirFormule) { synchro = true; E.choisirFormule(e.target.value, true); synchro = false; if (e.target.value !== 'L') form.elements.m.value = $(`[data-formules] input[value="${e.target.value}"]`).dataset.montant; }
    });
    form.elements.m.addEventListener('input', () => {
      const champ = $('[data-montant-mensuel]');
      if (champ) { synchro = true; champ.value = form.elements.m.value; champ.dispatchEvent(new Event('input')); synchro = false; }
    });

    function valide() {
      retour.textContent = ''; retour.className = 'form-retour';
      if (i === 0 && !(+form.elements.m.value > 0)) { retour.textContent = 'Indiquez un montant mensuel pour continuer.'; retour.classList.add('est-erreur'); form.elements.m.focus(); return false; }
      if (i === 0) {
        const l = form.querySelector('[name="f"]:checked').value;
        const min = { A: 20, B: 50, C: 100 }[l];
        if (min && +form.elements.m.value < min) {
          retour.textContent = `La formule ${l} commence à ${min}\u00a0C$ par mois. Choisissez « Montant libre » pour un montant plus petit.`;
          retour.classList.add('est-erreur'); form.elements.m.focus(); return false;
        }
      }
      if (i === 1) {
        const manquants = [];
        [['prenom', 'votre prénom'], ['nom', 'votre nom'], ['courriel', 'votre courriel']].forEach(([n, lib]) => {
          const c = form.elements[n];
          const ok = n === 'courriel' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value.trim()) : c.value.trim() !== '';
          c.setAttribute('aria-invalid', ok ? 'false' : 'true');
          if (!ok) manquants.push(lib);
        });
        if (manquants.length) { retour.textContent = `Indiquez ${E.liste(manquants)} pour continuer.`; retour.classList.add('est-erreur'); form.querySelector('[aria-invalid="true"]').focus(); return false; }
      }
      return true;
    }
    function recap() {
      const l = form.querySelector('[name="f"]:checked').value;
      const v = +form.elements.m.value;
      const lignes = [
        ['Formule', F[l].nom], ['Montant', `${E.montant(v)} par mois, soit ${E.montant(v * 12)} par an`],
        ['Parrain ou marraine', `${form.elements.prenom.value} ${form.elements.nom.value}`.trim()],
        ['Courriel', form.elements.courriel.value], ['Versement', form.querySelector('[name="v"]:checked').value]
      ];
      const dl = $('[data-recap]', form);
      dl.innerHTML = '';
      lignes.forEach(([a, b]) => { const dt = document.createElement('dt'); dt.textContent = a; const dd = document.createElement('dd'); dd.textContent = b; dl.append(dt, dd); });
    }
    function aller(n) {
      const ancien = pas[i];
      i = n;
      pas.forEach((p, k) => { p.hidden = k !== i; });
      prec.hidden = i === 0;
      $('span', suiv).textContent = i === pas.length - 1 ? 'Envoyer ma demande' : 'Étape suivante';
      eau.style.width = ((i + 1) / pas.length) * 100 + '%';
      noms.forEach((li, k) => (k === i ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current')));
      if (i === 3) recap();
      const nouveau = pas[i];
      if (G && !calme && ancien !== nouveau) G.fromTo(nouveau, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, ease: 'expo.out' });
      const legende = $('legend', nouveau);
      legende.setAttribute('tabindex', '-1'); legende.focus({ preventScroll: true });
    }
    prec.addEventListener('click', () => aller(Math.max(0, i - 1)));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!valide()) return;
      if (i < pas.length - 1) { aller(i + 1); return; }
      pas.forEach((p) => { p.hidden = true; });
      prec.hidden = true; suiv.hidden = true;
      fin.hidden = false;
      fin.setAttribute('tabindex', '-1');
      fin.focus({ preventScroll: true });
      noms.forEach((li) => li.removeAttribute('aria-current'));
      eau.style.width = '100%';
      if (G && !calme) G.from(fin, { y: 20, opacity: 0, duration: 0.7, ease: 'expo.out' });
    });
  }

  document.addEventListener('DOMContentLoaded', () => { flux(); formules(); etapes(); assistant(); });
})();
