import { fireEvent, render, screen } from "@testing-library/react";
import { FOTOS } from "shared";
import { expect, test } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { Temas } from "./Temas";

const prefsCon = (c: object) => ({ ...apiFalsa().prefs!, ...c });

test("tocar Gym lo agrega a los temas", () => {
  const api = apiFalsa();
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("button", { name: "Gym" }));
  expect(api.setPrefs).toHaveBeenCalledWith({ temas: ["gym"] });
});

test("tocar un tema marcado lo saca", () => {
  const api = apiFalsa({ prefs: prefsCon({ temas: ["gym", "calma"] }) });
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("button", { name: "Gym" }));
  expect(api.setPrefs).toHaveBeenCalledWith({ temas: ["calma"] });
});

test("Mezcla general deja los temas vacíos", () => {
  const api = apiFalsa({ prefs: prefsCon({ temas: ["gym"] }) });
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("button", { name: "Mezcla general" }));
  expect(api.setPrefs).toHaveBeenCalledWith({ temas: [] });
});

test("elegir un grupo de fondos lo guarda", () => {
  const api = apiFalsa();
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("button", { name: "Fondos: Ciudad de noche" }));
  expect(api.setPrefs).toHaveBeenCalledWith({ fondo: "ciudad" });
});

test("con un grupo elegido, la estrella marca la foto como favorita", () => {
  const api = apiFalsa({ prefs: prefsCon({ fondo: "ciudad" }) });
  render(<Temas api={api} />);
  const primera = FOTOS.find((f) => f.pack === "ciudad")!;
  fireEvent.click(screen.getAllByRole("button", { name: "Marcar como favorita" })[0]);
  expect(api.setPrefs).toHaveBeenCalledWith({ fondosFavoritos: [primera.id] });
});

test("'Solo mis favoritas' cambia la preferencia", () => {
  const api = apiFalsa();
  render(<Temas api={api} />);
  fireEvent.click(screen.getByLabelText(/Solo mis favoritas/));
  expect(api.setPrefs).toHaveBeenCalledWith({ soloFondosFavoritos: true });
});

test("elegir una letra la guarda", () => {
  const api = apiFalsa();
  render(<Temas api={api} />);
  fireEvent.click(screen.getByRole("button", { name: "Letra: Impacto" }));
  expect(api.setPrefs).toHaveBeenCalledWith({ letra: "bebas" });
});
