import { expect, test } from "vitest";
import { horariosDelDia, tocaAhora } from "../src/horarios";

const AR = "America/Argentina/Buenos_Aires";

test("3 notificaciones de 8 a 22", () => {
  expect(horariosDelDia(3, "08:00", "22:00")).toEqual(["08:00", "15:00", "22:00"]);
});

test("1 notificación va a la hora de inicio", () => {
  expect(horariosDelDia(1, "09:00", "21:00")).toEqual(["09:00"]);
});

test("los horarios se redondean a múltiplos de 15 minutos", () => {
  for (const h of horariosDelDia(4, "08:10", "21:50")) expect(Number(h.slice(3)) % 15).toBe(0);
  expect(horariosDelDia(5, "08:00", "22:00")).toEqual(["08:00", "11:30", "15:00", "18:30", "22:00"]);
});

test("tocaAhora usa la zona del usuario", () => {
  // 11:05 UTC = 08:05 en Argentina
  expect(tocaAhora(["08:00"], new Date("2026-11-03T11:05:00Z"), AR)).toBe(0);
  expect(tocaAhora(["08:00"], new Date("2026-11-03T11:20:00Z"), AR)).toBeNull();
  expect(tocaAhora(["08:00", "15:00"], new Date("2026-11-03T18:00:00Z"), AR)).toBe(1);
});

test("el borde de la ventana: justo a la hora sí, 15 minutos después no", () => {
  expect(tocaAhora(["08:00"], new Date("2026-11-03T11:00:00Z"), AR)).toBe(0);
  expect(tocaAhora(["08:00"], new Date("2026-11-03T11:15:00Z"), AR)).toBeNull();
});
