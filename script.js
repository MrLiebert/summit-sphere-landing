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
   1. NAVBAR — Scroll-aware sticky
   ================================================ */
(function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  let lastScrollY = 0;

  const updateNavbar = () => {
    const scrollY = window.scrollY;

    if (scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
  };

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();
})();


/* ================================================
   2. MOBILE MENU
   ================================================ */
(function initMobileMenu() {
  const toggle = $('#menu-toggle');
  const menu = $('#mobile-menu');
  const body = document.body;
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
  const openBtns = [
    $('#academia-btn'),
    $('#academia-btn-mobile'),
    ...$$('.academia-footer-btn')
  ].filter(Boolean);
  const closeBtn = $('#modal-close-btn');
  const backdrop = $('#modal-backdrop');
  const subscribeBtn = $('#academy-subscribe');
  const emailInput = $('#academy-email');

  if (!modal) return;

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
      subscribeBtn.style.background = 'var(--gold)';
      subscribeBtn.style.color = 'var(--obsidian)';
      emailInput.value = '';
    });
  }
})();


/* ================================================
   5. INTERSECTION OBSERVER — Scroll Animations
   ================================================ */
(function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, observerOptions);

  // Apply reveal classes programmatically
  const revealSelectors = [
    { selector: '.section-header', className: 'reveal' },
    { selector: '.service-card', className: 'reveal' },
    { selector: '.team-card', className: 'reveal' },
    { selector: '.process-step', className: 'reveal' },
    { selector: '.testimonial-card', className: 'reveal' },
    { selector: '.value-item', className: 'reveal' },
    { selector: '.stat-item', className: '' }, // already has CSS animations
  ];

  revealSelectors.forEach(({ selector, className }) => {
    $$(selector).forEach((el, index) => {
      if (className && !el.classList.contains(className)) {
        el.classList.add(className);
        // Stagger siblings
        el.style.transitionDelay = `${index * 80}ms`;
        observer.observe(el);
      }
    });
  });

  // Also observe any existing .reveal elements
  $$('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic validation
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

    // Loading state
    setSubmitLoading(true);

    // Collect form data
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

      // Success state
      form.style.display = 'none';
      if (successMsg) {
        successMsg.classList.remove('hidden');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

    } catch (error) {
      console.error('[Contact Form] Error:', error);
      setSubmitLoading(false);
      submitText.textContent = 'Error — Intenta de nuevo';
    }
  });

  function setSubmitLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (loading) {
      submitText.textContent = 'Enviando...';
      submitArrow?.classList.add('hidden');
      submitSpinner?.classList.remove('hidden');
    } else {
      submitText.textContent = 'Enviar Consulta';
      submitArrow?.classList.remove('hidden');
      submitSpinner?.classList.add('hidden');
    }
  }

  function shakeField(el) {
    if (!el) return;
    el.closest('.form-field').style.animation = 'none';
    el.closest('.form-field').style.borderColor = 'rgba(184,50,50,0.5)';
    setTimeout(() => {
      el.closest('.form-field').style.borderColor = '';
    }, 2000);
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
          const href = link.getAttribute('href');
          link.classList.toggle('text-gold', href === `#${id}`);
          link.classList.toggle('text-slate', href !== `#${id}`);
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
   9. COUNTER ANIMATION for stats
   ================================================ */
(function initCounters() {
  const stats = $$('.stat-item p:first-child');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const rawText = el.textContent.trim();
      const prefix = rawText.startsWith('+') ? '+' : '';
      const suffix = rawText.includes('%') ? '%' : '';
      const num = parseInt(rawText.replace(/[^0-9]/g, ''), 10);

      if (isNaN(num)) return;

      animateCounter(el, 0, num, 1600, prefix, suffix);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => counterObserver.observe(stat));

  function animateCounter(el, start, end, duration, prefix, suffix) {
    const startTime = performance.now();

    const tick = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      el.textContent = prefix + current + suffix;

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
