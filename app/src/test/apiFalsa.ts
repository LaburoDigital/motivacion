import { FRASES_BASE, type Frase } from "shared";
import { vi } from "vitest";
import type { FrasesApi } from "../datos/useFrases";

export function apiFalsa(cambios: Partial<FrasesApi> = {}): FrasesApi {
  const delDia = FRASES_BASE.find((f) => f.nivel === "clave")!;
  const otras = FRASES_BASE.filter((f) => f.id !== delDia.id);
  const zen: Frase = { id: "z-1", texto: "Frase traducida", categoria: "gym", nivel: "normal", fuente: "zenquotes" };
  return {
    cargado: true,
    todas: [...FRASES_BASE, zen],
    fraseDelDia: delDia,
    estado: { vistas: {}, likes: {}, malas: [], clavesPropias: [] },
    prefs: {
      temas: [], fondo: "auto", letra: "playfair", soloFondosFavoritos: false, fondosFavoritos: [], zonaHoraria: "UTC",
      notificaciones: { activas: false, cantidad: 3, cadaHoras: 2, desde: "08:00", hasta: "22:00" }, estiloWallpaper: "negro",
    },
    siguientes: vi.fn((n: number) => [zen, ...otras].slice(0, n)),
    marcarVista: vi.fn(),
    alternarLike: vi.fn(),
    marcarClave: vi.fn(),
    marcarMala: vi.fn(),
    setPrefs: vi.fn(),
    ...cambios,
  };
}
