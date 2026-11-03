import { useCallback, useEffect, useState } from "react";
import type { Frase } from "shared";
import { compartirFrase } from "../compartir/imagenFrase";
import { MenuFrase } from "../componentes/MenuFrase";
import { TarjetaFrase } from "../componentes/TarjetaFrase";
import type { FrasesApi } from "../datos/useFrases";
import { ESTILOS, ESTILO_RESPALDO, elegirFondo, type EstiloVisual } from "../visual/estilos";

interface Props {
  api: FrasesApi;
  fraseInicial?: string | null;
}

const LOTE = 10;

export function Inicio({ api, fraseInicial }: Props) {
  const { cargado, fraseDelDia, todas, siguientes, prefs, estado } = api;
  const [feed, setFeed] = useState<Frase[]>([]);
  const [fondoElegido, setFondoElegido] = useState<Record<string, EstiloVisual>>({});
  const [menu, setMenu] = useState<Frase | null>(null);

  // Arma el feed una vez cargado; después crece con cargarMas.
  useEffect(() => {
    if (!cargado) return;
    const primeras: Frase[] = [];
    const pedida = fraseInicial ? todas.find((f) => f.id === fraseInicial) : undefined;
    if (pedida) primeras.push(pedida);
    if (fraseDelDia && fraseDelDia.id !== pedida?.id) primeras.push(fraseDelDia);
    setFeed([...primeras, ...siguientes(LOTE, primeras.map((f) => f.id))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargado, fraseDelDia?.id, fraseInicial]);

  const cargarMas = useCallback(() => {
    setFeed((actual) => [...actual, ...siguientes(LOTE, actual.map((f) => f.id))]);
  }, [siguientes]);

  const estiloDe = (frase: Frase, i: number) =>
    fondoElegido[frase.id] ?? (prefs ? elegirFondo(prefs, i) : ESTILO_RESPALDO);

  if (!cargado) return <div className="cargando">Cargando frases…</div>;

  return (
    <div className="feed">
      {feed.map((frase, i) => (
        <TarjetaFrase
          key={frase.id}
          frase={frase}
          estilo={estiloDe(frase, i)}
          liked={frase.id in estado.likes}
          delDia={frase.id === fraseDelDia?.id}
          onLike={() => api.alternarLike(frase.id)}
          onCompartir={() => void compartirFrase(frase, estiloDe(frase, i))}
          onCambiarFondo={() =>
            setFondoElegido((f) => ({ ...f, [frase.id]: ESTILOS[Math.floor(Math.random() * ESTILOS.length)] }))
          }
          onMantener={() => setMenu(frase)}
          onVisible={() => {
            api.marcarVista(frase.id);
            if (i >= feed.length - 3) cargarMas();
          }}
        />
      ))}
      {menu && (
        <MenuFrase
          frase={menu}
          onClave={() => api.marcarClave(menu.id)}
          onMala={() => api.marcarMala(menu.id)}
          onCerrar={() => setMenu(null)}
        />
      )}
    </div>
  );
}
