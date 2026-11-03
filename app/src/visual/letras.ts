export interface Letra {
  id: string;
  nombre: string;
  familia: string;
  peso: number;
  /** Multiplica el tamaño base: las condensadas necesitan más, las anchas menos. */
  escala: number;
  mayusculas?: boolean;
}

export const LETRAS: Letra[] = [
  { id: "playfair", nombre: "Clásica", familia: "'Playfair Display', Georgia, serif", peso: 500, escala: 1 },
  { id: "fraunces", nombre: "Libro", familia: "'Fraunces', Georgia, serif", peso: 500, escala: 1 },
  { id: "cormorant", nombre: "Elegante", familia: "'Cormorant Garamond', Georgia, serif", peso: 600, escala: 1.15 },
  { id: "dmserif", nombre: "Titular", familia: "'DM Serif Display', Georgia, serif", peso: 400, escala: 1.02 },
  { id: "bebas", nombre: "Impacto", familia: "'Bebas Neue', Impact, sans-serif", peso: 400, escala: 1.35, mayusculas: true },
  { id: "anton", nombre: "Gym", familia: "'Anton', Impact, sans-serif", peso: 400, escala: 1.1, mayusculas: true },
  { id: "oswald", nombre: "Calle", familia: "'Oswald', 'Arial Narrow', sans-serif", peso: 500, escala: 1.05 },
  { id: "outfit", nombre: "Moderna", familia: "'Outfit', system-ui, sans-serif", peso: 500, escala: 0.95 },
  { id: "space", nombre: "Técnica", familia: "'Space Grotesk', system-ui, sans-serif", peso: 500, escala: 0.92 },
];

export const letraPorId = (id: string) => LETRAS.find((l) => l.id === id) ?? LETRAS[0];
