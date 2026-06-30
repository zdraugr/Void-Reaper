// Build-time sync: copy the game source into desktop/app/ for packaging.
//
// The repo-root index.html + music/ + sfx/ stay the source of truth and are never
// edited here. This script produces a *release copy* under desktop/app/ with the DEV
// cheats/overlay disabled. Run automatically before `electron .` and every `dist`.
//
// No dependencies — Node stdlib only.

import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");      // desktop/scripts -> repo root
const appDir = join(here, "..", "app");       // desktop/app

// Replacements applied to index.html. Each MUST match at least once, or the source
// drifted and we bail loudly rather than ship a build with cheats still on.
const edits = [
  // cheats/overlay off; with DEV=false the Store shim also persists real saves.
  { from: "let DEV=true", to: "let DEV=false" },
  // neutralize the runtime backtick toggle so a player can't re-enable DEV.
  { from: "DEV=!DEV;", to: "DEV=false;" },
];

function fail(msg) {
  console.error("sync-assets: " + msg);
  process.exit(1);
}

const srcHtml = join(repoRoot, "index.html");
if (!existsSync(srcHtml)) fail("cannot find " + srcHtml);

let html = readFileSync(srcHtml, "utf8");
for (const { from, to } of edits) {
  if (!html.includes(from)) fail(`expected to find ${JSON.stringify(from)} in index.html (source drifted?)`);
  html = html.split(from).join(to);
}

// Fresh app/ each run so stale files never linger.
rmSync(appDir, { recursive: true, force: true });
mkdirSync(appDir, { recursive: true });

writeFileSync(join(appDir, "index.html"), html);

for (const asset of ["music", "sfx"]) {
  const src = join(repoRoot, asset);
  if (!existsSync(src)) fail("cannot find asset dir " + src);
  cpSync(src, join(appDir, asset), { recursive: true });
}

console.log("sync-assets: wrote app/ (DEV disabled) + music/ + sfx/");
