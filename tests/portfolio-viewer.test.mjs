import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const dataSource = await readFile(new URL('../js/portfolio-data.js', import.meta.url), 'utf8').catch(() => '');
const viewerSource = await readFile(new URL('../js/portfolio-viewer.js', import.meta.url), 'utf8').catch(() => '');
const context = vm.createContext({});
if (dataSource) vm.runInContext(dataSource, context);
if (viewerSource) vm.runInContext(viewerSource, context);

const projects = context.SysEraPortfolioProjects;
const viewer = context.SysEraPortfolioViewer;

test('portfolio data defines every project once with four complete images', () => {
  assert.ok(Array.isArray(projects));
  assert.ok(projects.length >= 2);

  projects.forEach((project) => {
    assert.match(project.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(project.number && project.name && project.category && project.description && project.liveUrl);
    assert.ok(Array.isArray(project.capabilities) && project.capabilities.length > 0);
    assert.equal(project.images.length, 4);
    project.images.forEach((image) => {
      assert.ok(image.src.startsWith('assets/images/portfolio/'));
      assert.ok(image.alt);
    });
  });
});

test('Al Waylia is available as project 03 with its four ecommerce views', () => {
  const project = projects.find((item) => item.id === 'alwaylia');

  assert.ok(project);
  assert.equal(project.number, '03');
  assert.equal(project.name, 'Al Waylia');
  assert.equal(project.category, 'E-COMMERCE EXPERIENCE');
  assert.equal(project.liveUrl, 'https://alwaylia.com/');
  assert.deepEqual(Array.from(project.capabilities), ['E-COMMERCE', 'WOOCOMMERCE', 'WORDPRESS']);
  assert.deepEqual(Array.from(project.images, (image) => image.src), [
    'assets/images/portfolio/alwaylia-home.webp',
    'assets/images/portfolio/alwaylia-shop.webp',
    'assets/images/portfolio/alwaylia-collection.webp',
    'assets/images/portfolio/alwaylia-product-detail.webp'
  ]);
});

test('renderProjects derives accessible tabs and panels from portfolio data', () => {
  const tabsHost = { innerHTML: '' };
  const panelsHost = { innerHTML: '' };
  const root = {
    querySelector: (selector) => selector === '[data-project-tabs]' ? tabsHost : panelsHost
  };

  viewer.renderProjects(root, projects);

  projects.forEach((project, index) => {
    const active = index === 0;
    assert.match(tabsHost.innerHTML, new RegExp(`id="work-tab-${project.id}"`));
    assert.match(tabsHost.innerHTML, new RegExp(`aria-controls="work-panel-${project.id}"`));
    assert.match(tabsHost.innerHTML, new RegExp(`data-project-tab="${project.id}"`));
    assert.match(panelsHost.innerHTML, new RegExp(`id="work-panel-${project.id}"`));
    assert.match(panelsHost.innerHTML, new RegExp(`aria-labelledby="work-tab-${project.id}"`));
    assert.match(panelsHost.innerHTML, new RegExp(`data-project-panel="${project.id}"`));
    assert.equal((panelsHost.innerHTML.split(project.liveUrl).length - 1), 2);
    assert.equal((panelsHost.innerHTML.match(new RegExp(`data-project-image="${project.id}"`, 'g')) ?? []).length, 4);
    const tabMarkup = tabsHost.innerHTML.match(new RegExp(`<button[^>]*data-project-tab="${project.id}"[^>]*>`))?.[0] ?? '';
    assert.match(tabMarkup, new RegExp(`aria-selected="${active}"`));
  });

  assert.equal((tabsHost.innerHTML.match(/role="tab"/g) ?? []).length, projects.length);
  assert.equal((panelsHost.innerHTML.match(/role="tabpanel"/g) ?? []).length, projects.length);
  assert.equal((panelsHost.innerHTML.match(/<img\b/g) ?? []).length, projects.length * 4);
  assert.equal((panelsHost.innerHTML.match(/\shidden/g) ?? []).length, projects.length - 1);
});

test('activateProject keeps a single tab and project panel active', () => {
  const attributes = new Map();
  const makeTab = (id) => ({
    dataset: { projectTab: id },
    classList: { toggle: (name, active) => attributes.set(`${id}:${name}`, active) },
    setAttribute: (name, value) => attributes.set(`${id}:${name}`, value)
  });
  const makePanel = (id) => ({ dataset: { projectPanel: id }, hidden: false });
  const ids = projects.map((project) => project.id);
  const tabs = ids.map(makeTab);
  const panels = ids.map(makePanel);
  const root = {
    querySelectorAll: (selector) => selector === '[data-project-tab]' ? tabs : panels
  };

  viewer.activateProject(root, ids.at(-1));

  ids.forEach((id, index) => {
    const active = index === ids.length - 1;
    assert.equal(attributes.get(`${id}:aria-selected`), String(active));
    assert.equal(attributes.get(`${id}:tabindex`), active ? '0' : '-1');
    assert.equal(panels[index].hidden, !active);
  });
});

test('getNextProjectId supports wrapping arrow keys and tablist boundaries', () => {
  const ids = projects.map((project) => project.id);

  assert.equal(viewer.getNextProjectId(ids, ids[0], 'ArrowRight'), ids[1]);
  assert.equal(viewer.getNextProjectId(ids, ids.at(-1), 'ArrowRight'), ids[0]);
  assert.equal(viewer.getNextProjectId(ids, ids[0], 'ArrowLeft'), ids.at(-1));
  assert.equal(viewer.getNextProjectId(ids, ids[1], 'Home'), ids[0]);
  assert.equal(viewer.getNextProjectId(ids, ids[0], 'End'), ids.at(-1));
});

test('shouldShowScrollCue only signals when hidden projects remain to the right', () => {
  const { shouldShowScrollCue } = viewer;

  assert.equal(shouldShowScrollCue({ scrollWidth: 720, clientWidth: 360, scrollLeft: 0 }), true);
  assert.equal(shouldShowScrollCue({ scrollWidth: 720, clientWidth: 360, scrollLeft: 180 }), true);
  assert.equal(shouldShowScrollCue({ scrollWidth: 720, clientWidth: 360, scrollLeft: 360 }), false);
  assert.equal(shouldShowScrollCue({ scrollWidth: 360, clientWidth: 360, scrollLeft: 0 }), false);
});
