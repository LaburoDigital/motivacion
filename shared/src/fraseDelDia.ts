import { fnv1a } from "./hash";
import type { CategoriaId, Frase } from "./tipos";

/** "YYYY-MM-DD" en la zona horaria del usuario. */
export function fechaLocal(ahora: Date, zonaHoraria: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zonaHoraria, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(ahora);
}

const porId = (a: Frase, b: Frase) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * La Clave del día: determinista por fecha y temas, para que la app,
 * la notificación y el wallpaper muestren la misma frase.
 */
export function fraseDelDia(frases: Frase[], fecha: string, temas: CategoriaId[]): Frase | null {
  const claves = frases.filter((f) => f.nivel === "clave");
  let candidatas = temas.length ? claves.filter((f) => temas.includes(f.categoria)) : claves;
  if (!candidatas.length) candidatas = claves;
  if (!candidatas.length) return null;
  candidatas = [...candidatas].sort(porId);
  const clave = fecha + "|" + [...temas].sort().join(",");
  return candidatas[fnv1a(clave) % candidatas.length];
}
