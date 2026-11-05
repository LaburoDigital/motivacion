import { fireEvent, render, screen } from "@testing-library/react";
import { FRASES_BASE } from "shared";
import { expect, test, vi } from "vitest";
import { Celebracion } from "./Celebracion";

test("festeja el hito con el nombre de la racha y una frase Clave", () => {
  const onSeguir = vi.fn();
  const frase = FRASES_BASE.find((f) => f.nivel === "clave")!;
  render(<Celebracion nombre="Gym" hito={30} frase={frase} onSeguir={onSeguir} />);
  expect(screen.getByText("30 días")).toBeTruthy();
  expect(screen.getByText(/Gym/)).toBeTruthy();
  expect(screen.getByText(frase.texto)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Seguir así" }));
  expect(onSeguir).toHaveBeenCalled();
});

test("muestra el festejo propio de la racha", () => {
  render(<Celebracion nombre="Sin fumar" hito={7} frase={null} festejo="Tu cuerpo ya lo nota." onSeguir={vi.fn()} />);
  expect(screen.getByText("Tu cuerpo ya lo nota.")).toBeTruthy();
});
