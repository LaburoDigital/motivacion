import { get, set } from "idb-keyval";
import type { CategoriaId, EstadoFeed, Frase } from "shared";

export interface Preferencias {
  temas: CategoriaId[];
  estiloVisual: string;
  soloFondosFavoritos: boolean;
  fondosFavoritos: string[];
  zonaHoraria: string;
}

export interface Remotas {
  version: string;
  frases: Frase[];
}

export interface FraseDelDiaGuardada {
  fecha: string;
  id: string;
}

const estadoVacio = (): EstadoFeed => ({ vistas: {}, likes: {}, malas: [], clavesPropias: [] });
const prefsDefault = (): Preferencias => ({
  temas: [],
  estiloVisual: "min-noche",
  soloFondosFavoritos: false,
  fondosFavoritos: [],
  zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

async function leer<T>(clave: string, porDefecto: () => T): Promise<T> {
  return ((await get(clave)) as T | undefined) ?? porDefecto();
}

export const almacen = {
  leerEstado: () => leer("estado", estadoVacio),
  guardarEstado: (e: EstadoFeed) => set("estado", e),
  leerPrefs: async () => ({ ...prefsDefault(), ...(await leer<Partial<Preferencias>>("prefs", () => ({}))) }),
  guardarPrefs: (p: Preferencias) => set("prefs", p),
  leerRemotas: () => leer<Remotas>("remotas", () => ({ version: "", frases: [] })),
  guardarRemotas: (r: Remotas) => set("remotas", r),
  leerFraseDelDia: () => leer<FraseDelDiaGuardada | null>("fraseDelDia", () => null),
  guardarFraseDelDia: (v: FraseDelDiaGuardada) => set("fraseDelDia", v),
};
