export interface Env {
  KV: KVNamespace;
  /** URL raw del frases.json curado en GitHub. */
  CURADAS_URL: string;
  VAPID_PUBLIC: string;
  VAPID_PRIVATE: string;
  /** "mailto:..." que piden los servicios de push. */
  VAPID_SUBJECT: string;
}
