export interface Env {
  KV: KVNamespace;
  /** URL raw del frases.json curado en GitHub. */
  CURADAS_URL: string;
  /** Origen de la app en Cloudflare Pages, donde están los wallpapers generados. */
  PAGES_URL: string;
  VAPID_PUBLIC: string;
  VAPID_PRIVATE: string;
  /** "mailto:..." que piden los servicios de push. */
  VAPID_SUBJECT: string;
}
