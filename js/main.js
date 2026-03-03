/**
 * Restored Fountain Tabernacle - Landing Page
 * Main JavaScript for slideshow, scroll animations, and interactions
 */

(function () {
  'use strict';

  // ============================================
  // Hero Slideshow (slow fade, no sliding)
  // ============================================

  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 1) {
    let currentIndex = 0;
    const SLIDE_INTERVAL = 6000; // 6 seconds per slide

    function nextSlide() {
      slides[currentIndex].classList.remove('hero-slide--active');
      currentIndex = (currentIndex + 1) % slides.length;
      slides[currentIndex].classList.add('hero-slide--active');
    }

    setInterval(nextSlide, SLIDE_INTERVAL);
  }

  // ============================================
  // Scroll-triggered animations (Intersection Observer)
  // ============================================

  const animatedElements = document.querySelectorAll(
    '.event-banner__content, .welcome__grid, .services__grid, .about-preview__content, ' +
    '.home-blog__list, .social__content, .service-card, .section-title'
  );

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px', // Trigger when 80px from viewport bottom
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optionally stop observing after animation
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add animate-on-scroll class and observe
  animatedElements.forEach((el) => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });

  // ============================================
  // Header scroll effect
  // ============================================

  const siteHeader = document.getElementById('site-header');
  if (siteHeader) {
    function updateHeader() {
      const isInternalPage = document.querySelector('.page-content');
      siteHeader.classList.toggle('scrolled', window.scrollY > 50 || isInternalPage);
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  // ============================================
  // Mobile menu toggle
  // ============================================

  const menuToggle = document.querySelector('.site-header__toggle');
  const siteNav = document.querySelector('.site-header__nav');
  const menuOverlay = document.querySelector('.site-header__overlay');

  function closeMenu() {
    if (menuToggle && siteNav) {
      menuToggle.setAttribute('aria-expanded', 'false');
      siteNav.classList.remove('open');
      if (menuOverlay) menuOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function openMenu() {
    if (menuToggle && siteNav) {
      menuToggle.setAttribute('aria-expanded', 'true');
      siteNav.classList.add('open');
      if (menuOverlay) menuOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu();
      else openMenu();
    });
    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
    if (menuOverlay) {
      menuOverlay.addEventListener('click', closeMenu);
    }
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  // ============================================
  // Smooth scroll for anchor links
  // ============================================

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      if (targetId === '#join') {
        e.preventDefault();
        openJoinModal();
        return;
      }
      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ============================================
  // Join the Family Modal
  // ============================================

  function openJoinModal() {
    const modal = document.getElementById('modal-join-family');
    if (modal) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = scrollbarWidth + 'px';
      document.body.style.overflow = 'hidden';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeJoinModal() {
    const modal = document.getElementById('modal-join-family');
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  document.querySelectorAll('[data-modal-open="join-family"]').forEach((btn) => {
    btn.addEventListener('click', openJoinModal);
  });

  document.querySelectorAll('[data-modal-close="join-family"]').forEach((el) => {
    el.addEventListener('click', closeJoinModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal-join-family');
      if (modal && modal.classList.contains('is-open')) closeJoinModal();
    }
  });

  // Open modal on load if hash is #join
  if (window.location.hash === '#join') {
    openJoinModal();
    history.replaceState(null, '', window.location.pathname);
  }

  // Join the Family form submit
  const joinForm = document.getElementById('join-family-form');
  if (joinForm && typeof Swal !== 'undefined') {
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      closeJoinModal();
      Swal.fire({
        title: 'Submitted!',
        text: "Thank you! We'll be in touch soon.",
        icon: 'success',
        confirmButtonColor: '#c9a227'
      });
      joinForm.reset();
    });
  }

  // Contact / Connect With Us form submit (home + contact page)
  const contactForm = document.getElementById('contact-form');
  if (contactForm && typeof Swal !== 'undefined') {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const db = firebase && firebase.firestore ? firebase.firestore() : null;
      if (!db) {
        Swal.fire({
          title: 'Unable to send',
          text: 'We could not connect to the server. Please try again later.',
          icon: 'error',
          confirmButtonColor: '#c9a227'
        });
        return;
      }

      const formData = new FormData(contactForm);
      const doc = {
        name: (formData.get('name') || '').toString().trim(),
        email: (formData.get('email') || '').toString().trim(),
        phone: (formData.get('phone') || '').toString().trim(),
        message: (formData.get('message') || '').toString().trim(),
        page: window.location.pathname || 'index',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'new'
      };

      try {
        await db.collection('contactMessages').add(doc);
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Unable to send',
          text: 'We could not save your message. Please try again.',
          icon: 'error',
          confirmButtonColor: '#c9a227'
        });
        return;
      }

      Swal.fire({
        title: 'Message Sent!',
        text: "Thank you! We'll get back to you soon.",
        icon: 'success',
        confirmButtonColor: '#c9a227'
      });
      contactForm.reset();
    });
  }

})();
