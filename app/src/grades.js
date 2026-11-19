// Colour grades for the cover engine. A grade is a gradient map: each pixel's
// brightness is remapped onto a sunset or neon ramp, then a warm tint is laid
// over the shadows. That is what gives any ordinary photo the Vice Coast
// poster look, whatever camera took it.

/** The six grades the editor offers, each with its ramp and tint. */
export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    ramp: [[0, 26, 8, 46], [0.28, 94, 28, 92], [0.55, 214, 62, 110], [0.78, 255, 138, 76], [1, 255, 226, 150]],
    tint: 'rgba(255, 94, 120, 0.10)',
    sky: [[0, '#2a0a3d'], [0.45, '#7a1e6e'], [0.75, '#e8446a'], [1, '#ff9a3d']],
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    ramp: [[0, 6, 12, 34], [0.3, 24, 64, 110], [0.55, 150, 40, 160], [0.8, 255, 80, 170], [1, 140, 240, 255]],
    tint: 'rgba(0, 220, 255, 0.08)',
    sky: [[0, '#050a2e'], [0.5, '#1b2a6e'], [0.8, '#c2339b'], [1, '#2de2ff']],
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    ramp: [[0, 30, 16, 10], [0.3, 110, 52, 22], [0.55, 214, 110, 34], [0.8, 255, 178, 80], [1, 255, 240, 190]],
    tint: 'rgba(255, 170, 60, 0.10)',
    sky: [[0, '#3d1a08'], [0.5, '#8a3a12'], [0.8, '#e8762a'], [1, '#ffd76a']],
  },
  {
    id: 'ocean-drive',
    name: 'Ocean Drive',
    ramp: [[0, 4, 20, 44], [0.3, 14, 80, 110], [0.55, 30, 160, 170], [0.8, 120, 220, 220], [1, 255, 250, 210]],
    tint: 'rgba(0, 200, 200, 0.08)',
    sky: [[0, '#03182e'], [0.5, '#0b4a6e'], [0.8, '#19b8c4'], [1, '#ffe08a']],
  },
  {
    id: 'hot-pink',
    name: 'Hot Pink',
    ramp: [[0, 34, 4, 40], [0.3, 120, 16, 110], [0.55, 230, 40, 140], [0.8, 255, 110, 160], [1, 255, 210, 230]],
    tint: 'rgba(255, 40, 160, 0.10)',
    sky: [[0, '#2e0530'], [0.5, '#8a1068'], [0.8, '#ff2e88'], [1, '#ffb3d9']],
  },
  {
    id: 'midnight-vice',
    name: 'Midnight Vice',
    ramp: [[0, 5, 5, 22], [0.3, 40, 26, 90], [0.55, 110, 50, 160], [0.8, 200, 90, 200], [1, 150, 200, 255]],
    tint: 'rgba(120, 80, 255, 0.10)',
    sky: [[0, '#04041c'], [0.5, '#1c1445'], [0.8, '#6a2a9e'], [1, '#3ec6ff']],
  },
];

/** Looks a grade up by id, falling back to the first grade. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

/** Remaps one channel value onto a ramp: ramp entries are [t, r, g, b]. */
function rampColor(ramp, t) {
  if (t <= ramp[0][0]) return ramp[0].slice(1);
  for (let i = 1; i < ramp.length; i++) {
    if (t <= ramp[i][0]) {
      const [t0, r0, g0, b0] = ramp[i - 1];
      const [t1, r1, g1, b1] = ramp[i];
      const k = (t - t0) / (t1 - t0 || 1);
      return [r0 + (r1 - r0) * k, g0 + (g1 - g0) * k, b0 + (b1 - b0) * k];
    }
  }
  return ramp[ramp.length - 1].slice(1);
}

/**
 * Applies a grade to a canvas in place: luminance drives the ramp, and the
 * original colour is kept at 35% so faces stay recognisable under the grade.
 */
export function applyGradeToCanvas(canvas, grade, strength = 1) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    const [r, g, b] = rampColor(grade.ramp, lum);
    const keep = 0.35 * strength;
    d[i] = r * (1 - keep) + d[i] * keep;
    d[i + 1] = g * (1 - keep) + d[i + 1] * keep;
    d[i + 2] = b * (1 - keep) + d[i + 2] * keep;
  }
  ctx.putImageData(img, 0, 0);
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, width, height);
}

/** One shared scratch canvas, reused so panel grading allocates nothing. */
let scratch = null;
function scratchCanvas(w, h) {
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w || scratch.height !== h) {
    scratch.width = w;
    scratch.height = h;
  }
  return scratch;
}

/**
 * Draws `img` cover-fitting `rect` with per-panel zoom and pan, graded with
 * `grade`. Zoom 1 fills the panel; offset moves the photo inside it.
 */
export function drawGradedPhoto(ctx, img, rect, zoom, offX, offY, grade) {
  const w = Math.max(2, Math.round(rect.w));
  const h = Math.max(2, Math.round(rect.h));
  const tmp = scratchCanvas(w, h);
  const tctx = tmp.getContext('2d');
  tctx.clearRect(0, 0, w, h);
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const s = base * zoom;
  const pw = img.naturalWidth * s;
  const ph = img.naturalHeight * s;
  const dx = (w - pw) / 2 + offX * w * 0.5;
  const dy = (h - ph) / 2 + offY * h * 0.5;
  tctx.drawImage(img, dx, dy, pw, ph);
  applyGradeToCanvas(tmp, grade, 0.9);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(tmp, rect.x, rect.y);
  ctx.restore();
}
