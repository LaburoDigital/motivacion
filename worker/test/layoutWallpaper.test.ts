import { expect, test } from "vitest";
import { calcularLayout, estimarLineas } from "../render/layoutWallpaper";

const W = 1179;
const H = 2556;
const corta = "La disciplina es libertad.";
const larga = "Al hombre se le puede arrebatar todo salvo una cosa: la última de las libertades humanas, elegir su actitud ante cualquier circunstancia. ".repeat(3).trim();

test("frase corta tiene letra más grande que una larga", () => {
  expect(calcularLayout(corta, W, H).fontSize).toBeGreaterThan(calcularLayout(larga, W, H).fontSize);
});

test("la letra queda entre 4,5% y 8,5% del ancho", () => {
  for (const t of [corta, larga, "x"]) {
    const { fontSize } = calcularLayout(t, W, H);
    expect(fontSize).toBeGreaterThanOrEqual(W * 0.045);
    expect(fontSize).toBeLessThanOrEqual(W * 0.085);
  }
});

test("una frase de 300+ caracteres no invade el tercio del reloj ni se sale", () => {
  expect(larga.length).toBeGreaterThan(300);
  const { top, fontSize, maxWidth } = calcularLayout(larga, W, H);
  expect(top).toBeGreaterThanOrEqual(H / 3);
  const alto = estimarLineas(larga, fontSize, maxWidth) * fontSize * 1.3;
  expect(top + alto).toBeLessThanOrEqual(H * 0.92);
});

test("el ancho máximo deja márgenes", () => {
  const { maxWidth } = calcularLayout(corta, W, H);
  expect(maxWidth).toBeLessThan(W);
  expect(maxWidth).toBeGreaterThan(W * 0.7);
});

test("con autor, el bloque completo (frase + autor) entra antes del 92%", () => {
  const { top, fontSize, maxWidth } = calcularLayout(larga, W, H, true);
  const alto = estimarLineas(larga, fontSize, maxWidth) * fontSize * 1.3 + fontSize * (0.6 + 0.65);
  expect(top).toBeGreaterThanOrEqual(H / 3);
  expect(top + alto).toBeLessThanOrEqual(H * 0.92);
});

test("una frase enorme achica la letra por debajo del mínimo antes que salirse", () => {
  const enorme = "palabra ".repeat(400).trim();
  const { top, fontSize, maxWidth } = calcularLayout(enorme, W, H, true);
  const alto = estimarLineas(enorme, fontSize, maxWidth) * fontSize * 1.3 + fontSize * 1.25;
  expect(top + alto).toBeLessThanOrEqual(H * 0.92);
  expect(fontSize).toBeGreaterThan(10);
});
