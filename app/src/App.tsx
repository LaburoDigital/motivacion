import { useState } from "react";
import { BarraNav, type Seccion } from "./componentes/BarraNav";
import { CartelInstalar } from "./componentes/CartelInstalar";
import { useFrases } from "./datos/useFrases";
import { useResincronizarNotificaciones } from "./datos/useResincronizar";
import { Ajustes } from "./pantallas/Ajustes";
import { Favoritos } from "./pantallas/Favoritos";
import { Inicio } from "./pantallas/Inicio";
import { Temas } from "./pantallas/Temas";
import "./estilos.css";

export default function App() {
  const api = useFrases();
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const [fraseInicial] = useState(() => new URLSearchParams(location.search).get("frase"));

  useResincronizarNotificaciones(api.prefs);

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
