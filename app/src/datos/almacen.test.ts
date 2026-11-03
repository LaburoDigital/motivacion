import "fake-indexeddb/auto";
import { clear } from "idb-keyval";
import { beforeEach, expect, test } from "vitest";
import { almacen } from "./almacen";

beforeEach(() => clear());

test("sin datos devuelve los defaults", async () => {
  expect(await almacen.leerEstado()).toEqual({ vistas: {}, likes: {}, malas: [], clavesPropias: [] });
  const prefs = await almacen.leerPrefs();
  expect(prefs).toMatchObject({ temas: [], estiloVisual: "min-noche", soloFondosFavoritos: false, fondosFavoritos: [] });
  expect(typeof prefs.zonaHoraria).toBe("string");
  expect(await almacen.leerRemotas()).toEqual({ version: "", frases: [] });
  expect(await almacen.leerFraseDelDia()).toBeNull();
});

test("guarda y vuelve a leer los 4 grupos", async () => {
  const estado = { vistas: { a: 1 }, likes: { b: 2 }, malas: ["c"], clavesPropias: ["d"] };
  const prefs = { temas: ["gym" as const], estiloVisual: "foto-3", soloFondosFavoritos: true, fondosFavoritos: ["foto-3"], zonaHoraria: "UTC",
    notificaciones: { activas: true, cantidad: 2, desde: "09:00", hasta: "21:00" }, estiloWallpaper: "foto" as const };
  const remotas = { version: "v1", frases: [{ id: "c-0001", texto: "x", categoria: "gym" as const, nivel: "buena" as const, fuente: "curada" as const }] };
  await almacen.guardarEstado(estado);
  await almacen.guardarPrefs(prefs);
  await almacen.guardarRemotas(remotas);
  await almacen.guardarFraseDelDia({ fecha: "2026-11-03", id: "b-0001" });
  expect(await almacen.leerEstado()).toEqual(estado);
  expect(await almacen.leerPrefs()).toEqual(prefs);
  expect(await almacen.leerRemotas()).toEqual(remotas);
  expect(await almacen.leerFraseDelDia()).toEqual({ fecha: "2026-11-03", id: "b-0001" });
});
