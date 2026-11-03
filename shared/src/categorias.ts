import type { CategoriaId } from "./tipos";

export const CATEGORIAS: { id: CategoriaId; etiqueta: string }[] = [
  { id: "disciplina", etiqueta: "Disciplina" },
  { id: "estudio", etiqueta: "Estudio" },
  { id: "gym", etiqueta: "Gym" },
  { id: "estoicismo", etiqueta: "Estoicismo" },
  { id: "amor-propio", etiqueta: "Amor propio" },
  { id: "exito", etiqueta: "Éxito" },
  { id: "calma", etiqueta: "Calma" },
  { id: "superacion", etiqueta: "Superación" },
];

export const IDS_CATEGORIAS: CategoriaId[] = CATEGORIAS.map((c) => c.id);
