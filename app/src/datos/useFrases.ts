import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FRASES_BASE, armarFeed, deduplicar, fechaLocal, fraseDelDia as calcularFraseDelDia,
  type EstadoFeed, type Frase,
} from "shared";
import { almacen, type Preferencias, type Remotas } from "./almacen";
import { obtenerFraseDelDiaRemota, obtenerRemotas } from "./api";

const estadoVacio: EstadoFeed = { vistas: {}, likes: {}, malas: [], clavesPropias: [] };

export function useFrases() {
  const [cargado, setCargado] = useState(false);
  const [remotas, setRemotas] = useState<Remotas>({ version: "", frases: [] });
  const [estado, setEstado] = useState<EstadoFeed>(estadoVacio);
  const [prefs, setPrefsState] = useState<Preferencias | null>(null);
  const [fraseDelDia, setFraseDelDia] = useState<Frase | null>(null);
  const estadoRef = useRef(estado);

  const todas = useMemo(() => deduplicar([...FRASES_BASE, ...remotas.frases]), [remotas]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [e, p, r, guardada] = await Promise.all([
        almacen.leerEstado(), almacen.leerPrefs(), almacen.leerRemotas(), almacen.leerFraseDelDia(),
      ]);
      if (!vivo) return;
      estadoRef.current = e;
      setEstado(e);
      setPrefsState(p);
      setRemotas(r);

      const nuevas = await obtenerRemotas(r.version);
      let actuales = r;
      if (nuevas && nuevas.version !== r.version) {
        actuales = nuevas;
        await almacen.guardarRemotas(nuevas);
        if (vivo) setRemotas(nuevas);
      }
      const lista = deduplicar([...FRASES_BASE, ...actuales.frases]);

      const hoy = fechaLocal(new Date(), p.zonaHoraria);
      let delDia = guardada?.fecha === hoy ? lista.find((f) => f.id === guardada.id) ?? null : null;
      if (!delDia) {
        delDia = await obtenerFraseDelDiaRemota(p.temas, p.zonaHoraria);
        if (!delDia) {
          // Sin red: Clave local, contando las que el usuario subió a Clave.
          const conPropias = lista.map((f) => (e.clavesPropias.includes(f.id) ? { ...f, nivel: "clave" as const } : f));
          delDia = calcularFraseDelDia(conPropias, hoy, p.temas);
        }
        if (delDia) await almacen.guardarFraseDelDia({ fecha: hoy, id: delDia.id });
      }
      if (vivo) {
        setFraseDelDia(delDia);
        setCargado(true);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const actualizarEstado = useCallback((cambio: (e: EstadoFeed) => EstadoFeed) => {
    const nuevo = cambio(estadoRef.current);
    estadoRef.current = nuevo;
    setEstado(nuevo);
    void almacen.guardarEstado(nuevo);
  }, []);

  const siguientes = useCallback(
    (n: number, excluir: string[] = []) => {
      const fuera = new Set(excluir);
      return armarFeed(todas.filter((f) => !fuera.has(f.id)), estadoRef.current, prefs?.temas ?? [], n, Date.now(), Math.random);
    },
    [todas, prefs],
  );

  const marcarVista = useCallback((id: string) =>
    actualizarEstado((e) => ({ ...e, vistas: { ...e.vistas, [id]: Date.now() } })), [actualizarEstado]);

  const alternarLike = useCallback((id: string) =>
    actualizarEstado((e) => {
      const likes = { ...e.likes };
      if (id in likes) delete likes[id];
      else likes[id] = Date.now();
      return { ...e, likes };
    }), [actualizarEstado]);

  const marcarClave = useCallback((id: string) =>
    actualizarEstado((e) => (e.clavesPropias.includes(id) ? e : { ...e, clavesPropias: [...e.clavesPropias, id] })), [actualizarEstado]);

  const marcarMala = useCallback((id: string) =>
    actualizarEstado((e) => (e.malas.includes(id) ? e : { ...e, malas: [...e.malas, id] })), [actualizarEstado]);

  const setPrefs = useCallback((cambio: Partial<Preferencias>) => {
    setPrefsState((p) => {
      if (!p) return p;
      const nuevo = { ...p, ...cambio };
      void almacen.guardarPrefs(nuevo);
      return nuevo;
    });
  }, []);

  return { cargado, todas, fraseDelDia, estado, prefs, siguientes, marcarVista, alternarLike, marcarClave, marcarMala, setPrefs };
}

export type FrasesApi = ReturnType<typeof useFrases>;
