import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useRespaldoAuto } from "./useRespaldoAuto";

vi.mock("./respaldo", () => ({ subirRespaldo: vi.fn(async () => true) }));
const { subirRespaldo } = await import("./respaldo");
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

test("no sube al abrir la app, sí un rato después de un cambio", () => {
  vi.useFakeTimers();
  const { rerender } = renderHook(({ v }) => useRespaldoAuto(true, v), { initialProps: { v: "a" } });
  act(() => { vi.advanceTimersByTime(200_000); });
  expect(subirRespaldo).not.toHaveBeenCalled();
  rerender({ v: "b" });
  act(() => { vi.advanceTimersByTime(30_000); });
  expect(subirRespaldo).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(70_000); });
  expect(subirRespaldo).toHaveBeenCalledTimes(1);
});

test("varios cambios seguidos suben una sola vez", () => {
  vi.useFakeTimers();
  const { rerender } = renderHook(({ v }) => useRespaldoAuto(true, v), { initialProps: { v: "a" } });
  rerender({ v: "b" }); rerender({ v: "c" }); rerender({ v: "d" });
  act(() => { vi.advanceTimersByTime(100_000); });
  expect(subirRespaldo).toHaveBeenCalledTimes(1);
});

test("al salir de la app sube lo pendiente enseguida", () => {
  vi.useFakeTimers();
  const { rerender } = renderHook(({ v }) => useRespaldoAuto(true, v), { initialProps: { v: "a" } });
  rerender({ v: "b" });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(subirRespaldo).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});
