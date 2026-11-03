import type { Preferencias } from "../datos/almacen";

export interface EstiloVisual {
  id: string;
  tipo: "minimalista" | "foto";
  nombre: string;
  fondoCss?: string;
  picsumId?: number;
  fuente: string;
  colorTexto: string;
}

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Inter', system-ui, sans-serif";
const DISPLAY = "'Bebas Neue', Impact, sans-serif";

const MINIMALISTAS: EstiloVisual[] = [
  ["min-noche", "Noche", "linear-gradient(160deg,#0b0b0f,#1c1c28)", SERIF, "#f5f5f5"],
  ["min-negro", "Negro puro", "#000", SANS, "#ffffff"],
  ["min-oceano", "Océano", "linear-gradient(160deg,#0f2027,#203a43,#2c5364)", SERIF, "#eaf6ff"],
  ["min-atardecer", "Atardecer", "linear-gradient(160deg,#41295a,#2f0743)", SERIF, "#ffe9f3"],
  ["min-fuego", "Fuego", "linear-gradient(160deg,#200122,#6f0000)", DISPLAY, "#fff1e6"],
  ["min-bosque", "Bosque", "linear-gradient(160deg,#0a1f14,#134e3a)", SERIF, "#eafff3"],
  ["min-acero", "Acero", "linear-gradient(160deg,#232526,#414345)", SANS, "#f2f2f2"],
  ["min-arena", "Arena", "linear-gradient(160deg,#e6dada,#c9b99a)", SERIF, "#2b2118"],
  ["min-papel", "Papel", "#f4efe6", SERIF, "#1d1d1d"],
  ["min-medianoche", "Medianoche", "radial-gradient(circle at 30% 20%,#1e3c72,#0b0b1a 70%)", SANS, "#eef2ff"],
  ["min-oro", "Oro", "linear-gradient(160deg,#1a1405,#4a3b12)", SERIF, "#f7e7b4"],
  ["min-lavanda", "Lavanda", "linear-gradient(160deg,#2a2440,#5b4b8a)", SERIF, "#f4efff"],
  ["min-grafito", "Grafito", "repeating-linear-gradient(45deg,#16161a 0 12px,#1b1b20 12px 24px)", DISPLAY, "#f5f5f5"],
  ["min-aurora", "Aurora", "linear-gradient(160deg,#0f0c29,#302b63,#24243e)", SANS, "#e8f0ff"],
].map(([id, nombre, fondoCss, fuente, colorTexto]) => ({ id, nombre, fondoCss, fuente, colorTexto, tipo: "minimalista" as const }));

// Fotos de Picsum (paisajes, mar, montaña, ciudad). Se oscurecen al mostrarlas.
const PICSUM_IDS = [10, 11, 13, 14, 15, 16, 17, 18, 19, 28, 29, 37, 39, 41, 43, 46, 47, 49, 50, 54, 57, 58, 59, 61, 65, 76, 84, 88, 98, 101, 110, 118];
const FOTOS: EstiloVisual[] = PICSUM_IDS.map((picsumId, i) => ({
  id: `foto-${i + 1}`,
  tipo: "foto",
  nombre: `Foto ${i + 1}`,
  picsumId,
  fuente: [SERIF, SANS, DISPLAY][i % 3],
  colorTexto: "#ffffff",
}));

export const ESTILOS: EstiloVisual[] = [...MINIMALISTAS, ...FOTOS];
export const ESTILO_RESPALDO = MINIMALISTAS[0];

export const estiloPorId = (id: string) => ESTILOS.find((e) => e.id === id);

export const urlFoto = (e: EstiloVisual, w: number, h: number) => `https://picsum.photos/id/${e.picsumId}/${w}/${h}`;

/** Con "solo favoritos" rota entre los favoritos; si no, el estilo elegido. */
export function elegirFondo(prefs: Preferencias, semilla: number): EstiloVisual {
  if (prefs.soloFondosFavoritos) {
    const favs = prefs.fondosFavoritos.map(estiloPorId).filter((e): e is EstiloVisual => !!e);
    if (favs.length) return favs[Math.abs(semilla) % favs.length];
  }
  return estiloPorId(prefs.estiloVisual) ?? ESTILO_RESPALDO;
}
