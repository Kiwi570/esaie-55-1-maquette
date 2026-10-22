/* Ésaïe 55:1 — « Venez aux eaux » : surface d’eau WebGL qui réfracte l’image d’ouverture */
import { Renderer, Program, Mesh, Triangle, Texture } from './vendor/ogl.min.mjs';

const E = (window.ESAIE = window.ESAIE || {});
const resoudre = (v) => E._eauResoudre && E._eauResoudre(v);
const MAX = 12;

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes;
uniform vec2 uImg;
uniform float uTime;
uniform float uAspect;
uniform float uIntro;
uniform float uDim;
uniform vec4 uRip[${MAX}];
varying vec2 vUv;

vec2 couvrir(vec2 uv) {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * s + 0.5;
}

float hauteur(vec2 p) {
  float h = sin(p.x * 5.0 + uTime * 0.6) * 0.5 + sin(p.y * 6.5 - uTime * 0.45 + p.x * 1.7) * 0.5;
  h += sin((p.x - p.y) * 11.0 + uTime * 0.9) * 0.25;
  h *= 0.05;
  for (int i = 0; i < ${MAX}; i++) {
    vec4 r = uRip[i];
    float age = uTime - r.z;
    if (age < 0.0 || age > 5.0 || r.w <= 0.0) continue;
    vec2 c = vec2(r.x * uAspect, r.y);
    float d = distance(p, c);
    float front = age * 0.42;
    float env = exp(-pow((d - front) * 7.0, 2.0));
    h += sin((d - front) * 48.0) * env * exp(-age * 0.85) * r.w * 0.06;
  }
  return h;
}

void main() {
  vec2 uv = vUv;
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float e = 0.0025;
  float h = hauteur(p);
  float hx = hauteur(p + vec2(e, 0.0)) - h;
  float hy = hauteur(p + vec2(0.0, e)) - h;
  vec3 n = normalize(vec3(-hx / e, -hy / e, 1.0));
  vec2 dec = n.xy * 0.045;

  vec3 col;
  col.r = texture2D(tMap, couvrir(uv + dec * 1.08)).r;
  col.g = texture2D(tMap, couvrir(uv + dec)).g;
  col.b = texture2D(tMap, couvrir(uv + dec * 0.92)).b;

  vec3 L = normalize(vec3(-0.25, 0.65, 0.72));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 140.0);
  col += vec3(0.95, 0.83, 0.6) * spec * 0.9;
  col += vec3(0.89, 0.71, 0.36) * smoothstep(0.02, 0.06, length(n.xy)) * 0.08;

  vec3 abysse = vec3(0.047, 0.122, 0.173);
  col = mix(col, abysse, uDim * 0.65);
  float vign = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(uAspect, 1.0)));
  col = mix(abysse, col, 0.55 + 0.45 * vign);

  vec2 centre = vec2(0.5 * uAspect, 0.5);
  float d = distance(p, centre);
  float rayon = uIntro * 1.9;
  float masque = smoothstep(rayon, rayon - 0.12, d);
  float anneau = exp(-pow((d - rayon) * 26.0, 2.0)) * (1.0 - smoothstep(0.75, 1.0, uIntro));
  col = mix(abysse, col, masque);
  col += vec3(0.89, 0.71, 0.36) * anneau * 0.85;

  // Grain de pellicule très léger : masque la douceur de l’image agrandie
  float grain = fract(sin(dot(gl_FragCoord.xy + fract(uTime * 7.0) * 91.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.035;

  gl_FragColor = vec4(col, 1.0);
}`;

function initialiser() {
  const conteneur = document.querySelector('[data-eau]');
  if (!conteneur || document.documentElement.classList.contains('calme')) { resoudre(null); return; }
  const img = conteneur.querySelector('img');
  if (!img) { resoudre(null); return; }

  // Version sans WebGL : l’image d’ouverture reste affichée telle quelle
  const essai = document.createElement('canvas');
  const support = !!(window.WebGLRenderingContext && (essai.getContext('webgl2') || essai.getContext('webgl')));
  if (!support) { resoudre(null); return; }

  let renderer;
  try {
    renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: false, antialias: false, powerPreference: 'high-performance' });
  } catch (err) { resoudre(null); return; }
  const gl = renderer.gl;
  if (!gl) { resoudre(null); return; }
  gl.clearColor(0.047, 0.122, 0.173, 1);

  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
  const ondes = Array.from({ length: MAX }, () => [0, 0, -100, 0]);
  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      tMap: { value: texture },
      uRes: { value: [1, 1] },
      uImg: { value: [16, 9] },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uIntro: { value: 1 },
      uDim: { value: 0 },
      uRip: { value: ondes }
    }
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  conteneur.appendChild(gl.canvas);

  const t0 = performance.now();
  const temps = () => (performance.now() - t0) / 1000;
  let indice = 0;
  function goutte(x, y, force) {
    ondes[indice] = [x, y, temps(), force == null ? 1 : force];
    indice = (indice + 1) % MAX;
  }

  function redimensionner() {
    const r = conteneur.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
    program.uniforms.uRes.value = [r.width, r.height];
    program.uniforms.uAspect.value = r.width / r.height;
  }
  let attente;
  window.addEventListener('resize', () => { cancelAnimationFrame(attente); attente = requestAnimationFrame(redimensionner); });
  redimensionner();

  // Interaction : sillage du curseur, gouttes au toucher
  let dernier = { x: -1, y: -1, t: 0 };
  const section = conteneur.closest('section') || conteneur;
  section.addEventListener('pointermove', (e) => {
    const r = conteneur.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    const t = temps();
    const dist = Math.hypot(x - dernier.x, y - dernier.y);
    if (dist > 0.035 && t - dernier.t > 0.05) { goutte(x, y, e.pointerType === 'mouse' ? 0.45 : 0.8); dernier = { x, y, t }; }
  }, { passive: true });
  section.addEventListener('pointerdown', (e) => {
    const r = conteneur.getBoundingClientRect();
    goutte((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, 1.4);
  });

  // Gouttes spontanées pour que l’eau vive aussi sur téléphone
  let prochaine = 2.5;

  let visible = true;
  new IntersectionObserver((ent) => { visible = ent[0].isIntersecting; }).observe(conteneur);

  // Garde-fou de fluidité : on baisse la résolution si l’appareil peine, puis on revient à l’image fixe
  let intervalles = [], precedent = 0, arret = false, surveillerApres = Infinity;
  function surveiller(now) {
    if (temps() < surveillerApres) { precedent = 0; return; }
    if (precedent) intervalles.push(now - precedent);
    precedent = now;
    const total = intervalles.reduce((a, b) => a + b, 0);
    if (intervalles.length < 40 && !(intervalles.length >= 5 && total > 900)) return;
    const tri = intervalles.slice().sort((a, b) => a - b);
    const median = tri[Math.floor(tri.length / 2)];
    intervalles = [];
    if (median <= 34) return;
    if (renderer.dpr > 0.75) { renderer.dpr = Math.max(0.75, renderer.dpr * 0.66); redimensionner(); return; }
    arret = true;
    conteneur.classList.remove('est-pret');
    document.documentElement.classList.remove('webgl');
    setTimeout(() => gl.canvas.remove(), 1300);
  }

  let fonduIntro = null;
  function boucle(now) {
    if (arret) return;
    requestAnimationFrame(boucle);
    if (!visible || document.hidden) { precedent = 0; return; }
    if (now) surveiller(now);
    const t = temps();
    program.uniforms.uTime.value = t;
    if (t > prochaine) { goutte(0.2 + Math.random() * 0.6, 0.25 + Math.random() * 0.55, 0.55); prochaine = t + 2.8 + Math.random() * 2.5; }
    const r = conteneur.getBoundingClientRect();
    program.uniforms.uDim.value = Math.min(1, Math.max(0, -r.top / r.height));
    if (fonduIntro) {
      const k = Math.min(1, (t - fonduIntro.debut) / fonduIntro.duree);
      program.uniforms.uIntro.value = 1 - Math.pow(1 - k, 3);
      if (k >= 1) fonduIntro = null;
    }
    renderer.render({ scene: mesh });
  }

  const api = {
    goutte,
    cacher() { program.uniforms.uIntro.value = 0; },
    reveler(duree) { fonduIntro = { debut: temps(), duree: duree || 1.6 }; }
  };

  function charger() {
    texture.image = img;
    program.uniforms.uImg.value = [img.naturalWidth || 16, img.naturalHeight || 9];
    document.documentElement.classList.add('webgl');
    surveillerApres = temps() + 0.8;
    // Pendant l’ouverture : l’eau attend la goutte ; si la goutte est déjà tombée, l’eau se révèle tout de suite
    if (document.documentElement.classList.contains('intro')) {
      if (E.introLancee) api.reveler(1.2); else api.cacher();
    }
    requestAnimationFrame(() => { conteneur.classList.add('est-pret'); });
    E.eau = api;
    resoudre(api);
  }
  const pret = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(charger);
  if (img.complete && img.naturalWidth) pret(); else img.addEventListener('load', pret, { once: true });
  // L’image change de version (rotation du téléphone, redimensionnement) : on renvoie la texture
  img.addEventListener('load', () => {
    if (!texture.image) return;
    texture.needsUpdate = true;
    program.uniforms.uImg.value = [img.naturalWidth || 16, img.naturalHeight || 9];
  });
  img.addEventListener('error', () => resoudre(null), { once: true });

  boucle();
}

try { initialiser(); } catch (err) { console.warn('Effet d’eau indisponible :', err); resoudre(null); }
