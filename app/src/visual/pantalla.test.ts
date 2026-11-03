import { afterEach, expect, test } from "vitest";
import { ajustarAlto } from "./pantalla";

const raiz = document.documentElement;
afterEach(() => raiz.style.removeProperty("--alto-app"));

test("instalada en el iPhone, usa el alto completo de la pantalla", () => {
  ajustarAlto({ instalada: true, altoPantalla: 932, anchoPantalla: 430, altoVentana: 898 });
  expect(raiz.style.getPropertyValue("--alto-app")).toBe("932px");
});

test("en Safari (sin instalar) no toca nada", () => {
  ajustarAlto({ instalada: false, altoPantalla: 932, anchoPantalla: 430, altoVentana: 700 });
  expect(raiz.style.getPropertyValue("--alto-app")).toBe("");
});

test("si la ventana ya es más alta que la pantalla informada, usa la ventana", () => {
  ajustarAlto({ instalada: true, altoPantalla: 800, anchoPantalla: 430, altoVentana: 932 });
  expect(raiz.style.getPropertyValue("--alto-app")).toBe("932px");
});

test("acostado usa el lado corto como alto", () => {
  ajustarAlto({ instalada: true, altoPantalla: 430, anchoPantalla: 932, altoVentana: 400 });
  expect(raiz.style.getPropertyValue("--alto-app")).toBe("430px");
});
