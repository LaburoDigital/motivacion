import { useState, type ReactNode } from "react";
import { ESTILO_RESPALDO, urlFoto, type EstiloVisual } from "./estilos";

export function Fondo({ estilo, children }: { estilo: EstiloVisual; children: ReactNode }) {
  const [fallo, setFallo] = useState(false);
  const usar = estilo.tipo === "foto" && fallo ? ESTILO_RESPALDO : estilo;
  return (
    <div className="fondo" style={{ background: usar.fondoCss ?? "#0b0b0f", color: usar.colorTexto, fontFamily: usar.fuente }}>
      {usar.tipo === "foto" && (
        <>
          <img className="fondo-foto" src={urlFoto(usar, 1080, 1920)} alt="" onError={() => setFallo(true)} />
          <div className="fondo-capa" />
        </>
      )}
      <div className="fondo-contenido">{children}</div>
    </div>
  );
}
