/**
 * The FAQ accordion (#faq-section in index.html) — one question open at a
 * time. Clicking an open question closes it; clicking a different one
 * closes whichever was open and opens that one instead.
 *
 * The expand/collapse animation itself is pure CSS (see ".faq-answer" in
 * css/main.css, the grid-template-rows 0fr → 1fr trick) — this file only
 * ever toggles the ".is-open" class and keeps the aria-expanded attribute
 * in sync with it for screen readers.
 */
export function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach((item) => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');

      items.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
