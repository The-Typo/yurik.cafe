(() => {
  'use strict';

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.site-nav__links');
  const navOverlay = document.querySelector('.nav-overlay');
  const backToTop = document.querySelector('.back-to-top');

  function toggleNav() {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
    if (navOverlay) navOverlay.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeNav() {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (navOverlay) navOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (navToggle) {
    navToggle.addEventListener('click', toggleNav);
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', closeNav);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  function handleScroll() {
    if (backToTop) {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
})();
