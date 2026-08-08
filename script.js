/**
 * Summit-Sphere — script.js
 * Vanilla JS: Navigation, Modals, Scroll Animations, Form Handling
 * Zero external dependencies
 */

'use strict';

/* ================================================
   UTILITIES
   ================================================ */
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

/* ================================================
   1. NAVBAR — Section-aware three-state sticky
   States:
     (default)      → transparent, white text  [hero]
     scrolled       → opaque dark navy          [navy sections]
     scrolled-light → opaque light              [cream/white sections]
   ================================================ */
(function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  // Sections rendered on a light background (cream / white)
  const lightSectionIds = [
    'nosotros',
    'servicios',
    'certificacion',
    'cumplimiento',
    'capacitacion',
    'comercializadora',
    'contacto'
  ];

  const lightSections = lightSectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const updateNavbar = () => {
    if (window.scrollY <= 60) {
      // At the very top — transparent over hero
      navbar.classList.remove('scrolled', 'scrolled-light');
      return;
    }

    // Which section's background sits behind the navbar band (top 80px)?
    const overLight = lightSections.some(section => {
      const { top, bottom } = section.getBoundingClientRect();
      return top <= 80 && bottom > 0;
    });

    navbar.classList.toggle('scrolled-light', overLight);
    navbar.classList.toggle('scrolled', !overLight);
  };

  window.addEventListener('scroll', updateNavbar, { passive: true });
  window.addEventListener('resize', updateNavbar, { passive: true });
  updateNavbar();
})();


/* ================================================
   2. MOBILE MENU
   ================================================ */
(function initMobileMenu() {
  const toggle = $('#menu-toggle');
  const menu = $('#mobile-menu');
  if (!toggle || !menu) return;

  let isOpen = false;

  toggle.addEventListener('click', () => {
    isOpen = !isOpen;
    menu.classList.toggle('open', isOpen);
    toggle.classList.toggle('menu-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a nav link is clicked
  $$('a, button', menu).forEach(link => {
    link.addEventListener('click', () => {
      isOpen = false;
      menu.classList.remove('open');
      toggle.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', false);
    });
  });
})();


/* ================================================
   3. SMOOTH SCROLL for anchor links
   ================================================ */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = $(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = $('#navbar')?.offsetHeight || 80;
      const targetY = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });
})();


/* ================================================
   4. ACADEMIA MODAL
   TODO: Replace modal logic with:
   - LMS subdomain redirect: window.location.href = 'https://academia.summit-sphere.com'
   - OR: Auth/registration modal connected to backend
   - Future: Integrate course catalog API endpoint here
   ================================================ */
(function initAcademiaModal() {
  const modal = $('#academia-modal');
  if (!modal) return;

  const openBtns = [
    $('#academia-btn'),
    $('#academia-btn-mobile'),
    ...$$('.academia-footer-btn')
  ].filter(Boolean);
  const closeBtn = $('#modal-close-btn');
  const backdrop = $('#modal-backdrop');
  const subscribeBtn = $('#academy-subscribe');
  const emailInput = $('#academy-email');

  const openModal = () => {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  };

  openBtns.forEach(btn => btn.addEventListener('click', openModal));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // ESC key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Academia early-access form
  if (subscribeBtn && emailInput) {
    subscribeBtn.addEventListener('click', () => {
      const email = emailInput.value.trim();

      if (!isValidEmail(email)) {
        emailInput.style.borderBottom = '1px solid red';
        emailInput.focus();
        return;
      }

      // TODO: Connect to real waitlist endpoint
      // Example: fetch('/api/waitlist', { method: 'POST', body: JSON.stringify({ email }) })
      console.log('[Academia] Waitlist signup:', email);

      subscribeBtn.textContent = '¡Listo! Te avisamos pronto ✦';
      subscribeBtn.disabled = true;
      subscribeBtn.style.background = 'var(--green)';
      subscribeBtn.style.color = 'var(--navy)';
      emailInput.value = '';
    });
  }
})();


/* ================================================
   5. INTERSECTION OBSERVER — Scroll Animations
   Reveal classes live in the markup; this only
   staggers siblings and flips them to .visible.
   ================================================ */
(function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  const revealEls = $$('.reveal, .reveal-left, .reveal-right');

  // Stagger cards that share a parent grid (capped so long grids stay snappy)
  const seen = new Map();
  revealEls.forEach(el => {
    const parent = el.parentElement;
    const index = seen.get(parent) ?? 0;
    seen.set(parent, index + 1);

    if (index > 0) {
      el.style.transitionDelay = `${Math.min(index, 6) * 70}ms`;
    }

    observer.observe(el);
  });
})();


/* ================================================
   6. CONTACT FORM
   TODO: Replace the fake submit with a real API call:
   - Option A: fetch('/api/contact', { method: 'POST', body: formData })
   - Option B: Formspree / EmailJS / Netlify Forms
   - Option C: Internal CRM integration (HubSpot, Pipedrive, etc.)
   ================================================ */
(function initContactForm() {
  const form = $('#contact-form');
  const successMsg = $('#form-success');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const submitText = $('#submit-text');
  const submitArrow = $('#submit-arrow');
  const submitSpinner = $('#submit-spinner');
  const defaultSubmitText = submitText ? submitText.textContent : 'Enviar';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('[name="email"]').value.trim();
    const nombre = form.querySelector('[name="nombre"]').value.trim();

    if (!nombre) {
      shakeField(form.querySelector('[name="nombre"]'));
      return;
    }

    if (!isValidEmail(email)) {
      shakeField(form.querySelector('[name="email"]'));
      return;
    }

    setSubmitLoading(true);

    const formData = {
      nombre,
      empresa: form.querySelector('[name="empresa"]').value.trim(),
      email,
      tema: form.querySelector('[name="tema"]').value,
      mensaje: form.querySelector('[name="mensaje"]').value.trim(),
    };

    try {
      // TODO: Replace with real API endpoint
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulated delay (remove when real API is connected)
      await new Promise(resolve => setTimeout(resolve, 1800));

      console.log('[Contact Form] Submitted:', formData);

      form.style.display = 'none';
      if (successMsg) {
        successMsg.classList.remove('hidden');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

    } catch (error) {
      console.error('[Contact Form] Error:', error);
      setSubmitLoading(false);
      if (submitText) submitText.textContent = 'Error — Intenta de nuevo';
    }
  });

  function setSubmitLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (loading) {
      if (submitText) submitText.textContent = 'Enviando...';
      submitArrow?.classList.add('hidden');
      submitSpinner?.classList.remove('hidden');
    } else {
      if (submitText) submitText.textContent = defaultSubmitText;
      submitArrow?.classList.remove('hidden');
      submitSpinner?.classList.add('hidden');
    }
  }

  function shakeField(el) {
    if (!el) return;
    const field = el.closest('.form-field');
    if (field) {
      field.style.borderColor = 'rgba(184,50,50,0.5)';
      setTimeout(() => { field.style.borderColor = ''; }, 2000);
    }
    el.focus();
  }
})();


/* ================================================
   7. YEAR IN FOOTER
   ================================================ */
(function setYear() {
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ================================================
   8. ACTIVE NAV LINK — Highlight section in view
   ================================================ */
(function initActiveNav() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    threshold: 0.4,
    rootMargin: '-80px 0px -40% 0px'
  });

  sections.forEach(section => sectionObserver.observe(section));
})();


/* ================================================
   9. COUNTER ANIMATION for the "Sobre la empresa" figures
   ================================================ */
(function initCounters() {
  const stats = $$('.stat-num');
  if (!stats.length) return;

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const rawText = el.textContent.trim();
      const prefix = rawText.startsWith('+') ? '+' : '';
      const num = parseInt(rawText.replace(/[^0-9]/g, ''), 10);

      if (isNaN(num)) return;

      animateCounter(el, 0, num, 1600, prefix);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => counterObserver.observe(stat));

  function animateCounter(el, start, end, duration, prefix) {
    const startTime = performance.now();

    const tick = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = Math.round(start + (end - start) * eased);

      el.textContent = prefix + current;

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
})();


/* ================================================
   HELPERS
   ================================================ */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
