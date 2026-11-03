import { IconCheck, IconSparkles, IconStar, IconStarFilled } from "@tabler/icons-react";
import { CATEGORIAS, FOTOS, PACKS, type CategoriaId, type Frase } from "shared";
import type { FrasesApi } from "../datos/useFrases";
import { poolDe, urlFoto } from "../visual/fondos";
import { LETRAS } from "../visual/letras";

const MUESTRA: Frase = { id: "muestra", texto: "", categoria: "superacion", nivel: "clave", fuente: "base" };

export function Temas({ api }: { api: FrasesApi }) {
  const prefs = api.prefs;
  if (!prefs) return null;

  const alternarTema = (id: CategoriaId) =>
    api.setPrefs({ temas: prefs.temas.includes(id) ? prefs.temas.filter((t) => t !== id) : [...prefs.temas, id] });

  const alternarFavorita = (id: string) =>
    api.setPrefs({
      fondosFavoritos: prefs.fondosFavoritos.includes(id)
        ? prefs.fondosFavoritos.filter((f) => f !== id)
        : [...prefs.fondosFavoritos, id],
    });

  // En "Automático" mostramos todas las fotos; con un grupo, solo las de ese grupo.
  const fotos = prefs.fondo === "auto" ? FOTOS : poolDe(MUESTRA, { ...prefs, soloFondosFavoritos: false });
  const portada = (pack: string) => FOTOS.find((f) => f.pack === pack)!;

  return (
    <div className="pantalla">
      <h1>Temas</h1>

      <section className="bloque">
        <h2>Frases sobre</h2>
        <div className="chips">
          <button className={`chip ${prefs.temas.length === 0 ? "activo" : ""}`} aria-pressed={prefs.temas.length === 0} onClick={() => api.setPrefs({ temas: [] })}>
            Mezcla general
          </button>
          {CATEGORIAS.map((c) => {
            const activo = prefs.temas.includes(c.id);
            return (
              <button key={c.id} className={`chip ${activo ? "activo" : ""}`} aria-pressed={activo} onClick={() => alternarTema(c.id)}>
                {c.etiqueta}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bloque">
        <h2>Fondos</h2>
        <div className="carrusel">
          <button
            className={`pack ${prefs.fondo === "auto" ? "activo" : ""}`}
            aria-label="Fondos: Automático"
            aria-pressed={prefs.fondo === "auto"}
            onClick={() => api.setPrefs({ fondo: "auto" })}
          >
            <span className="pack-auto"><IconSparkles size={28} stroke={1.5} /></span>
            <span className="pack-nombre">Automático</span>
          </button>
          {PACKS.map((p) => (
            <button
              key={p.id}
              className={`pack ${prefs.fondo === p.id ? "activo" : ""}`}
              aria-label={`Fondos: ${p.nombre}`}
              aria-pressed={prefs.fondo === p.id}
              onClick={() => api.setPrefs({ fondo: p.id })}
            >
              <img src={urlFoto(portada(p.id), 240, 400)} alt="" loading="lazy" />
              <span className="pack-nombre">{p.nombre}</span>
            </button>
          ))}
        </div>
        <p className="aviso">
          {prefs.fondo === "auto" ? "Cada frase lleva una foto que combina con su tema." : "Tocá la estrella para guardar tus fotos favoritas."}
        </p>
        <label className="interruptor">
          <input
            type="checkbox"
            checked={prefs.soloFondosFavoritos}
            onChange={(e) => api.setPrefs({ soloFondosFavoritos: e.target.checked })}
          />
          Solo mis favoritas ({prefs.fondosFavoritos.length})
        </label>
        <div className="grilla-fotos">
          {fotos.map((f) => {
            const fav = prefs.fondosFavoritos.includes(f.id);
            return (
              <div key={f.id} className="foto-muestra">
                <img src={urlFoto(f, 240, 420)} alt="" loading="lazy" />
                <button className={`foto-estrella ${fav ? "activa" : ""}`} aria-label={fav ? "Quitar de favoritas" : "Marcar como favorita"} aria-pressed={fav} onClick={() => alternarFavorita(f.id)}>
                  {fav ? <IconStarFilled size={18} /> : <IconStar size={18} stroke={1.8} />}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bloque">
        <h2>Letra</h2>
        <div className="lista-letras">
          {LETRAS.map((l) => {
            const activa = prefs.letra === l.id;
            return (
              <button key={l.id} className={`letra ${activa ? "activa" : ""}`} aria-label={`Letra: ${l.nombre}`} aria-pressed={activa} onClick={() => api.setPrefs({ letra: l.id })}>
                <span className="letra-muestra" style={{ fontFamily: l.familia, fontWeight: l.peso, textTransform: l.mayusculas ? "uppercase" : undefined }}>
                  La disciplina es libertad
                </span>
                <span className="letra-nombre">{l.nombre}</span>
                {activa && <IconCheck size={18} stroke={2} className="letra-check" />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
