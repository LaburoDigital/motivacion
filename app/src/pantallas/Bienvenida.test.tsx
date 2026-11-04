import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { Bienvenida } from "./Bienvenida";

vi.mock("../datos/notificaciones", () => ({ activarNotificaciones: vi.fn(async () => "ok") }));
const { activarNotificaciones } = await import("../datos/notificaciones");
afterEach(() => vi.clearAllMocks());

const boton = (nombre: string | RegExp) => screen.getByRole("button", { name: nombre });

test("los tres pasos guardan temas, fondo y activan notificaciones", async () => {
  const api = apiFalsa();
  render(<Bienvenida api={api} />);

  fireEvent.click(boton("Gym"));
  expect(api.setPrefs).toHaveBeenCalledWith({ temas: ["gym"] });
  fireEvent.click(boton("Siguiente"));

  fireEvent.click(boton("Fondos: Ciudad de noche"));
  expect(api.setPrefs).toHaveBeenCalledWith({ fondo: "ciudad" });
  fireEvent.click(boton("Siguiente"));

  fireEvent.click(boton("Activar notificaciones"));
  await waitFor(() => expect(activarNotificaciones).toHaveBeenCalledWith(expect.objectContaining({ cadaHoras: 2 })));
  await waitFor(() => expect(api.setPrefs).toHaveBeenCalledWith({ notificaciones: expect.objectContaining({ activas: true }) }));
  fireEvent.click(boton("Empezar"));
  expect(api.setPrefs).toHaveBeenCalledWith({ bienvenida: true });
});

test("'Ahora no' en las notificaciones también termina", () => {
  const api = apiFalsa();
  render(<Bienvenida api={api} />);
  fireEvent.click(boton("Siguiente"));
  fireEvent.click(boton("Siguiente"));
  fireEvent.click(boton("Ahora no"));
  expect(activarNotificaciones).not.toHaveBeenCalled();
  expect(api.setPrefs).toHaveBeenCalledWith({ bienvenida: true });
});

test("se puede volver al paso anterior", () => {
  render(<Bienvenida api={apiFalsa()} />);
  fireEvent.click(boton("Siguiente"));
  fireEvent.click(boton("Atrás"));
  expect(boton("Gym")).toBeTruthy();
});

test("si la app no está instalada, explica cómo instalarla", async () => {
  vi.mocked(activarNotificaciones).mockResolvedValueOnce("sin-soporte");
  render(<Bienvenida api={apiFalsa()} />);
  fireEvent.click(boton("Siguiente"));
  fireEvent.click(boton("Siguiente"));
  fireEvent.click(boton("Activar notificaciones"));
  await screen.findByText(/Agregar a inicio/);
});
