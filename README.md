# Ésaïe 55:1 — maquette « Venez aux eaux »

Maquette de démonstration du futur site de l’association Ésaïe 55:1 (Ottawa et Libreville).
Site statique : HTML, CSS et JavaScript, sans étape de construction, prêt pour Vercel.

## Pages
- `index.html` : accueil (ouverture d’eau WebGL, mission et six axes, Gabon, histoires, agir, engagements, équipe, don simulé, contact)
- `parrainage.html` : formules A, B, C et montant libre, quatre étapes, inscription simulée
- `projets.html` : quinze actions filtrables, plantations solidaires, projets urgents, transparence

## Ce qui est simulé
Les dons, parrainages et formulaires n’envoient rien et ne prélèvent rien. Le bouton de don mène au vrai formulaire de l’association.

## À compléter par l’association
- Numéro d’entreprise et, s’il existe, numéro d’enregistrement d’organisme de bienfaisance (ARC) : sans lui, aucun reçu officiel de don ne peut être promis
- Accord écrit des quatre personnes dont l’histoire est publiée (ou prénoms modifiés)
- Objectifs financiers des projets urgents
- Photo de la présidente, description du rôle du directeur général adjoint
- Code postal exact (K1N 5G1 ou K1N 5G2), liens des réseaux sociaux, agenda, rapport annuel et états financiers
- Préciser la formule A (une femme ou un jeune)

## Images
Les photos de l’équipe et le logo viennent du site actuel. Les autres images sont des illustrations générées (aucune ne représente un bénéficiaire réel).

## Accessibilité et mouvement
Un bouton « Mode calme » coupe l’effet d’eau et les animations ; il est activé d’office si le système demande de réduire les animations. Sans WebGL, ou sur un appareil trop lent, l’image fixe remplace l’effet d’eau.

## Bibliothèques et polices
GSAP 3.15 (ScrollTrigger, SplitText, Flip), Lenis 1.3, OGL 1.0. Polices Fraunces et Manrope (licence SIL Open Font License, fichiers dans `assets/fonts`).
