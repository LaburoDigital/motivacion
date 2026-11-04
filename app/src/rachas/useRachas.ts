import { useCallback, useEffect, useRef, useState } from "react";
import { fechaLocal } from "shared";
import { almacen, type ConfigRachas } from "../datos/almacen";
import { crearRacha, festejarHasta, marcarHoy, recaer, type Racha, type TipoRacha } from "./logica";

export function useRachas(zona: string) {
  const [config, setConfig] = useState<ConfigRachas>({ activas: false, hora: "21:00", lista: [] });
  const [cargado, setCargado] = useState(false);
  const ref = useRef(config);
  const hoy = fechaLocal(new Date(), zona);

  useEffect(() => {
    void almacen.leerRachas().then((c) => {
      ref.current = c;
      setConfig(c);
      setCargado(true);
    });
  }, []);

  const cambiar = useCallback((f: (c: ConfigRachas) => ConfigRachas) => {
    const nueva = f(ref.current);
    ref.current = nueva;
    setConfig(nueva);
    void almacen.guardarRachas(nueva);
  }, []);

  const cambiarRacha = useCallback(
    (id: string, f: (r: Racha) => Racha) => cambiar((c) => ({ ...c, lista: c.lista.map((r) => (r.id === id ? f(r) : r)) })),
    [cambiar],
  );

  return {
    ...config,
    cargado,
    hoy,
    setActivas: (activas: boolean) => cambiar((c) => ({ ...c, activas })),
    setHora: (hora: string) => cambiar((c) => ({ ...c, hora })),
    crear: (nombre: string, tipo: TipoRacha) => cambiar((c) => ({ ...c, activas: true, lista: [...c.lista, crearRacha(nombre, tipo, hoy)] })),
    borrar: (id: string) => cambiar((c) => ({ ...c, lista: c.lista.filter((r) => r.id !== id) })),
    cumplir: (id: string) => cambiarRacha(id, (r) => marcarHoy(r, hoy)),
    recaer: (id: string) => cambiarRacha(id, (r) => recaer(r, hoy)),
    festejar: (id: string, hito: number) => cambiarRacha(id, (r) => festejarHasta(r, hito)),
  };
}

export type RachasApi = ReturnType<typeof useRachas>;
