import { describe, expect, test } from "vitest";
import worker from "../src/index";
import { envFalso } from "./kvFalso";

const CODIGO = "llama-norte-rio-pan-sol-mar";
const guardar = (e: ReturnType<typeof envFalso>, codigo: string, cuerpo: unknown) =>
  worker.fetch(new Request(`https://w/respaldo/${codigo}`, { method: "PUT", body: JSON.stringify(cuerpo) }), e);
const leer = (e: ReturnType<typeof envFalso>, codigo: string) => worker.fetch(new Request(`https://w/respaldo/${codigo}`), e);

describe("respaldo en la nube", () => {
  test("guarda y devuelve los datos con el código", async () => {
    const e = envFalso();
    expect((await guardar(e, CODIGO, { version: 1, likes: { "b-0001": 5 } })).status).toBe(204);
    const res = await leer(e, CODIGO);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ version: 1, likes: { "b-0001": 5 } });
  });

  test("no guarda el código en claro en el KV", async () => {
    const e = envFalso();
    await guardar(e, CODIGO, { version: 1 });
    expect([...e.KV.datos.keys()].some((k) => k.includes("llama"))).toBe(false);
  });

  test("un código que no existe da 404", async () => {
    expect((await leer(envFalso(), "otro-codigo-que-no-esta-aca-nunca")).status).toBe(404);
  });

  test("rechaza códigos mal formados y respaldos enormes", async () => {
    const e = envFalso();
    expect((await guardar(e, "corto", { version: 1 })).status).toBe(400);
    expect((await guardar(e, CODIGO, { relleno: "x".repeat(300_000) })).status).toBe(413);
    expect((await guardar(e, CODIGO, "no es un objeto")).status).toBe(400);
  });
});
