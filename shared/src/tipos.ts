export type Nivel = "clave" | "buena" | "normal";
export type Fuente = "base" | "curada" | "zenquotes";
export type CategoriaId =
  | "disciplina" | "estudio" | "gym" | "estoicismo"
  | "amor-propio" | "exito" | "calma" | "superacion";

export interface Frase {
  id: string;
  texto: string;
  autor?: string;
  categoria: CategoriaId;
  nivel: Nivel;
  fuente: Fuente;
}

export const PESOS: Record<Nivel, number> = { clave: 3, buena: 2, normal: 1 };

/** Minúsculas, sin tildes, sin puntuación y con los espacios colapsados. */
export function normalizarTexto(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
