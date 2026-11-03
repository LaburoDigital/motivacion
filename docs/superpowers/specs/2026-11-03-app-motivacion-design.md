# App de Motivación — Diseño (spec)

Fecha: 2026-11-03
Estado: pendiente de revisión del usuario
Nombre de la app: a definir (placeholder: "Motivación")

## 1. Objetivo

Una app de frases motivacionales para uso personal y para compartir con amigos, que reemplace a la app "Motivation" (cuyo acceso completo es pago). Tiene que ser **100% gratis**: sin suscripciones, sin costos de servidor, sin tienda de apps.

**Usuarios:** el dueño y sus amigos. Todos usan **iPhone**.

**Criterios de éxito:**
- Se instala en iPhone desde un link (sin App Store).
- Siempre hay frases nuevas, sin que el contenido se sienta repetido.
- La "frase del día" es siempre una frase de alto nivel (🔥 Clave), nunca una genérica.
- Llegan notificaciones reales con frases.
- La pantalla bloqueada muestra la frase del día, legible.
- Costo mensual: $0.

## 2. Arquitectura

Tres piezas:

1. **PWA** (React + Vite) hospedada en **Cloudflare Pages**. Instalable con "Agregar a inicio" en Safari. Funciona offline.
2. **Cloudflare Worker** con **Cloudflare KV**: entrega frases nuevas, traduce frases de ZenQuotes una vez por día, envía notificaciones push y genera la imagen de la pantalla bloqueada.
3. **Atajo de iPhone** (app Atajos): todas las mañanas baja la imagen de `/wallpaper` y la pone como fondo de pantalla bloqueada.

Los datos del usuario (likes, favoritos, temas, historial de frases vistas) viven **solo en el celular** (IndexedDB/localStorage). No hay cuentas.

## 3. Fuentes de frases

| Fuente | Dónde vive | Nivel por defecto | Cómo se actualiza |
|---|---|---|---|
| Colección base (~500, español) | Dentro de la app | Asignado a mano (100–150 🔥 Clave) | Con cada versión de la app |
| Archivo curado en GitHub (`frases.json`) | Repo público en GitHub | Asignado a mano | Claude agrega frases cuando el usuario lo pide ("traé frases nuevas"), traducidas y revisadas a mano |
| ZenQuotes traducidas | Cloudflare KV | ➖ Normal siempre | El Worker trae y traduce con MyMemory una vez por día (cron) |

- Las frases de autores conocidos se verifican y llevan el autor correcto.
- Referencia: la cuenta de TikTok **evoconn** ("evo"), con frases que le gustan al usuario. De ahí se toman frases de autores conocidos (verificadas) y se usa el estilo como referencia. No se copia en bloque el contenido original del creador.

### Modelo de frase

```
{ id, texto, autor?, categoria, nivel: "clave" | "buena" | "normal", fuente: "base" | "curada" | "zenquotes" }
```

**Categorías iniciales:** Disciplina, Estudio, Gym, Estoicismo, Amor propio, Éxito, Calma, Superación.

## 4. Niveles

- 🔥 **Clave:** profundas, que te quedan en la cabeza. Elegidas a mano.
- ✅ **Buena:** motivan, pero son más comunes.
- ➖ **Normal:** relleno y variedad. Todas las de ZenQuotes empiezan acá.

El usuario puede **marcar una frase como 🔥 Clave** manteniéndola apretada. Esa marca es local y la suma a su rotación de la frase del día.

## 5. Selección de frases (feed)

- De cada 10 frases: unas **8 nuevas** (de los temas elegidos, nunca vistas) y **1–2 de los likes**.
- Una frase con like no se repite antes de **7 días**.
- Las 🔥 Clave aparecen más seguido que las ➖ Normal en el feed. Peso inicial: Clave ×3, Buena ×2, Normal ×1.
- Si se acaban las nuevas de un tema, vuelven las vistas hace más tiempo, primero las más viejas.
- Frases marcadas "🚫 Mala traducción" no se muestran más.

### Frase del día

- Sale **solo de las 🔥 Clave** (de la colección base, del archivo curado y de las que el usuario marcó como Clave).
- Es la misma en tres lugares: la primera frase del feed del día, la notificación de la mañana y la pantalla bloqueada.
- La elige el Worker según la fecha y los temas, así coinciden la app, la notificación y el wallpaper. La regla es determinista (hash de fecha + temas → índice dentro de las Clave del servidor). La app guarda la frase del día cuando la recibe; si arranca offline sin haberla recibido ese día, elige una Clave local con la misma regla (puede no coincidir con la notificación ese día, y es aceptable).
- Las frases que el usuario marcó como Clave (que están solo en su celular) entran en la frase del día **dentro de la app**. La notificación y el wallpaper usan las Clave del servidor, porque el servidor no las conoce.

## 6. Pantallas

Barra inferior con 4 secciones: **Inicio · Temas · Favoritos · Ajustes**.

1. **Inicio (feed):** frase a pantalla completa sobre el fondo del tema visual. Deslizás hacia arriba para la siguiente. Botones: ❤️ like, 📤 compartir (genera una imagen y abre el menú de compartir de iOS), 🔄 cambiar fondo. Doble tap = like. Mantener apretado → menú: marcar 🔥 Clave, 🚫 mala traducción.
2. **Temas:** pestaña **Contenido** (grilla de categorías para marcar, más "Mezcla general") y pestaña **Visual** (sub-pestañas Fotos y Minimalista, con vista previa, ⭐ para marcar fondos favoritos y el modo "Solo mis favoritos").
3. **Favoritos:** pestaña Frases (likes) y pestaña Fondos (⭐). Tocás una frase y se abre en grande para compartirla.
4. **Ajustes:** notificaciones (activar; frecuencia: cada 1, 2, 3 o 4 horas, o de 1 a 5 por día; por defecto, cada 2 horas; horario desde–hasta), pantalla bloqueada (guía paso a paso para instalar el atajo y elegir el estilo), cartel "cómo instalar" si la app se abrió en Safari sin instalar.

### Temas visuales

- **Minimalista:** degradados, colores lisos oscuros y texturas, generados en la app (anda offline).
- **Fotos:** fotos libres (Picsum/Pexels, sin necesidad de clave para Picsum), con una capa oscura para que el texto se lea. Necesita internet y tiene a Minimalista como respaldo.
- Cada estilo combina fondo, tipografía y color de texto.

## 7. Worker (Cloudflare)

| Ruta / tarea | Qué hace |
|---|---|
| `GET /frases?desde=<version>` | Devuelve frases curadas y de ZenQuotes posteriores a la versión que ya tiene la app |
| `GET /frase-del-dia?temas=...` | Devuelve la 🔥 Clave del día |
| `GET /wallpaper?temas=...&zona=...&estilo=...` | Redirige (302) a la imagen ya generada de la frase del día |
| `POST /suscripcion` / `DELETE /suscripcion` | Guarda o borra la suscripción push (endpoint, horario, cantidad, temas, zona horaria) |
| Cron diario | Trae unas 20 frases de ZenQuotes, las traduce con MyMemory, las guarda en KV como ➖ Normal. Además lee `frases.json` de GitHub y lo cachea |
| Cron cada minuto | Manda como máximo una notificación Web Push (VAPID) por corrida; cada usuario tiene un minuto fijo dentro de la ventana de 15 minutos de su horario |

- Las notificaciones de cada usuario se reparten dentro de su horario (o una cada N horas). La primera del día es la frase del día; las demás son ✅ Buenas o 🔥 Clave de sus temas.
- La notificación incluye el texto completo de la frase. Al tocarla, la app se abre con una **vista previa**: la frase como imagen, con botones para guardarla o compartirla y para seguir al feed. (iOS no permite imágenes dentro de las notificaciones de apps web.)
- Las suscripciones vencidas (respuesta 404/410 del servicio de push) se borran automáticamente.
- No se guardan datos personales, solo la suscripción push y las preferencias.

### Wallpaper legible

- El tercio superior queda libre para el reloj de iOS. La frase va centrada, un poco por debajo de la mitad.
- Letra grande, de alto contraste. El tamaño se ajusta al largo de la frase.
- 3 estilos: **Negro puro**, **Degradado oscuro**, **Foto oscurecida**.
- Se genera **al publicar la app** (satori + resvg + JPEG, en Node), una imagen por cada frase Clave y estilo, en `wallpapers/<estilo>/<id>.jpg` de Cloudflare Pages. Generarlas en el Worker gratis no entra en los 10 ms de CPU por pedido (cada una lleva ~1 s). Una curada Clave nueva necesita volver a publicar la app para tener imagen; mientras tanto se usa una Clave de la base.

## 8. Atajo de iPhone

- Se distribuye como un link de iCloud al atajo, generado una vez.
- Pasos del atajo: obtener el contenido de la URL de `/wallpaper` con los parámetros del usuario (sigue la redirección) → poner como fondo de pantalla bloqueada.
- El usuario crea una automatización diaria en Atajos ("Ejecutar inmediatamente"). La app muestra los parámetros personalizados para copiar y una guía con capturas.

## 9. Manejo de errores

- **Sin internet:** la app usa las frases locales y los fondos Minimalista.
- **Falla ZenQuotes o MyMemory:** ese día no se agregan frases traducidas y el resto sigue igual.
- **Falla el Worker:** la app sigue funcionando y no hay notificaciones ni wallpaper nuevo mientras tanto.
- **Push no soportado** (iOS < 16.4 o app no instalada): Ajustes lo explica y muestra cómo instalarla.

## 10. Pruebas

- **Tests unitarios:** selección del feed (proporción nuevas/likes, cooldown de 7 días, pesos por nivel, repetición cuando se acaban las nuevas), frase del día determinista y filtrado de malas traducciones.
- **Tests del Worker:** rutas, cron de ZenQuotes con respuestas simuladas y armado del wallpaper.
- **Manual en iPhone:** instalación de la PWA, notificaciones push, atajo y wallpaper. Link de prueba antes de pasarla a los amigos.

## 11. Fuera de alcance (por ahora)

- Cuentas o funciones sociales (ver los likes de amigos, mandar frases dentro de la app).
- Subir fotos propias como fondo.
- Widgets nativos y app nativa (Android/iOS).
- Generación de frases con IA.
- Frases en inglés.

## 12. Costos

Cloudflare Pages, Workers (plan gratis, 100.000 pedidos por día), KV (plan gratis) y GitHub son gratis. ZenQuotes y MyMemory son gratis con sus límites. **Total: $0.**

## 13. Límites del plan gratis (decisiones de implementación)

- **CPU 10 ms por pedido (Workers):** el cron diario precalcula en KV lo que piden `/frases`, la frase del día y las notificaciones; los wallpapers se generan al publicar; se manda una notificación por minuto (~6 ms cada una).
- **KV:** 100.000 lecturas, 1.000 escrituras y 1.000 listados por día. Las suscripciones se guardan en un índice (`subs`) con los horarios, así cada minuto se hace una sola lectura cuando no le toca a nadie. Hasta 15 usuarios pueden compartir el mismo horario.
