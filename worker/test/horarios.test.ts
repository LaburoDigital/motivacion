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

test("cada 2 horas de 8 a 22 son 8 notificaciones", () => {
  expect(horariosDelDia(3, "08:00", "22:00", 2)).toEqual(["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]);
});

test("cada 3 horas no se pasa del horario de fin", () => {
  expect(horariosDelDia(1, "09:00", "20:00", 3)).toEqual(["09:00", "12:00", "15:00", "18:00"]);
});

test("un horario que cruza la medianoche reparte bien", () => {
  expect(horariosDelDia(3, "22:00", "02:00")).toEqual(["22:00", "00:00", "02:00"]);
});

test("tocaAhora encuentra el horario de después de medianoche", () => {
  // 03:05 UTC = 00:05 en Argentina
  expect(tocaAhora(["22:00", "00:00", "02:00"], new Date("2026-11-04T03:05:00Z"), AR)).toBe(1);
});

test("hasta 24 por día", () => {
  expect(horariosDelDia(24, "00:00", "23:00")).toHaveLength(24);
});
