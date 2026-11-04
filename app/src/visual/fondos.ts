import { FOTOS, PACKS_POR_CATEGORIA, fnv1a, fotoDeFrase, urlFotoUnsplash, type Foto, type Frase, type PackId } from "shared";
import type { Preferencias } from "../datos/almacen";

export type ModoFondo = "auto" | PackId;

export const urlFoto = (f: Foto, w: number, h: number) => urlFotoUnsplash(f.id, w, h);

export const fotoPorId = (id: string) => FOTOS.find((f) => f.id === id);

/** Las fotos entre las que puede rotar una frase, según las preferencias. */
export function poolDe(frase: Frase, prefs: Preferencias): Foto[] {
  if (prefs.soloFondosFavoritos) {
    const favs = prefs.fondosFavoritos.map(fotoPorId).filter((f): f is Foto => !!f);
    if (favs.length) return favs;
  }
  const packs = prefs.fondo === "auto" ? PACKS_POR_CATEGORIA[frase.categoria] : [prefs.fondo];
  const pool = FOTOS.filter((f) => packs.includes(f.pack));
  return pool.length ? pool : FOTOS;
}

/** La foto de una frase: fija para cada frase; `desplazamiento` pasa a la siguiente del mismo grupo. */
export function fondoPara(frase: Frase, prefs: Preferencias, desplazamiento = 0): Foto {
  if (!prefs.soloFondosFavoritos || !prefs.fondosFavoritos.some((id) => FOTOS.some((f) => f.id === id))) {
    return fotoDeFrase(frase, prefs.fondo, desplazamiento);
  }
  const pool = poolDe(frase, prefs);
  return pool[(fnv1a(frase.id) + desplazamiento) % pool.length];
}
