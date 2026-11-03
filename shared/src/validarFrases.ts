import { IDS_CATEGORIAS } from "./categorias";
import { normalizarTexto, type Frase, type Fuente } from "./tipos";

const NIVELES = ["clave", "buena", "normal"];
const PRIORIDAD: Record<Fuente, number> = { base: 0, curada: 1, zenquotes: 2 };

/** Lista de errores de la colección; vacía si está todo bien. */
export function validarColeccion(frases: Frase[]): string[] {
  const errores: string[] = [];
  for (const f of frases) {
    if (!f.texto?.trim()) errores.push(`${f.id}: texto vacío`);
    if (!IDS_CATEGORIAS.includes(f.categoria)) errores.push(`${f.id}: categoría inválida "${f.categoria}"`);
    if (!NIVELES.includes(f.nivel)) errores.push(`${f.id}: nivel inválido "${f.nivel}"`);
  }
  return errores;
}

/** Una frase por texto normalizado e id; gana base > curada > zenquotes. */
export function deduplicar(frases: Frase[]): Frase[] {
  const ordenadas = [...frases].sort((a, b) => PRIORIDAD[a.fuente] - PRIORIDAD[b.fuente]);
  const textos = new Set<string>();
  const ids = new Set<string>();
  const resultado: Frase[] = [];
  for (const f of ordenadas) {
    const k = normalizarTexto(f.texto);
    if (textos.has(k) || ids.has(f.id)) continue;
    textos.add(k);
    ids.add(f.id);
    resultado.push(f);
  }
  return resultado;
}
