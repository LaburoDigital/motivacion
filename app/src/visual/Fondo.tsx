import { useState, type ReactNode } from "react";
import type { Foto } from "shared";
import { urlFoto } from "./fondos";
import type { Letra } from "./letras";

export interface Apariencia {
  foto: Foto;
  letra: Letra;
}

/** Foto a pantalla completa con un velo para que el texto se lea; si no carga, queda un degradado oscuro. */
export function Fondo({ foto, children }: { foto: Foto; children: ReactNode }) {
  const [fallo, setFallo] = useState(false);
  return (
    <div className="fondo">
      {!fallo && (
        <img
          className="fondo-foto"
          src={urlFoto(foto, 1080, 1920)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFallo(true)}
        />
      )}
      <div className="fondo-velo" />
      <div className="fondo-contenido">{children}</div>
    </div>
  );
}
