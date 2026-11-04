import { FRASES_BASE, fechaLocal, fnv1a, fraseDelDia } from "shared";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import worker from "../src/index";
import { enviarNotificaciones } from "../src/push";
import { envFalso } from "./kvFalso";

const AR = "America/Argentina/Buenos_Aires";
const b64url = (b: ArrayBuffer) => Buffer.from(b).toString("base64url");

let vapid: { publico: string; privado: string };
let subscription: { endpoint: string; expirationTime: null; keys: { p256dh: string; auth: string } };

beforeAll(async () => {
  const v = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const jwk = await crypto.subtle.exportKey("jwk", v.privateKey);
  vapid = { publico: b64url(await crypto.subtle.exportKey("raw", v.publicKey)), privado: jwk.d! };
  const c = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  subscription = {
    endpoint: "https://push.test/abc",
    expirationTime: null,
    keys: { p256dh: b64url(await crypto.subtle.exportKey("raw", c.publicKey)), auth: b64url(crypto.getRandomValues(new Uint8Array(16)).buffer) },
  };
});

afterEach(() => vi.unstubAllGlobals());

const env = envBase;
function envBase(inicial: Record<string, unknown> = {}) {
  const e = envFalso(inicial);
  e.VAPID_PUBLIC = vapid.publico;
  e.VAPID_PRIVATE = vapid.privado;
  return e;
}

const config = (cambios: Record<string, unknown> = {}) => ({
  subscription, cantidad: 3, desde: "08:00", hasta: "22:00", temas: ["gym"], zona: AR, ...cambios,
});

const post = (e: ReturnType<typeof env>, cuerpo: unknown) =>
  worker.fetch(new Request("https://w/suscripcion", { method: "POST", body: JSON.stringify(cuerpo) }), e);

describe("/suscripcion", () => {
  test("guarda la suscripción por hash del endpoint", async () => {
    const e = env();
    expect((await post(e, config())).status).toBe(201);
    const k = `sub:${fnv1a(subscription.endpoint).toString(16)}`;
    expect(e.KV.datos.has(k)).toBe(true);
    expect(await e.KV.get("subs", "json")).toEqual([{ clave: k, cantidad: 3, desde: "08:00", hasta: "22:00", zona: AR }]);
    await post(e, config({ cantidad: 2 }));
    expect(await e.KV.get("subs", "json")).toEqual([{ clave: k, cantidad: 2, desde: "08:00", hasta: "22:00", zona: AR }]);
  });

  test("acepta horarios que cruzan la medianoche y rechaza desde igual a hasta", async () => {
    expect((await post(env(), config({ desde: "22:00", hasta: "02:00" }))).status).toBe(201);
    expect((await post(env(), config({ desde: "10:00", hasta: "10:00" }))).status).toBe(400);
  });

  test("acepta de 1 a 24 por día", async () => {
    expect((await post(env(), config({ cantidad: 24 }))).status).toBe(201);
    expect((await post(env(), config({ cantidad: 0 }))).status).toBe(400);
    expect((await post(env(), config({ cantidad: 25 }))).status).toBe(400);
  });

  test("valida los días de la semana", async () => {
    expect((await post(env(), config({ dias: [1, 2, 3] }))).status).toBe(201);
    expect((await post(env(), config({ dias: [7] }))).status).toBe(400);
    expect((await post(env(), config({ dias: [] }))).status).toBe(400);
  });

  test("rechaza una suscripción sin claves", async () => {
    expect((await post(env(), config({ subscription: { endpoint: "https://x" } }))).status).toBe(400);
  });

  test("DELETE borra la suscripción", async () => {
    const e = env();
    await post(e, config());
    const res = await worker.fetch(
      new Request("https://w/suscripcion", { method: "DELETE", body: JSON.stringify({ endpoint: subscription.endpoint }) }), e,
    );
    expect(res.status).toBe(204);
    expect([...e.KV.datos.keys()].some((k) => k.startsWith("sub:"))).toBe(false);
    expect(await e.KV.get("subs", "json")).toEqual([]);
  });
});

describe("enviarNotificaciones", () => {
  const clave = `sub:${fnv1a("https://push.test/abc").toString(16)}`;
  const env = (inicial: Record<string, unknown> = {}) => {
    const e = envBase(inicial);
    if (!("subs" in inicial)) {
      const entradas = Object.entries(inicial)
        .filter(([k]) => k.startsWith("sub:"))
        .map(([clave, s]) => { const v = s as ReturnType<typeof config>; return { clave, cantidad: v.cantidad, desde: v.desde, hasta: v.hasta, zona: v.zona }; });
      void e.KV.put("subs", JSON.stringify(entradas));
    }
    return e;
  };

  test("no repite la misma notificación en la ventana", async () => {
    const enviar = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", enviar);
    const e = env({ [clave]: config() });
    await enviarNotificaciones(e, new Date("2026-11-03T11:00:00Z"));
    await enviarNotificaciones(e, new Date("2026-11-03T11:00:30Z"));
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  test("manda una por corrida: dos usuarios a la misma hora salen en minutos seguidos", async () => {
    const enviados: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => { enviados.push(url); return new Response(null, { status: 201 }); }));
    const otra = { ...config(), subscription: { ...subscription, endpoint: "https://push.test/otra" } };
    const e = env({ [clave]: config(), [`sub:${fnv1a("https://push.test/otra").toString(16)}`]: otra });
    await enviarNotificaciones(e, new Date("2026-11-03T11:00:00Z"));
    expect(enviados).toHaveLength(1);
    await enviarNotificaciones(e, new Date("2026-11-03T11:01:00Z"));
    expect(new Set(enviados)).toEqual(new Set(["https://push.test/abc", "https://push.test/otra"]));
    await enviarNotificaciones(e, new Date("2026-11-03T11:02:00Z"));
    expect(enviados).toHaveLength(2);
  });

  test("a la primera hora manda la frase del día", async () => {
    const enviados: { url: string; body: unknown }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      enviados.push({ url, body: init.body });
      return new Response(null, { status: 201 });
    }));
    const e = env({ [clave]: config() });
    const ahora = new Date("2026-11-03T11:00:00Z"); // 08:00 en Argentina
    await enviarNotificaciones(e, ahora);
    expect(enviados).toHaveLength(1);
    expect(enviados[0].url).toBe(subscription.endpoint);
    expect(e.KV.datos.has(clave)).toBe(true);
  });

  test("fuera de horario no manda nada", async () => {
    const enviar = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", enviar);
    await enviarNotificaciones(env({ [clave]: config() }), new Date("2026-11-03T12:05:00Z"));
    expect(enviar).not.toHaveBeenCalled();
  });

  test("si el servicio responde 410 borra la suscripción", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 410 })));
    const e = env({ [clave]: config() });
    await enviarNotificaciones(e, new Date("2026-11-03T11:00:00Z"));
    expect(e.KV.datos.has(clave)).toBe(false);
    expect(await e.KV.get("subs", "json")).toEqual([]);
  });
});

test("el mensaje de la mañana es la Clave del día y las demás son buena o clave", async () => {
  const { mensajePara } = await import("../src/push");
  const ahora = new Date("2026-11-03T11:05:00Z");
  const primera = await mensajePara(envFalso(), config() as never, 0, ahora);
  expect(primera.fraseId).toBe(fraseDelDia(FRASES_BASE, fechaLocal(ahora, AR), ["gym"])!.id);
  for (let i = 0; i < 20; i++) {
    const otra = await mensajePara(envFalso(), config() as never, 1, ahora);
    const f = FRASES_BASE.find((x) => x.id === otra.fraseId)!;
    expect(["buena", "clave"]).toContain(f.nivel);
    expect(f.categoria).toBe("gym");
  }
  expect(primera.titulo).toBe("Motivación");
  expect(primera.cuerpo).toContain("—");
});

describe("revisión final: push", () => {
  const clave = `sub:${fnv1a("https://push.test/abc").toString(16)}`;
  const claveOtra = `sub:${fnv1a("https://push.test/otra").toString(16)}`;

  test("volver a suscribirse no borra la marca de enviado", async () => {
    const e = env();
    await post(e, config());
    await e.KV.put(clave, JSON.stringify({ ...((await e.KV.get(clave, "json")) as object), enviado: "2026-11-03|0" }));
    await post(e, config());
    expect(((await e.KV.get(clave, "json")) as { enviado?: string }).enviado).toBe("2026-11-03|0");
  });

  test("si nadie tiene notificación ahora, solo lee el índice", async () => {
    const e = env();
    for (let i = 0; i < 5; i++) await post(e, config({ subscription: { ...subscription, endpoint: `https://push.test/${i}` } }));
    const leidas: string[] = [];
    const get = e.KV.get.bind(e.KV);
    e.KV.get = (async (k: string, t?: "json") => { leidas.push(k); return get(k, t); }) as typeof e.KV.get;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 201 })));
    await enviarNotificaciones(e, new Date("2026-11-03T12:05:00Z"));
    expect(leidas).toEqual(["subs"]);
  });

  test("cada usuario tiene su minuto: una lectura vieja no hace que se repita", async () => {
    const enviados: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => { enviados.push(url); return new Response(null, { status: 201 }); }));
    const e = env();
    await post(e, config());
    await post(e, config({ subscription: { ...subscription, endpoint: "https://push.test/otra" } }));
    const orden = [clave, claveOtra].sort();
    const primero = orden[0] === clave ? "https://push.test/abc" : "https://push.test/otra";
    const segundo = primero === "https://push.test/abc" ? "https://push.test/otra" : "https://push.test/abc";

    await enviarNotificaciones(e, new Date("2026-11-03T11:00:00Z"));
    expect(enviados).toEqual([primero]);
    // Simula una lectura vieja del KV: se pierde la marca de enviado del primero.
    const k = orden[0];
    const s = (await e.KV.get(k, "json")) as Record<string, unknown>;
    delete s.enviado;
    await e.KV.put(k, JSON.stringify(s));
    await enviarNotificaciones(e, new Date("2026-11-03T11:01:00Z"));
    expect(enviados).toEqual([primero, segundo]);
    await enviarNotificaciones(e, new Date("2026-11-03T11:02:00Z"));
    expect(enviados).toEqual([primero, segundo]);
  });
});

describe("cada N horas", () => {
  test("acepta cadaHoras de 1 a 6 y lo guarda en el índice", async () => {
    const e = env();
    expect((await post(e, config({ cadaHoras: 2 }))).status).toBe(201);
    const [entrada] = (await e.KV.get("subs", "json")) as { cadaHoras?: number }[];
    expect(entrada.cadaHoras).toBe(2);
  });

  test("rechaza cadaHoras fuera de rango", async () => {
    expect((await post(env(), config({ cadaHoras: 0 }))).status).toBe(400);
    expect((await post(env(), config({ cadaHoras: 7 }))).status).toBe(400);
  });

  test("con cada 2 horas manda a las 10 (y no con 3 por día)", async () => {
    const enviar = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", enviar);
    const e = env();
    await post(e, config({ cadaHoras: 2 }));
    await enviarNotificaciones(e, new Date("2026-11-03T13:00:00Z")); // 10:00 en Argentina
    expect(enviar).toHaveBeenCalledTimes(1);
  });
});

describe("aviso de racha", () => {
  const racha = { hora: "21:00", dias: 12, fecha: "2026-11-01", crece: true };

  test("acepta la racha y guarda la hora en el índice", async () => {
    const e = env();
    expect((await post(e, config({ racha }))).status).toBe(201);
    const [entrada] = (await e.KV.get("subs", "json")) as { rachaHora?: string }[];
    expect(entrada.rachaHora).toBe("21:00");
  });

  test("rechaza una racha mal formada", async () => {
    expect((await post(env(), config({ racha: { ...racha, hora: "25:00" } }))).status).toBe(400);
    expect((await post(env(), config({ racha: { ...racha, dias: -1 } }))).status).toBe(400);
  });

  test("a la hora del aviso manda la racha con los días al día de hoy", async () => {
    const enviados: unknown[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => { enviados.push(init); return new Response(null, { status: 201 }); }));
    const e = env();
    await post(e, config({ racha, desde: "08:00", hasta: "20:00" }));
    await enviarNotificaciones(e, new Date("2026-11-04T00:00:00Z")); // 21:00 del 3/11 en Argentina
    expect(enviados).toHaveLength(1);
  });

  test("el mensaje de racha suma los días que pasaron y no lleva nombre", async () => {
    const { mensajePara } = await import("../src/push");
    const sub = { ...config({ racha }), racha } as never;
    const m = await mensajePara(envFalso(), sub, 99, new Date("2026-11-04T00:00:00Z"));
    expect(m.titulo).toContain("14 días");
    expect(m.cuerpo.length).toBeGreaterThan(10);
  });

  test("una racha que no crece sola mantiene los días", async () => {
    const { mensajePara } = await import("../src/push");
    const quieta = { ...racha, crece: false };
    const m = await mensajePara(envFalso(), { ...config({ racha: quieta }), racha: quieta } as never, 99, new Date("2026-11-04T00:00:00Z"));
    expect(m.titulo).toContain("12 días");
  });
});

describe("días de la semana", () => {
  test("un día que no está en la lista no manda nada", async () => {
    const enviar = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", enviar);
    const e = env();
    await post(e, config({ dias: [0, 6] })); // solo fines de semana; el 3/11/2026 es martes
    await enviarNotificaciones(e, new Date("2026-11-03T11:00:00Z"));
    expect(enviar).not.toHaveBeenCalled();
  });

  test("un día que está en la lista manda", async () => {
    const enviar = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", enviar);
    const e = env();
    await post(e, config({ dias: [2] }));
    await enviarNotificaciones(e, new Date("2026-11-03T11:00:00Z"));
    expect(enviar).toHaveBeenCalledTimes(1);
  });
});
