import type { CategoriaId, Frase } from "shared";
import { WORKER_URL } from "../config";
import type { Remotas } from "./almacen";

async function pedir<T>(ruta: string): Promise<T | null> {
  try {
    const res = await fetch(WORKER_URL + ruta);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** null si falla la red; frases vacío si ya estás al día. */
export const obtenerRemotas = (desde: string) =>
  pedir<Remotas>(`/frases?desde=${encodeURIComponent(desde)}`);

export const obtenerFraseDelDiaRemota = (temas: CategoriaId[], zona: string) =>
  pedir<Frase>(`/frase-del-dia?temas=${temas.join(",")}&zona=${encodeURIComponent(zona)}`);
