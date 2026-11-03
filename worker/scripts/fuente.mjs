// Embebe Playfair Display Bold (OFL, vía @fontsource) como base64 para el wallpaper.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const woff = readFileSync(require.resolve("@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff"));
writeFileSync(
  new URL("../render/fuente.ts", import.meta.url),
  `// Generado por scripts/fuente.mjs. Playfair Display Bold, licencia SIL Open Font License.\nexport const FUENTE_BASE64 = "${woff.toString("base64")}";\n`,
);
console.log(`fuente: ${woff.length} bytes`);
