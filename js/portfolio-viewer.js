(function attachPortfolioViewer(global) {
  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const renderTab = (project, index) => {
    const active = index === 0;
    return `
      <button class="work-tab${active ? ' active' : ''}" type="button" role="tab" id="work-tab-${escapeHtml(project.id)}" aria-controls="work-panel-${escapeHtml(project.id)}" aria-selected="${active}" tabindex="${active ? '0' : '-1'}" data-project-tab="${escapeHtml(project.id)}">
        <span>${escapeHtml(project.number)} /</span><strong>${escapeHtml(project.name.toUpperCase())}</strong>
      </button>`;
  };

  const renderImage = (project, image) => {
    const position = image.objectPosition ? ` style="object-position: ${escapeHtml(image.objectPosition)}"` : '';
    return `
      <span class="work-board-cell" data-project-image="${escapeHtml(project.id)}">
        <img class="work-board-image" src="${escapeHtml(image.src)}" width="${escapeHtml(image.width)}" height="${escapeHtml(image.height)}" loading="lazy" decoding="async" alt="${escapeHtml(image.alt)}"${position} />
      </span>`;
  };

  const renderPlaceholderPanel = (project, index) => `
    <article class="work-project work-project-placeholder" id="work-panel-${escapeHtml(project.id)}" role="tabpanel" aria-labelledby="work-tab-${escapeHtml(project.id)}" data-project-panel="${escapeHtml(project.id)}"${index === 0 ? '' : ' hidden'}>
      <span class="work-project-number" aria-hidden="true">${escapeHtml(project.number)}</span>
      <div class="work-project-info">
        <p class="work-project-meta reveal work-reveal work-reveal-meta"><span>${escapeHtml(project.category)}</span></p>
        <h3 class="reveal work-reveal work-reveal-title">More work. On the way.</h3>
        <p class="work-project-description reveal work-reveal work-reveal-copy">${escapeHtml(project.description)}</p>
      </div>
    </article>`;

  const renderProjectPanel = (project, index) => `
    <article class="work-project work-project-featured" id="work-panel-${escapeHtml(project.id)}" role="tabpanel" aria-labelledby="work-tab-${escapeHtml(project.id)}" data-project-panel="${escapeHtml(project.id)}"${index === 0 ? '' : ' hidden'}>
      <span class="work-project-number" aria-hidden="true">${escapeHtml(project.number)}</span>
      <div class="work-project-info">
        <p class="work-project-meta reveal work-reveal work-reveal-meta"><span>${escapeHtml(project.number)}</span> / ${escapeHtml(project.category)}</p>
        <h3 class="reveal work-reveal work-reveal-title">${escapeHtml(project.name)}</h3>
        <p class="work-project-description reveal work-reveal work-reveal-copy">${escapeHtml(project.description)}</p>
        <ul class="work-capabilities reveal work-reveal work-reveal-capabilities" aria-label="${escapeHtml(project.name)} project capabilities">
          ${project.capabilities.map((capability) => `<li>${escapeHtml(capability)}</li>`).join('')}
        </ul>
        <a class="work-live-link reveal work-reveal work-reveal-action" href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noopener noreferrer">
          <span>VIEW LIVE</span><span class="work-live-link-marker" aria-hidden="true"></span><span aria-hidden="true">↗</span>
        </a>
      </div>
      <div class="work-visual-wrap reveal work-reveal work-reveal-visual">
        <a class="work-visual" href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noopener noreferrer" aria-label="View the live ${escapeHtml(project.name)} website in a new tab">
          <div class="work-frame-head" aria-hidden="true">
            <span>${escapeHtml(project.name.toUpperCase())}</span>
            <span class="work-live-state"><i></i> LIVE SITE <b>↗</b></span>
          </div>
          <div class="work-board">
            ${project.images.map((image) => renderImage(project, image)).join('')}
            <i class="work-board-node" aria-hidden="true"></i>
          </div>
          <div class="work-frame-foot" aria-hidden="true">
            <span>${escapeHtml(project.number)} / DESKTOP EXPERIENCE</span>
            <span>1680 / VIEWPORT</span>
          </div>
          <span class="work-frame-corner work-frame-corner-one" aria-hidden="true"></span>
          <span class="work-frame-corner work-frame-corner-two" aria-hidden="true"></span>
        </a>
      </div>
    </article>`;

  const renderPanel = (project, index) => project.placeholder
    ? renderPlaceholderPanel(project, index)
    : renderProjectPanel(project, index);

  const renderProjects = (root, projects) => {
    const tabsHost = root?.querySelector('[data-project-tabs]');
    const panelsHost = root?.querySelector('[data-project-panels]');
    if (!tabsHost || !panelsHost || !projects?.length) return;

    tabsHost.innerHTML = projects.map(renderTab).join('');
    panelsHost.innerHTML = projects.map(renderPanel).join('');
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

  const getNextProjectId = (projectIds, currentId, key) => {
    if (!projectIds.length) return currentId;
    const currentIndex = Math.max(0, projectIds.indexOf(currentId));
    if (key === 'Home') return projectIds[0];
    if (key === 'End') return projectIds[projectIds.length - 1];
    if (key === 'ArrowRight') return projectIds[(currentIndex + 1) % projectIds.length];
    if (key === 'ArrowLeft') return projectIds[(currentIndex - 1 + projectIds.length) % projectIds.length];
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

    const isDesktop = () => global.matchMedia
      ? global.matchMedia('(min-width: 761px)').matches
      : global.innerWidth > 760;

    const getTabStarts = (tabs) => {
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
      const contentEnd = lastTabBounds.right - listBounds.left + tablist.scrollLeft;
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
      const atStart = tablist.scrollLeft <= 1;
      const atEnd = tablist.scrollLeft >= maxScrollLeft - 1;
      const listBounds = tablist.getBoundingClientRect();

      if (cue) cue.hidden = !shouldShowScrollCue(tablist);
      if (previousButton) previousButton.disabled = atStart;
      if (nextButton) nextButton.disabled = atEnd;
      shell?.classList.toggle('has-overflow-left', !atStart);
      shell?.classList.toggle('has-overflow-right', !atEnd);

      tablist.querySelectorAll('[data-project-tab]').forEach((tab) => {
        const bounds = tab.getBoundingClientRect();
        const isPartiallyClipped = bounds.left < listBounds.left - 1 || bounds.right > listBounds.right + 1;
        tab.classList.toggle('is-partially-clipped', isDesktop() && isPartiallyClipped);
      });
    };

    const scrollToAdjacentTab = (direction) => {
      const tabs = Array.from(tablist.querySelectorAll('[data-project-tab]'));
      if (!tabs.length) return;

      const tabStarts = getTabStarts(tabs);
      const currentScrollLeft = tablist.scrollLeft;
      if (direction > 0) {
        const nextStart = tabStarts.find((start) => start > currentScrollLeft + 1);
        if (nextStart === undefined) return;
        tablist.scrollTo({
          left: Math.min(nextStart, tablist.scrollWidth - tablist.clientWidth),
          behavior: global.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      } else {
        const previousStart = tabStarts.slice().reverse().find((start) => start < currentScrollLeft - 1);
        if (previousStart === undefined) return;
        tablist.scrollTo({
          left: previousStart,
          behavior: global.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
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

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activateProject(viewer, tab.dataset.projectTab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextId = getNextProjectId(projectIds, tab.dataset.projectTab, event.key);
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
