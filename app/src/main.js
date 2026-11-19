// Wires the Vice Coast Cover Studio page: photo slots, layout and grade
// pickers, per-panel crop controls, caption editing and PNG export in the
// three post sizes. A `?shot=` query sets up a fixed scene for a screenshot
// instead (./shots.js).

import { drawCover, renderCoverCanvas, defaultState, LAYOUTS, SIZES, panelRects } from './cover.js';
import { GRADES } from './grades.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const state = defaultState();
let selectedPanel = 0;
let previewSize = { w: 720, h: 720 };

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The preview canvas keeps the export aspect ratio at a fast size. */
function previewDims() {
  const s = state.size;
  const scale = 720 / Math.max(s.w, s.h);
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

function redraw() {
  // A cover screenshot draws at the viewport's own size; the editor preview
  // stays at a fast 720 px on its long side.
  previewSize = document.body.classList.contains('shot-cover')
    ? { w: state.size.w, h: state.size.h }
    : previewDims();
  drawCover(canvas, { ...state, size: previewSize });
  syncPanelControls();
}

/** Rebuilds the layout, grade and size picker buttons from the constants. */
function buildPickers() {
  const layoutBox = $('layouts');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = l.name;
    b.dataset.layout = l.id;
    b.addEventListener('click', () => {
      state.layout = l.id;
      state.panels = Array.from({ length: l.panels }, (_, i) => state.panels[i] || { photo: i % 2, zoom: 1, ox: 0, oy: 0 });
      selectedPanel = 0;
      document.querySelectorAll('#layouts .chip').forEach((c) => c.classList.toggle('on', c === b));
      redraw();
    });
    layoutBox.appendChild(b);
  });
  layoutBox.firstChild.classList.add('on');

  const gradeBox = $('grades');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip grade-chip';
    b.dataset.grade = g.id;
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg, ${g.sky[1][1]}, ${g.sky[2][1]}, ${g.sky[3][1]})"></span>${g.name}`;
    b.addEventListener('click', () => {
      state.gradeId = g.id;
      document.querySelectorAll('#grades .chip').forEach((c) => c.classList.toggle('on', c === b));
      redraw();
    });
    gradeBox.appendChild(b);
  });
  gradeBox.firstChild.classList.add('on');

  const sizeBox = $('sizes');
  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = s.name;
    b.dataset.size = s.id;
    b.addEventListener('click', () => {
      state.size = s;
      document.querySelectorAll('#sizes .chip').forEach((c) => c.classList.toggle('on', c === b));
      redraw();
    });
    sizeBox.appendChild(b);
  });
  sizeBox.firstChild.classList.add('on');
}

/** Builds the four photo slots and the "fill every panel" shortcut. */
function buildPhotoSlots() {
  const box = $('photos');
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.innerHTML = `
      <span class="slot-label">Photo ${i + 1}</span>
      <img class="slot-thumb" alt="Photo ${i + 1} preview" hidden>
      <span class="slot-empty">Empty — add a photo</span>
      <span class="slot-add">+ Add photo</span>
      <input type="file" accept="image/*" hidden>`;
    const input = slot.querySelector('input');
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      state.photos[i] = await loadImage(URL.createObjectURL(file));
      refreshSlots();
      redraw();
    });
    slot.querySelector('.slot-add').addEventListener('click', () => input.click());
    slot.querySelector('.slot-thumb').addEventListener('click', () => input.click());
    box.appendChild(slot);
  }
  $('fillAll').addEventListener('click', () => {
    const idx = Number($('fillPhoto').value);
    state.panels.forEach((p) => { p.photo = idx; });
    redraw();
  });
}

function refreshSlots() {
  document.querySelectorAll('#photos .slot').forEach((slot, i) => {
    const img = slot.querySelector('.slot-thumb');
    const empty = slot.querySelector('.slot-empty');
    if (state.photos[i]) {
      img.src = state.photos[i].src;
      img.hidden = false;
      empty.hidden = true;
    } else {
      img.hidden = true;
      empty.hidden = false;
    }
  });
}

/** Panel picker: click a panel on the preview to crop and position it. */
function buildPanelPicker() {
  const box = $('panelPicker');
  const count = () => panelRects(state.layout, previewSize.w, previewSize.h).length;
  const rebuild = () => {
    box.innerHTML = '';
    for (let i = 0; i < count(); i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (i === selectedPanel ? ' on' : '');
      b.textContent = `Panel ${i + 1}`;
      b.addEventListener('click', () => { selectedPanel = i; rebuild(); syncPanelControls(); });
      box.appendChild(b);
    }
  };
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * previewSize.w;
    const y = ((e.clientY - r.top) / r.height) * previewSize.h;
    const rects = panelRects(state.layout, previewSize.w, previewSize.h);
    const hit = rects.findIndex((rc) => x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h);
    if (hit >= 0) { selectedPanel = hit; rebuild(); syncPanelControls(); }
  });
  state._rebuildPanels = rebuild;
  rebuild();
}

function syncPanelControls() {
  if (state._rebuildPanels) state._rebuildPanels();
  const panel = state.panels[selectedPanel] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
  $('panelPhoto').value = String(panel.photo);
  $('panelZoom').value = String(panel.zoom);
  $('panelX').value = String(panel.ox);
  $('panelY').value = String(panel.oy);
  $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panelTitle').textContent = `Panel ${selectedPanel + 1} — crop & position`;
}

function bindPanelControls() {
  $('panelPhoto').addEventListener('change', (e) => {
    state.panels[selectedPanel].photo = Number(e.target.value);
    redraw();
  });
  $('panelZoom').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value);
    redraw();
  });
  $('panelX').addEventListener('input', (e) => {
    state.panels[selectedPanel].ox = Number(e.target.value);
    redraw();
  });
  $('panelY').addEventListener('input', (e) => {
    state.panels[selectedPanel].oy = Number(e.target.value);
    redraw();
  });
}

function bindTextControls() {
  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
  $('heat').addEventListener('input', (e) => {
    state.heat = Number(e.target.value);
    $('heatVal').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
    redraw();
  });
  $('randomise').addEventListener('click', () => {
    const layouts = LAYOUTS.map((l) => l.id);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.gradeId = GRADES[Math.floor(Math.random() * GRADES.length)].id;
    state.heat = 1 + Math.floor(Math.random() * 5);
    $('heat').value = String(state.heat);
    $('heatVal').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
    document.querySelectorAll('#layouts .chip').forEach((c) => c.classList.toggle('on', c.dataset.layout === state.layout));
    document.querySelectorAll('#grades .chip').forEach((c) => c.classList.toggle('on', c.dataset.grade === state.gradeId));
    state.panels = Array.from({ length: LAYOUTS.find((l) => l.id === state.layout).panels }, (_, i) => state.panels[i] || { photo: i % 2, zoom: 1, ox: 0, oy: 0 });
    redraw();
  });
}

/** Downloads one rendered cover as a PNG file. */
function downloadCover(size) {
  const out = renderCoverCanvas(state, size);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    $('status').textContent = `Saved vice-coast-cover-${size.w}x${size.h}.png`;
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

function bindExport() {
  $('exportOne').addEventListener('click', () => downloadCover(state.size));
  $('exportAll').addEventListener('click', () => {
    SIZES.forEach((s, i) => setTimeout(() => downloadCover(s), i * 350));
    $('status').textContent = 'Exporting all three sizes…';
  });
}

/** Loads the two bundled sample photos so the app opens with a cover. */
async function loadSamples() {
  const [a, b] = await Promise.all([
    loadImage('samples/boulevard.jpg'),
    loadImage('samples/pier.jpg'),
  ]);
  state.photos[0] = a;
  state.photos[1] = b;
  refreshSlots();
  redraw();
}

buildPickers();
buildPhotoSlots();
buildPanelPicker();
bindPanelControls();
bindTextControls();
bindExport();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  // Screenshot scenes: wait for the vendored fonts, then paint the scene.
  document.fonts.load('16px Anton').then(() => document.fonts.load('16px Pacifico')).then(async () => {
    await runShot(shot, new URLSearchParams(location.search), state, loadImage, redraw);
    refreshSlots();
    redraw();
  });
} else {
  document.fonts.ready.then(() => redraw());
  loadSamples();
  redraw();
}
