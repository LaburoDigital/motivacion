import { useEffect, useRef } from "react";
import type { Frase } from "shared";
import { Fondo } from "../visual/Fondo";
import type { EstiloVisual } from "../visual/estilos";

interface Props {
  frase: Frase;
  estilo: EstiloVisual;
  liked: boolean;
  delDia?: boolean;
  onLike: () => void;
  onCompartir: () => void;
  onCambiarFondo: () => void;
  onMantener: () => void;
  onVisible: () => void;
}

const MANTENER_MS = 500;

export function tamanoTexto(texto: string): "grande" | "medio" | "chico" {
  if (texto.length > 180) return "chico";
  if (texto.length > 90) return "medio";
  return "grande";
}

export function TarjetaFrase({ frase, estilo, liked, delDia, onLike, onCompartir, onCambiarFondo, onMantener, onVisible }: Props) {
  const ref = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const visible = useRef(onVisible);
  visible.current = onVisible;

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && visible.current(), { threshold: 0.6 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const soltar = () => clearTimeout(timer.current);

  return (
    <section ref={ref} className="tarjeta" data-testid="tarjeta">
      <Fondo estilo={estilo}>
        {delDia && <div className="etiqueta-dia">🔥 Frase del día</div>}
        <blockquote
          data-testid="tarjeta-texto"
          className={`frase frase-${tamanoTexto(frase.texto)}`}
          onDoubleClick={onLike}
          onPointerDown={() => { timer.current = setTimeout(onMantener, MANTENER_MS); }}
          onPointerUp={soltar}
          onPointerLeave={soltar}
          onPointerCancel={soltar}
          onContextMenu={(e) => e.preventDefault()}
        >
          <p>{frase.texto}</p>
          {frase.autor && <footer>— {frase.autor}</footer>}
        </blockquote>
        <div className="acciones">
          <button aria-label={liked ? "Quitar me gusta" : "Me gusta"} onClick={onLike}>{liked ? "❤️" : "🤍"}</button>
          <button aria-label="Compartir" onClick={onCompartir}>📤</button>
          <button aria-label="Cambiar fondo" onClick={onCambiarFondo}>🔄</button>
        </div>
      </Fondo>
    </section>
  );
}
