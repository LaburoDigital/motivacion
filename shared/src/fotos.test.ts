import { expect, test } from "vitest";
import { FOTOS, PACKS_POR_CATEGORIA, fotoDeFrase, type Frase } from "./index";

const f = (id: string, categoria: Frase["categoria"]) => ({ id, categoria });

test("en Automático la foto es de un grupo que va con el tema", () => {
  for (let i = 0; i < 40; i++) expect(PACKS_POR_CATEGORIA.gym).toContain(fotoDeFrase(f(`b-${i}`, "gym"), "auto").pack);
});

test("con un grupo elegido la foto es de ese grupo", () => {
  for (let i = 0; i < 40; i++) expect(fotoDeFrase(f(`b-${i}`, "calma"), "ciudad").pack).toBe("ciudad");
});

test("la misma frase siempre tiene la misma foto", () => {
  expect(fotoDeFrase(f("b-0130", "gym"), "neon")).toEqual(fotoDeFrase(f("b-0130", "gym"), "neon"));
  expect(FOTOS).toContainEqual(fotoDeFrase(f("b-0130", "gym"), "auto"));
});
