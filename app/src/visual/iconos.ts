export const ICONOS_APP: { id: string; nombre: string }[] = [
  { id: "llama", nombre: "Llama" },
  { id: "noche", nombre: "Noche" },
  { id: "cima", nombre: "Cima" },
  { id: "pesa", nombre: "Pesa" },
];

export const urlIcono = (id: string, tam = 180) => `/iconos/${id}-${tam}.png`;

/**
 * iOS toma el ícono del <link rel="apple-touch-icon"> en el momento de "Agregar a inicio",
 * así que cambiarlo acá solo se ve después de borrar la app y volver a agregarla.
 */
export function aplicarIcono(id: string) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (link) link.setAttribute("href", urlIcono(id));
}
