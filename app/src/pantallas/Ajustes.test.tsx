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
const abrir = (nombre: string) => fireEvent.click(screen.getByRole("button", { name: nombre }));

function rachasFalsas(cambios = {}) {
  return {
    activas: false, hora: "21:00", lista: [], cargado: true, hoy: "2026-11-03",
    setActivas: vi.fn(), setHora: vi.fn(), crear: vi.fn(), borrar: vi.fn(), cumplir: vi.fn(), recaer: vi.fn(), festejar: vi.fn(),
    ...cambios,
  };
}

test("muestra la grilla de tarjetas y se puede volver", () => {
  render(<Ajustes api={apiFalsa()} rachas={rachasFalsas()} />);
  for (const n of ["Notificaciones", "Rachas", "Pantalla bloqueada", "Ícono de la app", "Temas que seguís", "Fondos y letra"]) {
    expect(screen.getByRole("button", { name: n })).toBeTruthy();
  }
  abrir("Notificaciones");
  expect(screen.getByLabelText(/Recibir notificaciones/)).toBeTruthy();
  abrir("Volver");
  expect(screen.getByRole("button", { name: "Rachas" })).toBeTruthy();
});

test("Temas que seguís lleva a la pestaña Temas", () => {
  const onIrATemas = vi.fn();
  render(<Ajustes api={apiFalsa()} onIrATemas={onIrATemas} />);
  abrir("Temas que seguís");
  expect(onIrATemas).toHaveBeenCalled();
});

test("con hasta antes que desde, el interruptor se deshabilita y muestra el error", () => {
  const api = apiFalsa({ prefs: prefsCon({ notificaciones: { activas: false, cantidad: 3, cadaHoras: null, desde: "22:00", hasta: "08:00" } }) });
  render(<Ajustes api={api} />);
  abrir("Notificaciones");
  expect((screen.getByLabelText(/Recibir notificaciones/) as HTMLInputElement).disabled).toBe(true);
  expect(screen.getByText(/tiene que ser antes/)).toBeTruthy();
});

test("cambiar la hora guarda la preferencia", () => {
  const api = apiFalsa();
  render(<Ajustes api={api} />);
  abrir("Notificaciones");
  fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "09:00" } });
  expect(api.setPrefs).toHaveBeenCalledWith({ notificaciones: expect.objectContaining({ desde: "09:00" }) });
});

test("sin soporte muestra cómo instalar la app", async () => {
  render(<Ajustes api={apiFalsa()} />);
  abrir("Notificaciones");
  fireEvent.click(screen.getByLabelText(/Recibir notificaciones/));
  await waitFor(() => expect(screen.getByText(/Instalá la app en tu pantalla de inicio/)).toBeTruthy());
  expect(activarNotificaciones).toHaveBeenCalledWith(expect.objectContaining({ cantidad: 3, desde: "08:00", hasta: "22:00" }));
});

test("por defecto la frecuencia es cada 2 horas y se manda al activar", async () => {
  render(<Ajustes api={apiFalsa()} />);
  abrir("Notificaciones");
  expect((screen.getByLabelText("Frecuencia") as HTMLSelectElement).value).toBe("h2");
  expect(screen.getByText(/8 notificaciones por día/)).toBeTruthy();
  fireEvent.click(screen.getByLabelText(/Recibir notificaciones/));
  await waitFor(() => expect(activarNotificaciones).toHaveBeenCalledWith(expect.objectContaining({ cadaHoras: 2 })));
});

test("elegir '3 por día' saca el cada N horas", () => {
  const api = apiFalsa();
  render(<Ajustes api={api} />);
  abrir("Notificaciones");
  fireEvent.change(screen.getByLabelText("Frecuencia"), { target: { value: "d3" } });
  expect(api.setPrefs).toHaveBeenCalledWith({ notificaciones: expect.objectContaining({ cantidad: 3, cadaHoras: null }) });
});

test("'Copiar mi link' copia la URL del wallpaper con temas, zona y estilo", async () => {
  const writeText = vi.fn(async (_texto: string) => undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  const api = apiFalsa({ prefs: prefsCon({ temas: ["gym", "calma"], zonaHoraria: "America/Argentina/Buenos_Aires", estiloWallpaper: "degradado" }) });
  render(<Ajustes api={api} />);
  abrir("Pantalla bloqueada");
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
  abrir("Pantalla bloqueada");
  expect(screen.getByRole("link", { name: /Instalar atajo/ }).getAttribute("href")).toBe("https://www.icloud.com/shortcuts/abc");
});

test("la opción de widget de texto copia el código para Scriptable", async () => {
  const writeText = vi.fn(async (_texto: string) => undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<Ajustes api={apiFalsa()} />);
  abrir("Pantalla bloqueada");
  fireEvent.click(screen.getByRole("tab", { name: "Widget de texto" }));
  fireEvent.click(screen.getByRole("button", { name: /Copiar código del widget/ }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(writeText.mock.calls[0][0]).toContain("https://w.test/frase-del-dia?");
  expect(screen.getByRole("link", { name: /Scriptable/ }).getAttribute("href")).toContain("apps.apple.com");
});

test("elegir un ícono lo guarda y cambia el ícono que toma iOS al agregar a inicio", () => {
  const link = document.createElement("link");
  link.rel = "apple-touch-icon";
  link.href = "/apple-touch-icon.png";
  document.head.appendChild(link);
  const api = apiFalsa();
  render(<Ajustes api={api} />);
  abrir("Ícono de la app");
  fireEvent.click(screen.getByRole("button", { name: "Ícono: Noche" }));
  expect(api.setPrefs).toHaveBeenCalledWith({ icono: "noche" });
  expect(link.getAttribute("href")).toBe("/iconos/noche-180.png");
  link.remove();
});

test("prender las rachas y abrir la lista", () => {
  const rachas = rachasFalsas();
  const onAbrirRachas = vi.fn();
  render(<Ajustes api={apiFalsa()} rachas={rachas} onAbrirRachas={onAbrirRachas} />);
  abrir("Rachas");
  fireEvent.click(screen.getByLabelText("Activar rachas"));
  expect(rachas.setActivas).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByRole("button", { name: /Ver mis rachas/ }));
  expect(onAbrirRachas).toHaveBeenCalled();
});

test("con rachas prendidas se elige la hora del aviso", () => {
  const rachas = rachasFalsas({ activas: true });
  render(<Ajustes api={apiFalsa()} rachas={rachas} onAbrirRachas={vi.fn()} />);
  abrir("Rachas");
  fireEvent.change(screen.getByLabelText("Hora del aviso de racha"), { target: { value: "22:30" } });
  expect(rachas.setHora).toHaveBeenCalledWith("22:30");
});

test("tocar tres veces el pie muestra las medidas de la pantalla", () => {
  render(<Ajustes api={apiFalsa()} />);
  const pie = screen.getByText(/Hecha con ganas/);
  fireEvent.click(pie); fireEvent.click(pie);
  expect(screen.queryByTestId("diagnostico")).toBeNull();
  fireEvent.click(pie);
  const d = screen.getByTestId("diagnostico").textContent!;
  expect(d).toContain("innerHeight");
  expect(d).toContain("screen");
  expect(d).toContain("safe-bottom");
});

test("con el estilo foto, el link lleva tu grupo de fotos", async () => {
  const writeText = vi.fn(async (_texto: string) => undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  const api = apiFalsa({ prefs: prefsCon({ estiloWallpaper: "foto", fondo: "ciudad" }) });
  render(<Ajustes api={api} />);
  abrir("Pantalla bloqueada");
  expect(screen.getByRole("option", { name: "Foto como en la app" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Copiar mi link/ }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(new URL(writeText.mock.calls[0][0]).searchParams.get("fondo")).toBe("ciudad");
});
