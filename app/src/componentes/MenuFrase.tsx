import { IconFlame, IconLanguageOff } from "@tabler/icons-react";
import type { Frase } from "shared";

interface Props {
  frase: Frase;
  onClave: () => void;
  onMala: () => void;
  onCerrar: () => void;
}

export function MenuFrase({ frase, onClave, onMala, onCerrar }: Props) {
  return (
    <div className="menu-fondo" onClick={onCerrar}>
      <div className="menu" role="menu" onClick={(e) => e.stopPropagation()}>
        <button role="menuitem" onClick={() => { onClave(); onCerrar(); }}>
          <IconFlame size={20} stroke={1.6} /> Marcar como Clave
        </button>
        {frase.fuente === "zenquotes" && (
          <button role="menuitem" onClick={() => { onMala(); onCerrar(); }}>
            <IconLanguageOff size={20} stroke={1.6} /> Mala traducción
          </button>
        )}
        <button className="menu-cancelar" onClick={onCerrar}>Cancelar</button>
      </div>
    </div>
  );
}
