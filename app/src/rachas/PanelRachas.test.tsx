import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { clear } from "idb-keyval";
import { beforeEach, expect, test, vi } from "vitest";
import { almacen } from "../datos/almacen";
import { PanelRachas } from "./PanelRachas";
import { useRachas } from "./useRachas";

beforeEach(() => clear());

function Montaje({ onCerrar = vi.fn() }) {
  const rachas = useRachas("UTC");
  return <PanelRachas rachas={rachas} onCerrar={onCerrar} />;
}

test("crear una racha de hacer algo y marcar que cumplí hoy", async () => {
  render(<Montaje />);
  fireEvent.change(await screen.findByLabelText("Nombre de la racha"), { target: { value: "Gym" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear racha" }));
  await screen.findByText("Gym");
  expect(screen.getByTestId("dias-racha").textContent).toBe("0");
  fireEvent.click(screen.getByRole("button", { name: "Cumplí hoy" }));
  await waitFor(() => expect(screen.getByTestId("dias-racha").textContent).toBe("1"));
  expect(screen.getByRole("button", { name: "Hecho hoy" })).toBeTruthy();
});

test("una racha de dejar algo pide confirmar la recaída", async () => {
  render(<Montaje />);
  fireEvent.change(await screen.findByLabelText("Nombre de la racha"), { target: { value: "Sin fumar" } });
  fireEvent.click(screen.getByRole("radio", { name: /Dejar algo/ }));
  fireEvent.click(screen.getByRole("button", { name: "Crear racha" }));
  await screen.findByText("Sin fumar");
  fireEvent.click(screen.getByRole("button", { name: "Recaí" }));
  expect(screen.getByRole("button", { name: "Sí, empezar de nuevo" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Sí, empezar de nuevo" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Sí, empezar de nuevo" })).toBeNull());
});

test("no crea rachas con nombre vacío", async () => {
  render(<Montaje />);
  fireEvent.click(await screen.findByRole("button", { name: "Crear racha" }));
  expect(screen.getByText("Poné un nombre para tu racha.")).toBeTruthy();
});

test("las rachas quedan guardadas en el celular", async () => {
  const { result } = renderHook(() => useRachas("UTC"));
  await waitFor(() => expect(result.current.cargado).toBe(true));
  act(() => result.current.crear("Comer sano", "hacer"));
  await waitFor(async () => expect((await almacen.leerRachas()).lista.map((r) => r.nombre)).toEqual(["Comer sano"]));
});
