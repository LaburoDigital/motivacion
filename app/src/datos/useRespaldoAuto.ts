import { useEffect, useRef } from "react";
import { subirRespaldo } from "./respaldo";

const ESPERA_MS = 90_000;

/**
 * Sube una copia a la nube un rato después de cada cambio (agrupa los cambios seguidos)
 * y enseguida al salir de la app. No sube solo por abrirla.
 * `huella` es cualquier valor que cambia cuando cambian los datos que importan.
 */
export function useRespaldoAuto(listo: boolean, huella: string) {
  const anterior = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pendiente = useRef(false);

  useEffect(() => {
    if (!listo) return;
    if (anterior.current === null || anterior.current === huella) {
      anterior.current = huella;
      return;
    }
    anterior.current = huella;
    pendiente.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pendiente.current = false;
      void subirRespaldo();
    }, ESPERA_MS);
  }, [listo, huella]);

  useEffect(() => {
    const alSalir = () => {
      if (document.visibilityState !== "hidden" || !pendiente.current) return;
      clearTimeout(timer.current);
      pendiente.current = false;
      void subirRespaldo();
    };
    document.addEventListener("visibilitychange", alSalir);
    return () => {
      document.removeEventListener("visibilitychange", alSalir);
      clearTimeout(timer.current);
    };
  }, []);
}
