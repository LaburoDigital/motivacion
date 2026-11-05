// Dibujos de línea para las tarjetas de Ajustes. Trazo claro, un detalle en ámbar y un poco de movimiento.
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const acento = { ...base, stroke: "var(--acento)" };

export function DibujoNotificaciones() {
  return (
    <svg viewBox="0 0 160 110" aria-hidden>
      <rect x="22" y="58" width="116" height="30" rx="12" {...base} opacity="0.35" />
      <rect x="14" y="40" width="132" height="34" rx="13" {...base} opacity="0.6" />
      <g className="anim-tiembla">
        <rect x="8" y="20" width="144" height="38" rx="14" {...base} />
        <circle cx="30" cy="39" r="9" {...acento} />
        <path d="M46 34h62M46 44h40" {...base} />
        <path d="M128 31v4M128 43h.01" {...acento} />
      </g>
    </svg>
  );
}

export function DibujoRachas() {
  const puntos = Array.from({ length: 7 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 7 - Math.PI / 2;
    return [80 + Math.cos(a) * 44, 56 + Math.sin(a) * 44];
  });
  return (
    <svg viewBox="0 0 160 110" aria-hidden>
      {puntos.map(([x, y], i) => (
        <circle
          key={i} cx={x} cy={y} r={i < 5 ? 5 : 4}
          {...(i < 5 ? acento : base)} fill={i < 5 ? "var(--acento)" : "none"} opacity={i < 5 ? 1 : 0.5}
          className={i < 5 ? "anim-punto" : undefined} style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
      <path className="anim-llama" d="M80 30c8 12 18 18 17 33-1 12-8 19-17 19s-17-7-17-18c0-8 5-13 9-17 1 7 3 10 7 12-2-9-2-18 1-29z" {...acento} />
    </svg>
  );
}

export function DibujoBloqueo() {
  return (
    <svg viewBox="0 0 160 110" aria-hidden>
      <rect x="44" y="4" width="72" height="130" rx="16" {...base} />
      <rect x="68" y="12" width="24" height="7" rx="3.5" {...base} />
      <text x="80" y="50" textAnchor="middle" fontSize="20" fontWeight="600" fill="currentColor" fontFamily="Outfit, system-ui">7:00</text>
      <g className="anim-brilla">
        <rect x="52" y="62" width="56" height="22" rx="7" {...acento} />
        <path d="M58 70h34M58 77h22" {...acento} />
      </g>
    </svg>
  );
}

export function DibujoIcono() {
  return (
    <svg viewBox="0 0 160 110" aria-hidden>
      <g className="anim-flota-lento">
        <rect x="18" y="34" width="38" height="38" rx="11" {...base} opacity="0.6" transform="rotate(-12 37 53)" />
        <path d="M31 63l6-12 6 12" {...base} opacity="0.6" transform="rotate(-12 37 53)" />
      </g>
      <g className="anim-flota-lento" style={{ animationDelay: "600ms" }}>
        <rect x="104" y="30" width="38" height="38" rx="11" {...base} opacity="0.6" transform="rotate(12 123 49)" />
        <path d="M128 40a8 8 0 1 0 4 14 10 10 0 0 1-4-14z" {...base} opacity="0.6" transform="rotate(12 123 49)" />
      </g>
      <g className="anim-flota">
        <rect x="56" y="22" width="48" height="48" rx="14" {...acento} />
        <path d="M80 32c5 7 11 11 10 20-1 7-5 11-10 11s-10-4-10-11c0-5 3-8 5-10 1 4 2 6 4 7-1-5-1-11 1-17z" {...acento} />
      </g>
      <path className="anim-destello" d="M50 88l3-3M110 90l3 3M80 94v4M30 20l2 2M134 14l-2 2" {...base} opacity="0.5" />
    </svg>
  );
}

export function DibujoTemas() {
  return (
    <svg viewBox="0 0 160 110" aria-hidden>
      <rect className="anim-chip" x="10" y="22" width="62" height="26" rx="13" {...acento} />
      <rect x="80" y="22" width="70" height="26" rx="13" {...base} />
      <rect x="10" y="56" width="48" height="26" rx="13" {...base} />
      <rect className="anim-chip" style={{ animationDelay: "1.2s" }} x="66" y="56" width="84" height="26" rx="13" {...base} opacity="0.6" />
      <path d="M24 35h34" {...acento} />
      <path d="M94 35h42M24 69h20M80 69h56" {...base} opacity="0.7" />
    </svg>
  );
}

export function DibujoFondos() {
  return (
    <svg viewBox="0 0 160 110" aria-hidden>
      <rect x="22" y="12" width="56" height="94" rx="12" {...base} opacity="0.55" transform="rotate(-8 50 59)" />
      <rect x="62" y="8" width="64" height="104" rx="14" {...base} />
      <circle className="anim-sol" cx="108" cy="30" r="7" {...acento} />
      <path d="M66 96l20-28 12 15 9-11 15 24" {...acento} />
      <text x="94" y="56" textAnchor="middle" fontSize="16" fill="currentColor" fontFamily="Playfair Display, serif">Aa</text>
    </svg>
  );
}

export function DibujoDatos() {
  return (
    <svg viewBox="0 0 160 110" aria-hidden>
      <path className="anim-flota-lento" d="M48 70a18 18 0 0 1 2-36 26 26 0 0 1 50-6 20 20 0 0 1 12 38z" {...base} />
      <g className="anim-flota">
        <rect x="64" y="52" width="32" height="26" rx="6" {...acento} />
        <path d="M70 52v-8a10 10 0 0 1 20 0v8" {...acento} />
        <circle cx="80" cy="65" r="3" {...acento} />
      </g>
      <path className="anim-destello" d="M40 92h20M70 96h20M100 92h20" {...base} opacity="0.5" />
    </svg>
  );
}
