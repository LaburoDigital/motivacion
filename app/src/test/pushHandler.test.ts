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
