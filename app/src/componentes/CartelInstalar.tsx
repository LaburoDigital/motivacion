import { IconX } from "@tabler/icons-react";
import { useState } from "react";

export function estaInstalada(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

const esIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

export function CartelInstalar() {
  const [cerrado, setCerrado] = useState(false);
  if (cerrado || estaInstalada() || !esIOS()) return null;
  return (
    <div className="cartel-instalar" role="note">
      <p>
        Instalá la app: tocá <strong>Compartir</strong> y después
        <strong> “Agregar a inicio”</strong>.
      </p>
      <button aria-label="Cerrar" onClick={() => setCerrado(true)}><IconX size={18} /></button>
    </div>
  );
}
