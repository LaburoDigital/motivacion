import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { apiFalsa } from "../test/apiFalsa";
import { Ajustes } from "./Ajustes";

vi.mock("../datos/notificaciones", () => ({
  activarNotificaciones: vi.fn(async () => "sin-soporte"),
  desactivarNotificaciones: vi.fn(async () => undefined),
}));
vi.mock("../config", () => ({ WORKER_URL: "https://w.test", ATAJO_URL: "https://www.icloud.com/shortcuts/abc" }));

const { activarNotificaciones } = await import("../datos/notificaciones");

afterEach(() => vi.clearAllMocks());

const prefsCon = (cambios: object) => ({ ...apiFalsa().prefs!, ...cambios });

test("con hasta antes que desde, el interruptor se deshabilita y muestra el error", () => {
  const api = apiFalsa({ prefs: prefsCon({ notificaciones: { activas: false, cantidad: 3, desde: "22:00", hasta: "08:00" } }) });
  render(<Ajustes api={api} />);
  expect((screen.getByLabelText(/Recibir notificaciones/) as HTMLInputElement).disabled).toBe(true);
  expect(screen.getByText(/tiene que ser antes/)).toBeTruthy();
});

test("cambiar la hora guarda la preferencia", () => {
  const api = apiFalsa();
  render(<Ajustes api={api} />);
  fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "09:00" } });
  expect(api.setPrefs).toHaveBeenCalledWith({ notificaciones: expect.objectContaining({ desde: "09:00" }) });
});

test("sin soporte muestra cómo instalar la app", async () => {
  render(<Ajustes api={apiFalsa()} />);
  fireEvent.click(screen.getByLabelText(/Recibir notificaciones/));
  await waitFor(() => expect(screen.getByText(/Instalá la app en tu pantalla de inicio/)).toBeTruthy());
  expect(activarNotificaciones).toHaveBeenCalledWith(expect.objectContaining({ cantidad: 3, desde: "08:00", hasta: "22:00" }));
});

test("'Copiar mi link' copia la URL del wallpaper con temas, zona y estilo", async () => {
  const writeText = vi.fn(async (_texto: string) => undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  const api = apiFalsa({ prefs: prefsCon({ temas: ["gym", "calma"], zonaHoraria: "America/Argentina/Buenos_Aires", estiloWallpaper: "degradado" }) });
  render(<Ajustes api={api} />);
  fireEvent.click(screen.getByRole("button", { name: /Copiar mi link/ }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  const url = new URL(writeText.mock.calls[0][0]);
  expect(url.origin + url.pathname).toBe("https://w.test/wallpaper");
  expect(url.searchParams.get("temas")).toBe("gym,calma");
  expect(url.searchParams.get("zona")).toBe("America/Argentina/Buenos_Aires");
  expect(url.searchParams.get("estilo")).toBe("degradado");
});

test("el botón de instalar el atajo apunta al link de iCloud", () => {
  render(<Ajustes api={apiFalsa()} />);
  expect(screen.getByRole("link", { name: /Instalar atajo/ }).getAttribute("href")).toBe("https://www.icloud.com/shortcuts/abc");
});
