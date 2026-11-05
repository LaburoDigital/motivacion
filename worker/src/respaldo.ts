import type { Env } from "./env";

const CODIGO = /^[a-zñ]{2,12}(-[a-zñ]{2,12}){5}$/;
const MAXIMO = 200_000;

/** El código nunca se guarda en claro: la clave del KV es su hash. */
async function claveDe(codigo: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codigo));
  return `resp:${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export const codigoValido = (codigo: string) => CODIGO.test(codigo);

/** Guarda el respaldo; devuelve el status HTTP. */
export async function guardarRespaldo(env: Env, codigo: string, cuerpo: string): Promise<number> {
  if (!codigoValido(codigo)) return 400;
  if (cuerpo.length > MAXIMO) return 413;
  let datos: unknown;
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    return 400;
  }
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return 400;
  await env.KV.put(await claveDe(codigo), cuerpo);
  return 204;
}

export async function leerRespaldo(env: Env, codigo: string): Promise<string | null> {
  if (!codigoValido(codigo)) return null;
  return (await env.KV.get(await claveDe(codigo))) as string | null;
}
