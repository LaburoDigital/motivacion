import {
  FRASES_BASE, IDS_CATEGORIAS, deduplicar, fechaLocal, fnv1a, fraseDelDia,
  type CategoriaId, type Frase,
} from "shared";
import type { Env } from "./env";
import { traducir } from "./traducir";
import { categoriaPorTexto, traerZenQuotes } from "./zenquotes";

const POR_DIA = 20;
const MAX_ZEN = 3000;
const FALLAS_SEGUIDAS = 3;
export const ZONA_DEFAULT = "America/Argentina/Buenos_Aires";

// Lo de la base ya viene deduplicado (lo garantiza un test de shared): se calcula una vez por isolate.
const CLAVES_BASE = FRASES_BASE.filter((f) => f.nivel === "clave");
const DESTACADAS_BASE = FRASES_BASE.filter((f) => f.nivel !== "normal");

async function leerLista(env: Env, clave: string): Promise<Frase[]> {
  return ((await env.KV.get(clave, "json")) as Frase[] | null) ?? [];
}

/**
 * Deja listo en KV todo lo que piden las rutas, para que cada pedido gaste poca CPU:
 * - "remotas" / "remotas:version": el JSON de /frases tal cual se responde.
 * - "claves:curadas" / "destacadas:curadas": las curadas que entran en la frase del día y en las notificaciones.
 */
export async function recalcularRemotas(env: Env): Promise<void> {
  const [curadas, zen] = await Promise.all([leerLista(env, "curadas"), leerLista(env, "zen:frases")]);
  const frases = deduplicar([...FRASES_BASE, ...curadas, ...zen]).filter((f) => f.fuente !== "base");
  const version = fnv1a(JSON.stringify(frases)).toString(16);
  const curadasUnicas = frases.filter((f) => f.fuente === "curada");
  await Promise.all([
    env.KV.put("remotas", JSON.stringify({ version, frases })),
    env.KV.put("remotas:version", JSON.stringify(version)),
    env.KV.put("claves:curadas", JSON.stringify(curadasUnicas.filter((f) => f.nivel === "clave"))),
    env.KV.put("destacadas:curadas", JSON.stringify(curadasUnicas.filter((f) => f.nivel !== "normal"))),
  ]);
}

async function leerPrecalculado<T>(env: Env, clave: string): Promise<T> {
  let valor = (await env.KV.get(clave, "json")) as T | null;
  if (valor === null) {
    // Primera vez (antes del primer cron): se calcula una sola vez y queda guardado.
    await recalcularRemotas(env);
    valor = (await env.KV.get(clave, "json")) as T;
  }
  return valor;
}

/** Cuerpo de GET /frases, ya armado; vacío si `desde` es la versión actual. */
export async function cuerpoFrases(env: Env, desde: string | null): Promise<string> {
  const version = await leerPrecalculado<string>(env, "remotas:version");
  if (desde === version) return JSON.stringify({ version, frases: [] });
  return ((await env.KV.get("remotas")) as string | null) ?? JSON.stringify({ version: "", frases: [] });
}

/** Clave del servidor: base + curadas. */
export async function clavesServidor(env: Env): Promise<Frase[]> {
  return [...CLAVES_BASE, ...(await leerPrecalculado<Frase[]>(env, "claves:curadas"))];
}

/** Buenas y Clave del servidor, para las notificaciones que no son la primera del día. */
export async function destacadasServidor(env: Env): Promise<Frase[]> {
  return [...DESTACADAS_BASE, ...(await leerPrecalculado<Frase[]>(env, "destacadas:curadas"))];
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
  return fraseDelDia(await clavesServidor(env), fechaLocal(ahora, zona), temas);
}

async function bajarCuradas(env: Env): Promise<void> {
  try {
    const res = await fetch(env.CURADAS_URL);
    if (!res.ok) return;
    const curadas = (await res.json()) as Frase[];
    if (Array.isArray(curadas)) await env.KV.put("curadas", JSON.stringify(curadas));
  } catch {
    // Si GitHub no responde, quedan las curadas de ayer.
  }
}

/**
 * Cron diario: baja las curadas, suma hasta 20 frases de ZenQuotes traducidas y
 * recalcula lo precalculado. Las curadas van primero y las traducciones se cortan
 * tras 3 fallas seguidas, para no pasar los 50 subpedidos del plan gratis.
 */
export async function actualizarDiario(env: Env): Promise<void> {
  await bajarCuradas(env);

  const previas = await leerLista(env, "zen:frases");
  const ids = new Set(previas.map((f) => f.id));
  const nuevas: Frase[] = [];
  let fallas = 0;
  for (const cita of await traerZenQuotes()) {
    if (nuevas.length >= POR_DIA || fallas >= FALLAS_SEGUIDAS) break;
    const id = `z-${fnv1a(cita.q).toString(16)}`;
    if (ids.has(id)) continue;
    const texto = await traducir(cita.q);
    if (!texto) {
      fallas++;
      continue;
    }
    fallas = 0;
    ids.add(id);
    nuevas.push({ id, texto, autor: cita.a, categoria: categoriaPorTexto(cita.q), nivel: "normal", fuente: "zenquotes" });
  }
  if (nuevas.length) {
    await env.KV.put("zen:frases", JSON.stringify([...previas, ...nuevas].slice(-MAX_ZEN)));
  }

  await recalcularRemotas(env);
}

/**
 * Para el fondo que cambia durante el día: antes de las 10 es la frase del día;
 * después, otra Clave de los mismos temas que cambia con cada hora.
 */
export async function fraseSegunHora(env: Env, temas: CategoriaId[], zona: string, ahora = new Date()): Promise<Frase | null> {
  const delDia = await fraseDelDiaPara(env, temas, zona, ahora);
  const hora = Number(new Intl.DateTimeFormat("en-GB", { timeZone: zona, hour: "2-digit", hourCycle: "h23" }).format(ahora));
  if (hora < 10 || !delDia) return delDia;
  const claves = await clavesServidor(env);
  const fecha = fechaLocal(ahora, zona);
  for (const extra of ["", "|b", "|c"]) {
    const f = fraseDelDia(claves, `${fecha}|${hora}${extra}`, temas);
    if (f && f.id !== delDia.id) return f;
  }
  return delDia;
}
