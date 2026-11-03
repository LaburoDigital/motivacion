export * from "./tipos";
export * from "./categorias";
export * from "./hash";
export * from "./fraseDelDia";
export * from "./feed";
export * from "./validarFrases";
import frasesBase from "../data/frases-base.json";
import type { Frase } from "./tipos";
export const FRASES_BASE = frasesBase as Frase[];
