import { IconBolt, IconChevronLeft, IconChevronRight, IconCopy, IconExternalLink, IconMinus, IconPlus } from "@tabler/icons-react";
import { CATEGORIAS } from "shared";
import { useState } from "react";
import { ATAJO_URL, WORKER_URL } from "../config";
import {
  DibujoBloqueo, DibujoFondos, DibujoIcono, DibujoNotificaciones, DibujoRachas, DibujoTemas,
} from "../componentes/Dibujos";
import { Diagnostico } from "../componentes/Diagnostico";
import { Pestanas } from "../componentes/Pestanas";
import type { Preferencias, PrefsNotificaciones } from "../datos/almacen";
import { activarNotificaciones, desactivarNotificaciones, type ResultadoActivar } from "../datos/notificaciones";
import type { FrasesApi } from "../datos/useFrases";
import { avisoDeRacha } from "../datos/useResincronizar";
import type { RachasApi } from "../rachas/useRachas";
import { ICONOS_APP, aplicarIcono, urlIcono } from "../visual/iconos";
import { scriptWidget } from "../visual/widget";

type Vista = "notificaciones" | "rachas" | "bloqueo" | "icono";

const SCRIPTABLE_URL = "https://apps.apple.com/app/scriptable/id1405459188";

const MENSAJES: Record<Exclude<ResultadoActivar, "ok">, string> = {
  "sin-soporte": "Instalá la app en tu pantalla de inicio para recibir notificaciones (iOS 16.4 o más).",
  denegado: "Las notificaciones están bloqueadas. Activalas en Ajustes de iOS → Notificaciones → Motivación.",
  error: "No se pudo activar. Revisá tu conexión y probá de nuevo.",
};

const ESTILOS_WP: { id: Preferencias["estiloWallpaper"]; nombre: string }[] = [
  { id: "negro", nombre: "Negro puro" },
  { id: "degradado", nombre: "Degradado oscuro" },
  { id: "foto", nombre: "Foto como en la app" },
];

const DIAS = [
  { n: 0, corto: "D", nombre: "Domingo" },
  { n: 1, corto: "L", nombre: "Lunes" },
  { n: 2, corto: "M", nombre: "Martes" },
  { n: 3, corto: "M", nombre: "Miércoles" },
  { n: 4, corto: "J", nombre: "Jueves" },
  { n: 5, corto: "V", nombre: "Viernes" },
  { n: 6, corto: "S", nombre: "Sábado" },
];

const aMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const deMin = (m: number) => {
  const x = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};

/** Cuántas por día: con "cada N horas" (versiones viejas) se calcula sobre el horario, que puede cruzar la medianoche. */
function cuantasPorDia(n: PrefsNotificaciones): number {
  if (!n.cadaHoras) return n.cantidad;
  let rango = aMin(n.hasta) - aMin(n.desde);
  if (rango <= 0) rango += 1440;
  return Math.min(24, Math.max(1, Math.floor(rango / (n.cadaHoras * 60)) + 1));
}

function Paso({ titulo, valor, onMenos, onMas, etiquetaMenos, etiquetaMas, testId }: {
  titulo: string; valor: string; onMenos: () => void; onMas: () => void; etiquetaMenos: string; etiquetaMas: string; testId?: string;
}) {
  return (
    <div className="fila paso">
      <span>{titulo}</span>
      <div className="paso-controles">
        <button className="paso-boton" aria-label={etiquetaMenos} onClick={onMenos}><IconMinus size={18} stroke={2.2} /></button>
        <span className="paso-valor" data-testid={testId} key={valor}>{valor}</span>
        <button className="paso-boton" aria-label={etiquetaMas} onClick={onMas}><IconPlus size={18} stroke={2.2} /></button>
      </div>
    </div>
  );
}

export function urlWallpaper(prefs: Preferencias): string {
  const q = new URLSearchParams({ temas: prefs.temas.join(","), zona: prefs.zonaHoraria, estilo: prefs.estiloWallpaper });
  if (prefs.estiloWallpaper === "foto") q.set("fondo", prefs.fondo);
  if (prefs.fondoCambia) q.set("cambio", "hora");
  return `${WORKER_URL}/wallpaper?${q}`;
}

interface Props {
  api: FrasesApi;
  rachas?: RachasApi;
  onAbrirRachas?: () => void;
  onIrATemas?: () => void;
}

export function Ajustes({ api, rachas, onAbrirRachas, onIrATemas }: Props) {
  const [vista, setVista] = useState<Vista | null>(null);
  const [toques, setToques] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [modoBloqueo, setModoBloqueo] = useState<"Fondo de pantalla" | "Widget de texto">("Fondo de pantalla");
  const prefs = api.prefs;
  if (!prefs) return null;
  const n = prefs.notificaciones;
  const cantidad = cuantasPorDia(n);
  const dias = n.dias ?? [0, 1, 2, 3, 4, 5, 6];
  const horarioValido = n.desde !== n.hasta;

  const cambiarNotif = async (cambio: Partial<PrefsNotificaciones>) => {
    const nuevo = { ...n, cantidad, cadaHoras: null, dias, ...cambio };
    api.setPrefs({ notificaciones: nuevo });
    // Si ya estaban activas, reenviamos la config al Worker con los horarios nuevos.
    if (nuevo.activas && "activas" in cambio === false && nuevo.desde !== nuevo.hasta) {
      await activarNotificaciones({ ...nuevo, temas: prefs.temas, zona: prefs.zonaHoraria, racha: avisoDeRacha(rachas ?? null) });
    }
  };
  const alternarDia = (d: number) => {
    if (dias.includes(d) && dias.length === 1) return;
    void cambiarNotif({ dias: dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d].sort() });
  };
  const temasTexto = prefs.temas.length
    ? prefs.temas.length === 1 ? CATEGORIAS.find((c) => c.id === prefs.temas[0])?.etiqueta : `${prefs.temas.length} temas`
    : "Mezcla general";

  const alternar = async (activar: boolean) => {
    setAviso(null);
    if (!activar) {
      await desactivarNotificaciones();
      api.setPrefs({ notificaciones: { ...n, activas: false } });
      return;
    }
    const r = await activarNotificaciones({
      cantidad, cadaHoras: null, desde: n.desde, hasta: n.hasta, dias, temas: prefs.temas, zona: prefs.zonaHoraria,
      racha: avisoDeRacha(rachas ?? null),
    });
    if (r === "ok") api.setPrefs({ notificaciones: { ...n, cantidad, cadaHoras: null, dias, activas: true } });
    else setAviso(MENSAJES[r]);
  };

  const copiar = async (que: string, texto: string) => {
    await navigator.clipboard.writeText(texto);
    setCopiado(que);
    setTimeout(() => setCopiado(null), 2000);
  };

  if (!vista) {
    const tarjetas: { id: string; titulo: string; dibujo: JSX.Element; accion: () => void; ancha?: boolean }[] = [
      { id: "temas", titulo: "Temas que seguís", dibujo: <DibujoTemas />, accion: () => onIrATemas?.() },
      { id: "fondos", titulo: "Fondos y letra", dibujo: <DibujoFondos />, accion: () => onIrATemas?.() },
      { id: "notificaciones", titulo: "Notificaciones", dibujo: <DibujoNotificaciones />, accion: () => setVista("notificaciones") },
      ...(rachas ? [{ id: "rachas", titulo: "Rachas", dibujo: <DibujoRachas />, accion: () => setVista("rachas") }] : []),
      { id: "bloqueo", titulo: "Pantalla bloqueada", dibujo: <DibujoBloqueo />, accion: () => setVista("bloqueo") },
      { id: "icono", titulo: "Ícono de la app", dibujo: <DibujoIcono />, accion: () => setVista("icono") },
    ];
    return (
      <div className="pantalla">
        <h1>Ajustes</h1>
        <div className="grilla-ajustes">
          {tarjetas.map((t) => (
            <button key={t.id} className="tarjeta-ajuste" aria-label={t.titulo} onClick={t.accion}>
              <span className="tarjeta-dibujo">{t.dibujo}</span>
              <span className="tarjeta-titulo">{t.titulo}</span>
            </button>
          ))}
        </div>
        <p className="pie-ajustes" onClick={() => setToques((t) => t + 1)}>Hecha con ganas, gratis y sin publicidad.</p>
        {toques >= 3 && <Diagnostico />}
      </div>
    );
  }

  const titulos: Record<Vista, string> = {
    notificaciones: "Notificaciones", rachas: "Rachas", bloqueo: "Pantalla bloqueada", icono: "Ícono de la app",
  };

  return (
    <div className="pantalla">
      <div className="cabeza-sub">
        <button className="accion" aria-label="Volver" onClick={() => setVista(null)}><IconChevronLeft size={22} stroke={1.8} /></button>
        <h1>{titulos[vista]}</h1>
      </div>

      {vista === "notificaciones" && (
      <section className="seccion">
        <label className="fila">
          Recibir notificaciones
          <input
            type="checkbox"
            checked={n.activas}
            disabled={!horarioValido}
            onChange={(e) => void alternar(e.target.checked)}
          />
        </label>
        <button className="fila fila-boton" onClick={() => onIrATemas?.()}>
          <span>Frases sobre</span>
          <span className="fila-valor">{temasTexto} <IconChevronRight size={18} stroke={1.8} /></span>
        </button>
        <Paso
          titulo="Cantidad" valor={`${cantidad}x`} testId="cantidad"
          etiquetaMenos="Menos notificaciones" etiquetaMas="Más notificaciones"
          onMenos={() => void cambiarNotif({ cantidad: Math.max(1, cantidad - 1) })}
          onMas={() => void cambiarNotif({ cantidad: Math.min(24, cantidad + 1) })}
        />
        <Paso
          titulo="Desde las" valor={n.desde}
          etiquetaMenos="Desde: más temprano" etiquetaMas="Desde: más tarde"
          onMenos={() => void cambiarNotif({ desde: deMin(aMin(n.desde) - 30) })}
          onMas={() => void cambiarNotif({ desde: deMin(aMin(n.desde) + 30) })}
        />
        <Paso
          titulo="Hasta las" valor={n.hasta}
          etiquetaMenos="Hasta: más temprano" etiquetaMas="Hasta: más tarde"
          onMenos={() => void cambiarNotif({ hasta: deMin(aMin(n.hasta) - 30) })}
          onMas={() => void cambiarNotif({ hasta: deMin(aMin(n.hasta) + 30) })}
        />
        <div className="repetir">
          <span>Repetir</span>
          <div className="dias">
            {DIAS.map((d) => (
              <button key={d.n} className={`dia ${dias.includes(d.n) ? "activo" : ""}`} aria-label={d.nombre} aria-pressed={dias.includes(d.n)} onClick={() => alternarDia(d.n)}>
                {d.corto}
              </button>
            ))}
          </div>
        </div>
        {!horarioValido && <p className="error">"Desde" y "hasta" no pueden ser iguales.</p>}
        {aviso && <p className="aviso">{aviso}</p>}
        {horarioValido && (
          <p className="aviso">
            {cantidad} {cantidad === 1 ? "notificación" : "notificaciones"} por día, de {n.desde} a {n.hasta}
            {aMin(n.hasta) < aMin(n.desde) ? " (del día siguiente)" : ""}. La primera es tu frase del día. El sonido es el de iOS.
          </p>
        )}
      </section>
      )}

      {vista === "rachas" && rachas && (
        <section className="seccion">
          <label className="fila">
            Activar rachas
            <input type="checkbox" checked={rachas.activas} onChange={(e) => rachas.setActivas(e.target.checked)} />
          </label>
          {rachas.activas && (
            <label className="fila">
              Hora del aviso de racha
              <input type="time" step={900} value={rachas.hora} onChange={(e) => rachas.setHora(e.target.value)} />
            </label>
          )}
          <button className="boton secundario" onClick={onAbrirRachas}>
            Ver mis rachas{rachas.lista.length ? ` (${rachas.lista.length})` : ""}
          </button>
          <p className="aviso">
            {n.activas
              ? "Todos los días a esa hora te llega un aviso para que no cortes tu racha. Nunca dice el nombre."
              : "Activá las notificaciones para recibir el aviso diario de tu racha."}
          </p>
        </section>
      )}

      {vista === "bloqueo" && (
      <>
      <Pestanas opciones={["Fondo de pantalla", "Widget de texto"] as const} actual={modoBloqueo} onCambiar={setModoBloqueo} />
      {modoBloqueo === "Fondo de pantalla" ? (
      <>
      <section className="seccion">
        <p className="lema">Todas las mañanas tu pantalla bloqueada cambia sola a la frase del día, con foto.</p>
        {WORKER_URL && <img className="vista-previa" src={urlWallpaper(prefs)} alt="Vista previa del fondo de hoy" />}
        <label className="fila">
          Estilo
          <select
            value={prefs.estiloWallpaper}
            onChange={(e) => api.setPrefs({ estiloWallpaper: e.target.value as Preferencias["estiloWallpaper"] })}
          >
            {ESTILOS_WP.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
      </section>

      <p className="aviso">Se arma una sola vez, en 3 pasos:</p>
      <ol className="pasos">
        <li className="paso-tarjeta">
          <span className="paso-numero">1</span>
          <div>
            <strong>Copiá tu link</strong>
            <button className="boton" onClick={() => void copiar("link", urlWallpaper(prefs))}>
              <IconCopy size={18} stroke={1.8} /> {copiado === "link" ? "Copiado" : "Copiar mi link"}
            </button>
          </div>
        </li>
        <li className="paso-tarjeta">
          <span className="paso-numero">2</span>
          <div>
            <strong>Armá el atajo</strong>
            {ATAJO_URL ? (
              <>
                <a className="boton" href={ATAJO_URL} target="_blank" rel="noreferrer"><IconBolt size={18} stroke={1.8} /> Instalar atajo</a>
                <p className="aviso">Tocá <b>Agregar atajo</b> y pegá tu link cuando te lo pida.</p>
              </>
            ) : (
              <>
                <p className="aviso">En la app <b>Atajos</b> tocá <b>+</b> y agregá estas 3 acciones, en orden:</p>
                <ul className="acciones-atajo">
                  <li><b>Texto</b> → pegá tu link</li>
                  <li><b>Obtener contenido de URL</b></li>
                  <li><b>Establecer foto de fondo de pantalla</b> → Pantalla bloqueada, y apagá los dos interruptores</li>
                </ul>
                <p className="aviso">Tocá <b>▶︎</b> para probarlo.</p>
              </>
            )}
          </div>
        </li>
        <li className="paso-tarjeta">
          <span className="paso-numero">3</span>
          <div>
            <strong>Que se haga solo</strong>
            <p className="aviso">Atajos → <b>Automatización</b> → <b>+</b> → <b>Hora del día</b> → <b>07:00</b> → <b>Ejecutar inmediatamente</b> → elegí tu atajo.</p>
          </div>
        </li>
      </ol>

      <section className="seccion">
        <h2>Extra</h2>
        <label className="fila">
          Cambiar durante el día
          <input type="checkbox" checked={!!prefs.fondoCambia} onChange={(e) => api.setPrefs({ fondoCambia: e.target.checked })} />
        </label>
        {prefs.fondoCambia && (
          <p className="aviso">Copiá el link de nuevo y sumá más horas en el paso 3 (por ejemplo 13:00 y 19:00). Cada vez trae otra frase.</p>
        )}
        <p className="aviso">Si cambiás temas, estilo o fondos, copiá el link de nuevo y pegalo en el <b>Texto</b> del atajo.</p>
      </section>
      </>
      ) : (
      <section className="seccion">
        <p className="aviso">Tu fondo queda igual: la frase del día aparece en texto en un widget debajo del reloj. En el widget chico entran unas 3 líneas, así que las frases largas se cortan.</p>
        <ol className="guia">
          <li>Bajá la app gratis <strong>Scriptable</strong>.</li>
          <li>Tocá <strong>Copiar código del widget</strong>.</li>
          <li>En Scriptable tocá <strong>+</strong>, pegá el código y ponele de nombre <strong>Frase del día</strong>.</li>
          <li>Mantené apretada la pantalla bloqueada → <strong>Personalizar</strong> → tocá la zona de widgets → <strong>Scriptable</strong>.</li>
          <li>Tocá el widget, elegí el script <strong>Frase del día</strong> y listo.</li>
        </ol>
        <a className="boton secundario" href={SCRIPTABLE_URL} target="_blank" rel="noreferrer"><IconExternalLink size={18} stroke={1.8} /> Bajar Scriptable</a>
        <button className="boton" onClick={() => void copiar("widget", scriptWidget(prefs, WORKER_URL))}>
          <IconCopy size={18} stroke={1.8} /> {copiado === "widget" ? "Copiado" : "Copiar código del widget"}
        </button>
        <p className="aviso">También funciona como widget en la pantalla de inicio, con fondo oscuro y la frase completa.</p>
      </section>
      )}
      </>
      )}

      {vista === "icono" && (
      <section className="seccion">
        <div className="iconos-app">
          {ICONOS_APP.map((i) => (
            <button
              key={i.id}
              className={`icono-app ${prefs.icono === i.id ? "activo" : ""}`}
              aria-label={`Ícono: ${i.nombre}`}
              aria-pressed={prefs.icono === i.id}
              onClick={() => { api.setPrefs({ icono: i.id }); aplicarIcono(i.id); }}
            >
              <img src={urlIcono(i.id)} alt="" />
              <span>{i.nombre}</span>
            </button>
          ))}
        </div>
        <p className="aviso">Para ver el ícono nuevo hay que borrar la app de la pantalla de inicio y volver a agregarla desde Safari.</p>
        <p className="error">Ojo: al borrar la app se borran tus likes, favoritos y rachas.</p>
      </section>
      )}
    </div>
  );
}
