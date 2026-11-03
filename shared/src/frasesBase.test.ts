import { describe, expect, test } from "vitest";
import { CATEGORIAS, FRASES_BASE, deduplicar, normalizarTexto, validarColeccion, type Frase } from "./index";

describe("colección base", () => {
  test("al menos 500 frases", () => expect(FRASES_BASE.length).toBeGreaterThanOrEqual(500));
  test("entre 100 y 150 clave", () => {
    const n = FRASES_BASE.filter((f) => f.nivel === "clave").length;
    expect(n).toBeGreaterThanOrEqual(100);
    expect(n).toBeLessThanOrEqual(150);
  });
  test("las 8 categorías con al menos 40 frases", () => {
    for (const c of CATEGORIAS) expect(FRASES_BASE.filter((f) => f.categoria === c.id).length, c.id).toBeGreaterThanOrEqual(40);
  });
  test("ids únicos b-NNNN y fuente base", () => {
    expect(new Set(FRASES_BASE.map((f) => f.id)).size).toBe(FRASES_BASE.length);
    for (const f of FRASES_BASE) {
      expect(f.id).toMatch(/^b-\d{4}$/);
      expect(f.fuente).toBe("base");
    }
  });
  test("sin duplicados por texto normalizado", () => {
    const vistos = new Map<string, string>();
    for (const f of FRASES_BASE) {
      const k = normalizarTexto(f.texto);
      expect(vistos.get(k), `${f.id} repite ${vistos.get(k)}`).toBeUndefined();
      vistos.set(k, f.id);
    }
  });
  test("validarColeccion no encuentra errores", () => expect(validarColeccion(FRASES_BASE)).toEqual([]));
});

describe("validarColeccion", () => {
  test("detecta categoría o nivel inválidos y texto vacío", () => {
    const malas = [
      { id: "b-0001", texto: "", categoria: "gym", nivel: "clave", fuente: "base" },
      { id: "b-0002", texto: "x", categoria: "futbol", nivel: "clave", fuente: "base" },
      { id: "b-0003", texto: "y", categoria: "gym", nivel: "top", fuente: "base" },
    ] as unknown as Frase[];
    expect(validarColeccion(malas)).toHaveLength(3);
  });
});

describe("deduplicar", () => {
  const base: Frase = { id: "b-0001", texto: "Lo que no me mata me hace más fuerte.", categoria: "superacion", nivel: "clave", fuente: "base" };
  const curada: Frase = { ...base, id: "c-0001", texto: "lo que no me mata, me hace MAS fuerte", fuente: "curada", nivel: "buena" };
  const zen: Frase = { ...base, id: "z-abc", texto: "Lo que no me mata me hace mas fuerte", fuente: "zenquotes", nivel: "normal" };
  test("gana la base sobre curada y zenquotes, sin importar el orden", () => {
    expect(deduplicar([zen, curada, base]).map((f) => f.id)).toEqual(["b-0001"]);
  });
  test("gana la curada sobre zenquotes", () => {
    expect(deduplicar([zen, curada]).map((f) => f.id)).toEqual(["c-0001"]);
  });
  test("mismo id no se repite", () => {
    expect(deduplicar([zen, { ...zen }])).toHaveLength(1);
  });
});
