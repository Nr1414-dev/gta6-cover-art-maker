// Sunset-coast silhouette art, drawn fresh with canvas paths: no image is
// loaded for any of this. Every shape is the app's own vector drawing — a
// skyline, palm trees, a low sun, a speedboat and a helicopter — so the cover
// never needs Rockstar artwork, a game screenshot or an outside file.

/** Tiny deterministic random source, so a cover redraws identically. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A low striped sun: a circle with horizontal cuts, Vice City poster style. */
export function drawStripedSun(ctx, cx, cy, r, top, bottom) {
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Cut horizontal bands out of the lower half of the sun.
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.08;
  let h = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, h);
    y += h * 3.2;
    h *= 1.35;
  }
  ctx.restore();
}

/** A blocky downtown skyline along `baseY`, filled solid in `color`. */
export function drawSkyline(ctx, x, baseY, w, h, color, seed) {
  const rnd = seededRandom(seed);
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.05 + rnd() * 0.09);
    const bh = h * (0.35 + rnd() * 0.65);
    const top = baseY - bh;
    ctx.fillRect(bx, top, bw, bh);
    // A rooftop antenna or water tower on some buildings.
    if (rnd() > 0.6) {
      ctx.fillRect(bx + bw * 0.42, top - h * 0.12, bw * 0.16, h * 0.12);
      ctx.beginPath();
      ctx.arc(bx + bw * 0.5, top - h * 0.13, bw * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    // A few lit windows, cut as small bright rectangles.
    if (rnd() > 0.45) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 214, 130, 0.85)';
      const rows = 2 + Math.floor(rnd() * 4);
      for (let i = 0; i < rows; i++) {
        const wy = top + bh * 0.15 + (i * bh * 0.7) / rows;
        const wx = bx + bw * (0.2 + rnd() * 0.5);
        ctx.fillRect(wx, wy, bw * 0.12, bh * 0.05);
      }
      ctx.restore();
    }
    bx += bw + w * 0.008;
  }
  ctx.restore();
}

/** One palm tree: a leaning trunk and seven drooping fronds. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly, drawn as a tapering curve.
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.10, y - s * 0.55, x + s * 0.22, y - s * 0.95);
  ctx.stroke();
  const tx = x + s * 0.22;
  const ty = y - s * 0.95;
  // Fronds fan out from the crown and droop at the tips.
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.92) + (i * Math.PI * 0.82) / 6;
    const len = s * (0.55 + (i % 2) * 0.12);
    const mx = tx + Math.cos(a) * len * 0.6;
    const my = ty + Math.sin(a) * len * 0.55 + s * 0.16;
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len + s * 0.34;
    ctx.lineWidth = s * 0.045;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  // Coconuts under the crown.
  ctx.beginPath();
  ctx.arc(tx - s * 0.04, ty + s * 0.05, s * 0.05, 0, Math.PI * 2);
  ctx.arc(tx + s * 0.05, ty + s * 0.06, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A row of palms of varied heights along a baseline. */
export function drawPalmRow(ctx, x, baseY, w, s, color, seed) {
  const rnd = seededRandom(seed);
  let px = x + w * 0.02;
  while (px < x + w * 0.95) {
    drawPalm(ctx, px, baseY, s * (0.7 + rnd() * 0.7), color);
    px += w * (0.12 + rnd() * 0.14);
  }
}

/** A small speedboat silhouette with a wake, facing right. */
export function drawSpeedboat(ctx, x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s * 1.5, y);
  ctx.lineTo(x + s * 1.15, y + s * 0.28);
  ctx.lineTo(x + s * 0.15, y + s * 0.28);
  ctx.closePath();
  ctx.fill();
  // Cabin and windscreen.
  ctx.beginPath();
  ctx.moveTo(x + s * 0.55, y);
  ctx.lineTo(x + s * 0.95, y);
  ctx.lineTo(x + s * 0.85, y - s * 0.3);
  ctx.lineTo(x + s * 0.6, y - s * 0.3);
  ctx.closePath();
  ctx.fill();
  // Wake lines behind the hull.
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.1, y + s * 0.42);
  ctx.lineTo(x - s * 0.7, y + s * 0.5);
  ctx.moveTo(x, y + s * 0.55);
  ctx.lineTo(x - s * 0.55, y + s * 0.68);
  ctx.stroke();
  ctx.restore();
}

/** A small helicopter silhouette, nose to the right, rotors spinning flat. */
export function drawHelicopter(ctx, x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // Rotor mast and blades.
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.9, y - s * 0.42);
  ctx.lineTo(x + s * 1.0, y - s * 0.42);
  ctx.stroke();
  ctx.fillRect(x - s * 0.06, y - s * 0.42, s * 0.12, s * 0.3);
  // Body: rounded cabin with a tail boom.
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.55, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.4, y - s * 0.08);
  ctx.lineTo(x + s * 1.25, y - s * 0.22);
  ctx.lineTo(x + s * 1.25, y - s * 0.02);
  ctx.lineTo(x + s * 0.4, y + s * 0.08);
  ctx.closePath();
  ctx.fill();
  // Tail fin and skids.
  ctx.fillRect(x + s * 1.12, y - s * 0.5, s * 0.1, s * 0.34);
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y + s * 0.42);
  ctx.lineTo(x + s * 0.55, y + s * 0.42);
  ctx.stroke();
  ctx.restore();
}

/** Halftone dots filling a rectangle, shrinking toward its top edge. */
export function drawHalftone(ctx, x, y, w, h, color, spacing) {
  ctx.save();
  ctx.fillStyle = color;
  const step = spacing;
  let row = 0;
  for (let yy = y + step / 2; yy < y + h; yy += step, row++) {
    const t = (yy - y) / h; // 0 at top, 1 at bottom
    const r = Math.max(0.6, step * 0.42 * (0.35 + t));
    for (let xx = x + step / 2 + (row % 2 ? step / 2 : 0); xx < x + w; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Film grain: a tiled noise pattern stamped over the whole canvas. */
let grainTile = null;
export function drawGrain(ctx, w, h, amount) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 128;
    grainTile.height = 128;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(128, 128);
    const rnd = seededRandom(20261119);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rnd() * 255);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkened corners that pull the eye to the middle of the cover. */
export function drawVignette(ctx, w, h, strength) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(10, 4, 24, 0)');
  g.addColorStop(1, `rgba(10, 4, 24, ${strength})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A sunset sky: vertical bands from dusk purple down to hot orange. */
export function paintSunsetSky(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [t, c] of stops) g.addColorStop(t, c);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}
