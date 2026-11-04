import { useEffect, useState } from "react";

function medirSafeArea(): Record<string, string> {
  const d = document.createElement("div");
  d.style.cssText =
    "position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
  document.body.appendChild(d);
  const s = getComputedStyle(d);
  const r = { top: s.paddingTop, bottom: s.paddingBottom };
  d.remove();
  return r;
}

/** Medidas de la pantalla para entender problemas de tamaño en el iPhone (oculto: 3 toques en el pie de Ajustes). */
export function Diagnostico() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const f = () => setTick((t) => t + 1);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  const safe = medirSafeArea();
  const app = document.querySelector(".app")?.getBoundingClientRect();
  const datos = {
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    clientHeight: document.documentElement.clientHeight,
    visualViewport: window.visualViewport ? Math.round(window.visualViewport.height) : "—",
    screen: `${screen.width}×${screen.height}`,
    app: app ? `${Math.round(app.top)}→${Math.round(app.bottom)}` : "—",
    "safe-top": safe.top,
    "safe-bottom": safe.bottom,
    standalone: String((navigator as Navigator & { standalone?: boolean }).standalone ?? false),
    dpr: window.devicePixelRatio,
    ios: navigator.userAgent.match(/OS (\d+[_\d]*)/)?.[1]?.replace(/_/g, ".") ?? "—",
  };
  return (
    <pre className="diagnostico" data-testid="diagnostico">
      {Object.entries(datos).map(([k, v]) => `${k}: ${v}`).join("\n")}
    </pre>
  );
}
