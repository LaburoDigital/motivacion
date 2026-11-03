import { PESOS, type CategoriaId, type Frase, type Nivel } from "./tipos";

export interface EstadoFeed {
  /** id -> timestamp (ms) de la última vez vista */
  vistas: Record<string, number>;
  /** id -> timestamp (ms) del like */
  likes: Record<string, number>;
  /** ids marcadas como "mala traducción" */
  malas: string[];
  /** ids que el usuario subió a clave */
  clavesPropias: string[];
}

const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

export function nivelEfectivo(f: Frase, estado: EstadoFeed): Nivel {
  return estado.clavesPropias.includes(f.id) ? "clave" : f.nivel;
}

function sorteoPonderado(pool: Frase[], estado: EstadoFeed, rng: () => number): Frase {
  const total = pool.reduce((s, f) => s + PESOS[nivelEfectivo(f, estado)], 0);
  let r = rng() * total;
  for (const f of pool) {
    r -= PESOS[nivelEfectivo(f, estado)];
    if (r < 0) return f;
  }
  return pool[pool.length - 1];
}

/**
 * Arma las próximas `cantidad` frases: en cada bloque de 10, las posiciones
 * 4 y 9 son de likes (vistos hace más de 7 días); el resto, nuevas por sorteo
 * ponderado por nivel; si no quedan nuevas, las vistas hace más tiempo.
 */
export function armarFeed(
  frases: Frase[], estado: EstadoFeed, temas: CategoriaId[],
  cantidad: number, ahora: number, rng: () => number,
): Frase[] {
  const malas = new Set(estado.malas);
  const usadas = new Set<string>();
  const validas = frases.filter((f) => !malas.has(f.id));
  const deTemas = temas.length ? validas.filter((f) => temas.includes(f.categoria)) : validas;
  const resultado: Frase[] = [];

  const likeElegible = () =>
    validas.filter((f) => f.id in estado.likes && !usadas.has(f.id) && (estado.vistas[f.id] ?? 0) < ahora - SIETE_DIAS);
  const nuevas = () => deTemas.filter((f) => !(f.id in estado.vistas) && !usadas.has(f.id));
  const masViejaVista = () =>
    deTemas
      .filter((f) => f.id in estado.vistas && !usadas.has(f.id))
      .sort((a, b) => estado.vistas[a.id] - estado.vistas[b.id])[0];

  for (let i = 0; resultado.length < cantidad; i++) {
    let elegida: Frase | undefined;
    if (i % 10 === 4 || i % 10 === 9) {
      const likes = likeElegible();
      if (likes.length) elegida = likes[Math.floor(rng() * likes.length)];
    }
    if (!elegida) {
      const pool = nuevas();
      elegida = pool.length ? sorteoPonderado(pool, estado, rng) : masViejaVista();
    }
    if (!elegida) break;
    usadas.add(elegida.id);
    resultado.push(elegida);
  }
  return resultado;
}
