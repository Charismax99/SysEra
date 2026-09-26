import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('Selected Work is placed after Technology and before Contact', () => {
  const technologyIndex = html.indexOf('<section id="technology"');
  const workIndex = html.indexOf('<section id="selected-work"');
  const contactIndex = html.indexOf('<section id="contact"');

  assert.ok(technologyIndex >= 0, 'Technology section should exist');
  assert.ok(workIndex > technologyIndex, 'Selected Work should follow Technology');
  assert.ok(contactIndex > workIndex, 'Contact should follow Selected Work');
});

test('Selected Work provides generation hosts instead of duplicated project markup', () => {
  const section = html.match(/<section id="selected-work"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.match(section, /role="tablist"/);
  assert.match(section, /data-project-tabs/);
  assert.match(section, /data-project-panels/);
  assert.doesNotMatch(section, /data-project-tab=/);
  assert.doesNotMatch(section, /data-project-panel=/);
  assert.doesNotMatch(section, /class="work-board-image"/);
});

test('portfolio data loads before the viewer', () => {
  const dataIndex = html.indexOf('<script src="js/portfolio-data.js"></script>');
  const viewerIndex = html.indexOf('<script src="js/portfolio-viewer.js"></script>');

  assert.ok(dataIndex >= 0, 'Portfolio data script should be loaded');
  assert.ok(viewerIndex > dataIndex, 'Portfolio viewer should load after its data');
});

test('header and footer navigation link to the focused Selected Work route', () => {
  const workLinks = [...html.matchAll(/<a\b[^>]*href="#selected-work"[^>]*data-view-route="selected-work"[^>]*>Work<\/a>/g)];

  assert.equal(workLinks.length, 2);
});
