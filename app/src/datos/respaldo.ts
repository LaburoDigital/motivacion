import { get, set } from "idb-keyval";
import { WORKER_URL } from "../config";
import { almacen } from "./almacen";

// 64 palabras cortas y fáciles de escribir: 6 palabras dan más de 68.000 millones de códigos.
const PALABRAS = [
  "llama", "norte", "rio", "pan", "sol", "mar", "luna", "roca", "fuego", "lobo", "tigre", "puma", "ruta", "cima", "valle", "bosque",
  "nube", "lluvia", "trueno", "viento", "playa", "isla", "barco", "faro", "puente", "torre", "campo", "trigo", "pino", "cedro", "rosa", "menta",
  "cafe", "mate", "miel", "sal", "limon", "uva", "pera", "coco", "tango", "ritmo", "golpe", "salto", "paso", "meta", "pulso", "chispa",
  "acero", "hierro", "plata", "oro", "cobre", "jade", "perla", "coral", "aguila", "halcon", "oso", "zorro", "toro", "gallo", "buho", "cisne",
];

const FORMATO = /^[a-z]{2,12}(-[a-z]{2,12}){5}$/;

export function generarCodigo(): string {
  const azar = crypto.getRandomValues(new Uint8Array(6));
  return [...azar].map((n) => PALABRAS[n % PALABRAS.length]).join("-");
}

/** El código de este celular: se crea la primera vez y no cambia. */
export async function obtenerCodigo(): Promise<string> {
  const guardado = (await get("codigo")) as string | undefined;
  if (guardado) return guardado;
  const nuevo = generarCodigo();
  await set("codigo", nuevo);
  return nuevo;
}

interface Respaldo {
  version: 1;
  fecha: string;
  estado: Awaited<ReturnType<typeof almacen.leerEstado>>;
  prefs: Awaited<ReturnType<typeof almacen.leerPrefs>>;
  rachas: Awaited<ReturnType<typeof almacen.leerRachas>>;
}

/** Sube likes, ajustes y rachas a la nube con el código. false si no hay internet. */
export async function subirRespaldo(): Promise<boolean> {
  try {
    const [codigo, estado, prefs, rachas] = await Promise.all([obtenerCodigo(), almacen.leerEstado(), almacen.leerPrefs(), almacen.leerRachas()]);
    // Las vistas crecen sin parar y no hacen falta para recuperar: viajan solo likes, malas y claves propias.
    const datos: Respaldo = { version: 1, fecha: new Date().toISOString(), estado: { ...estado, vistas: {} }, prefs, rachas };
    const res = await fetch(`${WORKER_URL}/respaldo/${encodeURIComponent(codigo)}`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(datos),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type ResultadoRecuperar = "ok" | "no-existe" | "invalido" | "error";

/** Trae el respaldo de otro celular (o de antes de reinstalar) y lo deja como propio. */
export async function recuperarRespaldo(texto: string): Promise<ResultadoRecuperar> {
  const codigo = texto.trim().toLowerCase().replace(/\s+/g, "-");
  if (!FORMATO.test(codigo)) return "invalido";
  try {
    const res = await fetch(`${WORKER_URL}/respaldo/${encodeURIComponent(codigo)}`);
    if (res.status === 404) return "no-existe";
    if (!res.ok) return "error";
    const datos = (await res.json()) as Respaldo;
    await almacen.guardarEstado(datos.estado);
    await almacen.guardarPrefs({ ...datos.prefs, bienvenida: true });
    await almacen.guardarRachas(datos.rachas);
    await set("codigo", codigo);
    return "ok";
  } catch {
    return "error";
  }
}

/** Le pide al navegador que no borre los datos de la app aunque falte espacio. */
export async function pedirPersistencia(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Si no se puede, siguen guardándose igual.
  }
}
