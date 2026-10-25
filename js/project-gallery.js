/**
 * The 5 finished projects shown in the carousel that appears once the
 * project video ends. Each "quadro" (picture frame) image already has its
 * own gold frame graphic baked in with a transparent background around it,
 * so cross-fading between them reads as paintings changing on the same
 * wall, not a generic slideshow.
 *
 * To add/remove/reorder a project, just edit this array — everything else
 * (dots, captions, cross-fade, wrap-around navigation) adapts automatically.
 */
const PROJECTS = [
  {
    file: 'QuadroFrajola.png',
    name: 'Frajola Drinks',
    eyebrow: 'E-commerce · Bebidas artesanais',
    desc: 'Identidade vibrante e direta ao ponto para uma marca de drinks que virou hábito.',
    url: 'https://frajola-drinks.vercel.app/',
  },
  {
    file: 'QuadroMalhas.png',
    name: 'Mazza Malhas',
    eyebrow: 'Landing page · Uniformes personalizados',
    desc: 'Conversão em primeiro lugar: da ideia ao orçamento em poucos cliques.',
    url: 'https://mazza-malhas.vercel.app/',
  },
  {
    file: 'dr.daf.png',
    name: 'Dra. Dafnny Anny',
    eyebrow: 'Landing page · Odontologia estética',
    desc: 'Delicadeza e autoridade para uma especialista em facetas e sorrisos.',
    url: 'https://dra-dafnny-anny.vercel.app/',
  },
  {
    file: 'birthday.png',
    name: 'Para Aniversários',
    eyebrow: 'Experiência interativa · Presente digital',
    desc: 'Um presente que se navega: memórias, cartas e trilha sonora em um só lugar.',
    url: 'https://birthday-my-love-sigma.vercel.app/',
  },
  {
    file: 'joao.martins.png',
    name: 'João Martins',
    eyebrow: 'Landing page · Performance & saúde',
    desc: 'Resultado como argumento: treino e terapia muscular com autoridade.',
    url: 'https://joao-martins-tau.vercel.app/',
  },
];

/**
 * Sets up the project carousel (buttons, dots, cross-fade) and returns its
 * root DOM element, so the caller (project-video.js) can fade the whole
 * thing in/out as the scroll-video's progress changes.
 */
export function initProjectGallery() {
  // Preload every project image up front so navigating the carousel never
  // shows a blank/loading frame mid cross-fade.
  PROJECTS.forEach((project) => {
    new Image().src = `assets/quadros/${project.file}`;
  });

  const gallery = document.getElementById('projectGallery');
  const frameA = document.getElementById('galleryFrameA');
  const frameB = document.getElementById('galleryFrameB');
  const prevButton = document.getElementById('galleryPrev');
  const nextButton = document.getElementById('galleryNext');
  const indexLabel = document.getElementById('galleryIndex');
  const eyebrowLabel = document.getElementById('galleryEyebrow');
  const titleLabel = document.getElementById('galleryTitle');
  const descLabel = document.getElementById('galleryDesc');
  const linkEl = document.getElementById('galleryLink');
  const dotsContainer = document.getElementById('galleryDots');

  // Build one dot button per project; clicking a dot jumps straight to it.
  PROJECTS.forEach((_project, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot';
    dot.setAttribute('aria-label', `Ir para o projeto ${i + 1}`);
    dot.addEventListener('click', () => showProject(i));
    dotsContainer.appendChild(dot);
  });

  let currentIndex = 0;
  let topLayerIsA = true; // which of the two <img> layers is currently the visible one

  function showProject(index) {
    // Wraps around: index -1 becomes the last project, index length becomes
    // the first — so prev/next never "run out" at either end.
    currentIndex = (index + PROJECTS.length) % PROJECTS.length;
    const project = PROJECTS[currentIndex];

    // Cross-fade technique: load the new picture into whichever <img> layer
    // is currently hidden, then flip which layer counts as "on top". Both
    // layers always sit in the exact same spot (see .gallery-frame in
    // css/main.css), so the CSS opacity transition does the actual fading —
    // this function just decides which image goes in which layer.
    const incomingLayer = topLayerIsA ? frameB : frameA;
    const outgoingLayer = topLayerIsA ? frameA : frameB;
    incomingLayer.src = `assets/quadros/${project.file}`;
    incomingLayer.alt = project.name;
    incomingLayer.classList.add('is-active');
    outgoingLayer.classList.remove('is-active');
    topLayerIsA = !topLayerIsA;

    indexLabel.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
    eyebrowLabel.textContent = project.eyebrow;
    titleLabel.textContent = project.name;
    descLabel.textContent = project.desc;
    linkEl.href = project.url;

    [...dotsContainer.children].forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentIndex);
    });
  }

  prevButton.addEventListener('click', () => showProject(currentIndex - 1));
  nextButton.addEventListener('click', () => showProject(currentIndex + 1));

  showProject(0); // show the first project immediately, no fade needed on load

  return gallery;
}
