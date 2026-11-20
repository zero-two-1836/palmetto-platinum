// Palmetto Platinum — the entry program for the GTA VI trophy guide bounty.
//
// It copies app/ and screenshots/ into the output directory and writes the
// dossier with the kit's vendored library, so the dossier handed in is
// exactly the one the scorer rebuilds from the same files and compares byte
// for byte. Outside the grader, MAKEFUN_OUTPUT_DIR names the output
// directory; the grader's /output is the default.

import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, "dossier.json"), dossier);
console.log(`Palmetto Platinum: dossier.json written to ${out} (${dossier.length} bytes)`);
