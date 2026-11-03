import { IconShare3, IconX } from "@tabler/icons-react";
import { useState } from "react";
import type { Foto, Frase } from "shared";
import { compartirFrase } from "../compartir/imagenFrase";
import { Pestanas } from "../componentes/Pestanas";
import type { FrasesApi } from "../datos/useFrases";
import { Fondo } from "../visual/Fondo";
import { fondoPara, fotoPorId, urlFoto } from "../visual/fondos";
import { letraPorId } from "../visual/letras";

export function Favoritos({ api }: { api: FrasesApi }) {
  const [pestana, setPestana] = useState<"Frases" | "Fondos">("Frases");
  const [abierta, setAbierta] = useState<Frase | null>(null);
  const { estado, todas, prefs } = api;
  if (!prefs) return null;

  const porId = new Map(todas.map((f) => [f.id, f]));
  const likes = Object.entries(estado.likes)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => porId.get(id))
    .filter((f): f is Frase => !!f);
  const fondos = prefs.fondosFavoritos.map(fotoPorId).filter((f): f is Foto => !!f);
  const letra = letraPorId(prefs.letra);
  const apariencia = abierta ? { foto: fondoPara(abierta, prefs), letra } : null;

  return (
    <div className="pantalla">
      <h1>Favoritos</h1>
      <Pestanas opciones={["Frases", "Fondos"] as const} actual={pestana} onCambiar={setPestana} />

      {pestana === "Frases" ? (
        likes.length ? (
          <ul className="lista-favoritos">
            {likes.map((f) => (
              <li key={f.id} data-testid="favorito-frase" onClick={() => setAbierta(f)}>
                <img src={urlFoto(fondoPara(f, prefs), 160, 160)} alt="" loading="lazy" />
                <div>
                  <p>{f.texto}</p>
                  {f.autor && <small>{f.autor}</small>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vacio">Todavía no guardaste frases. Tocá dos veces una frase para guardarla acá.</p>
        )
      ) : fondos.length ? (
        <div className="grilla-fotos">
          {fondos.map((f) => (
            <div key={f.id} className="foto-muestra">
              <img src={urlFoto(f, 240, 420)} alt="Fondo favorito" loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <p className="vacio">Marcá fotos con la estrella en Temas → Fondos.</p>
      )}

      {abierta && apariencia && (
        <div className="frase-abierta" onClick={() => setAbierta(null)}>
          <Fondo foto={apariencia.foto}>
            <blockquote
              className="frase frase-medio"
              style={{ fontFamily: letra.familia, fontWeight: letra.peso, textTransform: letra.mayusculas ? "uppercase" : undefined, ["--escala" as string]: letra.escala }}
            >
              <p>{abierta.texto}</p>
              {abierta.autor && <footer>{abierta.autor}</footer>}
            </blockquote>
            <div className="acciones">
              <button className="accion" aria-label="Compartir" onClick={(e) => { e.stopPropagation(); void compartirFrase(abierta, apariencia); }}>
                <IconShare3 size={26} stroke={1.6} />
              </button>
              <button className="accion" aria-label="Cerrar" onClick={() => setAbierta(null)}>
                <IconX size={26} stroke={1.6} />
              </button>
            </div>
          </Fondo>
        </div>
      )}
    </div>
  );
}
