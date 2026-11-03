import { FRASES_BASE, fechaLocal, fraseDelDia, type CategoriaId } from "shared";
import type { Env } from "./env";
import { fraseDelDiaPara } from "./frases";

export type EstiloWallpaper = "negro" | "degradado" | "foto";
export const ESTILOS_WALLPAPER: EstiloWallpaper[] = ["negro", "degradado", "foto"];

const urlImagen = (env: Env, estilo: EstiloWallpaper, id: string) => `${env.PAGES_URL}/wallpapers/${estilo}/${id}.jpg`;

/**
 * URL del wallpaper ya generado (en el deploy) para la Clave del día.
 * Si es una curada que todavía no tiene imagen, usa la Clave del día de la base.
 */
export async function urlWallpaper(env: Env, temas: CategoriaId[], zona: string, estilo: EstiloWallpaper): Promise<string | null> {
  const frase = await fraseDelDiaPara(env, temas, zona);
  if (!frase) return null;
  if (frase.fuente === "base") return urlImagen(env, estilo, frase.id);
  try {
    const res = await fetch(urlImagen(env, estilo, frase.id), { method: "HEAD" });
    if (res.ok) return urlImagen(env, estilo, frase.id);
  } catch {
    // Sin respuesta: usamos la de la base.
  }
  const deBase = fraseDelDia(FRASES_BASE, fechaLocal(new Date(), zona), temas);
  return deBase ? urlImagen(env, estilo, deBase.id) : null;
}
