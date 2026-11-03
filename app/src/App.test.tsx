import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "./App";

test("renderiza App sin romper", () => {
  const { container } = render(<App />);
  expect(container.firstChild).not.toBeNull();
});
