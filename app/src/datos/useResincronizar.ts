import { useEffect, useRef } from "react";
import type { Preferencias } from "./almacen";
import { activarNotificaciones } from "./notificaciones";

/**
 * Si el usuario cambia los temas con las notificaciones activas, le avisa al Worker.
 * No hace nada al abrir la app: reenviar en cada apertura gasta escrituras del KV.
 */
export function useResincronizarNotificaciones(prefs: Preferencias | null) {
  const previos = useRef<string | null>(null);
  const temas = prefs ? [...prefs.temas].sort().join(",") : null;

  useEffect(() => {
    if (temas === null) return;
    const antes = previos.current;
    previos.current = temas;
    if (antes === null || antes === temas || !prefs?.notificaciones.activas) return;
    void activarNotificaciones({ ...prefs.notificaciones, temas: prefs.temas, zona: prefs.zonaHoraria });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temas]);
}
