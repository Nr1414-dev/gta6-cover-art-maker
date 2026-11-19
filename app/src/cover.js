// The cover engine: turns photos + a caption into a multi-panel Vice Coast
// poster on a 2D canvas. Five layouts, six gradient-map grades, a halftone
// title block, a neon script subtitle, a badge ribbon and a heat meter of
// stars — every decoration drawn by this file and art.js, nothing borrowed.

import { drawStripedSun, drawSkyline, drawPalmRow, drawSpeedboat, drawHelicopter, drawHalftone, drawGrain, drawVignette, paintSunsetSky } from './art.js';
import { gradeById, drawGradedPhoto } from './grades.js';

/** The five layouts the editor offers, in the order they appear. */
export const LAYOUTS = [
  { id: 'nine', name: 'Nine-Panel Cover', panels: 8 },
  { id: 'hero', name: 'Hero + Three', panels: 4 },
  { id: 'four', name: 'Four-Panel', panels: 4 },
  { id: 'full', name: 'Full Bleed', panels: 1 },
  { id: 'snapshots', name: 'Tilted Snapshots', panels: 3 },
];

/** The three export sizes, in the order the buttons show them. */
export const SIZES = [
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

/** A fresh default state: the two sample photos fill the panels. */
export function defaultState() {
  return {
    layout: 'nine',
    gradeId: 'vice-sunset',
    caption: 'Sunset Heist',
    subtitle: 'Vice Coast nights',
    badge: 'VICE COAST • 2026',
    heat: 4,
    size: SIZES[0],
    photos: [null, null, null, null],
    panels: Array.from({ length: 8 }, (_, i) => ({ photo: i % 2, zoom: 1, ox: 0, oy: 0 })),
  };
}

/** Panel rectangles for a layout, in canvas pixels. */
export function panelRects(layout, w, h) {
  const g = Math.round(w * 0.014); // gutter between panels
  const m = Math.round(w * 0.028); // outer margin inside the frame
  const iw = w - m * 2;
  const ih = h - m * 2;
  if (layout === 'nine') {
    const cw = (iw - g * 2) / 3;
    const ch = (ih - g * 2) / 3;
    const rects = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue; // the centre cell is the logo
        rects.push({ x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch });
      }
    }
    return rects;
  }
  if (layout === 'hero') {
    const heroW = iw * 0.62;
    const sideW = iw - heroW - g;
    const sh = (ih - g * 2) / 3;
    return [
      { x: m, y: m, w: heroW, h: ih },
      { x: m + heroW + g, y: m, w: sideW, h: sh },
      { x: m + heroW + g, y: m + sh + g, w: sideW, h: sh },
      { x: m + heroW + g, y: m + (sh + g) * 2, w: sideW, h: sh },
    ];
  }
  if (layout === 'four') {
    const cw = (iw - g) / 2;
    const ch = (ih - g) / 2;
    return [
      { x: m, y: m, w: cw, h: ch },
      { x: m + cw + g, y: m, w: cw, h: ch },
      { x: m, y: m + ch + g, w: cw, h: ch },
      { x: m + cw + g, y: m + ch + g, w: cw, h: ch },
    ];
  }
  if (layout === 'full') {
    return [{ x: m, y: m, w: iw, h: ih }];
  }
  // snapshots: three tilted photos over a painted sky; rects are upright
  // boxes and the tilt is applied when they are drawn.
  const pw = iw * 0.42;
  const ph = ih * 0.52;
  return [
    { x: m + iw * 0.02, y: m + ih * 0.30, w: pw, h: ph, tilt: -0.09 },
    { x: m + iw * 0.30, y: m + ih * 0.18, w: pw, h: ph, tilt: 0.05 },
    { x: m + iw * 0.56, y: m + ih * 0.32, w: pw, h: ph, tilt: -0.04 },
  ];
}

/** Fits Anton text to a width, returning the largest size that fits. */
function fitFont(ctx, text, maxW, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxW) {
    size -= 4;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/** The centre logo cell of the nine-panel cover: sun, palms, big VI. */
function drawLogoCell(ctx, rect, grade) {
  paintSunsetSky(ctx, rect.x, rect.y, rect.w, rect.h, grade.sky);
  const sunR = rect.w * 0.30;
  drawStripedSun(
    ctx, rect.x + rect.w / 2, rect.y + rect.h * 0.42, sunR, '#ffe08a', '#ff5e7a',
  );
  drawSkyline(ctx, rect.x, rect.y + rect.h * 0.86, rect.w, rect.h * 0.24, '#1c0a33', 7);
  drawPalmRow(ctx, rect.x, rect.y + rect.h * 0.92, rect.w, rect.w * 0.16, '#160626', 11);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitFont(ctx, 'VI', rect.w * 0.62, rect.w * 0.52, 'Anton, sans-serif');
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.lineWidth = size * 0.09;
  ctx.strokeStyle = '#12041f';
  ctx.strokeText('VI', rect.x + rect.w / 2, rect.y + rect.h * 0.44);
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#ffe9a8');
  g.addColorStop(1, '#ff7a5c');
  ctx.fillStyle = g;
  ctx.fillText('VI', rect.x + rect.w / 2, rect.y + rect.h * 0.44);
  ctx.font = `${Math.max(10, rect.w * 0.055)}px Anton, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('VICE COAST', rect.x + rect.w / 2, rect.y + rect.h * 0.82);
  ctx.restore();
}

/** A tilted snapshot: white border, photo, tape strip on top. */
function drawSnapshot(ctx, img, rect, grade, panel) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rect.tilt || 0);
  ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = rect.w * 0.08;
  ctx.shadowOffsetY = rect.w * 0.03;
  ctx.fillStyle = '#fdf8ef';
  ctx.fillRect(rect.x - 10, rect.y - 10, rect.w + 20, rect.h + 34);
  ctx.shadowColor = 'transparent';
  if (img) {
    drawGradedPhoto(ctx, img, rect, panel.zoom, panel.ox, panel.oy, grade);
  } else {
    paintSunsetSky(ctx, rect.x, rect.y, rect.w, rect.h, grade.sky);
  }
  // Tape strip across the top edge.
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(rect.x + rect.w * 0.28, rect.y - 16, rect.w * 0.44, 22);
  ctx.restore();
  ctx.restore();
}

/** The big caption: halftone band behind, gradient Anton letters, hard shadow. */
function drawTitleBlock(ctx, state, w, h, grade) {
  const text = (state.caption || 'VICE COAST').trim().toUpperCase();
  const bandH = h * 0.15;
  const bandY = h - bandH - h * 0.075; // room below the band for the subtitle
  ctx.save();
  // Halftone dots fade across the band behind the letters.
  ctx.globalAlpha = 0.5;
  drawHalftone(ctx, w * 0.04, bandY, w * 0.92, bandH, '#ff2e88', Math.max(10, w * 0.016));
  ctx.globalAlpha = 1;
  // Dark slab so the letters read over any photo.
  ctx.fillStyle = 'rgba(12, 4, 26, 0.55)';
  ctx.fillRect(0, bandY - h * 0.012, w, bandH + h * 0.024);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitFont(ctx, text, w * 0.86, h * 0.105, 'Anton, sans-serif');
  ctx.font = `${size}px Anton, sans-serif`;
  const cy = bandY + bandH / 2 - size * 0.06;
  ctx.lineWidth = size * 0.10;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#12041f';
  ctx.strokeText(text, w / 2, cy);
  const g = ctx.createLinearGradient(0, cy - size * 0.55, 0, cy + size * 0.55);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, '#ffd76a');
  g.addColorStop(0.75, '#ff5e7a');
  g.addColorStop(1, '#c2339b');
  ctx.fillStyle = g;
  ctx.fillText(text, w / 2, cy);
  // Neon script subtitle tucked under the caption, inside the bottom margin.
  if (state.subtitle && state.subtitle.trim()) {
    const sub = state.subtitle.trim();
    const subSize = Math.max(13, h * 0.028);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = subSize * 0.7;
    ctx.fillStyle = '#7df3ff';
    ctx.fillText(sub, w / 2, bandY + bandH + h * 0.032);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

/** A diagonal ribbon across the top-left corner with the badge text. */
function drawBadgeRibbon(ctx, w, h, text) {
  if (!text || !text.trim()) return;
  const label = text.trim().toUpperCase();
  ctx.save();
  ctx.translate(w * 0.02, h * 0.055);
  ctx.rotate(-0.06);
  ctx.font = `${Math.max(12, w * 0.021)}px Anton, sans-serif`;
  const tw = ctx.measureText(label).width + w * 0.05;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tw, 0);
  ctx.lineTo(tw - w * 0.012, h * 0.042);
  ctx.lineTo(0, h * 0.042);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, tw / 2, h * 0.021);
  ctx.restore();
}

/** Five stars top-right on a dark pill: filled ones glow, empty are outlines. */
function drawHeatMeter(ctx, w, h, heat) {
  const r = Math.max(8, w * 0.013);
  const gap = r * 2.4;
  const labelW = w * 0.052;
  const pad = r * 0.9;
  const pillW = labelW + gap * 4 + r * 2 + pad * 2;
  const pillH = r * 2 + pad * 1.4;
  const x0 = w - pillW - w * 0.022;
  const y = h * 0.016;
  ctx.save();
  // Dark pill so the meter reads over any photo.
  ctx.fillStyle = 'rgba(12, 4, 26, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x0, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.font = `${Math.max(10, w * 0.016)}px Anton, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HEAT', x0 + pad, y + pillH / 2);
  const cy = y + pillH / 2;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, x0 + pad + labelW + i * gap, cy, r, i < heat);
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, filled) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (filled) {
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = r * 0.8;
    ctx.fillStyle = '#ffd76a';
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

/** Paints the sky, skyline, palms, boat and helicopter behind a layout. */
function drawBackdrop(ctx, state, w, h, grade) {
  paintSunsetSky(ctx, 0, 0, w, h, grade.sky);
  const sunR = Math.min(w, h) * 0.16;
  drawStripedSun(ctx, w * 0.72, h * 0.24, sunR, '#ffe08a', '#ff5e7a');
  drawHelicopter(ctx, w * 0.16, h * 0.16, Math.min(w, h) * 0.045, '#160626');
  drawSkyline(ctx, 0, h * 0.94, w, h * 0.22, '#1c0a33', 21);
  drawPalmRow(ctx, 0, h * 0.97, w, Math.min(w, h) * 0.11, '#12041f', 33);
  drawSpeedboat(ctx, w * 0.62, h * 0.885, Math.min(w, h) * 0.05, '#12041f');
}

/** Placeholder art for an empty panel: sky, sun, skyline and a hint. */
function drawEmptyPanel(ctx, rect, grade, index) {
  paintSunsetSky(ctx, rect.x, rect.y, rect.w, rect.h, grade.sky);
  drawStripedSun(ctx, rect.x + rect.w / 2, rect.y + rect.h * 0.38, rect.w * 0.22, '#ffe08a', '#ff5e7a');
  drawSkyline(ctx, rect.x, rect.y + rect.h * 0.88, rect.w, rect.h * 0.22, '#1c0a33', 40 + index);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `${Math.max(11, rect.w * 0.06)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h * 0.55);
  ctx.font = `${Math.max(10, rect.w * 0.04)}px sans-serif`;
  ctx.fillText('add a photo', rect.x + rect.w / 2, rect.y + rect.h * 0.55 + rect.w * 0.07);
  ctx.restore();
}

/**
 * Renders the whole cover onto `canvas` from `state`. The canvas is resized
 * to the state's export size first, so the same code draws the live preview
 * and the exported PNG.
 */
export function drawCover(canvas, state) {
  const grade = gradeById(state.gradeId);
  const w = state.size.w;
  const h = state.size.h;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Poster frame: deep purple base, then the layout inside it.
  ctx.fillStyle = '#12041f';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  if (state.layout === 'snapshots') drawBackdrop(ctx, state, w, h, grade);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = state.photos[panel.photo] || null;
    if (state.layout === 'snapshots') {
      if (img) drawSnapshot(ctx, img, rect, grade, panel);
      else drawSnapshot(ctx, null, rect, grade, panel);
      return;
    }
    if (img) {
      drawGradedPhoto(ctx, img, rect, panel.zoom, panel.ox, panel.oy, grade);
    } else {
      drawEmptyPanel(ctx, rect, grade, i);
    }
    // Thin white keyline around every panel, poster style.
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });
  if (state.layout === 'nine') {
    const g = Math.round(w * 0.014);
    const m = Math.round(w * 0.028);
    const cw = (w - m * 2 - g * 2) / 3;
    const ch = (h - m * 2 - g * 2) / 3;
    drawLogoCell(ctx, { x: m + cw + g, y: m + ch + g, w: cw, h: ch }, grade);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeRect(m + cw + g, m + ch + g, cw, ch);
    ctx.restore();
  }
  if (state.layout === 'full') {
    // A skyline strip and palms along the foot of the full-bleed photo.
    drawSkyline(ctx, 0, h * 0.96, w, h * 0.16, 'rgba(18,4,31,0.92)', 55);
    drawPalmRow(ctx, 0, h * 0.985, w, Math.min(w, h) * 0.09, '#0c0218', 77);
  }
  drawTitleBlock(ctx, state, w, h, grade);
  drawBadgeRibbon(ctx, w, h, state.badge);
  drawHeatMeter(ctx, w, h, state.heat);
  drawGrain(ctx, w, h, 0.05);
  drawVignette(ctx, w, h, 0.32);
  // Outer white poster border.
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, w * 0.008);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  ctx.restore();
}

/** Renders `state` at `size` onto a fresh offscreen canvas and returns it. */
export function renderCoverCanvas(state, size) {
  const canvas = document.createElement('canvas');
  drawCover(canvas, { ...state, size });
  return canvas;
}
