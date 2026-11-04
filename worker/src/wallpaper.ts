import { FRASES_BASE, PACKS, fechaLocal, fraseDelDia, type CategoriaId } from "shared";
import type { Env } from "./env";
import { fraseDelDiaPara, fraseSegunHora } from "./frases";

export type EstiloWallpaper = "negro" | "degradado" | "foto";
export const ESTILOS_WALLPAPER: EstiloWallpaper[] = ["negro", "degradado", "foto"];

const urlImagen = (env: Env, dir: string, id: string) => `${env.PAGES_URL}/wallpapers/${dir}/${id}.jpg`;

/** Carpeta de imágenes: "foto-<grupo>" si eligió un grupo de fotos; si no, la del estilo. */
export function carpetaWallpaper(estilo: EstiloWallpaper, fondo: string | null): string {
  return estilo === "foto" && fondo && PACKS.some((p) => p.id === fondo) ? `foto-${fondo}` : estilo;
}

/**
 * URL del wallpaper ya generado (en el deploy) para la Clave del día.
 * Si es una curada que todavía no tiene imagen, usa la Clave del día de la base.
 */
export async function urlWallpaper(
  env: Env, temas: CategoriaId[], zona: string, estilo: EstiloWallpaper, fondo: string | null = null, rotar = false,
): Promise<string | null> {
  const dir = carpetaWallpaper(estilo, fondo);
  const frase = rotar ? await fraseSegunHora(env, temas, zona) : await fraseDelDiaPara(env, temas, zona);
  if (!frase) return null;
  if (frase.fuente === "base") return urlImagen(env, dir, frase.id);
  try {
    const res = await fetch(urlImagen(env, dir, frase.id), { method: "HEAD" });
    if (res.ok) return urlImagen(env, dir, frase.id);
  } catch {
    // Sin respuesta: usamos la de la base.
  }
  const deBase = fraseDelDia(FRASES_BASE, fechaLocal(new Date(), zona), temas);
  return deBase ? urlImagen(env, dir, deBase.id) : null;
}
