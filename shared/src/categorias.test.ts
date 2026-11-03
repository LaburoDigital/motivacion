import { expect, test } from "vitest";
import { CATEGORIAS, PESOS, normalizarTexto } from "./index";

test("las 8 categorías exactas", () => {
  expect(CATEGORIAS.map((c) => c.id)).toEqual([
    "disciplina", "estudio", "gym", "estoicismo", "amor-propio", "exito", "calma", "superacion",
  ]);
  expect(CATEGORIAS.find((c) => c.id === "exito")?.etiqueta).toBe("Éxito");
});

test("pesos por nivel", () => {
  expect(PESOS).toEqual({ clave: 3, buena: 2, normal: 1 });
});

test("normalizarTexto saca tildes, puntuación y espacios de más", () => {
  expect(normalizarTexto("¡No es  que tengamos POCO tiempo!")).toBe("no es que tengamos poco tiempo");
  expect(normalizarTexto("  Éxito, ¿sí?  ")).toBe("exito si");
});
