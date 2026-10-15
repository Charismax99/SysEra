import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const dataSource = await readFile(new URL('../js/portfolio-data.js', import.meta.url), 'utf8');
const viewerSource = await readFile(new URL('../js/portfolio-viewer.js', import.meta.url), 'utf8');
const arabicHtml = await readFile(new URL('../ar/index.html', import.meta.url), 'utf8');
const context = vm.createContext({ document: { documentElement: { lang: 'en' }, querySelectorAll: () => [] } });
vm.runInContext(dataSource, context);
vm.runInContext(viewerSource, context);

const projects = context.SysEraPortfolioProjects;
const viewer = context.SysEraPortfolioViewer;

test('every current project state has Arabic copy and every image has Arabic alt text', () => {
  assert.equal(projects.length, 10);
  projects.forEach((project) => {
    assert.ok(project.ar?.category);
    assert.ok(project.ar?.description);
    assert.ok(project.ar?.name);
    if (project.placeholder) {
      assert.equal(project.images.length, 0);
    } else {
      assert.equal(project.ar.capabilities.length, project.capabilities.length);
      project.images.forEach((image) => assert.ok(image.altAr));
    }
  });
});

test('Arabic Selected Work is an RTL section with localized static controls', () => {
  const section = arabicHtml.match(/<section[^>]*id="selected-work"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(section, /lang="ar" dir="rtl"/);
  assert.match(section, /اختر مشروعًا/);
  assert.match(section, /aria-label="المشاريع المختارة"/);
  assert.doesNotMatch(section, /SELECT PROJECT|SWIPE →|SELECTED WORK/);
});

test('Arabic rendering localizes featured and upcoming panels without changing English', () => {
  const render = (lang) => {
    const tabsHost = { innerHTML: '' };
    const panelsHost = { innerHTML: '' };
    const root = {
      lang,
      querySelector: (selector) => selector === '[data-project-tabs]' ? tabsHost : panelsHost
    };
    viewer.renderProjects(root, projects);
    return `${tabsHost.innerHTML}${panelsHost.innerHTML}`;
  };
  const english = render('en');
  const arabic = render('ar');
  assert.match(arabic, /زيارة الموقع/);
  assert.match(arabic, /المزيد من الأعمال قريبًا/);
  assert.match(arabic, /موقع مباشر/);
  assert.match(arabic, /alt="الصفحة الرئيسية لموقع GoPureX"/);
  projects.forEach((project) => {
    assert.match(arabic, new RegExp(`id="work-panel-${project.id}"`));
    assert.ok(arabic.includes(project.ar.description), `${project.id} Arabic description should render`);
    assert.ok(arabic.includes(project.ar.category), `${project.id} Arabic category should render`);
    if (!project.placeholder) {
      assert.equal((arabic.split(project.liveUrl).length - 1), 2);
      project.ar.capabilities.forEach((capability) => {
        assert.ok(arabic.includes(capability), `${project.id} Arabic capability should render`);
      });
      project.images.forEach((image) => {
        assert.ok(arabic.includes(image.altAr), `${project.id} Arabic image description should render`);
      });
    }
  });
  assert.match(english, /VIEW LIVE/);
  assert.match(english, /More work\. On the way\./);
  assert.doesNotMatch(english, /زيارة الموقع/);
});

test('RTL arrow keys follow the visual project order', () => {
  const ids = projects.map((project) => project.id);
  assert.equal(viewer.getNextProjectId(ids, ids[0], 'ArrowLeft', true), ids[1]);
  assert.equal(viewer.getNextProjectId(ids, ids[0], 'ArrowRight', true), ids.at(-1));
  assert.equal(viewer.getNextProjectId(ids, ids[0], 'Home', true), ids[0]);
});
