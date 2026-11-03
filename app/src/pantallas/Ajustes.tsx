import { IconApps, IconBell, IconBolt, IconCopy, IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { ATAJO_URL, WORKER_URL } from "../config";
import { GuiaAtajo } from "../componentes/GuiaAtajo";
import type { Preferencias, PrefsNotificaciones } from "../datos/almacen";
import { activarNotificaciones, desactivarNotificaciones, type ResultadoActivar } from "../datos/notificaciones";
import type { FrasesApi } from "../datos/useFrases";
import { ICONOS_APP, aplicarIcono, urlIcono } from "../visual/iconos";

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

export function Ajustes({ api }: { api: FrasesApi }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const prefs = api.prefs;
  if (!prefs) return null;
  const n = prefs.notificaciones;
  const horarioValido = n.desde < n.hasta;

  const cambiarNotif = async (cambio: Partial<PrefsNotificaciones>) => {
    const nuevo = { ...n, ...cambio };
    api.setPrefs({ notificaciones: nuevo });
    // Si ya estaban activas, reenviamos la config al Worker con los horarios nuevos.
    if (nuevo.activas && "activas" in cambio === false && nuevo.desde < nuevo.hasta) {
      await activarNotificaciones({ ...nuevo, temas: prefs.temas, zona: prefs.zonaHoraria });
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
    });
    if (r === "ok") api.setPrefs({ notificaciones: { ...n, activas: true } });
    else setAviso(MENSAJES[r]);
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(urlWallpaper(prefs));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="pantalla">
      <h1>Ajustes</h1>

      <section className="seccion">
        <h2><IconBell size={20} stroke={1.7} /> Notificaciones</h2>
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

      <section className="seccion">
        <h2><IconLock size={20} stroke={1.7} /> Pantalla bloqueada</h2>
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
        <button className="boton secundario" onClick={() => void copiar()}><IconCopy size={18} stroke={1.8} /> {copiado ? "Copiado" : "Copiar mi link"}</button>
        <a className="boton" href={ATAJO_URL || undefined} target="_blank" rel="noreferrer"><IconBolt size={18} stroke={1.8} /> Instalar atajo</a>
        <GuiaAtajo />
        <p className="aviso">Si cambiás tus temas o el estilo, volvé a copiar el link y pegalo en el atajo.</p>
      </section>
      <section className="seccion">
        <h2><IconApps size={20} stroke={1.7} /> Ícono de la app</h2>
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
        <p className="aviso">Para ver el ícono nuevo, borrá la app de la pantalla de inicio y volvé a agregarla desde Safari. Tus frases y favoritos no se pierden.</p>
      </section>
    </div>
  );
}
