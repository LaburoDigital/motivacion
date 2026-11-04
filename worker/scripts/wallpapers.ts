// Genera los wallpapers de todas las frases Clave en app/dist/wallpapers/<estilo>/<id>.jpg.
// Correr después de `npm run build -w app` y antes de publicar la app en Cloudflare Pages.
// LIMITE=5 genera solo las primeras 5 frases (para probar).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Frase } from "shared";
import { clavesParaRenderizar, directoriosWallpaper, generarWallpaper } from "../render/wallpaper";

const raiz = new URL("../../", import.meta.url);
const curadas = JSON.parse(readFileSync(new URL("curadas/frases.json", raiz), "utf8")) as Frase[];
const limite = Number(process.env.LIMITE) || Infinity;
const frases = clavesParaRenderizar(curadas).slice(0, limite);

let hechas = 0;
const carpetas = directoriosWallpaper();
for (const { dir: nombre, estilo, modo } of carpetas) {
  const dir = new URL(`app/dist/wallpapers/${nombre}/`, raiz);
  mkdirSync(dir, { recursive: true });
  for (const frase of frases) {
    const archivo = new URL(`${frase.id}.jpg`, dir);
    if (existsSync(archivo) && !process.env.FORZAR) continue;
    writeFileSync(archivo, await generarWallpaper(frase, estilo, 1179, 2556, undefined, modo));
    hechas++;
  }
  console.log(`${nombre}: listo`);
}
console.log(`${hechas} wallpapers generados (${frases.length} frases × ${carpetas.length} carpetas)`);
