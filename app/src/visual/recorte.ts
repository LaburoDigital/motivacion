interface Medidas {
  instalada: boolean;
  altoPantalla: number;
  anchoPantalla: number;
  altoVentana: number;
}

/**
 * iOS 18, con la app instalada y la foto detrás del reloj, le da a la app una ventana
 * más corta que la pantalla (le falta el alto de la barra de estado) y deja abajo una
 * franja donde no se puede dibujar. Esa franja ya cubre la rayita de inicio, así que
 * la barra de abajo no necesita dejar el espacio de seguridad: la clase la baja.
 */
export function marcarRecorteIOS({ instalada, altoPantalla, anchoPantalla, altoVentana }: Medidas) {
  const alto = Math.max(altoPantalla, anchoPantalla);
  const recortada = instalada && altoVentana < alto - 20 && altoPantalla > anchoPantalla;
  document.documentElement.classList.toggle("ios-recortado", recortada);
}

export function marcarRecorteAhora() {
  const instalada =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true;
  marcarRecorteIOS({ instalada, altoPantalla: screen.height, anchoPantalla: screen.width, altoVentana: window.innerHeight });
}
