import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { Temas } from "./Temas";

test("tocar Gym lo agrega a los temas", () => {
  const api = apiFalsa();
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("button", { name: /Gym/ }));
  expect(api.setPrefs).toHaveBeenCalledWith({ temas: ["gym"] });
});

test("tocar un tema marcado lo saca", () => {
  const api = apiFalsa({ prefs: { ...apiFalsa().prefs!, temas: ["gym", "calma"] } });
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("button", { name: /Gym/ }));
  expect(api.setPrefs).toHaveBeenCalledWith({ temas: ["calma"] });
});

test("Mezcla general deja los temas vacíos", () => {
  const api = apiFalsa({ prefs: { ...apiFalsa().prefs!, temas: ["gym"] } });
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("button", { name: /Mezcla general/ }));
  expect(api.setPrefs).toHaveBeenCalledWith({ temas: [] });
});

test("la estrella de un fondo lo agrega a favoritos", () => {
  const api = apiFalsa();
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("tab", { name: "Visual" }));
  fireEvent.click(screen.getByRole("tab", { name: "Minimalista" }));
  fireEvent.click(screen.getByRole("button", { name: "Favorito Océano" }));
  expect(api.setPrefs).toHaveBeenCalledWith({ fondosFavoritos: ["min-oceano"] });
});

test("elegir un fondo lo pone como estilo", () => {
  const api = apiFalsa();
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("tab", { name: "Visual" }));
  fireEvent.click(screen.getByRole("tab", { name: "Minimalista" }));
  fireEvent.click(screen.getByRole("button", { name: "Usar Océano" }));
  expect(api.setPrefs).toHaveBeenCalledWith({ estiloVisual: "min-oceano" });
});

test("el toggle 'Solo mis favoritos' cambia la preferencia", () => {
  const api = apiFalsa();
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("tab", { name: "Visual" }));
  fireEvent.click(screen.getByLabelText(/Solo mis favoritos/));
  expect(api.setPrefs).toHaveBeenCalledWith({ soloFondosFavoritos: true });
});
