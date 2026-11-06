import { IconHeart, IconHeartFilled, IconPhoto, IconShare3 } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, type Frase } from "shared";
import { Fondo, type Apariencia } from "../visual/Fondo";

interface Props {
  frase: Frase;
  apariencia: Apariencia;
  liked: boolean;
  delDia?: boolean;
  onLike: () => void;
  /** Doble tap: solo da like (nunca lo saca), como en Instagram. */
  onDobleTap: () => void;
  onCompartir: () => void;
  onCambiarFondo: () => void;
  onMantener: () => void;
  onVisible: () => void;
}

const MANTENER_MS = 500;
const DOBLE_TAP_MS = 300;

export function tamanoTexto(texto: string): "grande" | "medio" | "chico" {
  if (texto.length > 180) return "chico";
  if (texto.length > 90) return "medio";
  return "grande";
}

export function TarjetaFrase({ frase, apariencia, liked, delDia, onLike, onDobleTap, onCompartir, onCambiarFondo, onMantener, onVisible }: Props) {
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

  const ultimoToque = useRef(0);
  const [corazones, setCorazones] = useState<number[]>([]);

  const soltar = () => clearTimeout(timer.current);
  const alSoltar = () => {
    soltar();
    const ahora = Date.now();
    if (ahora - ultimoToque.current < DOBLE_TAP_MS) {
      ultimoToque.current = 0;
      onDobleTap();
      const id = ahora;
      setCorazones((c) => [...c, id]);
      setTimeout(() => setCorazones((c) => c.filter((x) => x !== id)), 900);
    } else ultimoToque.current = ahora;
  };
  const { letra } = apariencia;
  const tema = CATEGORIAS.find((c) => c.id === frase.categoria)?.etiqueta;

  return (
    <section ref={ref} className="tarjeta" data-testid="tarjeta">
      <Fondo foto={apariencia.foto}>
        <div
          className="tarjeta-toque"
          data-testid="tarjeta-toque"
          onPointerDown={() => { timer.current = setTimeout(onMantener, MANTENER_MS); }}
          onPointerUp={alSoltar}
          onPointerLeave={soltar}
          onPointerCancel={soltar}
          onContextMenu={(e) => e.preventDefault()}
        />
        {corazones.map((id) => (
          <span key={id} className="corazon-grupo" aria-hidden>
            <span className="corazon-onda" />
            <IconHeartFilled className="corazon-animado" data-testid="corazon-animado" size={110} />
          </span>
        ))}
        <div className="tarjeta-arriba">
          {delDia ? <span className="etiqueta etiqueta-dia">Frase del día</span> : <span className="etiqueta">{tema}</span>}
        </div>
        <blockquote
          data-testid="tarjeta-texto"
          className={`frase frase-${tamanoTexto(frase.texto)}`}
          style={{
            fontFamily: letra.familia,
            fontWeight: letra.peso,
            textTransform: letra.mayusculas ? "uppercase" : undefined,
            ["--escala" as string]: letra.escala,
          }}
        >
          <p>{frase.texto}</p>
          {frase.autor && <footer>{frase.autor}</footer>}
        </blockquote>
        <div className="acciones">
          <button className={`accion ${liked ? "activa" : ""}`} aria-label={liked ? "Quitar me gusta" : "Me gusta"} onClick={onLike}>
            {liked ? <IconHeartFilled size={26} /> : <IconHeart size={26} stroke={1.6} />}
          </button>
          <button className="accion" aria-label="Compartir" onClick={onCompartir}>
            <IconShare3 size={26} stroke={1.6} />
          </button>
          <button className="accion" aria-label="Cambiar fondo" onClick={onCambiarFondo}>
            <IconPhoto size={26} stroke={1.6} />
          </button>
        </div>
      </Fondo>
    </section>
  );
}
