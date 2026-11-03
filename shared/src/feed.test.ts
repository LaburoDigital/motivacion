import { describe, expect, test } from "vitest";
import { armarFeed, nivelEfectivo, type CategoriaId, type EstadoFeed, type Frase, type Nivel } from "./index";

const DIA = 24 * 60 * 60 * 1000;
const AHORA = Date.UTC(2026, 10, 3, 12);

function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function f(id: string, nivel: Nivel = "normal", categoria: CategoriaId = "gym"): Frase {
  return { id, texto: id, categoria, nivel, fuente: "base" };
}
const vacio = (): EstadoFeed => ({ vistas: {}, likes: {}, malas: [], clavesPropias: [] });

describe("armarFeed", () => {
  test("de 10, 2 son likes y 8 nuevas", () => {
    const frases = Array.from({ length: 100 }, (_, i) => f(`n${i}`));
    const likes = Array.from({ length: 5 }, (_, i) => f(`l${i}`));
    const estado = vacio();
    for (const l of likes) { estado.likes[l.id] = AHORA - 30 * DIA; estado.vistas[l.id] = AHORA - 30 * DIA; }
    const r = armarFeed([...frases, ...likes], estado, ["gym"], 10, AHORA, seeded());
    expect(r).toHaveLength(10);
    expect(r.filter((x) => x.id.startsWith("l"))).toHaveLength(2);
    expect(r.filter((x) => x.id.startsWith("n"))).toHaveLength(8);
  });

  test("un like visto hace 3 días no vuelve; uno visto hace 8 días sí", () => {
    const frases = Array.from({ length: 30 }, (_, i) => f(`n${i}`));
    const estado = vacio();
    estado.likes = { reciente: AHORA - 20 * DIA, viejo: AHORA - 20 * DIA };
    estado.vistas = { reciente: AHORA - 3 * DIA, viejo: AHORA - 8 * DIA };
    const r = armarFeed([...frases, f("reciente"), f("viejo")], estado, ["gym"], 10, AHORA, seeded());
    const ids = r.map((x) => x.id);
    expect(ids).toContain("viejo");
    expect(ids).not.toContain("reciente");
  });

  test("las malas traducciones nunca aparecen", () => {
    const frases = Array.from({ length: 20 }, (_, i) => f(`n${i}`));
    const estado = vacio();
    estado.malas = ["n0", "n1", "n2"];
    const r = armarFeed(frases, estado, ["gym"], 17, AHORA, seeded());
    expect(r.map((x) => x.id)).not.toEqual(expect.arrayContaining(["n0"]));
    expect(r.some((x) => estado.malas.includes(x.id))).toBe(false);
  });

  test("sin frases nuevas, vuelven primero las vistas hace más tiempo", () => {
    const frases = [f("a"), f("b"), f("c")];
    const estado = vacio();
    estado.vistas = { a: AHORA - 1 * DIA, b: AHORA - 9 * DIA, c: AHORA - 5 * DIA };
    const r = armarFeed(frases, estado, ["gym"], 3, AHORA, seeded());
    expect(r.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  test("las clave salen ~3 de cada 4 frente a una normal", () => {
    let claves = 0;
    const rng = seeded(7);
    for (let i = 0; i < 10000; i++) {
      const [x] = armarFeed([f("k", "clave"), f("n", "normal")], vacio(), ["gym"], 1, AHORA, rng);
      if (x.id === "k") claves++;
    }
    expect(claves / 10000).toBeGreaterThan(0.7);
    expect(claves / 10000).toBeLessThan(0.8);
  });

  test("temas vacíos usa todas las categorías", () => {
    const frases = [f("g", "normal", "gym"), f("c", "normal", "calma"), f("e", "normal", "estudio")];
    const r = armarFeed(frases, vacio(), [], 3, AHORA, seeded());
    expect(r.map((x) => x.id).sort()).toEqual(["c", "e", "g"]);
  });

  test("respeta los temas elegidos", () => {
    const frases = [f("g", "normal", "gym"), f("c", "normal", "calma")];
    const r = armarFeed(frases, vacio(), ["calma"], 5, AHORA, seeded());
    expect(r.map((x) => x.id)).toEqual(["c"]);
  });

  test("ningún id repetido en 50", () => {
    const frases = Array.from({ length: 60 }, (_, i) => f(`n${i}`, i % 3 === 0 ? "clave" : "normal"));
    const estado = vacio();
    estado.likes = { n1: AHORA - 30 * DIA, n2: AHORA - 30 * DIA };
    const r = armarFeed(frases, estado, ["gym"], 50, AHORA, seeded());
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length);
    expect(r).toHaveLength(50);
  });

  test("con pocas frases devuelve las que hay sin repetir", () => {
    const r = armarFeed([f("a"), f("b")], vacio(), ["gym"], 10, AHORA, seeded());
    expect(r.map((x) => x.id).sort()).toEqual(["a", "b"]);
  });
});

test("una frase en clavesPropias tiene nivel efectivo clave", () => {
  const estado = vacio();
  estado.clavesPropias = ["x"];
  expect(nivelEfectivo(f("x", "normal"), estado)).toBe("clave");
  expect(nivelEfectivo(f("y", "buena"), estado)).toBe("buena");
});
