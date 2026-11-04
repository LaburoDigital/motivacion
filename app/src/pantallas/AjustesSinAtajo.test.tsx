import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { Ajustes } from "./Ajustes";

vi.mock("../datos/notificaciones", () => ({ activarNotificaciones: vi.fn(), desactivarNotificaciones: vi.fn() }));
vi.mock("../config", () => ({ WORKER_URL: "https://w.test", ATAJO_URL: "" }));

test("sin link del atajo no hay botón muerto: muestra cómo armarlo", () => {
  render(<Ajustes api={apiFalsa()} />);
  fireEvent.click(screen.getByRole("button", { name: "Pantalla bloqueada" }));
  expect(screen.queryByRole("link", { name: /Instalar atajo/ })).toBeNull();
  expect(screen.getByText(/Obtener contenido de URL/)).toBeTruthy();
  expect(screen.getByText(/Establecer foto de fondo de pantalla/)).toBeTruthy();
});
