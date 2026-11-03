import { FRASES_BASE } from "shared";
import { expect, test } from "vitest";
import { clavesParaRenderizar, generarWallpaper } from "../render/wallpaper";

test("genera un JPG del tamaño pedido", async () => {
  const jpg = await generarWallpaper(FRASES_BASE[0], "negro", 590, 1278);
  expect([...jpg.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  expect(jpg.length).toBeLessThan(400_000);
}, 30000);

test("estilo foto sin red igual genera la imagen", async () => {
  const jpg = await generarWallpaper(FRASES_BASE[0], "foto", 590, 1278, async () => null);
  expect([...jpg.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
}, 30000);

test("renderiza solo las Clave de la base y las curadas", () => {
  const curadas = [
    { id: "c-0001", texto: "a", categoria: "gym" as const, nivel: "clave" as const, fuente: "curada" as const },
    { id: "c-0002", texto: "b", categoria: "gym" as const, nivel: "buena" as const, fuente: "curada" as const },
  ];
  const ids = clavesParaRenderizar(curadas).map((f) => f.id);
  expect(ids).toContain("c-0001");
  expect(ids).not.toContain("c-0002");
  expect(ids.length).toBe(FRASES_BASE.filter((f) => f.nivel === "clave").length + 1);
});

test("la foto del wallpaper es la misma que la app elige en Automático", async () => {
  const { fotoParaWallpaper } = await import("../render/wallpaper");
  const { FOTOS, PACKS_POR_CATEGORIA } = await import("shared");
  const gym = FRASES_BASE.find((f) => f.categoria === "gym")!;
  const foto = fotoParaWallpaper(gym);
  expect(PACKS_POR_CATEGORIA.gym).toContain(foto.pack);
  expect(FOTOS).toContainEqual(foto);
});
