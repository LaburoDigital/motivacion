import {
  FRASES_BASE, IDS_CATEGORIAS, deduplicar, fechaLocal, fnv1a, fraseDelDia,
  type CategoriaId, type Frase,
} from "shared";
import type { Env } from "./env";
import { traducir } from "./traducir";
import { categoriaPorTexto, traerZenQuotes } from "./zenquotes";

const POR_DIA = 20;
const MAX_ZEN = 3000;
export const ZONA_DEFAULT = "America/Argentina/Buenos_Aires";

async function leerLista(env: Env, clave: string): Promise<Frase[]> {
  return ((await env.KV.get(clave, "json")) as Frase[] | null) ?? [];
}

/** Curadas + ZenQuotes, sin las que repiten una de la base. */
export async function frasesRemotas(env: Env): Promise<{ version: string; frases: Frase[] }> {
  const [curadas, zen] = await Promise.all([leerLista(env, "curadas"), leerLista(env, "zen:frases")]);
  const frases = deduplicar([...FRASES_BASE, ...curadas, ...zen]).filter((f) => f.fuente !== "base");
  return { version: fnv1a(JSON.stringify(frases)).toString(16), frases };
}

/** Todas las frases que el servidor conoce (base + remotas). */
export async function todasLasFrases(env: Env): Promise<Frase[]> {
  return [...FRASES_BASE, ...(await frasesRemotas(env)).frases];
}

export function parsearTemas(texto: string | null): CategoriaId[] {
  return (texto ?? "").split(",").filter((t): t is CategoriaId => IDS_CATEGORIAS.includes(t as CategoriaId));
}

export function zonaValida(zona: string | null): string {
  if (!zona) return ZONA_DEFAULT;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zona });
    return zona;
  } catch {
    return ZONA_DEFAULT;
  }
}

export async function fraseDelDiaPara(env: Env, temas: CategoriaId[], zona: string, ahora = new Date()): Promise<Frase | null> {
  return fraseDelDia(await todasLasFrases(env), fechaLocal(ahora, zona), temas);
}

/** Cron diario: suma 20 frases de ZenQuotes traducidas y baja las curadas. */
export async function actualizarDiario(env: Env): Promise<void> {
  const previas = await leerLista(env, "zen:frases");
  const ids = new Set(previas.map((f) => f.id));
  const nuevas: Frase[] = [];
  for (const cita of await traerZenQuotes()) {
    if (nuevas.length >= POR_DIA) break;
    const id = `z-${fnv1a(cita.q).toString(16)}`;
    if (ids.has(id)) continue;
    const texto = await traducir(cita.q);
    if (!texto) continue;
    ids.add(id);
    nuevas.push({ id, texto, autor: cita.a, categoria: categoriaPorTexto(cita.q), nivel: "normal", fuente: "zenquotes" });
  }
  if (nuevas.length) {
    await env.KV.put("zen:frases", JSON.stringify([...previas, ...nuevas].slice(-MAX_ZEN)));
  }

  try {
    const res = await fetch(env.CURADAS_URL);
    if (res.ok) {
      const curadas = (await res.json()) as Frase[];
      if (Array.isArray(curadas)) await env.KV.put("curadas", JSON.stringify(curadas));
    }
  } catch {
    // Si GitHub no responde, quedan las curadas de ayer.
  }
}
