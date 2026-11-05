import { IconCheck, IconFlame, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { OPCIONES_RACHA, opcionRacha } from "shared";
import { iconoRacha } from "./iconos";
import { cumplioHoy, diasRacha, type Racha, type TipoRacha } from "./logica";
import type { RachasApi } from "./useRachas";

const MENSAJES_GENERALES = ["Un día a la vez. Hoy también cuenta.", "La constancia le gana a todo.", "Lo difícil se vuelve hábito."];

function mensajeDe(racha: Racha, dias: number): string {
  const lista = opcionRacha(racha.clase)?.mensajes ?? MENSAJES_GENERALES;
  return lista[dias % lista.length];
}

function TarjetaRacha({ racha, api }: { racha: Racha; api: RachasApi }) {
  const [confirmar, setConfirmar] = useState(false);
  const dias = diasRacha(racha, api.hoy);
  const hecho = racha.tipo === "hacer" && cumplioHoy(racha, api.hoy);
  const Icono = iconoRacha(racha.clase);

  return (
    <li className="racha">
      <div className="racha-cabeza">
        <span className="racha-nombre"><Icono size={20} stroke={1.7} /><span data-testid="nombre-racha">{racha.nombre}</span></span>
        <button className="racha-borrar" aria-label={`Borrar ${racha.nombre}`} onClick={() => api.borrar(racha.id)}>
          <IconTrash size={18} stroke={1.6} />
        </button>
      </div>
      <div className="racha-numero">
        <IconFlame size={30} stroke={1.6} className={dias > 0 ? "encendida" : ""} />
        <span data-testid="dias-racha" key={dias}>{dias}</span>
        <small>{dias === 1 ? "día" : "días"}</small>
      </div>
      <p className="racha-mensaje" data-testid="mensaje-racha">{mensajeDe(racha, dias)}</p>
      <p className="racha-record">Récord: {Math.max(racha.record, dias)} {Math.max(racha.record, dias) === 1 ? "día" : "días"}</p>
      {racha.tipo === "hacer" ? (
        <button className={`boton ${hecho ? "secundario" : ""}`} disabled={hecho} onClick={() => api.cumplir(racha.id)}>
          {hecho ? <><IconCheck size={18} /> Hecho hoy</> : "Cumplí hoy"}
        </button>
      ) : confirmar ? (
        <div className="racha-confirmar">
          <button className="boton" onClick={() => { api.recaer(racha.id); setConfirmar(false); }}>Sí, empezar de nuevo</button>
          <button className="boton secundario" onClick={() => setConfirmar(false)}>Cancelar</button>
        </div>
      ) : (
        <button className="boton secundario" onClick={() => setConfirmar(true)}>Recaí</button>
      )}
    </li>
  );
}

export function PanelRachas({ rachas, onCerrar }: { rachas: RachasApi; onCerrar: () => void }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoRacha>("hacer");
  const [clase, setClase] = useState<string | null>(null);
  const [diasPrevios, setDiasPrevios] = useState("");
  const [error, setError] = useState(false);

  const elegirTipo = (t: TipoRacha) => {
    setTipo(t);
    // Si había elegido una opción armada, no corresponde al otro tipo; lo que escribió a mano se mantiene.
    if (clase) {
      setClase(null);
      setNombre("");
    }
  };
  const elegirOpcion = (id: string | null) => {
    setClase(id);
    setNombre(id ? opcionRacha(id)!.nombre : "");
    setError(false);
  };
  const crear = () => {
    if (!nombre.trim()) return setError(true);
    rachas.crear(nombre, tipo, { diasPrevios: Math.min(3650, Math.max(0, Number(diasPrevios) || 0)), clase });
    setNombre("");
    setClase(null);
    setDiasPrevios("");
    setError(false);
  };

  return (
    <div className="panel" role="dialog" aria-label="Tus rachas">
      <div className="panel-cabeza">
        <h1>Rachas</h1>
        <button className="accion" aria-label="Cerrar" onClick={onCerrar}><IconX size={22} stroke={1.7} /></button>
      </div>
      <p className="aviso">Se guardan solo en tu celular. Las notificaciones nunca dicen el nombre de tu racha.</p>

      {rachas.cargado && (
        <>
          <ul className="lista-rachas">
            {rachas.lista.map((r) => <TarjetaRacha key={r.id} racha={r} api={rachas} />)}
          </ul>

          <section className="seccion">
            <h2>Nueva racha</h2>
            <div className="pestanas" role="radiogroup">
              <button role="radio" aria-checked={tipo === "hacer"} aria-selected={tipo === "hacer"} onClick={() => elegirTipo("hacer")}>Empezar algo</button>
              <button role="radio" aria-checked={tipo === "dejar"} aria-selected={tipo === "dejar"} onClick={() => elegirTipo("dejar")}>Dejar algo</button>
            </div>
            <div className="opciones-racha">
              {OPCIONES_RACHA.filter((o) => o.tipo === tipo).map((o) => {
                const Icono = iconoRacha(o.id);
                return (
                  <button key={o.id} className={`opcion-racha ${clase === o.id ? "activa" : ""}`} aria-label={o.etiqueta} aria-pressed={clase === o.id} onClick={() => elegirOpcion(o.id)}>
                    <Icono size={24} stroke={1.6} />
                    <span>{o.etiqueta}</span>
                  </button>
                );
              })}
              <button className={`opcion-racha ${clase === null && nombre === "" ? "" : ""}`} aria-label="Otra" onClick={() => elegirOpcion(null)}>
                <IconPencil size={24} stroke={1.6} />
                <span>Otra</span>
              </button>
            </div>
            <input
              className="campo"
              aria-label="Nombre de la racha"
              placeholder={tipo === "hacer" ? "Gym, leer, tomar agua…" : "Sin fumar, sin azúcar…"}
              value={nombre}
              maxLength={40}
              onChange={(e) => { setNombre(e.target.value); setClase(null); setError(false); }}
            />
            <label className="fila">
              Días que ya llevás
              <input
                className="campo campo-corto" type="number" inputMode="numeric" min={0} max={3650} placeholder="0"
                aria-label="Días que ya llevás" value={diasPrevios} onChange={(e) => setDiasPrevios(e.target.value)}
              />
            </label>
            <p className="aviso">
              {tipo === "hacer" ? "Cada día tocás «Cumplí hoy». Si un día no lo marcás, vuelve a 0." : "Los días cuentan solos. Si recaés, lo marcás y empieza de nuevo."}
            </p>
            {error && <p className="error">Elegí una opción o poné un nombre para tu racha.</p>}
            <button className="boton" onClick={crear}>Crear racha</button>
          </section>
        </>
      )}
    </div>
  );
}
