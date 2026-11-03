import { useState } from "react";
import type { Frase } from "shared";
import { compartirFrase } from "../compartir/imagenFrase";
import { Pestanas } from "../componentes/Pestanas";
import type { FrasesApi } from "../datos/useFrases";
import { Fondo } from "../visual/Fondo";
import { ESTILO_RESPALDO, estiloPorId, urlFoto, type EstiloVisual } from "../visual/estilos";

export function Favoritos({ api }: { api: FrasesApi }) {
  const [pestana, setPestana] = useState<"Frases" | "Fondos">("Frases");
  const [abierta, setAbierta] = useState<Frase | null>(null);
  const { estado, todas, prefs } = api;

  const porId = new Map(todas.map((f) => [f.id, f]));
  const likes = Object.entries(estado.likes)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => porId.get(id))
    .filter((f): f is Frase => !!f);
  const fondos = (prefs?.fondosFavoritos ?? []).map(estiloPorId).filter((e): e is EstiloVisual => !!e);
  const estilo = (prefs && estiloPorId(prefs.estiloVisual)) || ESTILO_RESPALDO;

  return (
    <div className="pantalla">
      <h1>Favoritos</h1>
      <Pestanas opciones={["Frases", "Fondos"] as const} actual={pestana} onCambiar={setPestana} />

      {pestana === "Frases" ? (
        likes.length ? (
          <ul className="lista-favoritos">
            {likes.map((f) => (
              <li key={f.id} data-testid="favorito-frase" onClick={() => setAbierta(f)}>
                <p>{f.texto}</p>
                {f.autor && <small>— {f.autor}</small>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="vacio">Todavía no le diste ❤️ a ninguna frase. Tocá dos veces una frase para guardarla.</p>
        )
      ) : fondos.length ? (
        <div className="grilla-fondos">
          {fondos.map((e) => (
            <div
              key={e.id}
              className="fondo-muestra"
              style={{ background: e.tipo === "foto" ? `center/cover url(${urlFoto(e, 240, 420)})` : e.fondoCss, color: e.colorTexto }}
            >
              <span>{e.nombre}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="vacio">Todavía no marcaste fondos con ⭐. Hacelo desde Temas → Visual.</p>
      )}

      {abierta && (
        <div className="frase-abierta" onClick={() => setAbierta(null)}>
          <Fondo estilo={estilo}>
            <blockquote className="frase frase-medio">
              <p>{abierta.texto}</p>
              {abierta.autor && <footer>— {abierta.autor}</footer>}
            </blockquote>
            <div className="acciones">
              <button aria-label="Compartir" onClick={(e) => { e.stopPropagation(); void compartirFrase(abierta, estilo); }}>📤</button>
              <button aria-label="Cerrar" onClick={() => setAbierta(null)}>✕</button>
            </div>
          </Fondo>
        </div>
      )}
    </div>
  );
}
