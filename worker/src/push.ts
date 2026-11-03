import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";
import { fechaLocal, fnv1a, type CategoriaId } from "shared";
import type { Env } from "./env";
import { fraseDelDiaPara, parsearTemas, todasLasFrases, zonaValida } from "./frases";
import { aMinutos, horariosDelDia, tocaAhora } from "./horarios";

export interface Suscripcion {
  subscription: PushSubscription;
  cantidad: number;
  desde: string;
  hasta: string;
  temas: CategoriaId[];
  zona: string;
  /** "<fecha>|<índice>" de la última notificación mandada, para no repetirla. */
  enviado?: string;
}

export const claveSuscripcion = (endpoint: string) => `sub:${fnv1a(endpoint).toString(16)}`;

async function leerIndice(env: Env): Promise<string[]> {
  return ((await env.KV.get("subs", "json")) as string[] | null) ?? [];
}

export async function guardarSuscripcion(env: Env, sub: Suscripcion): Promise<void> {
  const clave = claveSuscripcion(sub.subscription.endpoint);
  await env.KV.put(clave, JSON.stringify(sub));
  const indice = await leerIndice(env);
  if (!indice.includes(clave)) await env.KV.put("subs", JSON.stringify([...indice, clave]));
}

export async function borrarSuscripcion(env: Env, clave: string): Promise<void> {
  await env.KV.delete(clave);
  await env.KV.put("subs", JSON.stringify((await leerIndice(env)).filter((k) => k !== clave)));
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Valida el cuerpo de POST /suscripcion; null si no sirve. */
export function validarSuscripcion(cuerpo: unknown): Suscripcion | null {
  const c = cuerpo as Partial<Suscripcion> | null;
  const s = c?.subscription;
  if (!s?.endpoint?.startsWith("https://") || !s.keys?.p256dh || !s.keys?.auth) return null;
  if (!Number.isInteger(c!.cantidad) || c!.cantidad! < 1 || c!.cantidad! > 5) return null;
  if (!HORA.test(c!.desde ?? "") || !HORA.test(c!.hasta ?? "")) return null;
  if (aMinutos(c!.desde!) >= aMinutos(c!.hasta!)) return null;
  return {
    subscription: { endpoint: s.endpoint, expirationTime: s.expirationTime ?? null, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } },
    cantidad: c!.cantidad!,
    desde: c!.desde!,
    hasta: c!.hasta!,
    temas: parsearTemas((c!.temas ?? []).join(",")),
    zona: zonaValida(c!.zona ?? null),
  };
}

export interface MensajePush {
  titulo: string;
  cuerpo: string;
  fraseId: string;
}

/** La primera del día es la Clave del día; las demás, una buena o clave de sus temas. */
export async function mensajePara(env: Env, sub: Suscripcion, indice: number, ahora: Date): Promise<MensajePush> {
  let frase = indice === 0 ? await fraseDelDiaPara(env, sub.temas, sub.zona, ahora) : null;
  if (!frase) {
    const todas = await todasLasFrases(env);
    const buenas = todas.filter((f) => f.nivel !== "normal");
    const deTemas = sub.temas.length ? buenas.filter((f) => sub.temas.includes(f.categoria)) : buenas;
    const pool = deTemas.length ? deTemas : buenas;
    frase = pool[Math.floor(Math.random() * pool.length)];
  }
  return { titulo: "Motivación", cuerpo: frase.autor ? `${frase.texto} — ${frase.autor}` : frase.texto, fraseId: frase.id };
}

/**
 * Cron cada minuto: manda como máximo `maxEnvios` notificaciones por corrida
 * (cada envío cifrado gasta ~6 ms de CPU y el plan gratis da 10 ms). Las que
 * coinciden salen en los minutos siguientes, dentro de la ventana de 15 minutos.
 */
export async function enviarNotificaciones(env: Env, ahora = new Date(), maxEnvios = 1): Promise<void> {
  const vapid = { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE };
  let enviados = 0;
  for (const clave of await leerIndice(env)) {
    if (enviados >= maxEnvios) break;
    const sub = (await env.KV.get(clave, "json")) as Suscripcion | null;
    if (!sub) continue;
    const indice = tocaAhora(horariosDelDia(sub.cantidad, sub.desde, sub.hasta), ahora, sub.zona);
    if (indice === null) continue;
    const marca = `${fechaLocal(ahora, sub.zona)}|${indice}`;
    if (sub.enviado === marca) continue;
    enviados++;
    try {
      const mensaje = await mensajePara(env, sub, indice, ahora);
      const payload = await buildPushPayload({ data: JSON.stringify(mensaje), options: { ttl: 4 * 60 * 60 } }, sub.subscription, vapid);
      const res = await fetch(sub.subscription.endpoint, payload);
      if (res.status === 404 || res.status === 410) {
        await borrarSuscripcion(env, clave);
        continue;
      }
    } catch {
      // Un envío que falla no se reintenta: queda marcado igual.
    }
    await env.KV.put(clave, JSON.stringify({ ...sub, enviado: marca }));
  }
}
