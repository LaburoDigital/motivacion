import { useEffect, useRef } from "react";
import { resumenParaAviso, type Racha } from "../rachas/logica";
import type { Preferencias } from "./almacen";
import { activarNotificaciones, type ConfigNotificaciones } from "./notificaciones";

/** Lo mínimo de las rachas para el aviso diario: nunca viaja el nombre. */
export interface RachasParaAviso {
  activas: boolean;
  hora: string;
  hoy: string;
  lista: Racha[];
  mostrarNombre?: boolean;
}

export function avisoDeRacha(rachas: RachasParaAviso | null): ConfigNotificaciones["racha"] {
  if (!rachas?.activas) return null;
  const resumen = resumenParaAviso(rachas.lista, rachas.hoy, !!rachas.mostrarNombre);
  return resumen ? { hora: rachas.hora, ...resumen } : null;
}

/**
 * Si cambian los temas o la racha con las notificaciones activas, le avisa al Worker.
 * No hace nada al abrir la app: reenviar en cada apertura gasta escrituras del KV.
 */
export function useResincronizarNotificaciones(prefs: Preferencias | null, rachas: RachasParaAviso | null = null) {
  const previos = useRef<string | null>(null);
  const racha = avisoDeRacha(rachas);
  const clave = prefs ? `${[...prefs.temas].sort().join(",")}|${JSON.stringify(racha)}` : null;

  useEffect(() => {
    if (clave === null) return;
    const antes = previos.current;
    previos.current = clave;
    if (antes === null || antes === clave || !prefs?.notificaciones.activas) return;
    void activarNotificaciones({ ...prefs.notificaciones, temas: prefs.temas, zona: prefs.zonaHoraria, racha });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
}
