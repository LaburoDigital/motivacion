import { describe, expect, test } from "vitest";
import { fechaLocal, fnv1a, fraseDelDia, type CategoriaId, type Frase, type Nivel } from "./index";

const cats: CategoriaId[] = ["disciplina", "estudio", "gym", "calma"];
function f(i: number, nivel: Nivel, categoria: CategoriaId): Frase {
  return { id: `b-${String(i).padStart(4, "0")}`, texto: `frase ${i}`, categoria, nivel, fuente: "base" };
}
const frases: Frase[] = [];
for (let i = 0; i < 40; i++) frases.push(f(i, i % 4 === 0 ? "buena" : "clave", cats[i % 4]));
for (let i = 40; i < 60; i++) frases.push(f(i, "normal", "gym"));

describe("fraseDelDia", () => {
  test("mismos argumentos, misma frase", () => {
    expect(fraseDelDia(frases, "2026-11-03", ["calma"])).toEqual(fraseDelDia(frases, "2026-11-03", ["calma"]));
  });
  test("cambia con los días", () => {
    const ids = new Set<string>();
    for (let d = 1; d <= 7; d++) ids.add(fraseDelDia(frases, `2026-11-0${d}`, [])!.id);
    expect(ids.size).toBeGreaterThanOrEqual(2);
  });
  test("nunca devuelve una buena o normal", () => {
    for (let d = 1; d <= 28; d++) {
      const fecha = `2026-11-${String(d).padStart(2, "0")}`;
      for (const t of [[], ["gym"], ["disciplina", "estudio"]] as CategoriaId[][]) {
        expect(fraseDelDia(frases, fecha, t)!.nivel).toBe("clave");
      }
    }
  });
  test("temas vacíos devuelve una clave de cualquier categoría", () => {
    expect(fraseDelDia(frases, "2026-11-03", [])!.nivel).toBe("clave");
  });
  test("sin claves en los temas elegidos cae a claves de otras categorías", () => {
    const sinGymClave = frases.filter((x) => !(x.categoria === "gym" && x.nivel === "clave"));
    const r = fraseDelDia(sinGymClave, "2026-11-03", ["gym"]);
    expect(r).not.toBeNull();
    expect(r!.nivel).toBe("clave");
    expect(r!.categoria).not.toBe("gym");
  });
  test("respeta los temas cuando hay claves", () => {
    expect(fraseDelDia(frases, "2026-11-03", ["calma"])!.categoria).toBe("calma");
  });
  test("el orden de los temas no cambia el resultado", () => {
    expect(fraseDelDia(frases, "2026-11-03", ["gym", "calma"])).toEqual(fraseDelDia(frases, "2026-11-03", ["calma", "gym"]));
  });
  test("sin claves devuelve null", () => {
    expect(fraseDelDia(frases.filter((x) => x.nivel !== "clave"), "2026-11-03", [])).toBeNull();
  });
});

test("fnv1a es estable y sin signo", () => {
  expect(fnv1a("")).toBe(2166136261);
  expect(fnv1a("a")).toBe(0xe40c292c);
});

test("fechaLocal usa la zona del usuario", () => {
  expect(fechaLocal(new Date("2026-11-04T01:30:00Z"), "America/Argentina/Buenos_Aires")).toBe("2026-11-03");
  expect(fechaLocal(new Date("2026-11-04T01:30:00Z"), "UTC")).toBe("2026-11-04");
});
