# Motivación

App de frases motivacionales para iPhone (PWA), gratis. Feed deslizable, frases 🔥 Clave, temas, favoritos, notificaciones y frase del día en la pantalla bloqueada.

| Carpeta | Qué es |
|---|---|
| `shared/` | Tipos, colección base (~520 frases), frase del día y lógica del feed. Lo usan la app y el Worker. |
| `app/` | La PWA (React + Vite) que se publica en Cloudflare Pages. |
| `worker/` | Cloudflare Worker: frases remotas, ZenQuotes traducidas, notificaciones push y redirección al wallpaper. |
| `curadas/frases.json` | Frases curadas que se suman sin publicar una versión nueva de la app. |

## Probar

```bash
npm install
npm test
```

## Publicar (todo en planes gratis de Cloudflare)

1. Iniciar sesión: `npx wrangler login`.
2. Crear el KV y pegar el `id` en `worker/wrangler.toml`:
   `npx wrangler kv namespace create KV`
3. Claves VAPID para las notificaciones:
   `npx web-push generate-vapid-keys`, y después
   `npx wrangler secret put VAPID_PUBLIC` y `npx wrangler secret put VAPID_PRIVATE` (desde `worker/`).
4. En `worker/wrangler.toml`, completar `CURADAS_URL` (URL raw de `curadas/frases.json` en GitHub) y `PAGES_URL` (URL de la app en Pages).
5. Publicar el Worker: `npm run deploy -w worker`.
6. Armar la app con la URL del Worker y generar los wallpapers (tarda unos minutos):
   ```bash
   VITE_WORKER_URL=https://motivacion-worker.<tu-subdominio>.workers.dev VITE_ATAJO_URL=<link de iCloud del atajo> npm run build -w app
   npm run wallpapers -w worker
   npx wrangler pages deploy app/dist --project-name motivacion
   ```

## Agregar frases

- **Curadas (sin publicar la app):** sumarlas a `curadas/frases.json` con `fuente: "curada"`, ids `c-0001`, `c-0002`… y nivel `clave`, `buena` o `normal`. El Worker las baja todos los días a las 9:00 UTC. Si alguna es `clave`, volvé a correr el paso 6 para que tenga wallpaper; mientras tanto, la pantalla bloqueada usa una Clave de la base.
- **Base:** editar `shared/data/fuente/frases-base.txt` y correr `node shared/scripts/generar-base.mjs`.

## Límites del plan gratis que condicionan el diseño

- **10 ms de CPU por pedido en Workers.** Por eso los wallpapers se generan al publicar (cada uno lleva ~1 s) y el Worker solo redirige, y el cron de notificaciones corre cada minuto y manda una por vez (~6 ms cada una). Con muchos usuarios a la misma hora, las notificaciones van saliendo en los minutos siguientes, dentro de 15 minutos.
- **KV:** 1.000 escrituras y 1.000 listados por día. Por eso las suscripciones van en un índice (`subs`) en lugar de listar el KV.
