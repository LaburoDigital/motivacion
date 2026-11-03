# App de Motivación — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA de frases motivacionales para iPhone, con feed deslizable, niveles de frases, temas, favoritos, notificaciones push y wallpaper diario para la pantalla bloqueada. Costo $0.

**Architecture:** Monorepo con npm workspaces: `shared/` (tipos y lógica pura: frase del día, feed), `app/` (PWA React + Vite en Cloudflare Pages) y `worker/` (Cloudflare Worker + KV: frases remotas, crons, push, wallpaper). La lógica de "frase del día" vive en `shared/` para que la app y el Worker den la misma frase.

**Tech Stack:** TypeScript 5.6, React 18.3.1, Vite 5.4, vite-plugin-pwa 0.20.5, vitest 2.1, idb-keyval 6.2.1, wrangler 3.80, satori 0.10.14, @resvg/resvg-wasm 2.6.2, @block65/webcrypto-web-push 1.0.

**Spec:** `docs/superpowers/specs/2026-11-03-app-motivacion-design.md`

## Global Constraints

- Costo $0: solo planes gratis de Cloudflare (Pages, Workers, KV, Cron Triggers), GitHub, ZenQuotes, MyMemory y Picsum. Ninguna dependencia ni servicio que pida pago o tarjeta.
- Plataforma objetivo: Safari iOS ≥ 16.4 con la PWA instalada ("Agregar a inicio").
- Todo el texto visible en **español rioplatense** (vos). Frases solo en español.
- Sin cuentas ni datos personales. Los datos del usuario solo en el dispositivo (IndexedDB vía idb-keyval). El servidor guarda únicamente suscripción push + preferencias.
- Niveles: `"clave" | "buena" | "normal"`. Pesos del feed: clave ×3, buena ×2, normal ×1.
- Feed: de cada 10 frases, ~8 nuevas y 1–2 de likes. Un like no se repite antes de 7 días.
- Frase del día: solo nivel `clave`. Las de ZenQuotes entran siempre como `normal`.
- Categorías (ids): `disciplina, estudio, gym, estoicismo, amor-propio, exito, calma, superacion`. Etiquetas: Disciplina, Estudio, Gym, Estoicismo, Amor propio, Éxito, Calma, Superación.
- Wallpaper: tercio superior libre para el reloj; 3 estilos `negro | degradado | foto`.
- Notificaciones: 1–5 por día, dentro de un horario desde–hasta (desde < hasta, mismo día).

## Review Focus

1. **Temas vacíos:** si el usuario no marca ningún tema, todo se comporta como "Mezcla general" (todas las categorías), sin feed vacío ni frase del día nula. → tests en Task 2 y Task 3.
2. **Ninguna Clave en los temas elegidos:** la frase del día cae a las Clave de cualquier categoría, nunca a una Buena/Normal ni a `undefined`. → test en Task 2.
3. **Frase muy larga (300+ caracteres):** en el wallpaper la letra se achica y el texto nunca invade el tercio superior ni se sale de la imagen. → test en Task 11.
4. **Frases duplicadas:** la misma frase llega por ZenQuotes en dos días, o una curada repite una de la base. Se deduplica por texto normalizado y nunca aparece dos veces. → tests en Task 4 y Task 10.
5. **Zona horaria del usuario:** la "fecha" de la frase del día y los horarios de notificación se calculan en la zona del usuario, no en UTC (a las 22:30 en Argentina sigue siendo "hoy"). → tests en Task 2 y Task 12.

---

### Task 0: Repo y monorepo

**Files:**
- Create: `package.json` (workspaces `shared`, `app`, `worker`), `tsconfig.base.json`, `.gitignore`
- Create: `shared/package.json`, `shared/tsconfig.json`, `shared/src/index.ts`
- Create: `app/` con `npm create vite@5 app -- --template react-ts`, más `vitest` y `@testing-library/react` como dev deps
- Create: `worker/` con `wrangler.toml` (name `motivacion-worker`, `compatibility_date = "2026-10-01"`, binding KV `KV`), `worker/src/index.ts`, vitest con `@cloudflare/vitest-pool-workers`
- Test: `shared/src/smoke.test.ts`

- [ ] **Step 1:** `git init` y crear la estructura de arriba. `app` importa `shared` como `"shared": "*"`.
- [ ] **Step 2:** Test smoke en `shared` (`expect(1).toBe(1)`) y un test de `app` que renderiza `<App/>` sin romper.
- [ ] **Step 3:** Run `npm test --workspaces`. Expected: PASS en los 3 workspaces.
- [ ] **Step 4:** Commit `chore: monorepo base (shared, app, worker)`.

---

### Task 1: Tipos compartidos

**Files:**
- Create: `shared/src/tipos.ts`, `shared/src/categorias.ts`
- Test: `shared/src/categorias.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Nivel = "clave" | "buena" | "normal";
  type Fuente = "base" | "curada" | "zenquotes";
  type CategoriaId = "disciplina"|"estudio"|"gym"|"estoicismo"|"amor-propio"|"exito"|"calma"|"superacion";
  interface Frase { id: string; texto: string; autor?: string; categoria: CategoriaId; nivel: Nivel; fuente: Fuente }
  const CATEGORIAS: { id: CategoriaId; etiqueta: string }[];
  const PESOS: Record<Nivel, number>; // { clave: 3, buena: 2, normal: 1 }
  function normalizarTexto(t: string): string; // minúsculas, sin tildes, sin puntuación, espacios colapsados
  ```
  Ids: base `b-0001…`, curada `c-0001…`, zenquotes `z-<fnv1a hex del texto en inglés>`.

- [ ] **Step 1:** Tests: `CATEGORIAS` tiene 8 ids exactos de Global Constraints; `normalizarTexto("¡No es  que tengamos POCO tiempo!") === "no es que tengamos poco tiempo"`.
- [ ] **Step 2:** Run `npm test -w shared`. Expected: FAIL (módulo no existe).
- [ ] **Step 3:** Implementar en los archivos de arriba y reexportar desde `shared/src/index.ts`.
- [ ] **Step 4:** Run `npm test -w shared`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(shared): tipos, categorías y normalización`.

---

### Task 2: Frase del día (determinista)

**Files:**
- Create: `shared/src/fraseDelDia.ts`, `shared/src/hash.ts`
- Test: `shared/src/fraseDelDia.test.ts`

**Interfaces:**
- Consumes: `Frase`, `CategoriaId` (Task 1)
- Produces:
  ```ts
  function fnv1a(s: string): number; // 32 bits sin signo
  function fechaLocal(ahora: Date, zonaHoraria: string): string; // "YYYY-MM-DD" vía Intl.DateTimeFormat("en-CA", { timeZone })
  function fraseDelDia(frases: Frase[], fecha: string, temas: CategoriaId[]): Frase | null;
  ```

Algoritmo: `temas` vacío ⇒ todas las categorías. Candidatas = `nivel === "clave"` con categoría en temas, ordenadas por `id`; si no hay ninguna, todas las `clave` ordenadas por `id`; si tampoco hay, `null`. Índice = `fnv1a(fecha + "|" + [...temas].sort().join(",")) % candidatas.length`.

- [ ] **Step 1:** Tests:
  - mismos argumentos ⇒ misma frase; fecha distinta ⇒ (con 30 claves) al menos 2 frases distintas en 7 días.
  - nunca devuelve una frase `buena`/`normal`.
  - `temas = []` devuelve una clave de cualquier categoría.
  - temas `["gym"]` sin claves de gym ⇒ devuelve una clave de otra categoría (Review Focus 2).
  - orden de `temas` no cambia el resultado (`["gym","calma"]` vs `["calma","gym"]`).
  - `fechaLocal(new Date("2026-11-04T01:30:00Z"), "America/Argentina/Buenos_Aires") === "2026-11-03"` (Review Focus 5).
- [ ] **Step 2:** Run `npm test -w shared`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run `npm test -w shared`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(shared): frase del día determinista`.

---

### Task 3: Selección del feed

**Files:**
- Create: `shared/src/feed.ts`
- Test: `shared/src/feed.test.ts`

**Interfaces:**
- Consumes: `Frase`, `PESOS`, `CategoriaId`
- Produces:
  ```ts
  interface EstadoFeed {
    vistas: Record<string, number>;   // id -> timestamp ms de la última vez vista
    likes: Record<string, number>;    // id -> timestamp ms del like
    malas: string[];                  // ids marcadas "mala traducción"
    clavesPropias: string[];          // ids que el usuario subió a clave
  }
  function nivelEfectivo(f: Frase, estado: EstadoFeed): Nivel; // clave si está en clavesPropias
  function armarFeed(frases: Frase[], estado: EstadoFeed, temas: CategoriaId[], cantidad: number, ahora: number, rng: () => number): Frase[];
  ```

Algoritmo: posiciones `i % 10 === 4` y `i % 10 === 9` son "slot de like": se elige al azar un like cuya última vista sea anterior a `ahora - 7 días`; si no hay, se usa una nueva. El resto: sorteo ponderado por `PESOS[nivelEfectivo]` entre frases de los temas, no vistas y no en `malas`; si no quedan no vistas, la vista hace más tiempo. Sin repetir ids dentro de un mismo resultado. Los likes siempre aparecen aunque estén fuera de los temas elegidos.

- [ ] **Step 1:** Tests (con `rng` fijo):
  - con 100 nuevas y 5 likes elegibles, `armarFeed(..., 10)` tiene exactamente 2 likes y 8 no vistas.
  - un like visto hace 3 días no aparece; uno visto hace 8 días sí.
  - ids en `malas` nunca aparecen.
  - sin no vistas, devuelve primero las de `vistas` más antiguas.
  - en 10.000 sorteos sobre 1 clave + 1 normal, la clave sale entre 70% y 80% (≈ 3/4).
  - id en `clavesPropias` tiene `nivelEfectivo === "clave"`.
  - `temas = []` usa todas las categorías (Review Focus 1).
  - ningún id repetido en un resultado de 50.
- [ ] **Step 2:** Run `npm test -w shared`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run `npm test -w shared`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(shared): selección del feed con niveles y likes`.

---

### Task 4: Colección base de frases

**Files:**
- Create: `shared/data/frases-base.json` (array de `Frase`, `fuente: "base"`)
- Create: `shared/src/validarFrases.ts`
- Test: `shared/src/frasesBase.test.ts`

**Interfaces:**
- Produces: `function validarColeccion(frases: Frase[]): string[]` (lista de errores; vacía = ok) y `function deduplicar(frases: Frase[]): Frase[]` (se queda con la primera por `normalizarTexto`; la base gana sobre la curada y la curada sobre zenquotes).

- [ ] **Step 1:** Tests: `frases-base.json` tiene ≥ 500 frases; entre 100 y 150 `clave`; las 8 categorías con ≥ 40 cada una; ids únicos `b-NNNN`; sin duplicados por `normalizarTexto` (Review Focus 4); `deduplicar` con una curada igual a una base se queda con la base.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Escribir la colección. Criterio de 🔥 Clave: frases con peso real (Séneca, Marco Aurelio, Epicteto, Nietzsche, Goggins, Jocko Willink, Kobe Bryant, etc.); nada genérico tipo "Just do it". Autor siempre verificado; si es anónima, sin `autor`. Antes de este paso, revisar la cuenta de TikTok **evoconn** (`https://www.tiktok.com/@evoconn`, "evo") con el navegador integrado: tomar solo frases de autores conocidos (verificadas) y usar las originales del creador solo como referencia de estilo. No iniciar sesión en TikTok.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(shared): colección base de frases`.

---

### Task 5: Almacenamiento local de la app

**Files:**
- Create: `app/src/datos/almacen.ts`
- Test: `app/src/datos/almacen.test.ts` (con `fake-indexeddb`)

**Interfaces:**
- Consumes: `EstadoFeed`, `Frase`, `CategoriaId`
- Produces:
  ```ts
  interface Preferencias { temas: CategoriaId[]; estiloVisual: string; soloFondosFavoritos: boolean; fondosFavoritos: string[]; zonaHoraria: string }
  interface Remotas { version: string; frases: Frase[] }
  const almacen: {
    leerEstado(): Promise<EstadoFeed>;  guardarEstado(e: EstadoFeed): Promise<void>;
    leerPrefs(): Promise<Preferencias>; guardarPrefs(p: Preferencias): Promise<void>;
    leerRemotas(): Promise<Remotas>;    guardarRemotas(r: Remotas): Promise<void>;
    leerFraseDelDia(): Promise<{ fecha: string; id: string } | null>;
    guardarFraseDelDia(v: { fecha: string; id: string }): Promise<void>;
  };
  ```
  Defaults: estado vacío; prefs `{ temas: [], estiloVisual: "min-noche", soloFondosFavoritos: false, fondosFavoritos: [], zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone }`; remotas `{ version: "", frases: [] }`.

- [ ] **Step 1:** Tests: lectura sin datos devuelve los defaults; guardar y volver a leer devuelve lo mismo para los 4 grupos.
- [ ] **Step 2:** Run `npm test -w app`. Expected: FAIL.
- [ ] **Step 3:** Implementar con `idb-keyval` (`get`/`set`, una clave por grupo).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(app): almacenamiento local`.

---

### Task 6: Sincronización con el Worker y hook de frases

**Files:**
- Create: `app/src/datos/api.ts`, `app/src/datos/useFrases.ts`, `app/src/config.ts` (`export const WORKER_URL = import.meta.env.VITE_WORKER_URL`)
- Test: `app/src/datos/useFrases.test.ts`

**Interfaces:**
- Consumes: `almacen` (Task 5), `deduplicar` (Task 4), `fraseDelDia`, `fechaLocal` (Task 2), `armarFeed` (Task 3), contrato `GET /frases` y `GET /frase-del-dia` (Task 10)
- Produces:
  ```ts
  function obtenerRemotas(desde: string): Promise<Remotas | null>; // null si falla la red
  function obtenerFraseDelDiaRemota(temas: CategoriaId[], zona: string): Promise<Frase | null>;
  function useFrases(): {
    todas: Frase[]; fraseDelDia: Frase | null; estado: EstadoFeed; prefs: Preferencias;
    siguientes(n: number): Frase[];
    marcarVista(id: string): void; alternarLike(id: string): void;
    marcarClave(id: string): void; marcarMala(id: string): void;
    setPrefs(p: Partial<Preferencias>): void;
  };
  ```
  `todas = deduplicar([...base, ...remotas.frases])`. Frase del día: si hay una guardada para la fecha local de hoy, esa; si no, pedir al Worker y guardarla; si falla, `fraseDelDia(todas con clavesPropias como clave, fecha, temas)` local. La frase del día siempre es la primera del feed del día.

- [ ] **Step 1:** Tests (fetch simulado): sin red, `todas` es la base y `fraseDelDia` no es null; con red, las remotas se suman sin duplicados; si `/frases?desde=<v>` responde la misma versión, no se reemplazan las remotas; la frase del día guardada hoy se reutiliza sin volver a pedirla.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(app): sincronización de frases y frase del día`.

---

### Task 7: Temas visuales y fondos

**Files:**
- Create: `app/src/visual/estilos.ts`, `app/src/visual/Fondo.tsx`
- Test: `app/src/visual/estilos.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface EstiloVisual { id: string; tipo: "minimalista" | "foto"; nombre: string; fondoCss?: string; picsumId?: number; fuente: string; colorTexto: string }
  const ESTILOS: EstiloVisual[]; // ≥ 12 minimalistas (ids "min-*"), ≥ 30 fotos (ids "foto-*")
  function urlFoto(e: EstiloVisual, w: number, h: number): string; // https://picsum.photos/id/<picsumId>/<w>/<h>
  function elegirFondo(prefs: Preferencias, semilla: number): EstiloVisual; // si soloFondosFavoritos y hay favoritos, entre ellos; si no, el estilo elegido
  function Fondo(props: { estilo: EstiloVisual; children: ReactNode }): JSX.Element;
  ```
  Las fotos llevan una capa `rgba(0,0,0,0.45)` para que el texto se lea. Si la imagen falla al cargar, `Fondo` usa el fondo `min-noche`. Fuentes: Playfair Display, Inter y Bebas Neue desde Google Fonts.

- [ ] **Step 1:** Tests: ids únicos; cantidades mínimas; `elegirFondo` con `soloFondosFavoritos` y favoritos devuelve solo favoritos; sin favoritos, ignora el flag; `urlFoto` arma la URL exacta.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar. Los `picsumId` se eligen a mano mirando `https://picsum.photos/v2/list` (paisajes, mar, montaña, ciudad de noche; sin personas en primer plano).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(app): estilos visuales y fondos`.

---

### Task 8: Pantalla Inicio (feed) y compartir

**Files:**
- Create: `app/src/pantallas/Inicio.tsx`, `app/src/componentes/TarjetaFrase.tsx`, `app/src/componentes/MenuFrase.tsx`, `app/src/compartir/imagenFrase.ts`
- Test: `app/src/pantallas/Inicio.test.tsx`

**Interfaces:**
- Consumes: `useFrases` (Task 6), `Fondo`, `elegirFondo` (Task 7)
- Produces: `function generarImagenFrase(frase: Frase, estilo: EstiloVisual, w = 1080, h = 1920): Promise<Blob>` (canvas; foto con `crossOrigin="anonymous"`); `function compartirFrase(frase, estilo): Promise<void>` (`navigator.share({ files: [File] })`; si no hay soporte, descarga el PNG).

Comportamiento: scroll vertical con `scroll-snap-type: y mandatory`, una frase por pantalla; carga 10 más al acercarse al final con `siguientes(10)`; `marcarVista` cuando una tarjeta queda visible (IntersectionObserver). Botones ❤️ / 📤 / 🔄 (🔄 cambia solo el fondo de esa tarjeta). Doble tap = like. Mantener apretado 500 ms abre `MenuFrase`: "🔥 Marcar como Clave" y "🚫 Mala traducción" (este último solo si `fuente === "zenquotes"`). La letra se achica según el largo de la frase (>180 caracteres: tamaño chico).

- [ ] **Step 1:** Tests (Testing Library, `useFrases` simulado): la primera tarjeta es la frase del día; doble click llama `alternarLike(id)`; mantener apretado y elegir "Marcar como Clave" llama `marcarClave(id)`; la opción "Mala traducción" no aparece en frases `base`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run. Expected: PASS. Revisar a mano en el navegador integrado con viewport `mobile`: el swipe engancha, la frase larga se lee y no se corta.
- [ ] **Step 5:** Commit `feat(app): feed de frases y compartir como imagen`.

---

### Task 9: Temas, Favoritos, navegación y PWA

**Files:**
- Create: `app/src/pantallas/Temas.tsx`, `app/src/pantallas/Favoritos.tsx`, `app/src/componentes/BarraNav.tsx`, `app/src/componentes/CartelInstalar.tsx`
- Modify: `app/src/App.tsx`, `app/vite.config.ts` (vite-plugin-pwa), `app/public/` (íconos 192/512 y `apple-touch-icon.png`)
- Test: `app/src/pantallas/Temas.test.tsx`, `app/src/pantallas/Favoritos.test.tsx`

**Interfaces:**
- Consumes: `useFrases`, `ESTILOS`, `compartirFrase`

Detalles: `BarraNav` con Inicio · Temas · Favoritos · Ajustes (estado de pestaña local, sin router). Temas: pestañas Contenido (8 categorías + "Mezcla general", que vacía `temas`) y Visual (sub-pestañas Fotos/Minimalista, ⭐ por fondo, toggle "Solo mis favoritos"). Favoritos: pestañas Frases (likes, el más reciente primero) y Fondos. `CartelInstalar` aparece si `!(navigator as any).standalone` en iOS: "Tocá Compartir y después 'Agregar a inicio'". Manifest: `name` "Motivación", `display: "standalone"`, `theme_color` y `background_color` `#0b0b0f`. El service worker precachea la app y `frases-base.json`.

- [ ] **Step 1:** Tests: tocar "Gym" agrega `gym` a `prefs.temas`; "Mezcla general" deja `temas = []`; ⭐ en un fondo lo agrega a `fondosFavoritos`; Favoritos lista los likes ordenados por fecha descendente.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run `npm test -w app` y `npm run build -w app`. Expected: PASS y `dist/` con `manifest.webmanifest` y `sw.js`.
- [ ] **Step 5:** Commit `feat(app): temas, favoritos, navegación y PWA`.

---

### Task 10: Worker — frases remotas y cron diario

**Files:**
- Create: `worker/src/frases.ts`, `worker/src/zenquotes.ts`, `worker/src/traducir.ts`
- Modify: `worker/src/index.ts` (router + `scheduled`), `worker/wrangler.toml` (crons `"0 9 * * *"` y `"*/15 * * * *"`, var `CURADAS_URL` = raw de `frases.json` en GitHub)
- Create: `curadas/frases.json` (array vacío inicial de `Frase` con `fuente: "curada"`)
- Test: `worker/test/frases.test.ts`

**Interfaces:**
- Consumes: `Frase`, `deduplicar`, `fnv1a`, `fraseDelDia`, `fechaLocal`, `frases-base.json` (claves de la base, para la frase del día)
- Produces (HTTP, con CORS `*`):
  - `GET /frases?desde=<version>` → `{ version: string; frases: Frase[] }` (curadas + zenquotes deduplicadas; `frases: []` si `desde === version`)
  - `GET /frase-del-dia?temas=gym,calma&zona=America/Argentina/Buenos_Aires` → `Frase`
  - `function actualizarDiario(env): Promise<void>`: ZenQuotes `https://zenquotes.io/api/quotes` → 20 frases → MyMemory `https://api.mymemory.translated.net/get?q=<texto>&langpair=en|es` → `Frase` con `nivel: "normal"`, `fuente: "zenquotes"`, `categoria` asignada por palabras clave (default `superacion`) → KV `zen:frases`. Además baja `CURADAS_URL` a KV `curadas`. `version` = fnv1a del JSON combinado.

- [ ] **Step 1:** Tests (fetch simulado): `actualizarDiario` guarda 20 frases `normal`; si ZenQuotes falla, no borra las anteriores; si MyMemory falla para una frase, esa se saltea; una frase de ZenQuotes ya existente (mismo texto en inglés ⇒ mismo id) no se duplica (Review Focus 4); `/frases?desde=<version actual>` devuelve `frases: []`; `/frase-del-dia` devuelve siempre `nivel: "clave"`.
- [ ] **Step 2:** Run `npm test -w worker`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(worker): frases remotas, ZenQuotes traducidas y frase del día`.

---

### Task 11: Worker — wallpaper

**Files:**
- Create: `worker/src/wallpaper.ts`, `worker/src/layoutWallpaper.ts`, `worker/assets/PlayfairDisplay-Bold.ttf` (licencia OFL)
- Modify: `worker/src/index.ts`
- Test: `worker/test/layoutWallpaper.test.ts`, `worker/test/wallpaper.test.ts`

**Interfaces:**
- Consumes: la lógica de `/frase-del-dia` (Task 10). Para `estilo=foto`: constante `FOTOS_WALLPAPER: number[]` (≥ 10 `picsumId` oscuros) en `worker/src/wallpaper.ts`, elegida con `fnv1a(fecha) % length` y oscurecida al 55%.
- Produces:
  - `function calcularLayout(texto: string, w: number, h: number): { top: number; fontSize: number; maxWidth: number }`: `top ≥ h/3`; `fontSize` entre `w*0.045` y `w*0.085`, menor cuanto más largo el texto; garantiza que el bloque estimado (`líneas × fontSize × 1.3`) entre entre `top` y `h*0.92`.
  - `GET /wallpaper?temas=...&zona=...&estilo=negro|degradado|foto&w=1179&h=2556` → `image/png` (satori → resvg-wasm). Defaults `w=1179`, `h=2556`, `estilo=negro`. Caché `Cache-Control: max-age=3600`.

- [ ] **Step 1:** Tests: `calcularLayout` con 40 caracteres da `fontSize` mayor que con 300; con 300 caracteres (Review Focus 3) `top ≥ h/3` y el bloque termina antes de `h*0.92`; `/wallpaper` responde 200 con `content-type: image/png` y los primeros bytes `\x89PNG`; `estilo` inválido ⇒ usa `negro`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar. Comprobar con `npx wrangler deploy --dry-run --outdir dist` que el bundle comprimido quede < 3 MB (límite del plan gratis). Si no entra, cambiar resvg-wasm por `@cf-wasm/resvg`, y anotar la decisión en el commit.
- [ ] **Step 4:** Run. Expected: PASS. Abrir `/wallpaper` en `wrangler dev` y mirar la imagen: reloj libre arriba, frase legible.
- [ ] **Step 5:** Commit `feat(worker): wallpaper legible para pantalla bloqueada`.

---

### Task 12: Notificaciones push

**Files:**
- Create: `worker/src/push.ts`, `worker/src/horarios.ts`
- Create: `app/src/datos/notificaciones.ts`, `app/public/push-handler.js` (importado en el SW por vite-plugin-pwa `injectManifest` o `importScripts`)
- Modify: `worker/src/index.ts`
- Test: `worker/test/horarios.test.ts`, `worker/test/push.test.ts`

**Interfaces:**
- Produces (Worker):
  - `POST /suscripcion` body `{ subscription: PushSubscriptionJSON; cantidad: 1..5; desde: "HH:MM"; hasta: "HH:MM"; temas: CategoriaId[]; zona: string }` → KV `sub:<fnv1a(endpoint)>`; 400 si `desde >= hasta` o `cantidad` fuera de 1–5.
  - `DELETE /suscripcion` body `{ endpoint }`.
  - `function horariosDelDia(cantidad: number, desde: string, hasta: string): string[]`: `cantidad = 1` ⇒ `[desde]`; si no, repartidos parejo de `desde` a `hasta` inclusive, redondeados al múltiplo de 15 min.
  - `function tocaAhora(horarios: string[], ahora: Date, zona: string): number | null`: índice del horario dentro de la ventana `(ahora − 15 min, ahora]` en la zona del usuario.
  - Cron `*/15`: para cada `sub:*`, si `tocaAhora` ⇒ índice 0 manda la frase del día; los demás, una frase `buena`/`clave` al azar de sus temas. Payload `{ titulo: "Motivación", cuerpo: texto + " — " + autor, fraseId }`. Respuesta 404/410 ⇒ borrar la suscripción. Claves VAPID en secrets `VAPID_PUBLIC`/`VAPID_PRIVATE`.
- Produces (App): `function activarNotificaciones(cfg): Promise<"ok" | "sin-soporte" | "denegado">` y `function desactivarNotificaciones(): Promise<void>`. El handler del SW muestra la notificación y en `notificationclick` abre `/?frase=<fraseId>`. `Inicio` pone esa frase primero si llega `?frase=`.

- [ ] **Step 1:** Tests: `horariosDelDia(3, "08:00", "22:00")` ⇒ `["08:00","15:00","22:00"]`; `horariosDelDia(1, "09:00", "21:00")` ⇒ `["09:00"]`; `tocaAhora(["08:00"], new Date("2026-11-03T11:05:00Z"), "America/Argentina/Buenos_Aires") === 0` y a las `11:20Z` ⇒ `null` (Review Focus 5); `POST /suscripcion` con `desde: "22:00", hasta: "08:00"` ⇒ 400; envío que responde 410 borra la clave de KV.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar con `@block65/webcrypto-web-push`.
- [ ] **Step 4:** Run `npm test --workspaces`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: notificaciones push con horarios`.

---

### Task 13: Pantalla Ajustes

**Files:**
- Create: `app/src/pantallas/Ajustes.tsx`, `app/src/componentes/GuiaAtajo.tsx`
- Test: `app/src/pantallas/Ajustes.test.tsx`

**Interfaces:**
- Consumes: `activarNotificaciones`, `desactivarNotificaciones` (Task 12), `useFrases().prefs`, `WORKER_URL`, constante `ATAJO_URL` en `app/src/config.ts` (`import.meta.env.VITE_ATAJO_URL`)

Secciones: **Notificaciones** (switch, selector 1–5, horas desde/hasta con `desde < hasta` validado en la UI; mensajes: "sin-soporte" ⇒ "Instalá la app en tu pantalla de inicio para recibir notificaciones (iOS 16.4 o más)"; "denegado" ⇒ cómo habilitarlas en Ajustes de iOS). **Pantalla bloqueada** (selector Negro puro / Degradado oscuro / Foto oscurecida, vista previa con `<img src="/wallpaper?...">`, botón "Instalar atajo" → `ATAJO_URL`, botón "Copiar mi link" con la URL de `/wallpaper` armada con sus temas, zona y estilo, y `GuiaAtajo` paso a paso: instalar el atajo → pegar el link cuando lo pide → Atajos > Automatización > Hora del día 07:00 > Ejecutar inmediatamente).

- [ ] **Step 1:** Tests: con `hasta <= desde` el switch de notificaciones queda deshabilitado y muestra el error; "Copiar mi link" copia una URL con `temas`, `zona` y `estilo` correctos; resultado `"sin-soporte"` muestra el mensaje de instalar.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(app): ajustes, notificaciones y guía del atajo`.

---

### Task 14: Deploy, atajo y prueba en iPhone

**Files:**
- Create: `README.md` (cómo deployar, cómo agregar frases curadas, cómo regenerar VAPID)
- Create: `docs/prueba-iphone.md` (checklist manual)

Pasos que necesitan al usuario están marcados **(usuario)**: Claude no crea cuentas ni ingresa contraseñas.

- [ ] **Step 1 (usuario):** Crear cuenta gratis en Cloudflare y en GitHub si no tiene, e iniciar sesión con `npx wrangler login`.
- [ ] **Step 2:** Crear el KV (`npx wrangler kv namespace create KV`), generar las claves VAPID (`npx web-push generate-vapid-keys`) y cargarlas con `npx wrangler secret put`. Deploy: `npm run deploy -w worker`. Expected: URL `https://motivacion-worker.<sub>.workers.dev`; `curl <url>/frase-del-dia` devuelve una Clave.
- [ ] **Step 3:** Subir el repo a GitHub (público, para que `CURADAS_URL` sea accesible) **con el OK del usuario**. Deploy de la app a Cloudflare Pages (`npx wrangler pages deploy app/dist`) con `VITE_WORKER_URL`.
- [ ] **Step 4 (usuario, en el iPhone):** Crear el atajo en Atajos siguiendo `docs/prueba-iphone.md` ("Pedir entrada de texto" → "Obtener contenido de URL" → "Establecer fondo de pantalla: Pantalla bloqueada"), compartirlo con "Copiar enlace de iCloud" y pasarle el link a Claude, que lo pone en `VITE_ATAJO_URL` y vuelve a deployar.
- [ ] **Step 5 (usuario, en el iPhone):** Recorrer `docs/prueba-iphone.md`: instalar la PWA, deslizar frases, like, compartir por WhatsApp, activar notificaciones (1 en los próximos 15 min), recibirla y tocarla (abre esa frase), correr el atajo y ver el wallpaper legible. Anotar fallas.
- [ ] **Step 6:** Corregir lo que salga de la prueba y commit `chore: deploy y guía de prueba en iPhone`.
