import { renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import type { Preferencias } from "./almacen";
import { useResincronizarNotificaciones } from "./useResincronizar";

vi.mock("./notificaciones", () => ({ activarNotificaciones: vi.fn(async () => "ok") }));
const { activarNotificaciones } = await import("./notificaciones");
afterEach(() => vi.clearAllMocks());

const prefs = (cambios: Partial<Preferencias>): Preferencias => ({
  ...apiFalsa().prefs!, notificaciones: { activas: true, cantidad: 3, cadaHoras: null, desde: "08:00", hasta: "22:00" }, ...cambios,
});

test("al abrir la app no reenvía la suscripción", () => {
  const { rerender } = renderHook(({ p }) => useResincronizarNotificaciones(p), { initialProps: { p: null as Preferencias | null } });
  rerender({ p: prefs({ temas: ["gym"] }) });
  rerender({ p: prefs({ temas: ["gym"] }) });
  expect(activarNotificaciones).not.toHaveBeenCalled();
});

test("si cambian los temas con notificaciones activas, la reenvía", () => {
  const { rerender } = renderHook(({ p }) => useResincronizarNotificaciones(p), { initialProps: { p: prefs({ temas: ["gym"] }) } });
  rerender({ p: prefs({ temas: ["gym", "calma"] }) });
  expect(activarNotificaciones).toHaveBeenCalledWith(expect.objectContaining({ temas: ["gym", "calma"] }));
});

test("con notificaciones apagadas no reenvía nada", () => {
  const apagadas = { activas: false, cantidad: 3, cadaHoras: null, desde: "08:00", hasta: "22:00" };
  const { rerender } = renderHook(({ p }) => useResincronizarNotificaciones(p), { initialProps: { p: prefs({ notificaciones: apagadas }) } });
  rerender({ p: prefs({ temas: ["calma"], notificaciones: apagadas }) });
  expect(activarNotificaciones).not.toHaveBeenCalled();
});
