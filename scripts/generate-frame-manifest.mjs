#!/usr/bin/env node
// Scans one or more frame folders and writes a manifest.json listing every frame
// in natural order. The frontend fetches this manifest instead of guessing
// filenames, so a sequence keeps working automatically whenever frames are
// added/removed/renamed, and several folders can be stitched into one
// continuous sequence (e.g. part 1 + part 2 of the same shot).
//
// Single folder (writes manifest.json inside that folder):
//   node scripts/generate-frame-manifest.mjs [framesDir]
//   Default framesDir: assets/videos/intro
//
// Multiple folders merged into one continuous manifest, in the order given
// (requires --out, since there's no single natural folder to write it into):
//   node scripts/generate-frame-manifest.mjs --out assets/videos/manifest-x.json assets/videos/partA assets/videos/partB

import { readdir, writeFile } from 'node:fs/promises';
import { join, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

function naturalCompare(a, b) {
  const chunk = (s) => s.match(/(\d+|\D+)/g) ?? [];
  const ca = chunk(a);
  const cb = chunk(b);
  const len = Math.max(ca.length, cb.length);
  for (let i = 0; i < len; i++) {
    const x = ca[i] ?? '';
    const y = cb[i] ?? '';
    if (x === y) continue;
    const nx = Number(x);
    const ny = Number(y);
    const bothNumeric = !Number.isNaN(nx) && !Number.isNaN(ny);
    return bothNumeric ? nx - ny : x < y ? -1 : 1;
  }
  return 0;
}

async function listFrames(dir) {
  const absDir = resolve(dir);
  const entries = await readdir(absDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort(naturalCompare);
  if (files.length === 0) throw new Error(`No image frames found in ${absDir}`);
  return { absDir, files };
}

async function generateSingle(framesDir) {
  const { absDir, files } = await listFrames(framesDir);
  const basePath = relative(repoRoot, absDir).split('\\').join('/') + '/';

  const manifest = {
    basePath,
    count: files.length,
    files,
    generatedAt: new Date().toISOString(),
  };

  const outPath = join(absDir, 'manifest.json');
  await writeFile(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`Manifest written: ${relative(repoRoot, outPath).split('\\').join('/')}`);
  console.log(`  basePath: ${basePath}`);
  console.log(`  frames:   ${files.length} (${files[0]} .. ${files[files.length - 1]})`);
}

async function generateMerged(outPath, sourceDirs) {
  const absOut = resolve(outPath);
  const outDir = dirname(absOut);
  const basePath = relative(repoRoot, outDir).split('\\').join('/') + '/';

  const allFiles = [];
  for (const dir of sourceDirs) {
    const { absDir, files } = await listFrames(dir);
    const prefix = relative(outDir, absDir).split('\\').join('/');
    for (const f of files) allFiles.push(`${prefix}/${f}`);
  }

  const manifest = {
    basePath,
    count: allFiles.length,
    files: allFiles,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(absOut, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`Manifest written: ${relative(repoRoot, absOut).split('\\').join('/')}`);
  console.log(`  basePath: ${basePath}`);
  console.log(`  frames:   ${allFiles.length} merged from ${sourceDirs.length} folder(s)`);
  console.log(`  order:    ${sourceDirs.join(' -> ')}`);
}

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');

if (outIdx !== -1) {
  const outPath = args[outIdx + 1];
  const sourceDirs = args.filter((_, i) => i !== outIdx && i !== outIdx + 1);
  if (!outPath || sourceDirs.length === 0) {
    console.error('Usage: node scripts/generate-frame-manifest.mjs --out <manifest.json> <dir1> <dir2> [...]');
    process.exit(1);
  }
  generateMerged(outPath, sourceDirs).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else {
  const framesDir = args[0] ?? 'assets/videos/intro';
  generateSingle(framesDir).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
