import { FOTOS, PACKS, PACKS_POR_CATEGORIA, type Frase } from "shared";
import { describe, expect, test } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { fondoPara, poolDe, urlFoto } from "./fondos";
import { LETRAS, letraPorId } from "./letras";

const prefs = (c = {}) => ({ ...apiFalsa().prefs!, ...c });
const frase = (id: string, categoria: Frase["categoria"]): Frase => ({ id, texto: id, categoria, nivel: "buena", fuente: "base" });

describe("catálogo de fotos", () => {
  test("ids únicos y cada pack con al menos 4 fotos", () => {
    expect(new Set(FOTOS.map((f) => f.id)).size).toBe(FOTOS.length);
    for (const p of PACKS) expect(FOTOS.filter((f) => f.pack === p.id).length, p.id).toBeGreaterThanOrEqual(4);
  });
  test("cada tema de frases tiene packs que existen", () => {
    for (const packs of Object.values(PACKS_POR_CATEGORIA)) {
      expect(packs.length).toBeGreaterThan(0);
      for (const p of packs) expect(PACKS.some((x) => x.id === p)).toBe(true);
    }
  });
});

describe("fondoPara", () => {
  test("en Automático, una frase de gym lleva foto de gym, boxeo o correr", () => {
    for (let i = 0; i < 30; i++) {
      expect(["gym", "boxeo", "correr"]).toContain(fondoPara(frase(`g${i}`, "gym"), prefs()).pack);
    }
  });
  test("con un pack elegido, todas las fotos son de ese pack", () => {
    for (let i = 0; i < 30; i++) expect(fondoPara(frase(`f${i}`, "calma"), prefs({ fondo: "ciudad" })).pack).toBe("ciudad");
  });
  test("solo favoritos usa solo los favoritos", () => {
    const favs = [FOTOS[0].id, FOTOS[10].id];
    for (let i = 0; i < 30; i++) {
      expect(favs).toContain(fondoPara(frase(`f${i}`, "gym"), prefs({ soloFondosFavoritos: true, fondosFavoritos: favs })).id);
    }
  });
  test("solo favoritos sin favoritos ignora el filtro", () => {
    expect(fondoPara(frase("a", "gym"), prefs({ soloFondosFavoritos: true, fondosFavoritos: [] }))).toBeTruthy();
  });
  test("la misma frase siempre tiene la misma foto, y cambiar avanza a otra del mismo grupo", () => {
    const f = frase("b-0042", "superacion");
    const a = fondoPara(f, prefs());
    expect(fondoPara(f, prefs())).toEqual(a);
    const b = fondoPara(f, prefs(), 1);
    expect(b.id).not.toBe(a.id);
    expect(poolDe(f, prefs()).some((x) => x.id === b.id)).toBe(true);
  });
  test("urlFoto pide la foto recortada al tamaño", () => {
    expect(urlFoto(FOTOS[0], 1080, 1920)).toBe(`https://images.unsplash.com/photo-${FOTOS[0].id}?w=1080&h=1920&fit=crop&crop=entropy&fm=jpg&q=75`);
  });
});

describe("letras", () => {
  test("al menos 8 letras con ids únicos", () => {
    expect(LETRAS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(LETRAS.map((l) => l.id)).size).toBe(LETRAS.length);
  });
  test("una letra desconocida cae a la primera", () => {
    expect(letraPorId("no-existe")).toBe(LETRAS[0]);
  });
});
