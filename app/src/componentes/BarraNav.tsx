export type Seccion = "inicio" | "temas" | "favoritos" | "ajustes";

const ITEMS: { id: Seccion; icono: string; nombre: string }[] = [
  { id: "inicio", icono: "🏠", nombre: "Inicio" },
  { id: "temas", icono: "🎨", nombre: "Temas" },
  { id: "favoritos", icono: "❤️", nombre: "Favoritos" },
  { id: "ajustes", icono: "⚙️", nombre: "Ajustes" },
];

export function BarraNav({ actual, onCambiar }: { actual: Seccion; onCambiar: (s: Seccion) => void }) {
  return (
    <nav className="barra-nav">
      {ITEMS.map((i) => (
        <button key={i.id} aria-current={actual === i.id ? "page" : undefined} onClick={() => onCambiar(i.id)}>
          <span aria-hidden>{i.icono}</span>
          <small>{i.nombre}</small>
        </button>
      ))}
    </nav>
  );
}
