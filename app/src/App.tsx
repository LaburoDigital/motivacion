import { useEffect, useState } from "react";
import { BarraNav, type Seccion } from "./componentes/BarraNav";
import { CartelInstalar } from "./componentes/CartelInstalar";
import { VistaPrevia } from "./componentes/VistaPrevia";
import { useFrases } from "./datos/useFrases";
import { useResincronizarNotificaciones } from "./datos/useResincronizar";
import { Ajustes } from "./pantallas/Ajustes";
import { Favoritos } from "./pantallas/Favoritos";
import { Inicio } from "./pantallas/Inicio";
import { Temas } from "./pantallas/Temas";
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

  useResincronizarNotificaciones(api.prefs);
  const icono = api.prefs?.icono;
  useEffect(() => {
    if (icono) aplicarIcono(icono);
  }, [icono]);

  return (
    <div className="app">
      <main className="contenido">
        {seccion === "inicio" && <Inicio api={api} fraseInicial={fraseInicial} />}
        {seccion === "temas" && <Temas api={api} />}
        {seccion === "favoritos" && <Favoritos api={api} />}
        {seccion === "ajustes" && <Ajustes api={api} />}
      </main>
      {previa && api.cargado && api.prefs && (
        <VistaPrevia frase={previa} estilo={{ foto: fondoPara(previa, api.prefs), letra: letraPorId(api.prefs.letra) }} onCerrar={cerrarPrevia} />
      )}
      <CartelInstalar />
      <BarraNav actual={seccion} onCambiar={setSeccion} />
    </div>
  );
}
