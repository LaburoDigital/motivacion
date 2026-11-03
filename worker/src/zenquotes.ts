import type { CategoriaId } from "shared";

export interface CitaZen {
  q: string;
  a: string;
}

/** Trae citas de ZenQuotes; [] si falla. Descarta el aviso que devuelve cuando hay límite. */
export async function traerZenQuotes(): Promise<CitaZen[]> {
  try {
    const res = await fetch("https://zenquotes.io/api/quotes");
    if (!res.ok) return [];
    const citas = (await res.json()) as CitaZen[];
    return citas.filter((c) => c.q && c.a && c.a !== "zenquotes.io");
  } catch {
    return [];
  }
}

const PALABRAS: [CategoriaId, RegExp][] = [
  ["disciplina", /\b(disciplin|habit|routine|consisten|discipline|focus|commit)/i],
  ["estudio", /\b(learn|knowledge|study|read|educat|wisdom|mind)/i],
  ["gym", /\b(body|strength|strong|train|health|physical|pain)/i],
  ["estoicismo", /\b(control|virtue|death|fate|accept|reason)/i],
  ["amor-propio", /\b(yourself|self|love|worth|kind)/i],
  ["exito", /\b(success|win|goal|achiev|dream|work)/i],
  ["calma", /\b(peace|calm|patien|quiet|present|breath|happi)/i],
];

/** Categoría por palabras clave del texto en inglés; si no matchea, superación. */
export function categoriaPorTexto(texto: string): CategoriaId {
  return PALABRAS.find(([, re]) => re.test(texto))?.[0] ?? "superacion";
}
