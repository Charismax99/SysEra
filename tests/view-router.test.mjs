import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/view-router.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);

const { resolveView, buildViewUrl, applyViewState, shouldUseInPageNavigation } = context.SysEraViewRouter;

const createClassList = () => {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    toggle: (name, force) => {
      const shouldAdd = force === undefined ? !values.has(name) : force;
      if (shouldAdd) values.add(name);
      else values.delete(name);
      return shouldAdd;
    },
    contains: (name) => values.has(name)
  };
};

const createSection = (id, revealCount = 0) => {
  const reveals = Array.from({ length: revealCount }, () => ({ classList: createClassList() }));
  return {
    id,
    hidden: false,
    querySelectorAll: (selector) => selector === '.reveal' ? reveals : [],
    reveals
  };
};

const createLink = (route) => {
  const attributes = new Map([['href', route === 'home' ? '#home' : `#${route}`]]);
  return {
    dataset: { viewRoute: route },
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    attributes
  };
};

test('resolveView accepts only supported focused routes', () => {
  assert.equal(JSON.stringify(resolveView('')), '{"mode":"home","route":null}');
  assert.equal(JSON.stringify(resolveView('#home')), '{"mode":"home","route":null}');
  assert.equal(JSON.stringify(resolveView('#services')), '{"mode":"focused","route":"services"}');
  assert.equal(JSON.stringify(resolveView('#technology')), '{"mode":"focused","route":"technology"}');
  assert.equal(JSON.stringify(resolveView('#why-us')), '{"mode":"home","route":null}');
});

test('buildViewUrl keeps Home clean and focused routes meaningful', () => {
  const location = { pathname: '/studio/', search: '?ref=nav' };
  assert.equal(buildViewUrl(null, location), '/studio/?ref=nav');
  assert.equal(buildViewUrl('contact', location), '/studio/?ref=nav#contact');
});

test('only unmarked section links in full Home use in-page navigation', () => {
  assert.equal(shouldUseInPageNavigation({ isFocused: false, hasViewRoute: false, hash: '#services' }), true);
  assert.equal(shouldUseInPageNavigation({ isFocused: false, hasViewRoute: true, hash: '#services' }), false);
  assert.equal(shouldUseInPageNavigation({ isFocused: true, hasViewRoute: false, hash: '#services' }), false);
  assert.equal(shouldUseInPageNavigation({ isFocused: false, hasViewRoute: false, hash: '' }), false);
});

test('applyViewState removes inactive sections from layout and reveals the focused section', () => {
  const sections = [
    createSection('', 1),
    createSection('about', 2),
    createSection('services', 2),
    createSection('why-us', 1),
    createSection('process', 1),
    createSection('technology', 2),
    createSection('contact', 2)
  ];
  const main = { classList: createClassList(), dataset: {} };
  const body = { classList: createClassList() };
  const links = ['home', 'about', 'services', 'process', 'technology', 'contact'].map(createLink);

  applyViewState({ mode: 'focused', route: 'services' }, { sections, main, body, links });

  assert.equal(sections.find((section) => section.id === 'services').hidden, false);
  assert.equal(sections.filter((section) => section.id !== 'services').every((section) => section.hidden), true);
  assert.equal(sections.find((section) => section.id === 'services').reveals.every((item) => item.classList.contains('visible')), true);
  assert.equal(main.classList.contains('focused-view'), true);
  assert.equal(body.classList.contains('has-focused-view'), true);
  assert.equal(links.find((link) => link.dataset.viewRoute === 'services').attributes.get('aria-current'), 'page');
  assert.equal(links.find((link) => link.dataset.viewRoute === 'home').attributes.has('aria-current'), false);

  applyViewState({ mode: 'home', route: null }, { sections, main, body, links });

  assert.equal(sections.every((section) => !section.hidden), true);
  assert.equal(main.classList.contains('focused-view'), false);
  assert.equal(links.find((link) => link.dataset.viewRoute === 'home').attributes.get('aria-current'), 'page');
});
