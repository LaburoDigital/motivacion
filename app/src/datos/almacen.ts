import { get, set } from "idb-keyval";
import type { CategoriaId, EstadoFeed, Frase, PackId } from "shared";
import type { Racha } from "../rachas/logica";

export interface Preferencias {
  temas: CategoriaId[];
  /** "auto" (según el tema de cada frase) o un pack de fotos. */
  fondo: "auto" | PackId;
  letra: string;
  icono: string;
  soloFondosFavoritos: boolean;
  fondosFavoritos: string[];
  zonaHoraria: string;
  notificaciones: PrefsNotificaciones;
  estiloWallpaper: "negro" | "degradado" | "foto";
}

export interface PrefsNotificaciones {
  activas: boolean;
  cantidad: number;
  /** Si está, una cada N horas en vez de `cantidad` por día. */
  cadaHoras: number | null;
  desde: string;
  hasta: string;
}

export interface Remotas {
  version: string;
  frases: Frase[];
}

export interface ConfigRachas {
  activas: boolean;
  /** Hora del aviso diario ("HH:MM"). */
  hora: string;
  lista: Racha[];
}

export interface FraseDelDiaGuardada {
  fecha: string;
  id: string;
  /** Temas con los que se eligió (ordenados, separados por coma). */
  temas?: string;
}

const estadoVacio = (): EstadoFeed => ({ vistas: {}, likes: {}, malas: [], clavesPropias: [] });
const prefsDefault = (): Preferencias => ({
  temas: [],
  fondo: "auto",
  letra: "playfair",
  icono: "llama",
  soloFondosFavoritos: false,
  fondosFavoritos: [],
  zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notificaciones: { activas: false, cantidad: 3, cadaHoras: 2, desde: "08:00", hasta: "22:00" },
  estiloWallpaper: "negro",
});

async function leer<T>(clave: string, porDefecto: () => T): Promise<T> {
  return ((await get(clave)) as T | undefined) ?? porDefecto();
}

export const almacen = {
  leerEstado: () => leer("estado", estadoVacio),
  guardarEstado: (e: EstadoFeed) => set("estado", e),
  leerPrefs: async () => {
    const { estiloVisual: _viejo, ...guardadas } = await leer<Partial<Preferencias> & { estiloVisual?: string }>("prefs", () => ({}));
    return { ...prefsDefault(), ...guardadas };
  },
  guardarPrefs: (p: Preferencias) => set("prefs", p),
  leerRemotas: () => leer<Remotas>("remotas", () => ({ version: "", frases: [] })),
  guardarRemotas: (r: Remotas) => set("remotas", r),
  leerFraseDelDia: () => leer<FraseDelDiaGuardada | null>("fraseDelDia", () => null),
  guardarFraseDelDia: (v: FraseDelDiaGuardada) => set("fraseDelDia", v),
  leerRachas: () => leer<ConfigRachas>("rachas", () => ({ activas: false, hora: "21:00", lista: [] })),
  guardarRachas: (c: ConfigRachas) => set("rachas", c),
};
