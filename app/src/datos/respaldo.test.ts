import "fake-indexeddb/auto";
import { clear } from "idb-keyval";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { almacen } from "./almacen";
import { generarCodigo, obtenerCodigo, recuperarRespaldo, subirRespaldo } from "./respaldo";

beforeEach(() => clear());
afterEach(() => vi.unstubAllGlobals());

const nube = new Map<string, string>();
function simularNube() {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const codigo = decodeURIComponent(url.split("/respaldo/")[1]);
    if (init?.method === "PUT") {
      nube.set(codigo, init.body as string);
      return new Response(null, { status: 204 });
    }
    const d = nube.get(codigo);
    return d ? new Response(d, { status: 200 }) : new Response("{}", { status: 404 });
  }));
}

test("el código son 6 palabras separadas por guiones", () => {
  for (let i = 0; i < 20; i++) expect(generarCodigo()).toMatch(/^[a-z]{2,12}(-[a-z]{2,12}){5}$/);
  expect(generarCodigo()).not.toBe(generarCodigo());
});

test("cada celular tiene su código y no cambia", async () => {
  const a = await obtenerCodigo();
  expect(await obtenerCodigo()).toBe(a);
});

test("lo que se sube con un código se recupera en otro celular", async () => {
  simularNube();
  await almacen.guardarEstado({ vistas: {}, likes: { "b-0001": 9 }, malas: [], clavesPropias: [] });
  await almacen.guardarRachas({ activas: true, hora: "21:00", lista: [{ id: "r", nombre: "Gym", tipo: "hacer", inicio: "2026-11-01", marcas: [], record: 4, hitosVistos: [] }] });
  const codigo = await obtenerCodigo();
  expect(await subirRespaldo()).toBe(true);

  await clear(); // "otro celular"
  expect(await recuperarRespaldo(`  ${codigo.toUpperCase()} `)).toBe("ok");
  expect((await almacen.leerEstado()).likes).toEqual({ "b-0001": 9 });
  expect((await almacen.leerRachas()).lista[0].nombre).toBe("Gym");
  expect((await almacen.leerPrefs()).bienvenida).toBe(true);
  expect(await obtenerCodigo()).toBe(codigo);
});

test("un código que no existe avisa y no toca nada", async () => {
  simularNube();
  await almacen.guardarEstado({ vistas: {}, likes: { x: 1 }, malas: [], clavesPropias: [] });
  expect(await recuperarRespaldo("aaa-bbb-ccc-ddd-eee-fff")).toBe("no-existe");
  expect(await recuperarRespaldo("cualquier cosa")).toBe("invalido");
  expect((await almacen.leerEstado()).likes).toEqual({ x: 1 });
});

test("sin internet, subir no rompe", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
  expect(await subirRespaldo()).toBe(false);
});
