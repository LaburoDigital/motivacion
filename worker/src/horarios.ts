const VENTANA = 15;

export const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const aHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/**
 * Horarios del día, en múltiplos de 15 minutos. Con `cadaHoras`, uno cada N horas
 * desde `desde` sin pasarse de `hasta`; si no, `cantidad` repartidos parejo (inclusive).
 */
export function horariosDelDia(cantidad: number, desde: string, hasta: string, cadaHoras?: number): string[] {
  const ini = aMinutos(desde);
  const fin = aMinutos(hasta);
  if (cadaHoras) {
    const lista: string[] = [];
    for (let m = ini; m <= fin; m += cadaHoras * 60) lista.push(aHora(Math.round(m / VENTANA) * VENTANA));
    return lista;
  }
  if (cantidad <= 1) return [aHora(Math.round(ini / VENTANA) * VENTANA)];
  const paso = (fin - ini) / (cantidad - 1);
  return Array.from({ length: cantidad }, (_, i) => aHora(Math.round((ini + paso * i) / VENTANA) * VENTANA));
}

function minutosLocales(ahora: Date, zona: string): number {
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: zona, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(ahora);
  const valor = (t: string) => Number(partes.find((p) => p.type === t)!.value);
  return valor("hour") * 60 + valor("minute");
}

/** Índice del horario que cae en la ventana (ahora − 15 min, ahora] en la zona del usuario. */
export function tocaAhora(horarios: string[], ahora: Date, zona: string): number | null {
  const ya = minutosLocales(ahora, zona);
  const i = horarios.findIndex((h) => {
    const m = aMinutos(h);
    return m > ya - VENTANA && m <= ya;
  });
  return i === -1 ? null : i;
}

/** Minutos que pasaron desde `hhmm` hasta ahora, en la zona del usuario. */
export function minutosDesde(hhmm: string, ahora: Date, zona: string): number {
  return minutosLocales(ahora, zona) - aMinutos(hhmm);
}
