import { IconFlame } from "@tabler/icons-react";
import type { Frase } from "shared";

interface Props {
  nombre: string;
  hito: number;
  frase: Frase | null;
  onSeguir: () => void;
}

/** Se muestra al llegar a 7, 30, 90, 180 o 365 días de una racha. */
export function Celebracion({ nombre, hito, frase, onSeguir }: Props) {
  return (
    <div className="celebracion" role="dialog" aria-label="Llegaste a un hito">
      <div className="celebracion-llama"><IconFlame size={64} stroke={1.4} /></div>
      <p className="celebracion-numero">{hito} días</p>
      <p className="celebracion-nombre">de {nombre}. No es suerte, es lo que elegiste cada día.</p>
      {frase && (
        <blockquote className="celebracion-frase">
          <p>{frase.texto}</p>
          {frase.autor && <footer>{frase.autor}</footer>}
        </blockquote>
      )}
      <button className="boton" onClick={onSeguir}>Seguir así</button>
    </div>
  );
}
