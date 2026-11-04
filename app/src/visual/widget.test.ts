import { expect, test } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { scriptWidget } from "./widget";

test("el script del widget pide la frase del día con los temas y la zona del usuario", () => {
  const prefs = { ...apiFalsa().prefs!, temas: ["gym" as const, "calma" as const], zonaHoraria: "America/Argentina/Buenos_Aires" };
  const s = scriptWidget(prefs, "https://w.test");
  expect(s).toContain("https://w.test/frase-del-dia?temas=gym%2Ccalma&zona=America%2FArgentina%2FBuenos_Aires");
  expect(s).toContain("Script.setWidget");
  expect(s).toContain("accessoryRectangular");
});
