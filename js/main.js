const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const hero = document.querySelector('.hero');
const revealItems = document.querySelectorAll('.reveal');
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const main = document.getElementById('home');
const viewSections = main ? Array.from(main.children).filter((child) => child.tagName === 'SECTION') : [];
const primaryViewLinks = document.querySelectorAll('.site-header [data-view-route], .site-footer [data-view-route]');
const currentViewLinks = document.querySelectorAll('.site-nav [data-view-route], .footer-nav [data-view-route]');
const viewRouter = window.SysEraViewRouter;
const mobileHeaderQuery = window.matchMedia('(max-width: 760px)');
const MOBILE_HEADER_SCROLL_THRESHOLD = 12;
let scrollFrame = null;
let headerScrollAnchor = window.scrollY;
let viewTransitionTimer = null;

const setMobileHeaderVisibility = () => {
  if (!header) return;

  const currentScrollY = window.scrollY;
  const menuIsOpen = siteNav?.classList.contains('open');
  const headerHasFocus = header.contains(document.activeElement);

  if (!mobileHeaderQuery.matches || currentScrollY <= 24 || menuIsOpen || headerHasFocus) {
    header.classList.remove('header-hidden');
    headerScrollAnchor = currentScrollY;
    return;
  }

  const scrollDelta = currentScrollY - headerScrollAnchor;
  if (Math.abs(scrollDelta) < MOBILE_HEADER_SCROLL_THRESHOLD) return;

  header.classList.toggle('header-hidden', scrollDelta > 0);
  headerScrollAnchor = currentScrollY;
};

const setHeaderState = () => {
  if (!header) return;

  const scrollProgress = Math.min(window.scrollY / 140, 1);
  header.style.setProperty('--nav-compress', scrollProgress.toFixed(3));
  header.classList.toggle('scrolled', scrollProgress > 0.08);

  if (hero) {
    hero.style.setProperty('--hero-depth', `${Math.min(window.scrollY * 0.08, 34).toFixed(1)}px`);
  }

  setMobileHeaderVisibility();
};

const requestScrollUpdate = () => {
  if (scrollFrame !== null) return;

  scrollFrame = window.requestAnimationFrame(() => {
    setHeaderState();
    scrollFrame = null;
  });
};

const applyCurrentView = (view, { focusHeading = false, transition = false } = {}) => {
  if (!viewRouter || !main) return;

  const render = () => {
    viewRouter.applyViewState(view, {
      sections: viewSections,
      main,
      body: document.body,
      links: currentViewLinks
    });

    window.scrollTo(0, 0);
    header?.classList.remove('header-hidden');
    headerScrollAnchor = 0;
    setHeaderState();

    if (focusHeading) {
      const activeSection = view.mode === 'focused'
        ? viewSections.find((section) => section.id === view.route)
        : viewSections[0];
      const heading = activeSection?.querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }

    requestAnimationFrame(() => main.classList.remove('view-transitioning'));
  };

  if (!transition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    render();
    return;
  }

  window.clearTimeout(viewTransitionTimer);
  main.classList.add('view-transitioning');
  viewTransitionTimer = window.setTimeout(render, 120);
};

const initViewNavigation = () => {
  if (!viewRouter || !main) return;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  primaryViewLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const route = link.dataset.viewRoute;
      const view = viewRouter.resolveView(route === 'home' ? '' : `#${route}`);
      event.preventDefault();

      history.pushState({ view: view.route || 'home' }, '', viewRouter.buildViewUrl(view.route, window.location));
      applyCurrentView(view, { focusHeading: true, transition: true });
    });
  });

  main.querySelectorAll('a[href^="#"]:not([data-view-route])').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href') || '';
      const useInPageNavigation = viewRouter.shouldUseInPageNavigation({
        isFocused: main.classList.contains('focused-view'),
        hasViewRoute: link.hasAttribute('data-view-route'),
        hash
      });

      if (!useInPageNavigation) return;

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ block: 'start' });
    });
  });

  window.addEventListener('popstate', () => {
    applyCurrentView(viewRouter.resolveView(window.location.hash), { transition: true });
  });

  window.addEventListener('hashchange', () => {
    applyCurrentView(viewRouter.resolveView(window.location.hash), { transition: true });
  });
};

if (viewRouter && main) {
  const initialView = viewRouter.resolveView(window.location.hash);
  if (window.location.hash === '#home') {
    history.replaceState({ view: 'home' }, '', viewRouter.buildViewUrl(null, window.location));
  }
  applyCurrentView(initialView);
}

const initNavigation = () => {
  if (!navToggle || !siteNav) return;

  const closeMenu = () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    siteNav.classList.remove('open');
  };

  navToggle.addEventListener('click', (event) => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
    siteNav.classList.toggle('open', !isOpen);
    header?.classList.remove('header-hidden');

    if (isOpen && event.detail > 0) navToggle.blur();
  });

  header?.addEventListener('focusin', () => header.classList.remove('header-hidden'));

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteNav.classList.contains('open')) {
      closeMenu();
      navToggle.focus();
    }
  });
};

const initHeroInteraction = () => {
  if (!hero) return;

  const supportsPointerEffect = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!supportsPointerEffect || prefersReducedMotion) return;

  let pointerFrame = null;
  let pointerX = 0;
  let pointerY = 0;

  hero.addEventListener('pointerenter', () => hero.classList.add('pointer-active'));
  hero.addEventListener('pointerleave', () => hero.classList.remove('pointer-active'));
  hero.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY - hero.getBoundingClientRect().top;

    if (pointerFrame !== null) return;
    pointerFrame = window.requestAnimationFrame(() => {
      hero.style.setProperty('--hero-pointer-x', `${pointerX}px`);
      hero.style.setProperty('--hero-pointer-y', `${pointerY}px`);
      pointerFrame = null;
    });
  }, { passive: true });
};

const initRevealObserver = () => {
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
};

const setStatus = (type, message) => {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.remove('error', 'success');
  if (type) {
    formStatus.classList.add(type);
  }
};

const initForm = () => {
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const message = String(formData.get('message') || '').trim();

  if (!name || !email || !phone || !message) {
      setStatus('error', 'Please complete all required fields.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setStatus('error', 'Please enter a valid email address.');
      return;
    }

    const phonePattern = /^[+\d][\d\s().-]{7,}$/;

  if (!phonePattern.test(phone)) {
  setStatus('error', 'Please enter a valid phone or WhatsApp number.');
  return;
}

    
    if (message.length < 10) {
      setStatus('error', 'Your message should be at least 10 characters long.');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      const response = await fetch('contact/send.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: new URLSearchParams(formData).toString()
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to send your message right now.');
      }

      setStatus('success', result.message || 'Your message was sent successfully.');
      form.reset();
    } catch (error) {
      setStatus('error', error.message || 'Something went wrong. Please try again.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Send Project Brief <span aria-hidden="true">→</span>';
      }
    }
  });
};

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
window.addEventListener('load', () => {
  setHeaderState();
  initViewNavigation();
  initNavigation();
  initHeroInteraction();
  initRevealObserver();
  initForm();
});
