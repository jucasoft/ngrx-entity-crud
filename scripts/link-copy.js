#!/usr/bin/env node
/**
 * Alternative to `npm link` for local testing: copies dist/ngrx-entity-crud into a consumer
 * app's node_modules/ngrx-entity-crud instead of symlinking it.
 *
 * `npm link` makes node_modules/ngrx-entity-crud a symlink pointing OUTSIDE the consumer's own
 * node_modules tree. Angular peer deps (@angular/core, @ngrx/store, rxjs, ...) resolved from
 * inside that symlinked code can then walk up to THIS repo's own node_modules instead of the
 * consumer's — even with "preserveSymlinks": true in the consumer's angular.json — producing
 * errors like "export 'X' was not found in '@angular/core'" when the two Angular versions
 * differ (e.g. this repo on Angular 19, a consumer on Angular 16). A real copy has no symlink
 * boundary to leak across, so peer deps always resolve inside the consumer's own node_modules.
 *
 * Usage:
 *   node scripts/link-copy.js <path-to-consumer-app>
 *   NEC_LINK_TARGET=<path-to-consumer-app> node scripts/link-copy.js
 *
 * Re-run after every `npm run build` (or use `npm run link:copy`, which builds first). The
 * consumer app does NOT auto-pick-up further local changes the way a symlink would — you must
 * re-run this script each time.
 */
const fs = require('fs');
const path = require('path');

const target = process.argv[2] || process.env.NEC_LINK_TARGET;
if (!target) {
  console.error('Usage: node scripts/link-copy.js <path-to-consumer-app>');
  console.error('   or: NEC_LINK_TARGET=<path-to-consumer-app> node scripts/link-copy.js');
  process.exit(1);
}

const distDir = path.resolve(__dirname, '..', 'dist', 'ngrx-entity-crud');
const targetRoot = path.resolve(target);
const destDir = path.join(targetRoot, 'node_modules', 'ngrx-entity-crud');

if (!fs.existsSync(distDir)) {
  console.error(`Not found: ${distDir}`);
  console.error('Run "npm run build" first (or use "npm run link:copy", which does both).');
  process.exit(1);
}

if (!fs.existsSync(path.join(targetRoot, 'node_modules'))) {
  console.error(`Not found: ${path.join(targetRoot, 'node_modules')}`);
  console.error(`"${targetRoot}" doesn't look like an app with node_modules installed.`);
  process.exit(1);
}

// lstat (not existsSync) so a symlink is detected even if its target is broken/missing.
let destExists = false;
try {
  fs.lstatSync(destDir);
  destExists = true;
} catch {
  // destDir doesn't exist yet - nothing to remove.
}
if (destExists) {
  // rmSync on a symlink removes only the link, never follows it - safe against the real dist/.
  fs.rmSync(destDir, {recursive: true, force: true});
}

fs.cpSync(distDir, destDir, {recursive: true});
console.log(`Copied ${distDir}\n     -> ${destDir}`);
