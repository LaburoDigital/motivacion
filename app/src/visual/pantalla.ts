interface Medidas {
  instalada: boolean;
  altoPantalla: number;
  anchoPantalla: number;
  altoVentana: number;
}

/**
 * En el iPhone, una app agregada a inicio recibe una ventana más corta que la pantalla
 * (le falta la zona de la rayita de abajo) y queda una franja negra. Si está instalada,
 * fijamos el alto al de la pantalla completa.
 */
export function ajustarAlto({ instalada, altoPantalla, anchoPantalla, altoVentana }: Medidas) {
  if (!instalada) return;
  const acostado = anchoPantalla > altoPantalla;
  const alto = Math.max(acostado ? Math.min(altoPantalla, anchoPantalla) : altoPantalla, altoVentana);
  document.documentElement.style.setProperty("--alto-app", `${alto}px`);
}

export function ajustarAltoAhora() {
  const instalada =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true;
  ajustarAlto({ instalada, altoPantalla: screen.height, anchoPantalla: screen.width, altoVentana: window.innerHeight });
}
