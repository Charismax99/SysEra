(function attachPortfolioViewer(global) {
  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const projectCopy = (project, isArabic) => isArabic ? { ...project, ...project.ar } : project;
  const brandName = (name, isArabic) => isArabic && /[A-Za-z]/.test(name)
    ? `<bdi lang="en" dir="ltr">${escapeHtml(name)}</bdi>`
    : escapeHtml(name);

  const renderTab = (project, index, isArabic) => {
    const active = index === 0;
    const copy = projectCopy(project, isArabic);
    const name = isArabic ? copy.name : project.name.toUpperCase();
    return `
      <button class="work-tab${active ? ' active' : ''}" type="button" role="tab" id="work-tab-${escapeHtml(project.id)}" aria-controls="work-panel-${escapeHtml(project.id)}" aria-selected="${active}" tabindex="${active ? '0' : '-1'}" data-project-tab="${escapeHtml(project.id)}">
        ${isArabic ? `<span class="work-tab-index" dir="rtl"><bdi dir="ltr">${escapeHtml(project.number)}</bdi><span aria-hidden="true">/</span></span>` : `<span>${escapeHtml(project.number)} /</span>`}<strong>${brandName(name, isArabic)}</strong>
      </button>`;
  };

  const renderImage = (project, image, isArabic) => {
    const position = image.objectPosition ? ` style="object-position: ${escapeHtml(image.objectPosition)}"` : '';
    return `
      <span class="work-board-cell" data-project-image="${escapeHtml(project.id)}">
        <img class="work-board-image" src="${escapeHtml(isArabic ? `../${image.src}` : image.src)}" width="${escapeHtml(image.width)}" height="${escapeHtml(image.height)}" loading="lazy" decoding="async" alt="${escapeHtml(isArabic ? image.altAr || image.alt : image.alt)}"${position} />
      </span>`;
  };

  const renderPlaceholderPanel = (project, index, isArabic) => {
    const copy = projectCopy(project, isArabic);
    return `
    <article class="work-project work-project-placeholder" id="work-panel-${escapeHtml(project.id)}" role="tabpanel" aria-labelledby="work-tab-${escapeHtml(project.id)}" data-project-panel="${escapeHtml(project.id)}"${index === 0 ? '' : ' hidden'}>
      <span class="work-project-number" aria-hidden="true">${escapeHtml(project.number)}</span>
      <div class="work-project-info">
        <p class="work-project-meta reveal work-reveal work-reveal-meta"><span>${escapeHtml(copy.category)}</span></p>
        <h3 class="reveal work-reveal work-reveal-title">${isArabic ? 'المزيد من الأعمال قريبًا' : 'More work. On the way.'}</h3>
        <p class="work-project-description reveal work-reveal work-reveal-copy">${escapeHtml(copy.description)}</p>
      </div>
    </article>`;
  };

  const renderProjectPanel = (project, index, isArabic) => {
    const copy = projectCopy(project, isArabic);
    return `
    <article class="work-project work-project-featured" id="work-panel-${escapeHtml(project.id)}" role="tabpanel" aria-labelledby="work-tab-${escapeHtml(project.id)}" data-project-panel="${escapeHtml(project.id)}"${index === 0 ? '' : ' hidden'}>
      <span class="work-project-number" aria-hidden="true">${escapeHtml(project.number)}</span>
      <div class="work-project-info">
        <p class="work-project-meta reveal work-reveal work-reveal-meta"><span${isArabic ? ' dir="ltr"' : ''}>${escapeHtml(project.number)}</span> / ${escapeHtml(copy.category)}</p>
        <h3 class="reveal work-reveal work-reveal-title">${brandName(copy.name, isArabic)}</h3>
        <p class="work-project-description reveal work-reveal work-reveal-copy">${escapeHtml(copy.description)}</p>
        <ul class="work-capabilities reveal work-reveal work-reveal-capabilities" aria-label="${escapeHtml(isArabic ? `تقنيات مشروع ${copy.name}` : `${project.name} project capabilities`)}">
          ${copy.capabilities.map((capability) => `<li>${escapeHtml(capability)}</li>`).join('')}
        </ul>
        <a class="work-live-link reveal work-reveal work-reveal-action" href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noopener noreferrer">
          <span>${isArabic ? 'زيارة الموقع' : 'VIEW LIVE'}</span><span class="work-live-link-marker" aria-hidden="true"></span><span aria-hidden="true">${isArabic ? '↖' : '↗'}</span>
        </a>
      </div>
      <div class="work-visual-wrap reveal work-reveal work-reveal-visual">
        <a class="work-visual" href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(isArabic ? `فتح موقع ${copy.name} في تبويب جديد` : `View the live ${project.name} website in a new tab`)}">
          <div class="work-frame-head" aria-hidden="true">
            <span>${brandName(isArabic ? copy.name : project.name.toUpperCase(), isArabic)}</span>
            <span class="work-live-state"><i></i> ${isArabic ? 'موقع مباشر' : 'LIVE SITE'} <b>${isArabic ? '↖' : '↗'}</b></span>
          </div>
          <div class="work-board">
            ${project.images.map((image) => renderImage(project, image, isArabic)).join('')}
            <i class="work-board-node" aria-hidden="true"></i>
          </div>
          <div class="work-frame-foot" aria-hidden="true">
            <span>${isArabic ? `<bdi dir="ltr">${escapeHtml(project.number)}</bdi> / تجربة سطح المكتب` : `${escapeHtml(project.number)} / DESKTOP EXPERIENCE`}</span>
            <span>${isArabic ? '<bdi dir="ltr">1680</bdi> / عرض الشاشة' : '1680 / VIEWPORT'}</span>
          </div>
          <span class="work-frame-corner work-frame-corner-one" aria-hidden="true"></span>
          <span class="work-frame-corner work-frame-corner-two" aria-hidden="true"></span>
        </a>
      </div>
    </article>`;
  };

  const renderPanel = (project, index, isArabic) => project.placeholder
    ? renderPlaceholderPanel(project, index, isArabic)
    : renderProjectPanel(project, index, isArabic);

  const renderProjects = (root, projects) => {
    const tabsHost = root?.querySelector('[data-project-tabs]');
    const panelsHost = root?.querySelector('[data-project-panels]');
    if (!tabsHost || !panelsHost || !projects?.length) return;

    const isArabic = root.lang === 'ar';
    tabsHost.innerHTML = projects.map((project, index) => renderTab(project, index, isArabic)).join('');
    panelsHost.innerHTML = projects.map((project, index) => renderPanel(project, index, isArabic)).join('');
  };

  const activateProject = (root, projectId) => {
    if (!root || !projectId) return;

    root.querySelectorAll('[data-project-tab]').forEach((tab) => {
      const isActive = tab.dataset.projectTab === projectId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    root.querySelectorAll('[data-project-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.projectPanel !== projectId;
    });
  };

  const getNextProjectId = (projectIds, currentId, key, isRtl = false) => {
    if (!projectIds.length) return currentId;
    const currentIndex = Math.max(0, projectIds.indexOf(currentId));
    if (key === 'Home') return projectIds[0];
    if (key === 'End') return projectIds[projectIds.length - 1];
    if (key === (isRtl ? 'ArrowLeft' : 'ArrowRight')) return projectIds[(currentIndex + 1) % projectIds.length];
    if (key === (isRtl ? 'ArrowRight' : 'ArrowLeft')) return projectIds[(currentIndex - 1 + projectIds.length) % projectIds.length];
    return currentId;
  };

  const shouldShowScrollCue = ({ scrollWidth, clientWidth, scrollLeft }) => {
    const maxScrollLeft = scrollWidth - clientWidth;
    return maxScrollLeft > 1 && scrollLeft < maxScrollLeft - 1;
  };

  const bindProjectSelector = (viewer) => {
    const tablist = viewer.querySelector('[data-project-tabs]');
    const cue = viewer.querySelector('[data-project-swipe-cue]');
    const shell = viewer.querySelector('[data-project-tabs-shell]');
    const previousButton = viewer.querySelector('[data-project-scroll="previous"]');
    const nextButton = viewer.querySelector('[data-project-scroll="next"]');
    if (!tablist) return;
    const isRtl = viewer.dir === 'rtl';

    const isDesktop = () => global.matchMedia
      ? global.matchMedia('(min-width: 761px)').matches
      : global.innerWidth > 760;

    const getTabStarts = (tabs) => {
      if (isRtl) {
        const firstRight = tabs[0].getBoundingClientRect().right;
        return tabs.map((tab) => firstRight - tab.getBoundingClientRect().right);
      }
      const listBounds = tablist.getBoundingClientRect();
      return tabs.map((tab) => tab.getBoundingClientRect().left - listBounds.left + tablist.scrollLeft);
    };

    const updateTailSpace = () => {
      if (!isDesktop()) {
        tablist.style.removeProperty('--work-scroll-tail');
        return;
      }

      tablist.style.removeProperty('--work-scroll-tail');
      const tabs = Array.from(tablist.querySelectorAll('[data-project-tab]'));
      if (!tabs.length) return;

      const listBounds = tablist.getBoundingClientRect();
      const tabStarts = getTabStarts(tabs);
      const lastTabBounds = tabs[tabs.length - 1].getBoundingClientRect();
      const contentEnd = isRtl
        ? tabs[0].getBoundingClientRect().right - lastTabBounds.left
        : lastTabBounds.right - listBounds.left + tablist.scrollLeft;
      let lastPageStart = tabStarts[tabs.length - 1];

      for (let index = tabs.length - 2; index >= 0; index -= 1) {
        if (contentEnd - tabStarts[index] > tablist.clientWidth + 1) break;
        lastPageStart = tabStarts[index];
      }

      const naturalMaxScrollLeft = Math.max(0, tablist.scrollWidth - tablist.clientWidth);
      const tailSpace = Math.max(0, lastPageStart - naturalMaxScrollLeft);
      tablist.style.setProperty('--work-scroll-tail', `${tailSpace}px`);
    };

    const updateCue = () => {
      const maxScrollLeft = Math.max(0, tablist.scrollWidth - tablist.clientWidth);
      const listBounds = tablist.getBoundingClientRect();
      const tabs = Array.from(tablist.querySelectorAll('[data-project-tab]'));
      const atStart = isRtl
        ? !tabs.length || tabs[0].getBoundingClientRect().right <= listBounds.right + 1
        : tablist.scrollLeft <= 1;
      const atEnd = isRtl
        ? !tabs.length || tabs[tabs.length - 1].getBoundingClientRect().left >= listBounds.left - 1
        : tablist.scrollLeft >= maxScrollLeft - 1;

      if (cue) cue.hidden = isRtl ? atEnd : !shouldShowScrollCue(tablist);
      if (previousButton) previousButton.disabled = atStart;
      if (nextButton) nextButton.disabled = atEnd;
      shell?.classList.toggle('has-overflow-left', isRtl ? !atEnd : !atStart);
      shell?.classList.toggle('has-overflow-right', isRtl ? !atStart : !atEnd);

      tabs.forEach((tab) => {
        const bounds = tab.getBoundingClientRect();
        const isPartiallyClipped = bounds.left < listBounds.left - 1 || bounds.right > listBounds.right + 1;
        tab.classList.toggle('is-partially-clipped', isDesktop() && isPartiallyClipped);
      });
    };

    const scrollToAdjacentTab = (direction) => {
      const tabs = Array.from(tablist.querySelectorAll('[data-project-tab]'));
      if (!tabs.length) return;

      const tabStarts = getTabStarts(tabs);
      const listBounds = tablist.getBoundingClientRect();
      const currentScrollLeft = isRtl
        ? tabs[0].getBoundingClientRect().right - listBounds.right
        : tablist.scrollLeft;
      if (direction > 0) {
        const nextStart = tabStarts.find((start) => start > currentScrollLeft + 1);
        if (nextStart === undefined) return;
        const behavior = global.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        if (isRtl) tablist.scrollBy({ left: currentScrollLeft - nextStart, behavior });
        else tablist.scrollTo({ left: Math.min(nextStart, tablist.scrollWidth - tablist.clientWidth), behavior });
      } else {
        const previousStart = tabStarts.slice().reverse().find((start) => start < currentScrollLeft - 1);
        if (previousStart === undefined) return;
        const behavior = global.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        if (isRtl) tablist.scrollBy({ left: currentScrollLeft - previousStart, behavior });
        else tablist.scrollTo({ left: previousStart, behavior });
      }
    };

    previousButton?.addEventListener('click', () => scrollToAdjacentTab(-1));
    nextButton?.addEventListener('click', () => scrollToAdjacentTab(1));
    tablist.addEventListener('scroll', updateCue, { passive: true });
    global.addEventListener('resize', () => {
      updateTailSpace();
      updateCue();
    });
    updateTailSpace();
    global.requestAnimationFrame(updateCue);
  };

  const bindProjectTabs = (viewer) => {
    const tabs = Array.from(viewer.querySelectorAll('[data-project-tab]'));
    const projectIds = tabs.map((tab) => tab.dataset.projectTab);
    const isRtl = viewer.dir === 'rtl';

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activateProject(viewer, tab.dataset.projectTab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextId = getNextProjectId(projectIds, tab.dataset.projectTab, event.key, isRtl);
        activateProject(viewer, nextId);
        tabs.find((item) => item.dataset.projectTab === nextId)?.focus();
      });
    });
  };

  const init = (scope, projects = global.SysEraPortfolioProjects) => {
    scope.querySelectorAll('[data-portfolio-viewer]').forEach((viewer) => {
      renderProjects(viewer, projects);
      bindProjectTabs(viewer);
      bindProjectSelector(viewer);
    });
  };

  global.SysEraPortfolioViewer = { activateProject, getNextProjectId, init, renderProjects, shouldShowScrollCue };

  if (typeof document !== 'undefined') init(document);
})(globalThis);
