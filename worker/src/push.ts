import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";
import { fechaLocal, fnv1a, type CategoriaId } from "shared";
import type { Env } from "./env";
import { destacadasServidor, fraseDelDiaPara, parsearTemas, zonaValida } from "./frases";
import { aMinutos, horariosDelDia, minutosDesde, tocaAhora } from "./horarios";

export interface Suscripcion {
  subscription: PushSubscription;
  cantidad: number;
  desde: string;
  hasta: string;
  temas: CategoriaId[];
  zona: string;
  /** Si está, una notificación cada N horas (1 a 6) en vez de `cantidad` por día. */
  cadaHoras?: number;
  /** "<fecha>|<índice>" de la última notificación mandada, para no repetirla. */
  enviado?: string;
}

export const claveSuscripcion = (endpoint: string) => `sub:${fnv1a(endpoint).toString(16)}`;

/** Lo justo para decidir a quién le toca, sin leer cada suscripción. */
interface EntradaIndice {
  clave: string;
  cantidad: number;
  desde: string;
  hasta: string;
  zona: string;
  cadaHoras?: number;
}

async function leerIndice(env: Env): Promise<EntradaIndice[]> {
  return ((await env.KV.get("subs", "json")) as EntradaIndice[] | null) ?? [];
}

export async function guardarSuscripcion(env: Env, sub: Suscripcion): Promise<void> {
  const clave = claveSuscripcion(sub.subscription.endpoint);
  const previa = (await env.KV.get(clave, "json")) as Suscripcion | null;
  // Conserva la marca de enviado: reabrir la app no tiene que repetir la última notificación.
  await env.KV.put(clave, JSON.stringify(previa?.enviado ? { ...sub, enviado: previa.enviado } : sub));
  const entrada: EntradaIndice = { clave, cantidad: sub.cantidad, desde: sub.desde, hasta: sub.hasta, zona: sub.zona };
  if (sub.cadaHoras) entrada.cadaHoras = sub.cadaHoras;
  const indice = (await leerIndice(env)).filter((e) => e.clave !== clave);
  await env.KV.put("subs", JSON.stringify([...indice, entrada]));
}

export async function borrarSuscripcion(env: Env, clave: string): Promise<void> {
  await env.KV.delete(clave);
  await env.KV.put("subs", JSON.stringify((await leerIndice(env)).filter((e) => e.clave !== clave)));
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
  const cadaHoras = c!.cadaHoras;
  if (cadaHoras !== undefined && cadaHoras !== null && (!Number.isInteger(cadaHoras) || cadaHoras < 1 || cadaHoras > 6)) return null;
  return {
    ...(cadaHoras ? { cadaHoras } : {}),
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
    const buenas = await destacadasServidor(env);
    const deTemas = sub.temas.length ? buenas.filter((f) => sub.temas.includes(f.categoria)) : buenas;
    const pool = deTemas.length ? deTemas : buenas;
    frase = pool[Math.floor(Math.random() * pool.length)];
  }
  return { titulo: "Motivación", cuerpo: frase.autor ? `${frase.texto} — ${frase.autor}` : frase.texto, fraseId: frase.id };
}

/**
 * Cron cada minuto. Cada envío cifrado gasta ~6 ms de CPU y el plan gratis da 10 ms,
 * así que se manda uno por minuto: los que comparten horario se ordenan por clave y
 * cada uno tiene su minuto fijo dentro de la ventana de 15 (0, 1, 2…). Que el minuto
 * sea fijo evita repetir aunque el KV devuelva una marca de "enviado" vieja.
 */
export async function enviarNotificaciones(env: Env, ahora = new Date()): Promise<void> {
  const grupos = new Map<number, { entrada: EntradaIndice; indice: number; transcurridos: number }[]>();
  for (const entrada of await leerIndice(env)) {
    const horarios = horariosDelDia(entrada.cantidad, entrada.desde, entrada.hasta, entrada.cadaHoras);
    const indice = tocaAhora(horarios, ahora, entrada.zona);
    if (indice === null) continue;
    const transcurridos = minutosDesde(horarios[indice], ahora, entrada.zona);
    const inicio = Math.floor(ahora.getTime() / 60000) - transcurridos;
    grupos.set(inicio, [...(grupos.get(inicio) ?? []), { entrada, indice, transcurridos }]);
  }

  for (const grupo of grupos.values()) {
    grupo.sort((a, b) => (a.entrada.clave < b.entrada.clave ? -1 : 1));
    const turno = grupo.find((g, orden) => orden === g.transcurridos);
    if (!turno) continue;
    await enviarA(env, turno.entrada.clave, turno.indice, ahora);
    return;
  }
}

async function enviarA(env: Env, clave: string, indice: number, ahora: Date): Promise<void> {
  const sub = (await env.KV.get(clave, "json")) as Suscripcion | null;
  if (!sub) return;
  const marca = `${fechaLocal(ahora, sub.zona)}|${indice}`;
  if (sub.enviado === marca) return;
  const vapid = { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE };
  try {
    const mensaje = await mensajePara(env, sub, indice, ahora);
    const payload = await buildPushPayload({ data: JSON.stringify(mensaje), options: { ttl: 4 * 60 * 60 } }, sub.subscription, vapid);
    const res = await fetch(sub.subscription.endpoint, payload);
    if (res.status === 404 || res.status === 410) {
      await borrarSuscripcion(env, clave);
      return;
    }
  } catch {
    // Un envío que falla no se reintenta: queda marcado igual.
  }
  await env.KV.put(clave, JSON.stringify({ ...sub, enviado: marca }));
}
