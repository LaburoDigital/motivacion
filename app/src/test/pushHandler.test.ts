import { readFileSync } from "node:fs";
import { expect, test, vi } from "vitest";

function cargarHandler(ventanas: unknown[]) {
  const oyentes: Record<string, (e: unknown) => void> = {};
  const openWindow = vi.fn(async () => ({}));
  const self = {
    addEventListener: (tipo: string, fn: (e: unknown) => void) => { oyentes[tipo] = fn; },
    registration: { showNotification: vi.fn(async () => undefined) },
    clients: { matchAll: vi.fn(async () => ventanas), openWindow },
  };
  new Function("self", readFileSync("public/push-handler.js", "utf8"))(self);
  return { oyentes, openWindow };
}

async function tocar(oyentes: Record<string, (e: unknown) => void>) {
  let espera: Promise<unknown> = Promise.resolve();
  oyentes.notificationclick({
    notification: { close: () => undefined, data: { fraseId: "b-0001" } },
    waitUntil: (p: Promise<unknown>) => { espera = p; },
  });
  await espera;
}

test("si navigate falla, abre una ventana nueva en la frase", async () => {
  const ventana = { navigate: vi.fn(async () => { throw new TypeError("no controlada"); }), focus: vi.fn() };
  const { oyentes, openWindow } = cargarHandler([ventana]);
  await tocar(oyentes);
  expect(openWindow).toHaveBeenCalledWith("/?frase=b-0001");
});

test("sin ventanas abiertas, abre la app en la frase", async () => {
  const { oyentes, openWindow } = cargarHandler([]);
  await tocar(oyentes);
  expect(openWindow).toHaveBeenCalledWith("/?frase=b-0001");
});

test("las notificaciones se reemplazan en vez de acumularse", async () => {
  const oyentes: Record<string, (e: unknown) => void> = {};
  const showNotification = vi.fn(async () => undefined);
  const self = { addEventListener: (t: string, f: (e: unknown) => void) => { oyentes[t] = f; }, registration: { showNotification }, clients: {} };
  new Function("self", readFileSync("public/push-handler.js", "utf8"))(self);
  let espera: Promise<unknown> = Promise.resolve();
  oyentes.push({ data: { json: () => ({ titulo: "🔥 Frase del día", cuerpo: "x", fraseId: "b-1" }) }, waitUntil: (p: Promise<unknown>) => { espera = p; } });
  await espera;
  const opciones = (showNotification.mock.calls[0] as unknown[])[1] as { tag?: string; renotify?: boolean };
  expect(opciones.tag).toBe("motivacion");
  expect(opciones.renotify).toBe(true);
});
