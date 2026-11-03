import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App";

vi.mock("./compartir/imagenFrase", () => ({
  generarImagenFrase: vi.fn(async () => new Blob(["png"])),
  compartirFrase: vi.fn(async () => undefined),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
});

test("renderiza App sin romper", () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
  const { container } = render(<App />);
  expect(container.firstChild).not.toBeNull();
});

test("abierta desde una notificación muestra la vista previa, y al cerrarla limpia la URL", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  history.replaceState(null, "", "/?frase=b-0001");
  render(<App />);
  await waitFor(() => expect(screen.getByRole("dialog", { name: /Vista previa/ })).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: /Ver más frases/ }));
  expect(screen.queryByRole("dialog", { name: /Vista previa/ })).toBeNull();
  expect(location.search).toBe("");
});
