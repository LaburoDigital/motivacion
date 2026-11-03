import { useState } from "react";
import { CATEGORIAS, type CategoriaId } from "shared";
import { Pestanas } from "../componentes/Pestanas";
import type { FrasesApi } from "../datos/useFrases";
import { ESTILOS, urlFoto } from "../visual/estilos";

const EMOJI: Record<CategoriaId, string> = {
  disciplina: "🎯", estudio: "📚", gym: "🏋️", estoicismo: "🏛️",
  "amor-propio": "💛", exito: "🏆", calma: "🌊", superacion: "⛰️",
};

export function Temas({ api }: { api: FrasesApi }) {
  const [pestana, setPestana] = useState<"Contenido" | "Visual">("Contenido");
  const [tipo, setTipo] = useState<"Fotos" | "Minimalista">("Fotos");
  const prefs = api.prefs;
  if (!prefs) return null;

  const alternarTema = (id: CategoriaId) =>
    api.setPrefs({ temas: prefs.temas.includes(id) ? prefs.temas.filter((t) => t !== id) : [...prefs.temas, id] });

  const alternarFavorito = (id: string) =>
    api.setPrefs({
      fondosFavoritos: prefs.fondosFavoritos.includes(id)
        ? prefs.fondosFavoritos.filter((f) => f !== id)
        : [...prefs.fondosFavoritos, id],
    });

  const estilos = ESTILOS.filter((e) => (tipo === "Fotos" ? e.tipo === "foto" : e.tipo === "minimalista"));

  return (
    <div className="pantalla">
      <h1>Temas</h1>
      <Pestanas opciones={["Contenido", "Visual"] as const} actual={pestana} onCambiar={setPestana} />

      {pestana === "Contenido" ? (
        <div className="grilla-temas">
          <button
            className={`tema ${prefs.temas.length === 0 ? "activo" : ""}`}
            aria-pressed={prefs.temas.length === 0}
            onClick={() => api.setPrefs({ temas: [] })}
          >
            🎲 Mezcla general
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              className={`tema ${prefs.temas.includes(c.id) ? "activo" : ""}`}
              aria-pressed={prefs.temas.includes(c.id)}
              onClick={() => alternarTema(c.id)}
            >
              {EMOJI[c.id]} {c.etiqueta}
            </button>
          ))}
        </div>
      ) : (
        <>
          <Pestanas opciones={["Fotos", "Minimalista"] as const} actual={tipo} onCambiar={setTipo} />
          <label className="interruptor">
            <input
              type="checkbox"
              checked={prefs.soloFondosFavoritos}
              onChange={(e) => api.setPrefs({ soloFondosFavoritos: e.target.checked })}
            />
            Solo mis favoritos
          </label>
          <div className="grilla-fondos">
            {estilos.map((e) => (
              <div key={e.id} className={`fondo-muestra ${prefs.estiloVisual === e.id ? "activo" : ""}`}>
                <button
                  className="fondo-usar"
                  aria-label={`Usar ${e.nombre}`}
                  style={{
                    background: e.tipo === "foto" ? `center/cover url(${urlFoto(e, 240, 420)})` : e.fondoCss,
                    color: e.colorTexto,
                    fontFamily: e.fuente,
                  }}
                  onClick={() => api.setPrefs({ estiloVisual: e.id })}
                >
                  <span>{e.nombre}</span>
                </button>
                <button
                  className="fondo-estrella"
                  aria-label={`Favorito ${e.nombre}`}
                  aria-pressed={prefs.fondosFavoritos.includes(e.id)}
                  onClick={() => alternarFavorito(e.id)}
                >
                  {prefs.fondosFavoritos.includes(e.id) ? "⭐" : "☆"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
