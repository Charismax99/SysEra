import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/theme.js', import.meta.url), 'utf8').catch(() => '');
const englishHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const arabicHtml = await readFile(new URL('../ar/index.html', import.meta.url), 'utf8');

const runTheme = ({ language = 'en', saved = null, storageFails = false } = {}) => {
  const attributes = new Map();
  const buttonAttributes = new Map();
  let ready;
  let clicked;
  let stored;
  const label = { textContent: '' };
  const icon = { textContent: '' };
  const button = {
    setAttribute: (name, value) => buttonAttributes.set(name, value),
    querySelector: (selector) => selector === '.theme-toggle-label' ? label : selector === '[data-theme-icon]' ? icon : null,
    addEventListener: (name, callback) => { if (name === 'click') clicked = callback; }
  };
  const document = {
    documentElement: {
      lang: language,
      setAttribute: (name, value) => attributes.set(name, value),
      getAttribute: (name) => attributes.get(name)
    },
    addEventListener: (name, callback) => { if (name === 'DOMContentLoaded') ready = callback; },
    querySelector: (selector) => selector === '[data-theme-toggle]' ? button : null
  };
  const localStorage = {
    getItem: () => { if (storageFails) throw Error('blocked'); return saved; },
    setItem: (_, value) => { if (storageFails) throw Error('blocked'); stored = value; }
  };
  vm.runInNewContext(source, { document, localStorage });
  return {
    attributes,
    buttonAttributes,
    label,
    icon,
    ready: () => ready?.(),
    click: () => clicked?.(),
    get stored() { return stored; }
  };
};

test('saved light theme is applied before DOM ready and the stylesheets load after the initializer', () => {
  for (const html of [englishHtml, arabicHtml]) {
    assert.match(html, /<script src="(?:\.\.\/)?js\/theme\.js"><\/script>[\s\S]*?<link rel="stylesheet" href="(?:\.\.\/)?css\/style\.css"/);
  }
  const page = runTheme({ saved: 'light' });
  assert.equal(page.attributes.get('data-theme'), 'light');
});

test('blocked storage starts dark and still permits an in-page switch', () => {
  const page = runTheme({ storageFails: true });
  assert.equal(page.attributes.get('data-theme'), 'dark');
  page.ready();
  page.click();
  assert.equal(page.attributes.get('data-theme'), 'light');
  assert.equal(page.buttonAttributes.get('aria-pressed'), 'true');
});

test('switch saves the choice and exposes localized pressed state', () => {
  for (const language of ['en', 'ar']) {
    const page = runTheme({ language });
    page.ready();
    assert.equal(page.buttonAttributes.get('aria-pressed'), 'false');
    assert.equal(page.label.textContent, language === 'ar' ? 'فاتح' : 'Light');
    assert.equal(page.icon.textContent, '☼');
    page.click();
    assert.equal(page.stored, 'light');
    assert.equal(page.buttonAttributes.get('aria-pressed'), 'true');
    assert.equal(page.label.textContent, language === 'ar' ? 'غامق' : 'Dark');
    assert.equal(page.icon.textContent, '☾');
    assert.match(page.buttonAttributes.get('aria-label'), language === 'ar' ? /التبديل إلى الوضع الغامق/ : /switch to dark mode/);
    page.click();
    assert.equal(page.buttonAttributes.get('aria-pressed'), 'false');
    assert.equal(page.label.textContent, language === 'ar' ? 'فاتح' : 'Light');
  }
});

test('saved light mode initializes the opposite action and matching accessibility state', () => {
  const page = runTheme({ saved: 'light', language: 'ar' });
  page.ready();
  assert.equal(page.label.textContent, 'غامق');
  assert.equal(page.icon.textContent, '☾');
  assert.equal(page.buttonAttributes.get('aria-pressed'), 'true');
  assert.match(page.buttonAttributes.get('aria-label'), /التبديل إلى الوضع الغامق/);
});
