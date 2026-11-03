const ANCHO_LETRA = 0.52; // ancho promedio de un carácter de Playfair Bold, en "em"
const INTERLINEA = 1.3;

/** Cuántas líneas ocupa el texto, partiendo por palabras. */
export function estimarLineas(texto: string, fontSize: number, maxWidth: number): number {
  const porLinea = Math.max(1, Math.floor(maxWidth / (fontSize * ANCHO_LETRA)));
  let lineas = 1;
  let largo = 0;
  for (const palabra of texto.split(/\s+/)) {
    const extra = largo ? palabra.length + 1 : palabra.length;
    if (largo + extra > porLinea && largo) {
      lineas++;
      largo = palabra.length;
    } else largo += extra;
  }
  return lineas;
}

/** Alto de la línea "— autor": margen (0,6 em) + línea de medio tamaño (0,65 em). */
const ALTO_AUTOR = 0.6 + 0.65;

/**
 * Tamaño y posición de la frase: el tercio de arriba queda libre para el reloj,
 * el bloque (frase + autor) se centra un poco por debajo de la mitad y nunca pasa
 * el 92% del alto. Si ni con letra chica entra, se achica más antes que salirse.
 */
export function calcularLayout(texto: string, w: number, h: number, conAutor = false) {
  const maxWidth = Math.round(w * 0.82);
  const piso = h / 3 + h * 0.02;
  let fontSize = w * 0.085;
  let top = piso;
  for (; fontSize > 10; fontSize -= 1) {
    const alto = estimarLineas(texto, fontSize, maxWidth) * fontSize * INTERLINEA + (conAutor ? fontSize * ALTO_AUTOR : 0);
    top = Math.max(piso, h * 0.58 - alto / 2);
    if (top + alto <= h * 0.92) break;
  }
  return { top: Math.round(top), fontSize: Math.floor(fontSize * 100) / 100, maxWidth };
}
