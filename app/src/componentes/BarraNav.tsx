import { IconBookmark, IconHome, IconLayoutGrid, IconSettings, type Icon } from "@tabler/icons-react";

export type Seccion = "inicio" | "temas" | "favoritos" | "ajustes";

const ITEMS: { id: Seccion; icono: Icon; nombre: string }[] = [
  { id: "inicio", icono: IconHome, nombre: "Inicio" },
  { id: "temas", icono: IconLayoutGrid, nombre: "Temas" },
  { id: "favoritos", icono: IconBookmark, nombre: "Favoritos" },
  { id: "ajustes", icono: IconSettings, nombre: "Ajustes" },
];

export function BarraNav({ actual, onCambiar }: { actual: Seccion; onCambiar: (s: Seccion) => void }) {
  return (
    <nav className="barra-nav" style={{ ["--activo" as string]: ITEMS.findIndex((i) => i.id === actual) }}>
      <span className="barra-pastilla" aria-hidden />
      {ITEMS.map(({ id, icono: Icono, nombre }) => (
        <button key={id} aria-current={actual === id ? "page" : undefined} onClick={() => onCambiar(id)}>
          <Icono size={22} stroke={1.6} aria-hidden />
          <small>{nombre}</small>
        </button>
      ))}
    </nav>
  );
}
