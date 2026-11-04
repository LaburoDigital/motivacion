import { describe, expect, test } from "vitest";
import { crearRacha, cumplioHoy, diasEntre, diasRacha, hitoNuevo, marcarHoy, recaer, resumenParaAviso } from "./logica";

describe("diasEntre", () => {
  test("cuenta días calendario", () => {
    expect(diasEntre("2026-11-01", "2026-11-03")).toBe(2);
    expect(diasEntre("2026-10-31", "2026-11-01")).toBe(1);
    expect(diasEntre("2026-11-03", "2026-11-03")).toBe(0);
  });
});

describe("racha de dejar algo", () => {
  const r = crearRacha("Sin fumar", "dejar", "2026-11-01", "id1");
  test("los días cuentan solos desde que empezó", () => {
    expect(diasRacha(r, "2026-11-01")).toBe(0);
    expect(diasRacha(r, "2026-11-13")).toBe(12);
  });
  test("recaer vuelve a 0 y guarda el récord", () => {
    const despues = recaer(r, "2026-11-13");
    expect(diasRacha(despues, "2026-11-13")).toBe(0);
    expect(diasRacha(despues, "2026-11-15")).toBe(2);
    expect(despues.record).toBe(12);
  });
  test("el récord no baja si la recaída es antes", () => {
    const a = recaer(r, "2026-11-13");
    const b = recaer(a, "2026-11-14");
    expect(b.record).toBe(12);
  });
});

describe("racha de hacer algo", () => {
  const r = crearRacha("Gym", "hacer", "2026-11-01", "id2");
  test("sin marcas es 0", () => {
    expect(diasRacha(r, "2026-11-03")).toBe(0);
  });
  test("cuenta días seguidos marcados hasta hoy", () => {
    const m = ["2026-11-01", "2026-11-02", "2026-11-03"].reduce((x, d) => marcarHoy(x, d), r);
    expect(diasRacha(m, "2026-11-03")).toBe(3);
    expect(cumplioHoy(m, "2026-11-03")).toBe(true);
  });
  test("si hoy todavía no marcó, cuenta la racha hasta ayer", () => {
    const m = ["2026-11-01", "2026-11-02"].reduce((x, d) => marcarHoy(x, d), r);
    expect(diasRacha(m, "2026-11-03")).toBe(2);
    expect(cumplioHoy(m, "2026-11-03")).toBe(false);
  });
  test("si se saltea un día, vuelve a 0", () => {
    const m = ["2026-11-01", "2026-11-02"].reduce((x, d) => marcarHoy(x, d), r);
    expect(diasRacha(m, "2026-11-04")).toBe(0);
  });
  test("marcar dos veces el mismo día no suma", () => {
    const m = marcarHoy(marcarHoy(r, "2026-11-03"), "2026-11-03");
    expect(diasRacha(m, "2026-11-03")).toBe(1);
  });
  test("el récord se actualiza al marcar", () => {
    const m = ["2026-11-01", "2026-11-02", "2026-11-03"].reduce((x, d) => marcarHoy(x, d), r);
    expect(m.record).toBe(3);
  });
});

describe("hitos", () => {
  test("avisa el hito justo al llegar y no lo repite", () => {
    const r = crearRacha("Sin pajas", "dejar", "2026-11-01", "id3");
    expect(hitoNuevo(r, "2026-11-08")).toBe(7);
    expect(hitoNuevo({ ...r, hitosVistos: [7] }, "2026-11-08")).toBeNull();
    expect(hitoNuevo(r, "2026-11-05")).toBeNull();
  });
  test("si pasó de largo un hito sin abrir la app, igual lo muestra", () => {
    const r = crearRacha("Sin pajas", "dejar", "2026-11-01", "id3");
    expect(hitoNuevo({ ...r, hitosVistos: [7] }, "2026-12-05")).toBe(30);
  });
});

describe("resumenParaAviso", () => {
  test("toma la racha más larga, sin el nombre", () => {
    const a = crearRacha("Gym", "hacer", "2026-11-01", "a");
    const b = crearRacha("Sin pajas", "dejar", "2026-10-20", "b");
    const r = resumenParaAviso([a, b], "2026-11-03");
    expect(r).toEqual({ dias: 14, fecha: "2026-11-03", crece: true });
    expect(JSON.stringify(r)).not.toContain("pajas");
  });
  test("sin rachas devuelve null", () => {
    expect(resumenParaAviso([], "2026-11-03")).toBeNull();
  });
});
