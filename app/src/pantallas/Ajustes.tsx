import { IconBolt, IconChevronLeft, IconCopy, IconExternalLink } from "@tabler/icons-react";
import { useState } from "react";
import { ATAJO_URL, WORKER_URL } from "../config";
import {
  DibujoBloqueo, DibujoFondos, DibujoIcono, DibujoNotificaciones, DibujoRachas, DibujoTemas,
} from "../componentes/Dibujos";
import { Diagnostico } from "../componentes/Diagnostico";
import { GuiaAtajo } from "../componentes/GuiaAtajo";
import { GuiaCrearAtajo } from "../componentes/GuiaCrearAtajo";
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
  { id: "foto", nombre: "Foto oscurecida" },
];

const FRECUENCIAS: { valor: string; nombre: string }[] = [
  { valor: "h1", nombre: "Cada 1 hora" },
  { valor: "h2", nombre: "Cada 2 horas" },
  { valor: "h3", nombre: "Cada 3 horas" },
  { valor: "h4", nombre: "Cada 4 horas" },
  ...[1, 2, 3, 4, 5].map((c) => ({ valor: `d${c}`, nombre: `${c} por día` })),
];

const aMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

function cuantasPorDia(n: PrefsNotificaciones): number {
  if (!n.cadaHoras) return n.cantidad;
  return Math.max(0, Math.floor((aMin(n.hasta) - aMin(n.desde)) / (n.cadaHoras * 60)) + 1);
}

export function urlWallpaper(prefs: Preferencias): string {
  const q = new URLSearchParams({ temas: prefs.temas.join(","), zona: prefs.zonaHoraria, estilo: prefs.estiloWallpaper });
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
  const horarioValido = n.desde < n.hasta;

  const cambiarNotif = async (cambio: Partial<PrefsNotificaciones>) => {
    const nuevo = { ...n, ...cambio };
    api.setPrefs({ notificaciones: nuevo });
    // Si ya estaban activas, reenviamos la config al Worker con los horarios nuevos.
    if (nuevo.activas && "activas" in cambio === false && nuevo.desde < nuevo.hasta) {
      await activarNotificaciones({ ...nuevo, temas: prefs.temas, zona: prefs.zonaHoraria, racha: avisoDeRacha(rachas ?? null) });
    }
  };

  const alternar = async (activar: boolean) => {
    setAviso(null);
    if (!activar) {
      await desactivarNotificaciones();
      api.setPrefs({ notificaciones: { ...n, activas: false } });
      return;
    }
    const r = await activarNotificaciones({
      cantidad: n.cantidad, cadaHoras: n.cadaHoras, desde: n.desde, hasta: n.hasta, temas: prefs.temas, zona: prefs.zonaHoraria,
      racha: avisoDeRacha(rachas ?? null),
    });
    if (r === "ok") api.setPrefs({ notificaciones: { ...n, activas: true } });
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
        <label className="fila">
          Frecuencia
          <select
            value={n.cadaHoras ? `h${n.cadaHoras}` : `d${n.cantidad}`}
            onChange={(e) => {
              const v = e.target.value;
              void cambiarNotif(v.startsWith("h") ? { cadaHoras: Number(v.slice(1)) } : { cantidad: Number(v.slice(1)), cadaHoras: null });
            }}
          >
            {FRECUENCIAS.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}
          </select>
        </label>
        <label className="fila">
          Desde
          <input type="time" step={900} value={n.desde} onChange={(e) => void cambiarNotif({ desde: e.target.value })} />
        </label>
        <label className="fila">
          Hasta
          <input type="time" step={900} value={n.hasta} onChange={(e) => void cambiarNotif({ hasta: e.target.value })} />
        </label>
        {!horarioValido && <p className="error">La hora de inicio tiene que ser antes que la de fin.</p>}
        {aviso && <p className="aviso">{aviso}</p>}
        {horarioValido && <p className="aviso">{cuantasPorDia(n)} notificaciones por día. La primera es siempre tu frase del día.</p>}
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
      <section className="seccion">
        <p className="aviso">Todas las mañanas tu fondo de pantalla bloqueada cambia a la frase del día, grande y con foto.</p>
        <label className="fila">
          Estilo
          <select
            value={prefs.estiloWallpaper}
            onChange={(e) => api.setPrefs({ estiloWallpaper: e.target.value as Preferencias["estiloWallpaper"] })}
          >
            {ESTILOS_WP.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
        {WORKER_URL && <img className="vista-previa" src={urlWallpaper(prefs)} alt="Vista previa del wallpaper de hoy" />}
        <button className="boton secundario" onClick={() => void copiar("link", urlWallpaper(prefs))}><IconCopy size={18} stroke={1.8} /> {copiado === "link" ? "Copiado" : "Copiar mi link"}</button>
        {ATAJO_URL ? (
          <>
            <a className="boton" href={ATAJO_URL} target="_blank" rel="noreferrer"><IconBolt size={18} stroke={1.8} /> Instalar atajo</a>
            <GuiaAtajo />
          </>
        ) : (
          <GuiaCrearAtajo />
        )}
        <p className="aviso">Si cambiás tus temas o el estilo, volvé a copiar el link y pegalo en el atajo.</p>
      </section>
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
