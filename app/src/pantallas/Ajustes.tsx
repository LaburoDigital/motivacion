import { useState } from "react";
import { ATAJO_URL, WORKER_URL } from "../config";
import { GuiaAtajo } from "../componentes/GuiaAtajo";
import type { Preferencias, PrefsNotificaciones } from "../datos/almacen";
import { activarNotificaciones, desactivarNotificaciones, type ResultadoActivar } from "../datos/notificaciones";
import type { FrasesApi } from "../datos/useFrases";

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
    const r = await activarNotificaciones({ cantidad: n.cantidad, desde: n.desde, hasta: n.hasta, temas: prefs.temas, zona: prefs.zonaHoraria });
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
        <h2>🔔 Notificaciones</h2>
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
          Por día
          <select value={n.cantidad} onChange={(e) => void cambiarNotif({ cantidad: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((c) => <option key={c} value={c}>{c}</option>)}
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
        <p className="aviso">La primera del día es siempre tu 🔥 Frase del día.</p>
      </section>

      <section className="seccion">
        <h2>🔒 Pantalla bloqueada</h2>
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
        <button className="boton secundario" onClick={() => void copiar()}>{copiado ? "¡Copiado!" : "📋 Copiar mi link"}</button>
        <a className="boton" href={ATAJO_URL || undefined} target="_blank" rel="noreferrer">⚡ Instalar atajo</a>
        <GuiaAtajo />
        <p className="aviso">Si cambiás tus temas o el estilo, volvé a copiar el link y pegalo en el atajo.</p>
      </section>
    </div>
  );
}
