import { IconDownload } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { Frase } from "shared";
import { compartirFrase, generarImagenFrase } from "../compartir/imagenFrase";
import type { Apariencia } from "../visual/Fondo";

interface Props {
  frase: Frase;
  estilo: Apariencia;
  onCerrar: () => void;
  generar?: (f: Frase, a: Apariencia) => Promise<Blob>;
  compartir?: (f: Frase, a: Apariencia) => Promise<void>;
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
        <button className="boton" onClick={() => void compartir(frase, estilo)}>
          <IconDownload size={20} stroke={1.8} /> Guardar o compartir
        </button>
        <button className="boton secundario" onClick={onCerrar}>Ver más frases</button>
      </div>
    </div>
  );
}
