import { useState } from "react";
import { BarraNav, type Seccion } from "./componentes/BarraNav";
import { CartelInstalar } from "./componentes/CartelInstalar";
import { useFrases } from "./datos/useFrases";
import { Favoritos } from "./pantallas/Favoritos";
import { Inicio } from "./pantallas/Inicio";
import { Temas } from "./pantallas/Temas";
import "./estilos.css";

export default function App() {
  const api = useFrases();
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const [fraseInicial] = useState(() => new URLSearchParams(location.search).get("frase"));

  return (
    <div className="app">
      <main className="contenido">
        {seccion === "inicio" && <Inicio api={api} fraseInicial={fraseInicial} />}
        {seccion === "temas" && <Temas api={api} />}
        {seccion === "favoritos" && <Favoritos api={api} />}
        {seccion === "ajustes" && <div className="pantalla"><h1>Ajustes</h1></div>}
      </main>
      <CartelInstalar />
      <BarraNav actual={seccion} onCambiar={setSeccion} />
    </div>
  );
}
