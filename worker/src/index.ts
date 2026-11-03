import type { Env } from "./env";
import { actualizarDiario, fraseDelDiaPara, frasesRemotas, parsearTemas, zonaValida } from "./frases";
import { ESTILOS_WALLPAPER, urlWallpaper, type EstiloWallpaper } from "./wallpaper";

export type { Env };

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export const json = (cuerpo: unknown, status = 200) => Response.json(cuerpo, { status, headers: CORS });

async function rutear(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  if (req.method === "GET" && url.pathname === "/frases") {
    const remotas = await frasesRemotas(env);
    const desde = url.searchParams.get("desde");
    return json(desde === remotas.version ? { version: remotas.version, frases: [] } : remotas);
  }

  if (req.method === "GET" && url.pathname === "/frase-del-dia") {
    const frase = await fraseDelDiaPara(env, parsearTemas(url.searchParams.get("temas")), zonaValida(url.searchParams.get("zona")));
    return frase ? json(frase) : json({ error: "sin frases clave" }, 404);
  }

  if (req.method === "GET" && url.pathname === "/wallpaper") {
    const pedido = url.searchParams.get("estilo") as EstiloWallpaper;
    const estilo = ESTILOS_WALLPAPER.includes(pedido) ? pedido : "negro";
    const destino = await urlWallpaper(env, parsearTemas(url.searchParams.get("temas")), zonaValida(url.searchParams.get("zona")), estilo);
    if (!destino) return json({ error: "sin frases clave" }, 404);
    return new Response(null, { status: 302, headers: { ...CORS, location: destino, "cache-control": "max-age=1800" } });
  }

  return json({ error: "no encontrado" }, 404);
}

export default {
  fetch: rutear,

  async scheduled(evento: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if (evento.cron === "0 9 * * *") ctx.waitUntil(actualizarDiario(env));
  },
};
