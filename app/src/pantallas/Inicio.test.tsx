import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { Inicio } from "./Inicio";

afterEach(() => vi.useRealTimers());

test("la primera tarjeta es la frase del día", () => {
  const api = apiFalsa();
  render(<Inicio api={api} />);
  const tarjetas = screen.getAllByTestId("tarjeta");
  expect(tarjetas[0].textContent).toContain(api.fraseDelDia!.texto);
});

test("una frase pedida por ?frase= va primero", () => {
  const api = apiFalsa();
  render(<Inicio api={api} fraseInicial="z-1" />);
  expect(screen.getAllByTestId("tarjeta")[0].textContent).toContain("Frase traducida");
});

test("doble click da like", () => {
  const api = apiFalsa();
  render(<Inicio api={api} />);
  fireEvent.doubleClick(screen.getAllByTestId("tarjeta-texto")[0]);
  expect(api.alternarLike).toHaveBeenCalledWith(api.fraseDelDia!.id);
});

test("mantener apretado abre el menú y marca como Clave", () => {
  vi.useFakeTimers();
  const api = apiFalsa();
  render(<Inicio api={api} />);
  fireEvent.pointerDown(screen.getAllByTestId("tarjeta-texto")[0]);
  act(() => { vi.advanceTimersByTime(600); });
  fireEvent.click(screen.getByText(/Marcar como Clave/));
  expect(api.marcarClave).toHaveBeenCalledWith(api.fraseDelDia!.id);
});

test("'Mala traducción' solo aparece en frases de ZenQuotes", () => {
  vi.useFakeTimers();
  const api = apiFalsa();
  render(<Inicio api={api} />);
  const textos = screen.getAllByTestId("tarjeta-texto");
  fireEvent.pointerDown(textos[0]);
  act(() => { vi.advanceTimersByTime(600); });
  expect(screen.queryByText(/Mala traducción/)).toBeNull();
  fireEvent.click(screen.getByText("Cancelar"));
  fireEvent.pointerDown(textos[1]);
  act(() => { vi.advanceTimersByTime(600); });
  fireEvent.click(screen.getByText(/Mala traducción/));
  expect(api.marcarMala).toHaveBeenCalledWith("z-1");
});
