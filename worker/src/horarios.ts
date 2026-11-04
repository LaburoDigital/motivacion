const VENTANA = 15;

export const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const DIA = 24 * 60;
const aHora = (min: number) => {
  const m = ((min % DIA) + DIA) % DIA;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/**
 * Horarios del día, en múltiplos de 15 minutos. Con `cadaHoras`, uno cada N horas
 * desde `desde` sin pasarse de `hasta`; si no, `cantidad` repartidos parejo (inclusive).
 */
export function horariosDelDia(cantidad: number, desde: string, hasta: string, cadaHoras?: number): string[] {
  const ini = aMinutos(desde);
  let fin = aMinutos(hasta);
  // Si "hasta" es antes que "desde", el horario cruza la medianoche (ej. 22:00 a 02:00).
  if (fin <= ini) fin += DIA;
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

/** Minutos que pasaron desde `hhmm` hasta ahora (dando la vuelta por la medianoche), en la zona del usuario. */
export function minutosDesde(hhmm: string, ahora: Date, zona: string): number {
  return (((minutosLocales(ahora, zona) - aMinutos(hhmm)) % DIA) + DIA) % DIA;
}

/** Índice del horario que cae en la ventana (ahora − 15 min, ahora] en la zona del usuario. */
export function tocaAhora(horarios: string[], ahora: Date, zona: string): number | null {
  const i = horarios.findIndex((h) => minutosDesde(h, ahora, zona) < VENTANA);
  return i === -1 ? null : i;
}

const DIAS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Día de la semana en la zona del usuario: 0 = domingo … 6 = sábado. */
export function diaSemana(ahora: Date, zona: string): number {
  return DIAS_EN.indexOf(new Intl.DateTimeFormat("en-US", { timeZone: zona, weekday: "short" }).format(ahora));
}
