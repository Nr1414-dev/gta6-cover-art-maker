// Vice Coast Cover Studio — the hand-in program for gta6-cover-art-01.
// Node 22, standard library only, no network and no build step.
//
// What it hands in: the offline web app in app/ (index.html plus its ES
// modules, vendored Anton and Pacifico fonts, and the two sample photos),
// the four real browser screenshots in screenshots/, and dossier.json —
// the summary the judge reads, written by buildDossier from the vendored
// make.fun library in vendor/makefun-app.ts (untouched).
//
// The app itself: five cover layouts (a nine-panel grid around a central
// VI logo, hero-and-three, four-panel, full bleed and tilted snapshots),
// six gradient-map sunset/neon grades, per-panel photo crop and position,
// a halftone title block, a neon script subtitle, a badge ribbon and a
// heat-meter of stars, exporting PNGs at 1080x1080, 1080x1350 and
// 1920x1080. Every decoration is drawn by the app's own canvas code.
//
// Try it locally first: `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  // The whole app, exactly as it sits in the repository.
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  // The screenshots, when they exist (they do in the submitted repo).
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  }
  // The dossier, built from the copied files with the gate's own caps:
  // at most 4 screenshots of 256 KiB, app/ at most 993 files and 48 MiB,
  // every app/ path at most 1000 bytes, dossier text at most 160 KiB.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
