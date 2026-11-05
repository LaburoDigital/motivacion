import { IconBell, IconChevronLeft, IconSparkles } from "@tabler/icons-react";
import { useState } from "react";
import { CATEGORIAS, FOTOS, PACKS, type CategoriaId } from "shared";
import { Recuperar } from "../componentes/Recuperar";
import { activarNotificaciones } from "../datos/notificaciones";
import type { FrasesApi } from "../datos/useFrases";
import { urlFoto } from "../visual/fondos";

const PASOS = 3;

/** Lo primero que ve alguien nuevo: temas, fondo y notificaciones, en 30 segundos. */
export function Bienvenida({ api }: { api: FrasesApi }) {
  const [paso, setPaso] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [activadas, setActivadas] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const prefs = api.prefs;
  if (!prefs) return null;

  const terminar = () => api.setPrefs({ bienvenida: true });
  const alternarTema = (id: CategoriaId) =>
    api.setPrefs({ temas: prefs.temas.includes(id) ? prefs.temas.filter((t) => t !== id) : [...prefs.temas, id] });

  const activar = async () => {
    setAviso(null);
    const n = prefs.notificaciones;
    const r = await activarNotificaciones({ ...n, temas: prefs.temas, zona: prefs.zonaHoraria });
    if (r === "ok") {
      api.setPrefs({ notificaciones: { ...n, activas: true } });
      setActivadas(true);
    } else if (r === "sin-soporte") {
      setAviso("Para recibir notificaciones, primero instalá la app: tocá Compartir y después «Agregar a inicio». Las podés activar después en Ajustes.");
    } else if (r === "denegado") {
      setAviso("Quedaron bloqueadas. Las podés activar en Ajustes de iOS → Notificaciones → Motivación.");
    } else {
      setAviso("No se pudieron activar. Probá después desde Ajustes.");
    }
  };

  const portada = (pack: string) => FOTOS.find((f) => f.pack === pack)!;

  return (
    <div className="bienvenida" role="dialog" aria-label="Bienvenida">
      <div className="bienvenida-arriba">
        {paso > 0 ? (
          <button className="accion" aria-label="Atrás" onClick={() => setPaso(paso - 1)}><IconChevronLeft size={22} stroke={1.8} /></button>
        ) : <span />}
        <div className="puntos">{Array.from({ length: PASOS }, (_, i) => <span key={i} className={i === paso ? "activo" : ""} />)}</div>
        <span />
      </div>

      {paso === 0 && (
        <section className="bienvenida-paso">
          {recuperando ? (
            <div className="bienvenida-recuperar">
              <h1>Recuperá tus datos</h1>
              <p className="aviso">Pegá el código de 6 palabras que está en Ajustes → Tus datos de tu otra app.</p>
              <Recuperar />
              <button className="boton secundario" onClick={() => setRecuperando(false)}>Empezar de cero</button>
            </div>
          ) : (
            <button className="link-recuperar" onClick={() => setRecuperando(true)}>¿Ya tenía la app? Recuperá tus datos</button>
          )}
          <h1>¿Qué te mueve?</h1>
          <p className="aviso">Elegí de qué querés frases. Podés cambiarlo cuando quieras.</p>
          <div className="chips">
            <button className={`chip ${prefs.temas.length === 0 ? "activo" : ""}`} aria-pressed={prefs.temas.length === 0} onClick={() => api.setPrefs({ temas: [] })}>
              Mezcla general
            </button>
            {CATEGORIAS.map((c) => (
              <button key={c.id} className={`chip ${prefs.temas.includes(c.id) ? "activo" : ""}`} aria-pressed={prefs.temas.includes(c.id)} onClick={() => alternarTema(c.id)}>
                {c.etiqueta}
              </button>
            ))}
          </div>
        </section>
      )}

      {paso === 1 && (
        <section className="bienvenida-paso">
          <h1>Elegí tus fondos</h1>
          <p className="aviso">En Automático, cada frase lleva una foto que va con su tema.</p>
          <div className="grilla-packs">
            <button className={`pack ${prefs.fondo === "auto" ? "activo" : ""}`} aria-label="Fondos: Automático" aria-pressed={prefs.fondo === "auto"} onClick={() => api.setPrefs({ fondo: "auto" })}>
              <span className="pack-auto"><IconSparkles size={28} stroke={1.5} /></span>
              <span className="pack-nombre">Automático</span>
            </button>
            {PACKS.map((p) => (
              <button key={p.id} className={`pack ${prefs.fondo === p.id ? "activo" : ""}`} aria-label={`Fondos: ${p.nombre}`} aria-pressed={prefs.fondo === p.id} onClick={() => api.setPrefs({ fondo: p.id })}>
                <img src={urlFoto(portada(p.id), 240, 400)} alt="" loading="lazy" />
                <span className="pack-nombre">{p.nombre}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {paso === 2 && (
        <section className="bienvenida-paso bienvenida-centro">
          <div className="bienvenida-campana"><IconBell size={56} stroke={1.3} /></div>
          <h1>Una frase cada 2 horas</h1>
          <p className="aviso">De 8 a 22, y la primera del día es tu frase del día. Lo cambiás en Ajustes.</p>
          {aviso && <p className="aviso aviso-destacado">{aviso}</p>}
        </section>
      )}

      <div className="bienvenida-abajo">
        {paso < PASOS - 1 && <button className="boton" onClick={() => setPaso(paso + 1)}>Siguiente</button>}
        {paso === PASOS - 1 && !activadas && (
          <>
            <button className="boton" onClick={() => void activar()}>Activar notificaciones</button>
            <button className="boton secundario" onClick={terminar}>Ahora no</button>
          </>
        )}
        {paso === PASOS - 1 && activadas && <button className="boton" onClick={terminar}>Empezar</button>}
      </div>
    </div>
  );
}
