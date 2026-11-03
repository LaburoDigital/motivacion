import { fireEvent, render, screen } from "@testing-library/react";
import { FRASES_BASE } from "shared";
import { expect, test } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { Favoritos } from "./Favoritos";

test("lista los likes del más reciente al más viejo", () => {
  const [a, b, c] = FRASES_BASE;
  const api = apiFalsa({ estado: { vistas: {}, likes: { [a.id]: 100, [b.id]: 300, [c.id]: 200 }, malas: [], clavesPropias: [] } });
  render(<Favoritos api={api} />);
  const items = screen.getAllByTestId("favorito-frase").map((e) => e.textContent);
  expect(items[0]).toContain(b.texto);
  expect(items[1]).toContain(c.texto);
  expect(items[2]).toContain(a.texto);
});

test("sin likes muestra un mensaje", () => {
  render(<Favoritos api={apiFalsa()} />);
  expect(screen.getByText(/Todavía no/)).toBeTruthy();
});

test("la pestaña Fondos muestra los fondos favoritos", () => {
  const api = apiFalsa({ prefs: { ...apiFalsa().prefs!, fondosFavoritos: ["min-oceano"] } });
  render(<Favoritos api={api} />);
  fireEvent.click(screen.getByRole("tab", { name: "Fondos" }));
  expect(screen.getByText("Océano")).toBeTruthy();
});
