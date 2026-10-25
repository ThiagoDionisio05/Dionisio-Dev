/**
 * Entry point for the page.
 *
 * Loaded from index.html as <script type="module" src="js/main.js">, right
 * after the GSAP + ScrollTrigger <script> tags. Module scripts always run
 * after the page has finished parsing (same timing as a regular `defer`
 * script), so by the time this file runs, `gsap` and `ScrollTrigger` are
 * guaranteed to already be loaded on `window` — that's why we can reference
 * them directly below without importing them.
 *
 * The page has two independent scroll-driven video sections; each one's
 * logic lives in its own file so you can read them one at a time:
 *
 *   #introVideo   → plays automatically as the user scrolls, no gate.
 *                   See intro-section.js.
 *                   Ends with a "principles" banner fading in on top.
 *
 *   #projectVideo → collapsed to one screen by default (see
 *                   project-experience.js) — a user who doesn't open it
 *                   scrolls straight past into "Sobre mim". Opening it
 *                   expands the section into the full scroll-driven video
 *                   (project-video.js), which ends on the project carousel
 *                   (project-gallery.js). A close button on the gallery
 *                   collapses it back down.
 *
 * The closing pitch section's 3-tab switcher ("Seu site" / "Seu sistema" /
 * "Sua loja") is unrelated to either video — see pitch-tabs.js.
 *
 * The FAQ accordion (single question open at a time) is its own small,
 * unrelated piece too — see faq-accordion.js.
 *
 * Every other "plain" section (collection, about, pitch, process, FAQ,
 * CTA, footer) gets a scroll-triggered fade/slide-in entrance and the
 * decorative connectors between them get a draw-in animation — all handled
 * centrally in scroll-reveals.js, called last since it queries for
 * elements the sections above have already rendered.
 */
import { initIntroSection } from './intro-section.js';
import { initProjectExperience } from './project-experience.js';
import { initProjectGallery } from './project-gallery.js';
import { initProjectVideo } from './project-video.js';
import { initPitchTabs } from './pitch-tabs.js';
import { initFaqAccordion } from './faq-accordion.js';
import { initScrollReveals } from './scroll-reveals.js';

// Without this, the browser's own scroll-restoration would jump straight
// back to wherever the user had scrolled to before hitting F5 — defeating
// the intro video's "only plays again on a real reload" behavior (see
// js/intro-section.js): landing mid-page after a refresh would immediately
// re-trigger its one-shot retirement instead of showing a clean, fresh
// page the user can scroll down from the top to watch again.
//
// `history.scrollRestoration = 'manual'` looks like the textbook fix, but
// GSAP's ScrollTrigger fights it: it saves whatever scrollRestoration value
// it sees on its OWN first load and keeps forcing that value back after
// every refresh it runs internally (including the one triggered inside
// retire()) — so it always wins. Forcing the actual scroll position instead
// sidesteps that fight entirely: it doesn't matter what the browser (or
// GSAP) thinks scrollRestoration should be if we just put scrollY back to
// 0 ourselves before the user ever sees the restored position.
window.scrollTo(0, 0);

gsap.registerPlugin(ScrollTrigger);

initIntroSection();
initProjectExperience();
initPitchTabs();
initFaqAccordion();

const projectGallery = initProjectGallery();
initProjectVideo(projectGallery);

initScrollReveals();
