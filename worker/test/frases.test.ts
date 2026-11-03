import { FRASES_BASE, fnv1a, type Frase } from "shared";
import { afterEach, describe, expect, test, vi } from "vitest";
import worker from "../src/index";
import { actualizarDiario } from "../src/frases";
import { envFalso } from "./kvFalso";

const zen = Array.from({ length: 50 }, (_, i) => ({ q: `Quote number ${i} about courage`, a: `Autor ${i}`, h: "" }));

function simularFetch({ zenOk = true, traduccionFalla = [] as number[], curadas = [] as Frase[] } = {}) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.startsWith("https://zenquotes.io")) {
      return zenOk ? Response.json(zen) : new Response("caído", { status: 503 });
    }
    if (url.startsWith("https://api.mymemory.translated.net")) {
      const q = new URL(url).searchParams.get("q")!;
      const n = Number(q.match(/\d+/)![0]);
      if (traduccionFalla.includes(n)) return Response.json({ responseStatus: 429, responseData: { translatedText: "" } });
      return Response.json({ responseStatus: 200, responseData: { translatedText: `Frase número ${n} sobre el coraje` } });
    }
    if (url.startsWith("https://curadas.test")) return Response.json(curadas);
    return new Response("no", { status: 404 });
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("actualizarDiario", () => {
  test("guarda 20 frases traducidas como normal", async () => {
    simularFetch();
    const env = envFalso();
    await actualizarDiario(env);
    const guardadas = (await env.KV.get("zen:frases", "json")) as Frase[];
    expect(guardadas).toHaveLength(20);
    for (const f of guardadas) {
      expect(f.nivel).toBe("normal");
      expect(f.fuente).toBe("zenquotes");
      expect(f.id).toMatch(/^z-[0-9a-f]+$/);
    }
    expect(guardadas[0].texto).toBe("Frase número 0 sobre el coraje");
    expect(guardadas[0].autor).toBe("Autor 0");
  });

  test("si ZenQuotes falla no borra las anteriores", async () => {
    const previa: Frase = { id: "z-1", texto: "Vieja", categoria: "superacion", nivel: "normal", fuente: "zenquotes" };
    simularFetch({ zenOk: false });
    const env = envFalso({ "zen:frases": [previa] });
    await actualizarDiario(env);
    expect(await env.KV.get("zen:frases", "json")).toEqual([previa]);
  });

  test("si MyMemory falla para una frase, la saltea", async () => {
    simularFetch({ traduccionFalla: [0] });
    const env = envFalso();
    await actualizarDiario(env);
    const guardadas = (await env.KV.get("zen:frases", "json")) as Frase[];
    expect(guardadas.some((f) => f.texto.includes("número 0 "))).toBe(false);
    expect(guardadas).toHaveLength(20);
  });

  test("una frase de ZenQuotes ya guardada no se duplica", async () => {
    simularFetch();
    const env = envFalso();
    await actualizarDiario(env);
    await actualizarDiario(env);
    const guardadas = (await env.KV.get("zen:frases", "json")) as Frase[];
    expect(new Set(guardadas.map((f) => f.id)).size).toBe(guardadas.length);
    expect(guardadas.some((f) => f.id === `z-${fnv1a(zen[0].q).toString(16)}`)).toBe(true);
  });

  test("baja las curadas de GitHub", async () => {
    const curada: Frase = { id: "c-0001", texto: "Curada", categoria: "gym", nivel: "clave", fuente: "curada" };
    simularFetch({ curadas: [curada] });
    const env = envFalso();
    await actualizarDiario(env);
    expect(await env.KV.get("curadas", "json")).toEqual([curada]);
  });
});

describe("rutas", () => {
  const curada: Frase = { id: "c-0001", texto: "Una curada", categoria: "gym", nivel: "clave", fuente: "curada" };
  const repetida: Frase = { id: "z-9", texto: FRASES_BASE[0].texto, categoria: "gym", nivel: "normal", fuente: "zenquotes" };

  test("/frases devuelve curadas y zenquotes sin duplicados con la base", async () => {
    const env = envFalso({ curadas: [curada], "zen:frases": [repetida] });
    const res = await worker.fetch(new Request("https://w/frases"), env);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const cuerpo = (await res.json()) as { version: string; frases: Frase[] };
    expect(cuerpo.frases.map((f) => f.id)).toEqual(["c-0001"]);
    expect(cuerpo.version).not.toBe("");
  });

  test("/frases?desde=<versión actual> devuelve frases vacías", async () => {
    const env = envFalso({ curadas: [curada] });
    const { version } = (await (await worker.fetch(new Request("https://w/frases"), env)).json()) as { version: string };
    const cuerpo = (await (await worker.fetch(new Request(`https://w/frases?desde=${version}`), env)).json()) as { frases: Frase[] };
    expect(cuerpo.frases).toEqual([]);
  });

  test("/frase-del-dia siempre es clave", async () => {
    const env = envFalso();
    for (const temas of ["", "gym", "calma,estudio", "inventado"]) {
      const res = await worker.fetch(new Request(`https://w/frase-del-dia?temas=${temas}&zona=America/Argentina/Buenos_Aires`), env);
      expect(((await res.json()) as Frase).nivel).toBe("clave");
    }
  });

  test("ruta desconocida da 404", async () => {
    expect((await worker.fetch(new Request("https://w/nada"), envFalso())).status).toBe(404);
  });
});

describe("revisión final", () => {
  const muchas: Frase[] = Array.from({ length: 3000 }, (_, i) => ({
    id: `z-${i.toString(16)}`, texto: `Zen ${i}`, categoria: "calma", nivel: "normal", fuente: "zenquotes",
  }));

  function espiarLecturas(env: ReturnType<typeof envFalso>) {
    const leidas: string[] = [];
    const get = env.KV.get.bind(env.KV);
    env.KV.get = (async (k: string, t?: "json") => { leidas.push(k); return get(k, t); }) as typeof env.KV.get;
    return leidas;
  }

  test("el cron deja guardadas las remotas ya listas y su versión", async () => {
    simularFetch();
    const env = envFalso();
    await actualizarDiario(env);
    const remotas = JSON.parse(env.KV.datos.get("remotas")!);
    expect(remotas.frases).toHaveLength(20);
    expect(env.KV.datos.get("remotas:version")).toBe(JSON.stringify(remotas.version));
  });

  test("las rutas no leen ni procesan zen:frases (CPU del plan gratis)", async () => {
    simularFetch();
    const env = envFalso({ "zen:frases": muchas });
    await actualizarDiario(env);
    const leidas = espiarLecturas(env);
    await worker.fetch(new Request("https://w/frases"), env);
    await worker.fetch(new Request("https://w/frases?desde=x"), env);
    await worker.fetch(new Request("https://w/frase-del-dia?temas=gym"), env);
    await worker.fetch(new Request("https://w/wallpaper?temas=gym"), env);
    expect(leidas).not.toContain("zen:frases");
  });

  test("/frases sin versión todavía responde vacío sin romper", async () => {
    const cuerpo = (await (await worker.fetch(new Request("https://w/frases"), envFalso())).json()) as { frases: Frase[] };
    expect(cuerpo.frases).toEqual([]);
  });

  test("las curadas se bajan primero aunque fallen todas las traducciones", async () => {
    const curada: Frase = { id: "c-0001", texto: "Curada", categoria: "gym", nivel: "clave", fuente: "curada" };
    simularFetch({ traduccionFalla: zen.map((_, i) => i), curadas: [curada] });
    const env = envFalso();
    await actualizarDiario(env);
    expect(await env.KV.get("curadas", "json")).toEqual([curada]);
  });

  test("corta las traducciones después de 3 fallas seguidas (límite de 50 subpedidos)", async () => {
    simularFetch({ traduccionFalla: zen.map((_, i) => i) });
    const env = envFalso();
    await actualizarDiario(env);
    const llamadas = (fetch as unknown as { mock: { calls: [string][] } }).mock.calls.filter(([u]) => u.includes("mymemory"));
    expect(llamadas.length).toBe(3);
  });

  test("una curada clave entra en la frase del día del servidor", async () => {
    const curadas: Frase[] = Array.from({ length: 400 }, (_, i) => ({
      id: `c-${String(i).padStart(4, "0")}`, texto: `Curada ${i}`, categoria: "gym", nivel: "clave", fuente: "curada",
    }));
    simularFetch({ curadas });
    const env = envFalso();
    await actualizarDiario(env);
    const f = (await (await worker.fetch(new Request("https://w/frase-del-dia?temas=gym"), env)).json()) as Frase;
    expect(f.fuente).toBe("curada");
  });
});
