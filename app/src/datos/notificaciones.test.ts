import { afterEach, expect, test, vi } from "vitest";
import { activarNotificaciones, desactivarNotificaciones } from "./notificaciones";

const cfg = { cantidad: 3, desde: "08:00", hasta: "22:00", temas: [], zona: "UTC" };

afterEach(() => vi.unstubAllGlobals());

function simularNavegador(permiso: NotificationPermission) {
  const sub = { endpoint: "https://push.test/x", toJSON: () => ({ endpoint: "https://push.test/x", keys: { p256dh: "a", auth: "b" } }), unsubscribe: vi.fn(async () => true) };
  const pushManager = { subscribe: vi.fn(async () => sub), getSubscription: vi.fn(async () => sub) };
  vi.stubGlobal("PushManager", function PushManager() {});
  vi.stubGlobal("Notification", { requestPermission: vi.fn(async () => permiso) });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { ready: Promise.resolve({ pushManager }) } });
  const llamadas: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    llamadas.push({ url, init });
    if (url.endsWith("/vapid")) return Response.json({ publicKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U" });
    return new Response(null, { status: 201 });
  }));
  return { pushManager, sub, llamadas };
}

test("sin service worker o push devuelve sin-soporte", async () => {
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });
  expect(await activarNotificaciones(cfg)).toBe("sin-soporte");
});

test("permiso denegado devuelve denegado", async () => {
  simularNavegador("denied");
  expect(await activarNotificaciones(cfg)).toBe("denegado");
});

test("con permiso se suscribe y manda la config al Worker", async () => {
  const { pushManager, llamadas } = simularNavegador("granted");
  expect(await activarNotificaciones(cfg)).toBe("ok");
  expect(pushManager.subscribe).toHaveBeenCalled();
  const post = llamadas.find((l) => l.url.endsWith("/suscripcion"))!;
  expect(post.init?.method).toBe("POST");
  expect(JSON.parse(post.init!.body as string)).toMatchObject({ cantidad: 3, desde: "08:00", hasta: "22:00", subscription: { endpoint: "https://push.test/x" } });
});

test("desactivar borra la suscripción en el Worker y en el navegador", async () => {
  const { sub, llamadas } = simularNavegador("granted");
  await desactivarNotificaciones();
  expect(llamadas.some((l) => l.url.endsWith("/suscripcion") && l.init?.method === "DELETE")).toBe(true);
  expect(sub.unsubscribe).toHaveBeenCalled();
});
