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
    expect(await e.KV.get("subs", "json")).toEqual([k]);
    await post(e, config({ cantidad: 2 }));
    expect(await e.KV.get("subs", "json")).toEqual([k]);
  });

  test("rechaza desde >= hasta", async () => {
    expect((await post(env(), config({ desde: "22:00", hasta: "08:00" }))).status).toBe(400);
    expect((await post(env(), config({ desde: "10:00", hasta: "10:00" }))).status).toBe(400);
  });

  test("rechaza cantidad fuera de 1 a 5", async () => {
    expect((await post(env(), config({ cantidad: 0 }))).status).toBe(400);
    expect((await post(env(), config({ cantidad: 6 }))).status).toBe(400);
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
    if (!("subs" in inicial)) void e.KV.put("subs", JSON.stringify(Object.keys(inicial).filter((k) => k.startsWith("sub:"))));
    return e;
  };

  test("no repite la misma notificación en la ventana", async () => {
    const enviar = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", enviar);
    const e = env({ [clave]: config() });
    await enviarNotificaciones(e, new Date("2026-11-03T11:01:00Z"));
    await enviarNotificaciones(e, new Date("2026-11-03T11:02:00Z"));
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  test("manda una por corrida: dos usuarios a la misma hora salen en minutos seguidos", async () => {
    const enviados: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => { enviados.push(url); return new Response(null, { status: 201 }); }));
    const otra = { ...config(), subscription: { ...subscription, endpoint: "https://push.test/otra" } };
    const e = env({ [clave]: config(), [`sub:${fnv1a("https://push.test/otra").toString(16)}`]: otra });
    await enviarNotificaciones(e, new Date("2026-11-03T11:01:00Z"));
    expect(enviados).toHaveLength(1);
    await enviarNotificaciones(e, new Date("2026-11-03T11:02:00Z"));
    expect(new Set(enviados)).toEqual(new Set(["https://push.test/abc", "https://push.test/otra"]));
    await enviarNotificaciones(e, new Date("2026-11-03T11:03:00Z"));
    expect(enviados).toHaveLength(2);
  });

  test("a la primera hora manda la frase del día", async () => {
    const enviados: { url: string; body: unknown }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      enviados.push({ url, body: init.body });
      return new Response(null, { status: 201 });
    }));
    const e = env({ [clave]: config() });
    const ahora = new Date("2026-11-03T11:05:00Z"); // 08:05 en Argentina
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
    await enviarNotificaciones(e, new Date("2026-11-03T11:05:00Z"));
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
