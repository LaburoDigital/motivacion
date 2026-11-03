// Render de wallpapers en Node, en el deploy (en el Worker gratis no alcanza la CPU).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import jpeg from "jpeg-js";
import satori from "satori";
import { FRASES_BASE, fnv1a, type Frase } from "shared";
import type { EstiloWallpaper } from "../src/wallpaper";
import { FUENTE_BASE64 } from "./fuente";
import { calcularLayout } from "./layoutWallpaper";

/** Fotos de Picsum para el estilo "foto"; cada frase tiene la suya. */
export const FOTOS_WALLPAPER = [10, 15, 16, 28, 29, 39, 46, 54, 57, 58, 76, 84];

const require = createRequire(import.meta.url);
const fuente = Buffer.from(FUENTE_BASE64, "base64");
let wasmListo: Promise<void> | null = null;

export type BajarFoto = (url: string) => Promise<string | null>;

const bajarFoto: BajarFoto = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
};

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });

/** JPG con la frase legible debajo del reloj (el tercio de arriba queda libre). */
export async function generarWallpaper(
  frase: Frase, estilo: EstiloWallpaper, w = 1179, h = 2556, foto: BajarFoto = bajarFoto,
): Promise<Uint8Array> {
  const { top, fontSize, maxWidth } = calcularLayout(frase.texto, w, h, !!frase.autor);
  const idFoto = FOTOS_WALLPAPER[fnv1a(frase.id) % FOTOS_WALLPAPER.length];
  const imagen = estilo === "foto" ? await foto(`https://picsum.photos/id/${idFoto}/${w}/${h}?blur=5`) : null;
  const fondo = estilo === "degradado" ? "linear-gradient(160deg, #0f0c29, #302b63 55%, #0b0b0f)" : "#000000";

  const capas: unknown[] = [];
  if (imagen) {
    capas.push({ type: "img", props: { src: imagen, width: w, height: h, style: { position: "absolute", top: 0, left: 0 } } });
    capas.push(el("div", { position: "absolute", top: 0, left: 0, width: w, height: h, backgroundColor: "rgba(0,0,0,0.65)" }));
  }
  capas.push(
    el(
      "div",
      { position: "absolute", top, left: (w - maxWidth) / 2, width: maxWidth, display: "flex", flexDirection: "column", alignItems: "center" },
      [
        el("div", { fontSize, lineHeight: 1.3, color: "#ffffff", textAlign: "center" }, frase.texto),
        ...(frase.autor
          ? [el("div", { marginTop: fontSize * 0.6, fontSize: fontSize * 0.5, color: "rgba(255,255,255,0.75)" }, `— ${frase.autor}`)]
          : []),
      ],
    ),
  );

  const svg = await satori(
    el("div", { display: "flex", position: "relative", width: w, height: h, background: fondo }, capas) as never,
    { width: w, height: h, fonts: [{ name: "Playfair Display", data: fuente, weight: 700, style: "normal" }] },
  );
  wasmListo ??= initWasm(readFileSync(require.resolve("@resvg/resvg-wasm/index_bg.wasm")));
  await wasmListo;
  const render = new Resvg(svg, { fitTo: { mode: "width", value: w } }).render();
  return jpeg.encode({ data: Buffer.from(render.pixels), width: render.width, height: render.height }, 88).data;
}

/** Las frases que necesitan wallpaper: todas las Clave de la base y de las curadas. */
export function clavesParaRenderizar(curadas: Frase[]): Frase[] {
  return [...FRASES_BASE, ...curadas].filter((f) => f.nivel === "clave");
}
