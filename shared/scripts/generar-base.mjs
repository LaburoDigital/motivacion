// Convierte data/fuente/frases-base.txt en data/frases-base.json.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../data/", import.meta.url));
const NIVELES = { k: "clave", b: "buena", n: "normal" };
const frases = [];
let categoria = null;
for (const linea of readFileSync(dir + "fuente/frases-base.txt", "utf8").split(/\r?\n/)) {
  if (!linea.trim() || linea.startsWith("#")) continue;
  if (linea.startsWith("@")) { categoria = linea.slice(1).trim(); continue; }
  const [n, autor, ...resto] = linea.split("|");
  const f = { id: `b-${String(frases.length + 1).padStart(4, "0")}`, texto: resto.join("|").trim(), categoria, nivel: NIVELES[n], fuente: "base" };
  if (autor.trim()) f.autor = autor.trim();
  frases.push(f);
}
writeFileSync(dir + "frases-base.json", JSON.stringify(frases, null, 1) + "\n");
console.log(`${frases.length} frases`);
