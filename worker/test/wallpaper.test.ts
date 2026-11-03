import { FRASES_BASE, fechaLocal, fraseDelDia, type Frase } from "shared";
import { afterEach, expect, test, vi } from "vitest";
import worker from "../src/index";
import { envFalso } from "./kvFalso";

afterEach(() => vi.unstubAllGlobals());

const ZONA = "America/Argentina/Buenos_Aires";
const hoy = () => fechaLocal(new Date(), ZONA);

async function pedir(query: string, inicial: Record<string, unknown> = {}) {
  return worker.fetch(new Request(`https://w/wallpaper?${query}`), envFalso(inicial));
}

test("redirige a la imagen pre-generada de la Clave del día", async () => {
  const res = await pedir(`temas=gym&zona=${ZONA}&estilo=degradado`);
  const esperada = fraseDelDia(FRASES_BASE, hoy(), ["gym"])!;
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toBe(`https://app.test/wallpapers/degradado/${esperada.id}.jpg`);
  expect(res.headers.get("cache-control")).toContain("max-age");
});

test("estilo inválido usa negro", async () => {
  const res = await pedir(`zona=${ZONA}&estilo=cualquiera`);
  expect(res.headers.get("location")).toMatch(/\/wallpapers\/negro\/b-\d{4}\.jpg$/);
});

test("una curada sin imagen generada cae a la Clave de la base", async () => {
  // Muchas curadas clave de gym: la del día seguro es una curada.
  const curadas: Frase[] = Array.from({ length: 300 }, (_, i) => ({
    id: `c-${String(i).padStart(4, "0")}`, texto: `Curada clave ${i}`, categoria: "gym", nivel: "clave", fuente: "curada",
  }));
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
  const res = await pedir(`temas=gym&zona=${ZONA}&estilo=negro`, { curadas });
  const location = res.headers.get("location")!;
  expect(location).toMatch(/\/wallpapers\/negro\/b-\d{4}\.jpg$/);
  expect(location).toContain(fraseDelDia(FRASES_BASE, hoy(), ["gym"])!.id);
});

test("una curada con imagen generada se usa", async () => {
  const curadas: Frase[] = Array.from({ length: 300 }, (_, i) => ({
    id: `c-${String(i).padStart(4, "0")}`, texto: `Curada clave ${i}`, categoria: "gym", nivel: "clave", fuente: "curada",
  }));
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  const res = await pedir(`temas=gym&zona=${ZONA}&estilo=negro`, { curadas });
  expect(res.headers.get("location")).toMatch(/\/wallpapers\/negro\/c-\d{4}\.jpg$/);
});
