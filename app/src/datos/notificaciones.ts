import type { CategoriaId } from "shared";
import { WORKER_URL } from "../config";

export interface ConfigNotificaciones {
  cantidad: number;
  cadaHoras?: number | null;
  dias?: number[];
  desde: string;
  hasta: string;
  temas: CategoriaId[];
  zona: string;
  /** Aviso diario de racha: solo hora y números. */
  racha?: { hora: string; dias: number; fecha: string; crece: boolean; clase: string | null; nombre?: string } | null;
}

export type ResultadoActivar = "ok" | "sin-soporte" | "denegado" | "error";

function claveAplicacion(base64url: string): Uint8Array {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

const hayPush = () =>
  typeof navigator !== "undefined" && !!navigator.serviceWorker && typeof PushManager !== "undefined" && typeof Notification !== "undefined";

/** Pide permiso, se suscribe y le pasa al Worker horarios y temas. En iPhone requiere la app instalada (iOS 16.4+). */
export async function activarNotificaciones(cfg: ConfigNotificaciones): Promise<ResultadoActivar> {
  if (!hayPush()) return "sin-soporte";
  if ((await Notification.requestPermission()) !== "granted") return "denegado";
  try {
    const { publicKey } = (await (await fetch(`${WORKER_URL}/vapid`)).json()) as { publicKey: string };
    const registro = await navigator.serviceWorker.ready;
    const subscription = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveAplicacion(publicKey) });
    const res = await fetch(`${WORKER_URL}/suscripcion`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), ...cfg }),
    });
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function desactivarNotificaciones(): Promise<void> {
  if (!hayPush()) return;
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  if (!sub) return;
  await fetch(`${WORKER_URL}/suscripcion`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => undefined);
  await sub.unsubscribe();
}
