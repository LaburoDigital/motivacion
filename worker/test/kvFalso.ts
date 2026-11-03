import type { Env } from "../src/env";

/** KV en memoria con la parte de la API que usa el Worker. */
export function kvFalso(inicial: Record<string, unknown> = {}) {
  const datos = new Map<string, string>(Object.entries(inicial).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    datos,
    async get(clave: string, tipo?: "json") {
      const v = datos.get(clave);
      if (v === undefined) return null;
      return tipo === "json" ? JSON.parse(v) : v;
    },
    async put(clave: string, valor: string) {
      datos.set(clave, valor);
    },
    async delete(clave: string) {
      datos.delete(clave);
    },
    async list({ prefix = "" }: { prefix?: string } = {}) {
      return { keys: [...datos.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

export function envFalso(inicial: Record<string, unknown> = {}): Env & { KV: ReturnType<typeof kvFalso> } {
  return {
    KV: kvFalso(inicial) as never,
    CURADAS_URL: "https://curadas.test/frases.json",
    PAGES_URL: "https://app.test",
    VAPID_PUBLIC: "",
    VAPID_PRIVATE: "",
    VAPID_SUBJECT: "mailto:test@example.com",
  } as never;
}
