import { expect, test } from "vitest";
import type { Preferencias } from "../datos/almacen";
import { ESTILOS, elegirFondo, estiloPorId, urlFoto } from "./estilos";

const prefs = (p: Partial<Preferencias> = {}): Preferencias => ({
  temas: [], estiloVisual: "min-noche", soloFondosFavoritos: false, fondosFavoritos: [], zonaHoraria: "UTC",
  notificaciones: { activas: false, cantidad: 3, cadaHoras: null, desde: "08:00", hasta: "22:00" }, estiloWallpaper: "negro", ...p,
});

test("ids únicos y cantidades mínimas", () => {
  expect(new Set(ESTILOS.map((e) => e.id)).size).toBe(ESTILOS.length);
  expect(ESTILOS.filter((e) => e.tipo === "minimalista" && e.id.startsWith("min-")).length).toBeGreaterThanOrEqual(12);
  expect(ESTILOS.filter((e) => e.tipo === "foto" && e.id.startsWith("foto-")).length).toBeGreaterThanOrEqual(30);
  expect(estiloPorId("min-noche")?.tipo).toBe("minimalista");
});

test("urlFoto arma la URL de Picsum", () => {
  const foto = ESTILOS.find((e) => e.tipo === "foto")!;
  expect(urlFoto(foto, 1080, 1920)).toBe(`https://picsum.photos/id/${foto.picsumId}/1080/1920`);
});

test("solo favoritos: elige entre los favoritos", () => {
  const favs = ["foto-1", "min-oceano"];
  for (let s = 0; s < 50; s++) {
    expect(favs).toContain(elegirFondo(prefs({ soloFondosFavoritos: true, fondosFavoritos: favs }), s).id);
  }
});

test("solo favoritos sin favoritos ignora el flag", () => {
  expect(elegirFondo(prefs({ soloFondosFavoritos: true, estiloVisual: "min-oceano" }), 3).id).toBe("min-oceano");
});

test("sin el flag usa el estilo elegido; estilo desconocido cae a min-noche", () => {
  expect(elegirFondo(prefs({ estiloVisual: "foto-2" }), 9).id).toBe("foto-2");
  expect(elegirFondo(prefs({ estiloVisual: "no-existe" }), 9).id).toBe("min-noche");
});
