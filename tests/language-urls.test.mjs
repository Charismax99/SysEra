import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/language.js', import.meta.url), 'utf8');
const englishHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const arabicHtml = await readFile(new URL('../ar/index.html', import.meta.url), 'utf8');

const runLanguage = ({ language, protocol, hostname, choice = null }) => {
  const links = language === 'ar'
    ? [{ dataset: { language: 'en' }, attributes: new Map([['href', '../']]) }]
    : [{ dataset: { language: 'ar' }, attributes: new Map([['href', 'ar/']]) }];
  links.forEach((link) => {
    link.getAttribute = (name) => link.attributes.get(name);
    link.setAttribute = (name, value) => link.attributes.set(name, value);
    link.addEventListener = () => {};
  });
  let onReady;
  let replaced;
  const context = vm.createContext({
    document: {
      documentElement: { lang: language },
      addEventListener: (_, callback) => { onReady = callback; },
      querySelectorAll: () => links
    },
    location: {
      protocol, hostname, search: '?ref=test', hash: '#services',
      replace: (url) => { replaced = url; }
    },
    localStorage: { getItem: () => choice },
    navigator: { language: 'en' }
  });
  vm.runInContext(source, context);
  onReady?.();
  return { href: links[0].attributes.get('href'), replaced };
};

test('published language URLs are canonical and keep the query and section anchor', () => {
  assert.equal(runLanguage({ language: 'en', protocol: 'https:', hostname: 'sysera.tech' }).href,
    'https://sysera.tech/ar?ref=test#services');
  assert.equal(runLanguage({ language: 'ar', protocol: 'https:', hostname: 'sysera.tech' }).href,
    'https://sysera.tech/?ref=test#services');
  assert.equal(runLanguage({ language: 'en', protocol: 'https:', hostname: 'sysera.tech', choice: 'ar' }).replaced,
    'https://sysera.tech/ar?ref=test#services');
});

test('local file and HTTP previews keep working without public-domain navigation', () => {
  assert.equal(runLanguage({ language: 'en', protocol: 'file:', hostname: '' }).href,
    'ar/index.html?ref=test#services');
  assert.equal(runLanguage({ language: 'ar', protocol: 'file:', hostname: '' }).href,
    '../index.html?ref=test#services');
  assert.equal(runLanguage({ language: 'en', protocol: 'http:', hostname: '127.0.0.1' }).href,
    'ar/?ref=test#services');
  assert.equal(runLanguage({ language: 'ar', protocol: 'http:', hostname: '127.0.0.1' }).href,
    '../?ref=test#services');
});

test('Arabic canonical and language alternates use the slashless URL', () => {
  assert.match(englishHtml, /hreflang="ar" href="https:\/\/sysera\.tech\/ar"/);
  assert.match(arabicHtml, /rel="canonical" href="https:\/\/sysera\.tech\/ar"/);
  assert.match(arabicHtml, /hreflang="ar" href="https:\/\/sysera\.tech\/ar"/);
  assert.match(englishHtml, /href="\/ar" class="language-switch"/);
  assert.match(arabicHtml, /href="\/" class="language-switch"/);
});
