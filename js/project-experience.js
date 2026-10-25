/**
 * Coordinates the collapsed/expanded state of the whole project-video
 * "experience" (#projectVideo — the temple video + the project gallery it
 * ends on are treated as a single unit here, matching how the design treats
 * them: one thing you either skip or step into).
 *
 * Collapsed (the default, on every page load):
 *   The section is just one screen tall (100vh) — a plain "invitation" card
 *   showing frame 1 with the "Entre no templo" button. It does NOT pin or
 *   scroll-jack. A user who never clicks the button scrolls straight past
 *   it into the next section (the "Sobre mim" close of the page) after a
 *   single screen, exactly like any other normal section.
 *
 * Expanded (after clicking "Entre no templo"):
 *   The section grows to its full scroll-driven height (see
 *   EXPANDED_HEIGHT), so scrolling now plays the video frame by frame down
 *   to the project gallery — see project-video.js for that part. Forward
 *   scroll is capped at the last frame (see the scroll clamp below) so the
 *   ONLY way past this section, once opened, is the close (×) button on the
 *   gallery — never an accidental scroll into "Sobre mim". The close button
 *   collapses the section back to the one-screen card and returns the user
 *   to exactly where they opened it from.
 *
 * Why grow/shrink the section's height instead of some overlay/modal:
 * everything below it (the "Sobre mim" section) is real page content that
 * should be reachable by normal scrolling either way — a modal would need
 * its own scroll container and z-index stacking to fake that. Resizing the
 * real section keeps this a single, normal, scrollable page throughout.
 */
const COLLAPSED_HEIGHT = '100vh';
const EXPANDED_HEIGHT = '440vh';

export function initProjectExperience() {
  const section = document.getElementById('projectVideo');
  const gate = document.getElementById('projectGate');
  const openButton = document.getElementById('projectGateButton');
  const gallery = document.getElementById('projectGallery');
  const closeButton = document.getElementById('galleryClose');

  let expanded = false;

  function expand() {
    if (expanded) return;
    expanded = true;
    section.style.setProperty('--svs-scroll-length', EXPANDED_HEIGHT);
    // The scroll-video's ScrollTrigger measured its start/end against the
    // OLD (collapsed) section height when the page first loaded — it has no
    // way to know the section just grew until we tell it to re-measure.
    ScrollTrigger.refresh();
    gate.classList.add('is-hidden');
  }

  function collapse() {
    if (!expanded) return;
    expanded = false;
    // Grab this BEFORE shrinking the section — collapsing removes 340vh of
    // page height, and if the user had scrolled deep into the video, doing
    // this after would leave them stranded wherever that scroll position
    // now points to (likely well past "Sobre mim").
    const sectionTop = Math.round(section.getBoundingClientRect().top + window.scrollY);

    section.style.setProperty('--svs-scroll-length', COLLAPSED_HEIGHT);
    ScrollTrigger.refresh();

    // Belt-and-suspenders: project-video.js's onProgress will settle the
    // gallery's opacity back to 0 once ScrollTrigger recalculates too, but
    // setting it here directly means there's never even a one-frame flash
    // of the gallery while that catches up.
    gallery.style.opacity = 0;
    gallery.style.pointerEvents = 'none';
    gate.classList.remove('is-hidden');

    window.scrollTo(0, sectionTop);
    openButton.focus(); // return keyboard focus to where the user's attention was
  }

  openButton.addEventListener('click', expand);
  closeButton.addEventListener('click', collapse);

  // Escape closes it too — same as any other dismissible panel, for anyone
  // navigating by keyboard rather than clicking the × with a mouse.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && expanded) collapse();
  });

  // --- Scroll ceiling: once inside, the only way out is the × button ---
  //
  // Once the video reaches its last frame, position: sticky naturally lets
  // go and ordinary scrolling reveals whatever comes next in the document
  // ("Sobre mim") — same as scrolling past any section. Here that read as a
  // bug: the temple should feel like a self-contained space you *step out
  // of* deliberately, not one you fall through by scrolling one pixel too
  // far.
  //
  // The fix intentionally does NOT block scrolling (wheel/touch/keydown
  // preventDefault) — an earlier version of this gate did that and it was
  // fragile: different browsers and input devices (trackpad inertia,
  // Windows smooth-scroll) fired events in ways that occasionally left
  // scrolling stuck entirely. Instead, scrolling is left completely free,
  // and this only pulls the page back if it ever ends up PAST the last
  // frame — a plain boundary clamp, the same technique behind "rubber
  // banding" scroll effects. Scrolling backward (rewinding the video) is
  // always allowed, since that never trips the `> maxScrollY` check.
  function maxScrollY() {
    const rect = section.getBoundingClientRect();
    return Math.round(rect.top + window.scrollY + rect.height - window.innerHeight);
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!expanded) return;
      const max = maxScrollY();
      // +1px tolerance absorbs sub-pixel rounding between the fractional
      // getBoundingClientRect() above and the rounded pixel scrollTo()
      // lands on — without it, the two disagreeing by a hair can make this
      // re-trigger itself every scroll tick.
      if (window.scrollY > max + 1) {
        window.scrollTo(0, max);
        hintCloseButton();
      }
    },
    { passive: true }
  );

  // A quick pulse on the × button whenever the user bumps into that ceiling
  // — a wordless nudge toward how to actually leave, right when they'd be
  // wondering why the page stopped scrolling. Throttled so holding a key or
  // scrolling continuously doesn't retrigger it every few milliseconds.
  let lastHintAt = 0;
  function hintCloseButton() {
    const now = Date.now();
    if (now - lastHintAt < 1200) return;
    lastHintAt = now;
    closeButton.classList.remove('is-hinting');
    void closeButton.offsetWidth; // force reflow so the animation can restart
    closeButton.classList.add('is-hinting');
  }
}
