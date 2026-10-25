import { ScrollVideoSequence } from '../components/scroll-video-sequence/scroll-video-sequence.js';

/**
 * Sets up the intro scroll-video section (#introVideo).
 *
 * As the user scrolls, the video plays forward/backward frame by frame.
 * It opens on a hero overlay (headline, lead, CTAs) sitting on top of frame
 * 1 — visible immediately, no scrolling required — which fades out over the
 * first 6% of scroll progress so it gets out of the way as soon as the
 * video actually starts playing. Once it's almost finished (the last 15% of
 * the scroll distance), a banner with our "principles" cards fades in on
 * top of the last frame — see `.hero-overlay` / `.closing-banner` inside
 * #introVideo in index.html, and their styles in css/main.css (search for
 * "Intro video reveal").
 *
 * One-shot playback: the FIRST time the user scrolls all the way past this
 * section, it retires for the rest of the page's life — frozen on the last
 * frame with the principles banner fully shown, and its extra scroll length
 * collapses down to a single screen (the same --svs-scroll-length +
 * ScrollTrigger.refresh() trick js/project-experience.js uses to collapse
 * the project video). From then on it's just a normal static block: with no
 * scroll-jacking distance left, scrolling back up can never re-pin the
 * canvas or re-scrub the video — only reloading the page brings it back.
 */
export function initIntroSection() {
  const section = document.getElementById('introVideo');
  const closingBanner = document.getElementById('closingBanner');
  const heroOverlay = document.getElementById('heroOverlay');
  const FADE_START = 0.85; // banner starts appearing once scroll progress passes 85%
  const HERO_FADE_END = 0.06; // hero finishes fading out by 6% scroll progress
  const RETIRED_HEIGHT = '100vh'; // one screen, no scrub distance left — see retire()

  let retired = false;

  // "Entrar no templo" smooth-scrolls to the project section instead of
  // doing a plain instant anchor jump. Scoped to just this one link via
  // Element.scrollIntoView({behavior:'smooth'}) rather than turning on CSS
  // `scroll-behavior: smooth` globally — the latter would also silently
  // turn every carefully-tuned INSTANT window.scrollTo() elsewhere on this
  // page (the retirement collapse below, project-experience.js's clamp and
  // collapse/expand) into smooth-animated ones, reintroducing exactly the
  // scroll-timing bugs those already fixed.
  document.getElementById('heroScrollLink').addEventListener('click', (event) => {
    event.preventDefault();
    // This button is only ever reachable while the hero is visible, i.e.
    // before retirement — so retire() (declared below, but function
    // declarations are hoisted) always actually runs here. It's called
    // BEFORE the scroll starts, not left to fire reactively mid-animation:
    // a real click is unambiguous proof of genuine intent, so `armed` is
    // forced too, rather than possibly no-op'ing inside a startup settle
    // window a fast clicker might still be in. Retiring first — rather
    // than letting onLeave catch it once the smooth-scroll crosses the
    // boundary — matters because retire() ends with its own INSTANT
    // window.scrollTo() correction; firing that mid-flight would cancel
    // the browser's native smooth-scroll animation outright, stranding the
    // page partway there instead of landing on the project section.
    armed = true;
    retire();
    document.getElementById('projectVideo').scrollIntoView({ behavior: 'smooth' });
  });

  // Chromium (and other browsers) can restore the previous scroll position
  // asynchronously, a moment after the page has already started running —
  // even after main.js's own `window.scrollTo(0, 0)` on its very first
  // line. This page is deliberately designed to always start at the top on
  // ANY load, including a reload (that's what makes "F5 brings the intro
  // back" actually work), so during this brief settle window, an unexpected
  // jump away from scrollY 0 is that browser restoration — not a real
  // person, since nobody scrolls hundreds of pixels within milliseconds of
  // a blank page appearing. `userInteracted` is the guard that keeps this
  // from ever fighting a genuinely fast scroller: the moment any real input
  // is seen, corrections stop entirely and whatever the user does is
  // respected as-is.
  let userInteracted = false;
  const markInteracted = () => {
    userInteracted = true;
  };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((type) =>
    window.addEventListener(type, markInteracted, { passive: true, once: true })
  );

  let armed = false;
  const resettleIfUntouched = () => {
    if (!userInteracted && window.scrollY !== 0) window.scrollTo(0, 0);
  };
  resettleIfUntouched();
  requestAnimationFrame(resettleIfUntouched);
  // Comfortably past the ~200ms delay observed for Chromium's own restore —
  // once this fires, retire() and the banner fade below are allowed to act
  // on real scrolling again.
  setTimeout(() => {
    resettleIfUntouched();
    armed = true;
    // The banner's own onProgress updates are ALSO ignored below while
    // !armed — but that transient restoration jump can still land ONE
    // onProgress call showing progress ≈ 1 in the instant before it's
    // caught (GSAP's scrub reports every scroll tick, settle-window guard
    // or not). If that happened, the banner would be left visibly stuck at
    // full opacity even though scrollY is back to 0 and nothing further
    // triggers GSAP to recompute it. Resetting to the known-correct resting
    // state here — the instant it becomes safe to trust scroll again —
    // guarantees that stray frame never lingers.
    if (!retired) {
      closingBanner.style.opacity = 0;
      closingBanner.style.pointerEvents = 'none';
      heroOverlay.style.opacity = 1;
      heroOverlay.classList.remove('is-hidden');
    }
  }, 600);

  const sequence = new ScrollVideoSequence({
    section: '#introVideo',
    manifestUrl: 'assets/videos/intro/manifest.json',
    scrub: 0.15,
    onProgress: (progress) => {
      // Ignore anything reported before `armed` (see above — could be the
      // settle-window's transient scroll jump, not real scrolling) or after
      // `retired` (frozen — the trigger reporting this is about to be
      // killed anyway).
      if (retired || !armed) return;

      // Fades out over the first HERO_FADE_END of scroll — gone well before
      // the video itself has moved far, so it never fights the scrubbing.
      const heroOpacity = Math.max(0, 1 - progress / HERO_FADE_END);
      heroOverlay.style.opacity = heroOpacity;
      // Drops out of the tab order and stops intercepting clicks once fully
      // faded — and comes back if the user scrolls back up near the top.
      heroOverlay.classList.toggle('is-hidden', heroOpacity <= 0);

      // Maps progress 0.85 → 1 to opacity 0 → 1, so the banner eases in
      // smoothly instead of popping in abruptly on the very last frame.
      const bannerOpacity = Math.min(1, Math.max(0, (progress - FADE_START) / (1 - FADE_START)));
      closingBanner.style.opacity = bannerOpacity;
      // Only clickable once fully visible — otherwise, while still fading
      // in, it would sit on top of the video and swallow clicks meant for
      // whatever's underneath it.
      closingBanner.style.pointerEvents = bannerOpacity >= 0.99 ? 'auto' : 'none';
    },
  });

  // Guards against a rare race: if the user scrolls past the section before
  // its manifest/frames finish loading, retire() below would fire while
  // `sequence` has no scrollTrigger yet (nothing to kill) and no frames yet
  // (nothing to freeze on) — a harmless no-op at that moment, but it would
  // leave the sequence to set up its ScrollTrigger as normal once loading
  // DOES finish, undoing the retirement. This re-applies it once loading
  // catches up, so retirement always sticks no matter the load timing.
  sequence.ready.then(() => {
    if (retired) sequence.freeze();
  });

  // A separate watcher from the video's own ScrollTrigger (which only
  // tracks progress WITHIN the section) — onLeave fires exactly once
  // scroll exits this section's range going forward, which is precisely
  // "the user is done with the intro and has moved on."
  const retirementTrigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onLeave: retire,
  });

  function retire() {
    // !armed means we're still inside the startup settle window — this
    // onLeave was caused by the browser's own transient scroll-restoration
    // jump (see `armed` above), not by a real person actually finishing the
    // intro, so it must NOT count as "the user scrolled past it."
    if (retired || !armed) return;
    retired = true;

    // Force the frozen state to always show the fully-revealed banner, even
    // if a very fast scroll outran the scrub easing above and progress
    // never quite reported a clean 1 before onLeave fired. The hero is long
    // gone by this point in every real scenario, but hide it defensively
    // too (e.g. the "instant jump straight to the bottom" case, which skips
    // every intermediate onProgress tick that would normally have faded it).
    closingBanner.style.opacity = 1;
    closingBanner.style.pointerEvents = 'auto';
    heroOverlay.style.opacity = 0;
    heroOverlay.classList.add('is-hidden');
    sequence.freeze();

    // Collapse the section's extra scroll length so there's nothing left
    // for a later upward scroll to re-pin against. Measuring the height
    // before/after lets the page shift by exactly that much afterward, so
    // the collapse itself is never felt as a jump — same technique as
    // project-experience.js's collapse(), just compensating a scroll DELTA
    // here instead of restoring an absolute position.
    //
    // scrollY is captured NOW, before anything moves — ScrollTrigger.refresh()
    // below can itself nudge window.scrollY (to keep it within whatever the
    // new, shorter document's max scroll is), so reading window.scrollY
    // AFTER refresh() would double-count that adjustment on top of ours.
    // Using this captured value keeps the math correct regardless of
    // whatever refresh() decides to do to the live scroll position.
    const scrollYBeforeCollapse = window.scrollY;
    const beforeHeight = section.getBoundingClientRect().height;
    section.style.setProperty('--svs-scroll-length', RETIRED_HEIGHT);
    retirementTrigger.kill();
    ScrollTrigger.refresh();
    const afterHeight = section.getBoundingClientRect().height;
    window.scrollTo(0, Math.round(scrollYBeforeCollapse - (beforeHeight - afterHeight)));
  }
}
