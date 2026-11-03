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
    prefs: { temas: [], estiloVisual: "min-noche", soloFondosFavoritos: false, fondosFavoritos: [], zonaHoraria: "UTC" },
    siguientes: vi.fn((n: number) => [zen, ...otras].slice(0, n)),
    marcarVista: vi.fn(),
    alternarLike: vi.fn(),
    marcarClave: vi.fn(),
    marcarMala: vi.fn(),
    setPrefs: vi.fn(),
    ...cambios,
  };
}
