/**
 * Scroll Reveal Utility — vanilla IntersectionObserver
 * Matches silk-design reveal config: 0.6s, easeOut, -20% viewport margin, once: true
 * Respects prefers-reduced-motion (no animation if reduced)
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Immediately reveal all elements without animation
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px',  // Trigger when element is 20% into viewport (silk default)
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target); // once: true
      }
    });
  }, observerOptions);

  // Observe all .reveal elements
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Expose for dynamic content (e.g., after i18n language switch)
  window.scrollReveal = {
    observe: (el) => {
      if (el && el.classList.contains('reveal') && !el.classList.contains('revealed')) {
        observer.observe(el);
      }
    },
    observeAll: () => {
      document.querySelectorAll('.reveal:not(.revealed)').forEach(el => observer.observe(el));
    }
  };
})();