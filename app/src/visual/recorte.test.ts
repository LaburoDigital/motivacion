import { afterEach, expect, test } from "vitest";
import { marcarRecorteIOS } from "./recorte";

const raiz = document.documentElement;
afterEach(() => raiz.classList.remove("ios-recortado"));

test("instalada y con la ventana más corta que la pantalla, marca el recorte", () => {
  marcarRecorteIOS({ instalada: true, altoPantalla: 844, anchoPantalla: 390, altoVentana: 797 });
  expect(raiz.classList.contains("ios-recortado")).toBe(true);
});

test("si la ventana ocupa toda la pantalla, no marca nada", () => {
  marcarRecorteIOS({ instalada: true, altoPantalla: 844, anchoPantalla: 390, altoVentana: 844 });
  expect(raiz.classList.contains("ios-recortado")).toBe(false);
});

test("en Safari sin instalar no marca nada", () => {
  marcarRecorteIOS({ instalada: false, altoPantalla: 844, anchoPantalla: 390, altoVentana: 700 });
  expect(raiz.classList.contains("ios-recortado")).toBe(false);
});
