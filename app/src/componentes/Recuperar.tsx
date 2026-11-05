import { useState } from "react";
import { recuperarRespaldo, type ResultadoRecuperar } from "../datos/respaldo";

const MENSAJES: Record<Exclude<ResultadoRecuperar, "ok">, string> = {
  invalido: "El código son 6 palabras separadas por guiones, por ejemplo llama-norte-rio-pan-sol-mar.",
  "no-existe": "No encontramos datos con ese código. Revisá que esté bien escrito.",
  error: "No se pudo conectar. Revisá tu internet y probá de nuevo.",
};

/** Campo para pegar el código de otro celular (o de antes de reinstalar) y traer todo. */
export function Recuperar() {
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const recuperar = async () => {
    setCargando(true);
    setMensaje(null);
    const r = await recuperarRespaldo(codigo);
    setCargando(false);
    if (r === "ok") location.reload();
    else setMensaje(MENSAJES[r]);
  };

  return (
    <div className="recuperar">
      <input
        className="campo" aria-label="Código para recuperar" placeholder="llama-norte-rio-pan-sol-mar"
        autoCapitalize="none" autoCorrect="off" spellCheck={false}
        value={codigo} onChange={(e) => { setCodigo(e.target.value); setMensaje(null); }}
      />
      <button className="boton" disabled={cargando || !codigo.trim()} onClick={() => void recuperar()}>
        {cargando ? "Recuperando…" : "Recuperar"}
      </button>
      {mensaje && <p className="error">{mensaje}</p>}
    </div>
  );
}
