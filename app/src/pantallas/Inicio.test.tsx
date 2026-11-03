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

function dobleTap(el: Element) {
  fireEvent.pointerDown(el); fireEvent.pointerUp(el);
  fireEvent.pointerDown(el); fireEvent.pointerUp(el);
}

test("doble tap en la foto da like y muestra el corazón", () => {
  const api = apiFalsa();
  render(<Inicio api={api} />);
  dobleTap(screen.getAllByTestId("tarjeta-toque")[0]);
  expect(api.alternarLike).toHaveBeenCalledWith(api.fraseDelDia!.id);
  expect(screen.getAllByTestId("corazon-animado").length).toBe(1);
});

test("doble tap en una frase que ya tiene like no se lo saca", () => {
  const api = apiFalsa();
  api.estado.likes[api.fraseDelDia!.id] = 1;
  render(<Inicio api={api} />);
  dobleTap(screen.getAllByTestId("tarjeta-toque")[0]);
  expect(api.alternarLike).not.toHaveBeenCalled();
  expect(screen.getAllByTestId("corazon-animado").length).toBe(1);
});

test("dos toques separados no dan like", () => {
  vi.useFakeTimers();
  const api = apiFalsa();
  render(<Inicio api={api} />);
  const el = screen.getAllByTestId("tarjeta-toque")[0];
  fireEvent.pointerDown(el); fireEvent.pointerUp(el);
  act(() => { vi.advanceTimersByTime(500); });
  fireEvent.pointerDown(el); fireEvent.pointerUp(el);
  expect(api.alternarLike).not.toHaveBeenCalled();
});

test("mantener apretado abre el menú y marca como Clave", () => {
  vi.useFakeTimers();
  const api = apiFalsa();
  render(<Inicio api={api} />);
  fireEvent.pointerDown(screen.getAllByTestId("tarjeta-toque")[0]);
  act(() => { vi.advanceTimersByTime(600); });
  fireEvent.click(screen.getByText(/Marcar como Clave/));
  expect(api.marcarClave).toHaveBeenCalledWith(api.fraseDelDia!.id);
});

test("'Mala traducción' solo aparece en frases de ZenQuotes", () => {
  vi.useFakeTimers();
  const api = apiFalsa();
  render(<Inicio api={api} />);
  const textos = screen.getAllByTestId("tarjeta-toque");
  fireEvent.pointerDown(textos[0]);
  act(() => { vi.advanceTimersByTime(600); });
  expect(screen.queryByText(/Mala traducción/)).toBeNull();
  fireEvent.click(screen.getByText("Cancelar"));
  fireEvent.pointerDown(textos[1]);
  act(() => { vi.advanceTimersByTime(600); });
  fireEvent.click(screen.getByText(/Mala traducción/));
  expect(api.marcarMala).toHaveBeenCalledWith("z-1");
});
