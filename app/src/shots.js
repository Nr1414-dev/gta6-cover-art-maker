// Fixed scenes for screenshots: ?shot=cover shows one exported cover alone,
// ?shot=editor shows the editor with a photo loaded. `photo` picks the sample
// (samples/<photo>.jpg), `caption` the words, `layout` the layout and `size`
// the export size (square, portrait or wide). window.__shotReady is set once
// the scene is painted.

import { SIZES, LAYOUTS } from './cover.js';

function applyQuery(state, query) {
  const layout = query.get('layout');
  if (layout && LAYOUTS.some((l) => l.id === layout)) state.layout = layout;
  const size = SIZES.find((s) => s.id === (query.get('size') || 'wide'));
  if (size) state.size = size;
  const caption = query.get('caption');
  if (caption) state.caption = caption;
  const subtitle = query.get('subtitle');
  if (subtitle) state.subtitle = subtitle;
  const grade = query.get('grade');
  if (grade) state.gradeId = grade;
  const heat = query.get('heat');
  if (heat) state.heat = Number(heat);
  const panels = LAYOUTS.find((l) => l.id === state.layout).panels;
  state.panels = Array.from({ length: panels }, (_, i) => state.panels[i] || { photo: i % 2, zoom: 1, ox: 0, oy: 0 });
}

export async function runShot(shot, query, state, loadImage, redraw) {
  const photoName = query.get('photo') ?? 'pier';
  const otherName = photoName === 'pier' ? 'boulevard' : 'pier';
  const [a, b] = await Promise.all([
    loadImage(`samples/${photoName}.jpg`),
    loadImage(`samples/${otherName}.jpg`),
  ]);
  state.photos[0] = a;
  state.photos[1] = b;
  applyQuery(state, query);
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // The cover fills the whole viewport: draw at the viewport's own size so
    // the screenshot is the exported cover itself, at browser scale.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    state.size = { id: 'shot', name: 'shot', w: vw, h: vh };
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
