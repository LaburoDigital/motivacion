import { useEffect, useState } from "react";
import { BarraNav, type Seccion } from "./componentes/BarraNav";
import { CartelInstalar } from "./componentes/CartelInstalar";
import { VistaPrevia } from "./componentes/VistaPrevia";
import { Celebracion } from "./rachas/Celebracion";
import { PanelRachas } from "./rachas/PanelRachas";
import { diasRacha, hitoNuevo } from "./rachas/logica";
import { useRachas } from "./rachas/useRachas";
import { useFrases } from "./datos/useFrases";
import { useResincronizarNotificaciones } from "./datos/useResincronizar";
import { useRespaldoAuto } from "./datos/useRespaldoAuto";
import { Ajustes } from "./pantallas/Ajustes";
import { Bienvenida } from "./pantallas/Bienvenida";
import { Favoritos } from "./pantallas/Favoritos";
import { Inicio } from "./pantallas/Inicio";
import { Temas } from "./pantallas/Temas";
import { fraseDelDia, opcionRacha } from "shared";
import { fondoPara } from "./visual/fondos";
import { aplicarIcono } from "./visual/iconos";
import { letraPorId } from "./visual/letras";
import "./estilos.css";

export default function App() {
  const api = useFrases();
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const [fraseInicial] = useState(() => new URLSearchParams(location.search).get("frase"));
  const [verPrevia, setVerPrevia] = useState(!!fraseInicial);
  const previa = verPrevia && fraseInicial ? api.todas.find((f) => f.id === fraseInicial) : undefined;

  const cerrarPrevia = () => {
    setVerPrevia(false);
    // Que volver a abrir la app no muestre la vista previa otra vez.
    history.replaceState(null, "", location.pathname);
  };

  const rachas = useRachas(api.prefs?.zonaHoraria ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [verRachas, setVerRachas] = useState(false);
  const mayor = rachas.activas && rachas.lista.length ? Math.max(...rachas.lista.map((r) => diasRacha(r, rachas.hoy))) : null;
  const festejo = rachas.activas
    ? rachas.lista.map((r) => ({ r, hito: hitoNuevo(r, rachas.hoy) })).find((x) => x.hito !== null)
    : undefined;

  useResincronizarNotificaciones(api.prefs, rachas.activas ? rachas : null);
  useRespaldoAuto(
    api.cargado && rachas.cargado,
    JSON.stringify([api.estado.likes, api.estado.clavesPropias, api.estado.malas, api.prefs, rachas.activas, rachas.hora, rachas.lista]),
  );
  const icono = api.prefs?.icono;
  useEffect(() => {
    if (icono) aplicarIcono(icono);
  }, [icono]);

  return (
    <div className="app">
      <main className="contenido">
        {seccion === "inicio" && (
          <Inicio api={api} fraseInicial={fraseInicial} racha={mayor === null ? null : { dias: mayor }} onAbrirRachas={() => setVerRachas(true)} />
        )}
        {seccion === "temas" && <Temas api={api} />}
        {seccion === "favoritos" && <Favoritos api={api} />}
        {seccion === "ajustes" && <Ajustes api={api} rachas={rachas} onAbrirRachas={() => setVerRachas(true)} onIrATemas={() => setSeccion("temas")} />}
      </main>
      {previa && api.cargado && api.prefs && (
        <VistaPrevia frase={previa} estilo={{ foto: fondoPara(previa, api.prefs), letra: letraPorId(api.prefs.letra) }} onCerrar={cerrarPrevia} />
      )}
      {verRachas && <PanelRachas rachas={rachas} onCerrar={() => setVerRachas(false)} />}
      {festejo && festejo.hito !== null && api.cargado && (
        <Celebracion
          nombre={festejo.r.nombre}
          hito={festejo.hito}
          festejo={opcionRacha(festejo.r.clase)?.festejo}
          frase={fraseDelDia(api.todas, `${rachas.hoy}|${festejo.r.id}`, ["superacion", "disciplina"])}
          onSeguir={() => rachas.festejar(festejo.r.id, festejo.hito!)}
        />
      )}
      {api.cargado && api.prefs && !api.prefs.bienvenida && <Bienvenida api={api} />}
      <CartelInstalar />
      <BarraNav actual={seccion} onCambiar={setSeccion} />
    </div>
  );
}
