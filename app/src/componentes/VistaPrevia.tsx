import { useEffect, useState } from "react";
import type { Frase } from "shared";
import { compartirFrase, generarImagenFrase } from "../compartir/imagenFrase";
import type { EstiloVisual } from "../visual/estilos";

interface Props {
  frase: Frase;
  estilo: EstiloVisual;
  onCerrar: () => void;
  generar?: (f: Frase, e: EstiloVisual) => Promise<Blob>;
  compartir?: (f: Frase, e: EstiloVisual) => Promise<void>;
}

/** Lo que se ve al tocar una notificación: la frase como imagen, lista para guardar o compartir. */
export function VistaPrevia({ frase, estilo, onCerrar, generar = generarImagenFrase, compartir = compartirFrase }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let vivo = true;
    void generar(frase, estilo).then((blob) => {
      if (!vivo) return;
      url = URL.createObjectURL(blob);
      setSrc(url);
    });
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [frase, estilo, generar]);

  return (
    <div className="vista-previa-fondo" role="dialog" aria-label="Vista previa de la frase">
      {src ? <img className="vista-previa-imagen" src={src} alt={frase.texto} /> : <div className="vista-previa-imagen cargando">Armando la imagen…</div>}
      <div className="vista-previa-botones">
        <button className="boton" onClick={() => void compartir(frase, estilo)}>📥 Guardar o compartir</button>
        <button className="boton secundario" onClick={onCerrar}>Ver más frases</button>
      </div>
    </div>
  );
}
