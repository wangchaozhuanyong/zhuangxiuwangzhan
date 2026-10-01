import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const pages = read('adaptive-page-matrix.json');
assert.equal(pages.length, 30);
assert.deepEqual([...new Set(pages.map(page => page.width))], [360, 390, 768, 1024, 1440]);
assert.equal(new Set(pages.map(page => `${page.width}:${page.path}`)).size, 30);
for (const page of pages) {
  assert.equal(page.width, page.expectedWidth);
  assert.equal(page.background, 'rgba(0, 0, 0, 0)');
  assert.match(page.headerClass, /is-overlay/);
  assert.equal(page.pseudo, 'none');
  assert.equal(page.heroTop, 0);
  assert.equal(page.spacer, false);
  assert.equal(page.readingPanels, 0);
  assert.equal(page.overflow, false);
  for (const text of page.texts) if (text.mode === 'color') assert.ok(Number(text.ratio) >= 4.5);
}
const fixture = read('adaptive-fixture.json');
assert.equal(fixture.image.width, 1440);
assert.equal(fixture.image.sceneText[0].color, 'rgb(255, 255, 255)');
assert.equal(fixture.image.sceneText[1].color, 'rgb(0, 0, 0)');
for (const text of fixture.black.sceneText) assert.equal(text.color, 'rgb(255, 255, 255)');
for (const text of fixture.white.sceneText) assert.equal(text.color, 'rgb(41, 46, 41)');
for (const scene of [fixture.image, fixture.black, fixture.white]) {
  assert.equal(scene.overflow, false);
  for (const text of scene.sceneText) assert.equal(text.background, 'rgba(0, 0, 0, 0)');
}
const unavailable = fixture.image.cases.find(item => item.case === 'unavailable');
assert.equal(unavailable.mode, 'outline');
assert.equal(unavailable.source, 'unavailable');
assert.equal(unavailable.ratio, undefined);
assert.equal(fixture.image.cases.find(item => item.case === 'mixed').mode, 'outline');
const contacts = read('adaptive-contact-regression.json');
assert.equal(contacts.length, 4);
assert.deepEqual([...new Set(contacts.map(page => page.width))], [390, 1440]);
for (const page of contacts) {
  assert.equal(page.overflow, false);
  assert.equal(page.languageColor, 'rgb(253, 252, 250)');
  assert.equal(page.languageBackground, 'rgb(63, 78, 66)');
  assert.equal(page.primary.color, 'rgb(253, 252, 250)');
  assert.equal(page.primary.background, 'rgb(63, 78, 66)');
  for (const row of page.rows) {
    assert.ok(row.height >= 64);
    assert.equal(row.display, 'grid');
  }
}
for (const state of read('adaptive-top-resize.json')) {
  assert.equal(state.y, 0);
  assert.match(state.header, /is-overlay/);
  assert.equal(state.background, 'rgba(0, 0, 0, 0)');
}
const interactions = read('adaptive-interactions.json');
assert.equal(interactions.open, 'open');
assert.equal(interactions.closed, 'closed');
assert.match(interactions.focus, /scheme-a-chrome__menu-trigger/);
assert.match(interactions.languagePath, /\/en\/services\/design$/);
assert.match(interactions.scrolled.header, /is-solid/);
assert.match(interactions.top.header, /is-overlay/);
assert.equal(interactions.top.y, 0);
assert.equal(interactions.top.bg, 'rgba(0, 0, 0, 0)');
console.log('PASS: 30 responsive pages, 4 contact pages, dynamic background changes, unknown/mixed image fallback, top resize, menu/focus/language/scroll.');
