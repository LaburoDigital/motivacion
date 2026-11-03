interface Props<T extends string> {
  opciones: readonly T[];
  actual: T;
  onCambiar: (o: T) => void;
}

export function Pestanas<T extends string>({ opciones, actual, onCambiar }: Props<T>) {
  return (
    <div className="pestanas" role="tablist">
      {opciones.map((o) => (
        <button key={o} role="tab" aria-selected={o === actual} onClick={() => onCambiar(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}
