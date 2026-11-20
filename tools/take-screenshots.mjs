// Palmetto Platinum — screenshot tool.
//
// Serves the app with serve.ts, renders each view named in shots.json in the
// headless Chromium that ships with Playwright's browser cache, and writes
// the captures as JPEGs into screenshots/, stepping the JPEG quality down
// until each one fits the 256 KiB cap. The shots are real renders of the app
// in its seeded demo state — never edited or composited.

import { execFile, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const outDir = join(repo, "screenshots");
const PORT = 8931;
const MAX_BYTES = 262144;

async function findChromium() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const cache = join(process.env.HOME ?? "", ".cache", "ms-playwright");
  const dirs = await readdir(cache).catch(() => []);
  for (const d of dirs.sort().reverse()) {
    const shell = join(cache, d, "chrome-linux", "headless_shell");
    if (d.startsWith("chromium_headless_shell") && existsSync(shell)) return shell;
    const full = join(cache, d, "chrome-linux", "chrome");
    if (d.startsWith("chromium") && existsSync(full)) return full;
  }
  throw new Error("No Chromium found in the Playwright browser cache; set CHROME_BIN.");
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("serve.ts did not come up");
}

async function shoot(chromium, shot) {
  const png = join(outDir, `.tmp-${shot.file}.png`);
  const jpg = join(outDir, shot.file);
  await run(chromium, [
    "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${shot.viewport.width},${shot.viewport.height}`,
    "--virtual-time-budget=9000",
    `--screenshot=${png}`,
    `http://localhost:${PORT}${shot.url}`,
  ], { timeout: 60000 });
  // ffmpeg -q:v runs 2 (best) to 31 (worst); walk down until the JPEG fits.
  for (const q of [5, 7, 9, 12, 16, 20, 24]) {
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-q:v", String(q), jpg]);
    const size = statSync(jpg).size;
    if (size <= MAX_BYTES) {
      console.log(`${shot.file}: ${size} bytes (q:v ${q})`);
      rmSync(png, { force: true });
      return;
    }
  }
  throw new Error(`${shot.file} would not fit ${MAX_BYTES} bytes`);
}

const shots = JSON.parse(readFileSync(join(repo, "shots.json"), "utf8"));
mkdirSync(outDir, { recursive: true });
const chromium = await findChromium();
const server = spawn("node", [join(repo, "serve.ts")], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: "ignore",
});
try {
  await waitForServer();
  for (const shot of shots) await shoot(chromium, shot);
} finally {
  server.kill();
}
console.log("screenshots done");
