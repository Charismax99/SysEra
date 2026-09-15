(function attachViewRouter(global) {
  const supportedRoutes = new Set(['about', 'services', 'process', 'technology', 'contact']);

  const resolveView = (hash) => {
    const route = String(hash || '').replace(/^#/, '').toLowerCase();
    return supportedRoutes.has(route)
      ? { mode: 'focused', route }
      : { mode: 'home', route: null };
  };

  const buildViewUrl = (route, location) => {
    const baseUrl = `${location.pathname}${location.search}`;
    return route ? `${baseUrl}#${route}` : baseUrl;
  };

  const shouldUseInPageNavigation = ({ isFocused, hasViewRoute, hash }) => (
    !isFocused && !hasViewRoute && /^#[a-z][\w-]*$/i.test(hash)
  );

  const applyViewState = (view, elements) => {
    const { sections, main, body, links } = elements;
    const isFocused = view.mode === 'focused';

    sections.forEach((section) => {
      const isActive = !isFocused || section.id === view.route;
      section.hidden = !isActive;

      if (isFocused && isActive) {
        section.querySelectorAll('.reveal').forEach((item) => item.classList.add('visible'));
      }
    });

    main.classList.toggle('focused-view', isFocused);
    body.classList.toggle('has-focused-view', isFocused);
    main.dataset.activeView = view.route || 'home';

    links.forEach((link) => {
      const isCurrent = link.dataset.viewRoute === (view.route || 'home');
      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  global.SysEraViewRouter = {
    applyViewState,
    buildViewUrl,
    resolveView,
    shouldUseInPageNavigation
  };
})(globalThis);
