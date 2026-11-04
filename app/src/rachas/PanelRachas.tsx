import { IconCheck, IconFlame, IconTrash, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { cumplioHoy, diasRacha, type Racha, type TipoRacha } from "./logica";
import type { RachasApi } from "./useRachas";

function TarjetaRacha({ racha, api }: { racha: Racha; api: RachasApi }) {
  const [confirmar, setConfirmar] = useState(false);
  const dias = diasRacha(racha, api.hoy);
  const hecho = racha.tipo === "hacer" && cumplioHoy(racha, api.hoy);

  return (
    <li className="racha">
      <div className="racha-cabeza">
        <span className="racha-nombre">{racha.nombre}</span>
        <button className="racha-borrar" aria-label={`Borrar ${racha.nombre}`} onClick={() => api.borrar(racha.id)}>
          <IconTrash size={18} stroke={1.6} />
        </button>
      </div>
      <div className="racha-numero">
        <IconFlame size={30} stroke={1.6} className={dias > 0 ? "encendida" : ""} />
        <span data-testid="dias-racha">{dias}</span>
        <small>{dias === 1 ? "día" : "días"}</small>
      </div>
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
  const [error, setError] = useState(false);

  const crear = () => {
    if (!nombre.trim()) return setError(true);
    rachas.crear(nombre, tipo);
    setNombre("");
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
            <input
              className="campo"
              aria-label="Nombre de la racha"
              placeholder="Gym, comer sano, sin fumar…"
              value={nombre}
              maxLength={40}
              onChange={(e) => { setNombre(e.target.value); setError(false); }}
            />
            <div className="pestanas" role="radiogroup">
              <button role="radio" aria-checked={tipo === "hacer"} aria-selected={tipo === "hacer"} onClick={() => setTipo("hacer")}>Hacer algo</button>
              <button role="radio" aria-checked={tipo === "dejar"} aria-selected={tipo === "dejar"} onClick={() => setTipo("dejar")}>Dejar algo</button>
            </div>
            <p className="aviso">
              {tipo === "hacer" ? "Cada día tocás «Cumplí hoy». Si un día no lo marcás, vuelve a 0." : "Los días cuentan solos. Si recaés, lo marcás y empieza de nuevo."}
            </p>
            {error && <p className="error">Poné un nombre para tu racha.</p>}
            <button className="boton" onClick={crear}>Crear racha</button>
          </section>
        </>
      )}
    </div>
  );
}
