export type TipoRacha = "hacer" | "dejar";

export interface Racha {
  id: string;
  nombre: string;
  /** "hacer": se marca cada día cumplido. "dejar": los días cuentan solos hasta una recaída. */
  tipo: TipoRacha;
  /** Para "dejar": desde cuándo cuenta (se reinicia al recaer). */
  inicio: string;
  /** Para "hacer": días marcados como cumplidos ("YYYY-MM-DD"). */
  marcas: string[];
  record: number;
  hitosVistos: number[];
  /** Opción armada (ej. "fumar"); null si la escribió el usuario. */
  clase?: string | null;
}

export const HITOS = [7, 30, 90, 180, 365];

const aDia = (fecha: string) => Math.round(Date.UTC(+fecha.slice(0, 4), +fecha.slice(5, 7) - 1, +fecha.slice(8, 10)) / 86_400_000);
const deDia = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);

/** Días calendario de `desde` a `hasta` (fechas "YYYY-MM-DD"). */
export const diasEntre = (desde: string, hasta: string) => aDia(hasta) - aDia(desde);

export function crearRacha(
  nombre: string, tipo: TipoRacha, hoy: string, id: string = crypto.randomUUID(),
  { diasPrevios = 0, clase = null }: { diasPrevios?: number; clase?: string | null } = {},
): Racha {
  const n = Math.max(0, Math.floor(diasPrevios));
  // "Dejar": empezó hace n días. "Hacer": n días cumplidos hasta ayer; hoy queda por marcar.
  const inicio = tipo === "dejar" ? deDia(aDia(hoy) - n) : hoy;
  const marcas = tipo === "hacer" ? Array.from({ length: n }, (_, i) => deDia(aDia(hoy) - n + i)) : [];
  return { id, nombre: nombre.trim(), tipo, inicio, marcas, record: n, hitosVistos: HITOS.filter((h) => h <= n), clase };
}

export const cumplioHoy = (r: Racha, hoy: string) => r.marcas.includes(hoy);

export function diasRacha(r: Racha, hoy: string): number {
  if (r.tipo === "dejar") return Math.max(0, diasEntre(r.inicio, hoy));
  const marcas = new Set(r.marcas);
  // Si hoy todavía no marcó, la racha sigue viva contando hasta ayer.
  let dia = aDia(hoy);
  if (!marcas.has(deDia(dia))) dia -= 1;
  let n = 0;
  while (marcas.has(deDia(dia))) {
    n++;
    dia--;
  }
  return n;
}

export function marcarHoy(r: Racha, hoy: string): Racha {
  if (r.marcas.includes(hoy)) return r;
  const nueva = { ...r, marcas: [...r.marcas, hoy].sort().slice(-400) };
  return { ...nueva, record: Math.max(r.record, diasRacha(nueva, hoy)) };
}

export function recaer(r: Racha, hoy: string): Racha {
  return { ...r, record: Math.max(r.record, diasRacha(r, hoy)), inicio: hoy, hitosVistos: [] };
}

/** El hito más alto alcanzado que todavía no se festejó, o null. */
export function hitoNuevo(r: Racha, hoy: string): number | null {
  const dias = diasRacha(r, hoy);
  const pendientes = HITOS.filter((h) => h <= dias && !r.hitosVistos.includes(h));
  return pendientes.length ? pendientes[pendientes.length - 1] : null;
}

export const festejarHasta = (r: Racha, hito: number): Racha => ({
  ...r,
  hitosVistos: [...new Set([...r.hitosVistos, ...HITOS.filter((h) => h <= hito)])],
});

/**
 * Lo que se le manda al Worker para la notificación de la noche: solo números, nunca el nombre.
 * `crece`: si los días siguen sumando solos (racha de "dejar").
 */
export function resumenParaAviso(
  rachas: Racha[], hoy: string, mostrarNombre = false,
): { dias: number; fecha: string; crece: boolean; clase: string | null; nombre?: string } | null {
  if (!rachas.length) return null;
  const mayor = rachas.reduce((a, b) => (diasRacha(b, hoy) > diasRacha(a, hoy) ? b : a));
  const resumen = { dias: diasRacha(mayor, hoy), fecha: hoy, crece: mayor.tipo === "dejar", clase: mayor.clase ?? null };
  return mostrarNombre ? { ...resumen, nombre: mayor.nombre } : resumen;
}
