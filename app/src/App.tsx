import { useEffect, useState } from "react";
import { BarraNav, type Seccion } from "./componentes/BarraNav";
import { CartelInstalar } from "./componentes/CartelInstalar";
import { activarNotificaciones } from "./datos/notificaciones";
import { useFrases } from "./datos/useFrases";
import { Ajustes } from "./pantallas/Ajustes";
import { Favoritos } from "./pantallas/Favoritos";
import { Inicio } from "./pantallas/Inicio";
import { Temas } from "./pantallas/Temas";
import "./estilos.css";

export default function App() {
  const api = useFrases();
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const [fraseInicial] = useState(() => new URLSearchParams(location.search).get("frase"));

  // Si cambian los temas con las notificaciones activas, el Worker tiene que saberlo.
  const temas = api.prefs?.temas.join(",");
  useEffect(() => {
    const p = api.prefs;
    if (!p?.notificaciones.activas) return;
    void activarNotificaciones({ ...p.notificaciones, temas: p.temas, zona: p.zonaHoraria });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temas]);

  return (
    <div className="app">
      <main className="contenido">
        {seccion === "inicio" && <Inicio api={api} fraseInicial={fraseInicial} />}
        {seccion === "temas" && <Temas api={api} />}
        {seccion === "favoritos" && <Favoritos api={api} />}
        {seccion === "ajustes" && <Ajustes api={api} />}
      </main>
      <CartelInstalar />
      <BarraNav actual={seccion} onCambiar={setSeccion} />
    </div>
  );
}
