import { createRoot } from "react-dom/client";
import App from "./App";

// Cuando se publica una versión nueva, el service worker nuevo toma el control: recargamos para verla.
if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
  let recargando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recargando) return;
    recargando = true;
    location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
