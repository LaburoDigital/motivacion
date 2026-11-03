import { useState } from "react";
import { BarraNav, type Seccion } from "./componentes/BarraNav";
import { CartelInstalar } from "./componentes/CartelInstalar";
import { VistaPrevia } from "./componentes/VistaPrevia";
import { useFrases } from "./datos/useFrases";
import { useResincronizarNotificaciones } from "./datos/useResincronizar";
import { Ajustes } from "./pantallas/Ajustes";
import { Favoritos } from "./pantallas/Favoritos";
import { Inicio } from "./pantallas/Inicio";
import { Temas } from "./pantallas/Temas";
import { ESTILO_RESPALDO, estiloPorId } from "./visual/estilos";
import "./estilos.css";

export default function App() {
  const api = useFrases();
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const [fraseInicial] = useState(() => new URLSearchParams(location.search).get("frase"));
  const [verPrevia, setVerPrevia] = useState(!!fraseInicial);
  const previa = verPrevia && fraseInicial ? api.todas.find((f) => f.id === fraseInicial) : undefined;
  const estilo = (api.prefs && estiloPorId(api.prefs.estiloVisual)) || ESTILO_RESPALDO;

  const cerrarPrevia = () => {
    setVerPrevia(false);
    // Que volver a abrir la app no muestre la vista previa otra vez.
    history.replaceState(null, "", location.pathname);
  };

  useResincronizarNotificaciones(api.prefs);

  return (
    <div className="app">
      <main className="contenido">
        {seccion === "inicio" && <Inicio api={api} fraseInicial={fraseInicial} />}
        {seccion === "temas" && <Temas api={api} />}
        {seccion === "favoritos" && <Favoritos api={api} />}
        {seccion === "ajustes" && <Ajustes api={api} />}
      </main>
      {previa && api.cargado && <VistaPrevia frase={previa} estilo={estilo} onCerrar={cerrarPrevia} />}
      <CartelInstalar />
      <BarraNav actual={seccion} onCambiar={setSeccion} />
    </div>
  );
}
