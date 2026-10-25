/**
 * Scroll-triggered entrance animations for every "plain" (non-video)
 * section — collection, about, pitch, process, FAQ, CTA and the footer —
 * plus the decorative ".section-thread" connectors between them and the
 * process timeline's "drawing" line.
 *
 * Without this, those sections just pop into their final state the instant
 * they enter the viewport, which is what made the page feel flat and
 * disconnected — each section reading like a separate static page pasted
 * after the last one, instead of one continuous, considered experience.
 *
 * Respects prefers-reduced-motion: if the OS says the user wants less
 * motion, this file does nothing at all, and everything stays at its
 * normal CSS opacity (1) — same as what happens if this script fails to
 * load for any reason. Nothing is ever hidden by default in CSS; gsap.set()
 * below is what hides it, so "JS didn't run" always degrades to "fully
 * visible", never to "invisible forever".
 */
export function initScrollReveals() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Fades + slides a group of elements in together, staggered, the first
  // time they scroll within `start` of the viewport. `once: true` means a
  // section already revealed stays revealed if the user scrolls back up —
  // this is an entrance, not a peekaboo toggle.
  function reveal(selector, { x = 0, y = 28, stagger = 0.12, start = 'top 88%' } = {}) {
    const targets = gsap.utils.toArray(selector);
    if (!targets.length) return;

    gsap.set(targets, { opacity: 0, x, y });

    ScrollTrigger.batch(targets, {
      start,
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          stagger,
          overwrite: true,
        }),
    });
  }

  reveal('.collection-eyebrow, .collection-heading, .collection-lead');
  reveal('.about-content', { x: -24, y: 0 });
  reveal('.about-portrait', { x: 24, y: 0 });
  reveal('.pitch-eyebrow, .pitch-heading, .pitch-lead');
  reveal('.pitch-tabs', { y: 36 });
  reveal('.process-eyebrow, .process-heading');
  reveal('.process-step', { y: 32, stagger: 0.15 });
  reveal('.faq-eyebrow, .faq-heading');
  reveal('.faq-item', { y: 24, stagger: 0.1 });
  reveal('.cta-card', { y: 40 });
  reveal('.footer-logo, .footer-copyright', { y: 16, stagger: 0.08 });

  // Decorative connectors between sections (see .section-thread in
  // css/main.css) — the actual draw-in motion is a CSS transition, this
  // just adds the class that triggers it once scrolled into view.
  document.querySelectorAll('.section-thread').forEach((thread) => {
    ScrollTrigger.create({
      trigger: thread,
      start: 'top 90%',
      once: true,
      onEnter: () => thread.classList.add('is-visible'),
    });
  });

  // The process timeline's connecting line "grows" left-to-right instead
  // of just appearing — ties visually into the "vinhas que se expandem"
  // (growth) idea already in the intro's principles copy.
  const lineFill = document.querySelector('.process-line-fill');
  if (lineFill) {
    gsap.set(lineFill, { scaleX: 0 });
    ScrollTrigger.create({
      trigger: '.process-timeline',
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(lineFill, { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }),
    });
  }
}
