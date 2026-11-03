import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FOTOS, FRASES_BASE } from "shared";
import { expect, test, vi } from "vitest";
import { LETRAS } from "../visual/letras";

const ESTILO = { foto: FOTOS[0], letra: LETRAS[0] };
import { VistaPrevia } from "./VistaPrevia";

const frase = FRASES_BASE[0];

function montar() {
  const generar = vi.fn(async () => new Blob(["png"], { type: "image/png" }));
  const compartir = vi.fn(async () => undefined);
  const onCerrar = vi.fn();
  URL.createObjectURL = vi.fn(() => "blob:imagen");
  URL.revokeObjectURL = vi.fn();
  render(<VistaPrevia frase={frase} estilo={ESTILO} onCerrar={onCerrar} generar={generar} compartir={compartir} />);
  return { generar, compartir, onCerrar };
}

test("muestra la frase como imagen", async () => {
  const { generar } = montar();
  await waitFor(() => expect(screen.getByRole("img", { name: frase.texto }).getAttribute("src")).toBe("blob:imagen"));
  expect(generar).toHaveBeenCalledWith(frase, ESTILO);
});

test("'Guardar o compartir' abre el menú de iOS con la imagen", async () => {
  const { compartir } = montar();
  fireEvent.click(screen.getByRole("button", { name: /Guardar o compartir/ }));
  expect(compartir).toHaveBeenCalledWith(frase, ESTILO);
});

test("'Ver más frases' cierra la vista previa", () => {
  const { onCerrar } = montar();
  fireEvent.click(screen.getByRole("button", { name: /Ver más frases/ }));
  expect(onCerrar).toHaveBeenCalled();
});
