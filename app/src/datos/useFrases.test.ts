import "fake-indexeddb/auto";
import { act, renderHook, waitFor } from "@testing-library/react";
import { clear } from "idb-keyval";
import { FRASES_BASE, fechaLocal, type Frase } from "shared";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { almacen } from "./almacen";
import { useFrases } from "./useFrases";

const curada: Frase = { id: "c-0001", texto: "Una frase curada nueva", categoria: "gym", nivel: "clave", fuente: "curada" };
const duplicada: Frase = { id: "c-0002", texto: FRASES_BASE[0].texto, categoria: "gym", nivel: "buena", fuente: "curada" };

function responder(rutas: Record<string, unknown>) {
  const llamadas: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    llamadas.push(url);
    for (const [ruta, cuerpo] of Object.entries(rutas)) {
      if (url.includes(ruta)) return new Response(JSON.stringify(cuerpo), { status: 200 });
    }
    return new Response("no", { status: 404 });
  }));
  return llamadas;
}

beforeEach(() => clear());
afterEach(() => vi.unstubAllGlobals());

test("sin red usa la base y tiene frase del día", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
  const { result } = renderHook(() => useFrases());
  await waitFor(() => expect(result.current.cargado).toBe(true));
  expect(result.current.todas.length).toBe(FRASES_BASE.length);
  expect(result.current.fraseDelDia?.nivel).toBe("clave");
});

test("con red suma las remotas sin duplicados", async () => {
  responder({ "/frases": { version: "v2", frases: [curada, duplicada] }, "/frase-del-dia": FRASES_BASE[0] });
  const { result } = renderHook(() => useFrases());
  await waitFor(() => expect(result.current.todas.length).toBe(FRASES_BASE.length + 1));
  expect(result.current.todas.some((f) => f.id === "c-0001")).toBe(true);
  expect(result.current.todas.some((f) => f.id === "c-0002")).toBe(false);
  expect((await almacen.leerRemotas()).version).toBe("v2");
});

test("si el Worker responde la misma versión, no reemplaza las remotas", async () => {
  await almacen.guardarRemotas({ version: "v1", frases: [curada] });
  const llamadas = responder({ "/frases": { version: "v1", frases: [] }, "/frase-del-dia": FRASES_BASE[0] });
  const { result } = renderHook(() => useFrases());
  await waitFor(() => expect(llamadas.some((u) => u.includes("desde=v1"))).toBe(true));
  await waitFor(() => expect(result.current.todas.some((f) => f.id === "c-0001")).toBe(true));
  expect((await almacen.leerRemotas()).frases).toEqual([curada]);
});

test("reutiliza la frase del día guardada hoy sin volver a pedirla", async () => {
  const hoy = fechaLocal(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
  const clave = FRASES_BASE.find((f) => f.nivel === "clave")!;
  await almacen.guardarFraseDelDia({ fecha: hoy, id: clave.id });
  const llamadas = responder({ "/frases": { version: "v1", frases: [] } });
  const { result } = renderHook(() => useFrases());
  await waitFor(() => expect(result.current.fraseDelDia?.id).toBe(clave.id));
  expect(llamadas.some((u) => u.includes("/frase-del-dia"))).toBe(false);
});

test("alternarLike guarda y quita el like", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
  const { result } = renderHook(() => useFrases());
  await waitFor(() => expect(result.current.cargado).toBe(true));
  act(() => result.current.alternarLike("b-0001"));
  expect("b-0001" in result.current.estado.likes).toBe(true);
  await waitFor(async () => expect("b-0001" in (await almacen.leerEstado()).likes).toBe(true));
  act(() => result.current.alternarLike("b-0001"));
  expect("b-0001" in result.current.estado.likes).toBe(false);
});

test("siguientes no repite las excluidas", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
  const { result } = renderHook(() => useFrases());
  await waitFor(() => expect(result.current.cargado).toBe(true));
  const primeras = result.current.siguientes(10);
  const otras = result.current.siguientes(10, primeras.map((f) => f.id));
  expect(otras.some((f) => primeras.some((p) => p.id === f.id))).toBe(false);
});
