"use client";

import { useState } from "react";
import { useRemitos } from "../context/RemitosContext";
import { useUser } from "../context/UserContext";

export default function CierreDelDia({
  location,
}: {
  location: string;
}) {
  const {
    addCierre,
    addConfirmacionDevolucion,
    getCierreByDate,
    getConfirmacionByDate,
    getRemitoByDate,
  } = useRemitos();
  const { user } = useUser();

  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  const cierreHoy = getCierreByDate(location, hoy);
  const confirmacionAyer = getConfirmacionByDate(location, ayer);
  const remitoAyer = getRemitoByDate(location, ayer);

  /* ---------- ESTADO CIERRE ---------- */
  const [medParaDevolver, setMedParaDevolver] = useState("");
  const [medRellenaDesecho, setMedRellenaDesecho] = useState("");
  const [trenzasSobrantes, setTrenzasSobrantes] = useState("");
  const [latasCrudasQuedan, setLatasCrudasQuedan] = useState("");
  const [medCrudasQuedan, setMedCrudasQuedan] = useState("");
  const [obsCierre, setObsCierre] = useState("");
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  /* ---------- ESTADO CONFIRMACION FABRICA ---------- */
  const [medReconocidas, setMedReconocidas] = useState("");
  const [obsConfirmacion, setObsConfirmacion] = useState("");
  const [guardandoConf, setGuardandoConf] = useState(false);

  function formatFecha(d: Date) {
    return d.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  async function handleGuardarCierre() {
    if (!medParaDevolver || !trenzasSobrantes) {
      alert("Completá al menos medialunas para devolver y trenzas sobrantes");
      return;
    }
    setGuardandoCierre(true);
    try {
      await addCierre({
        location,
        fecha: hoy,
        medParaDevolver: Number(medParaDevolver),
        medRellenaDesecho: Number(medRellenaDesecho || 0),
        trenzasSobrantes: Number(trenzasSobrantes),
        latasCrudasQuedan: Number(latasCrudasQuedan || 0),
        medCrudasQuedan: Number(medCrudasQuedan || 0),
        observacion: obsCierre,
        creadoPor: user?.email ?? "desconocido",
      });
    } catch (err) {
      console.error(err);
      alert("Error al guardar el cierre");
    } finally {
      setGuardandoCierre(false);
    }
  }

  async function handleGuardarConfirmacion() {
    if (!medReconocidas) {
      alert("Ingresá las medialunas reconocidas por la fábrica");
      return;
    }
    setGuardandoConf(true);
    try {
      await addConfirmacionDevolucion({
        location,
        fecha: ayer,
        medReconocidas: Number(medReconocidas),
        observacion: obsConfirmacion,
        creadoPor: user?.email ?? "desconocido",
      });
    } catch (err) {
      console.error(err);
      alert("Error al guardar la confirmación");
    } finally {
      setGuardandoConf(false);
    }
  }

  const inputClass =
    "w-full bg-zinc-800 text-white text-2xl font-bold text-center rounded-xl p-4 border-2 border-zinc-700 focus:border-blue-500 outline-none";

  const labelClass =
    "text-zinc-400 text-sm uppercase tracking-wider mb-1 block";

  return (
    <div className="space-y-6 pb-10">

      {/* CONFIRMACION DEVOLUCION DE AYER */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Confirmacion fabrica</h2>
            <p className="text-zinc-400 text-sm capitalize">Lo que reconocieron de ayer — {formatFecha(ayer)}</p>
          </div>
          {confirmacionAyer && (
            <span className="bg-green-500/20 text-green-400 border border-green-500/40 px-3 py-1 rounded-full text-sm font-semibold">
              Cargado
            </span>
          )}
        </div>

        {cierreHoy === undefined && remitoAyer && (
          <div className="bg-zinc-800/50 rounded-xl p-3 mb-4 text-sm text-zinc-400">
            Remito de ayer: {remitoAyer.unidadesMedialunas} medialunas en {remitoAyer.latasMedialunas} latas
          </div>
        )}

        {confirmacionAyer ? (
          <div className="space-y-3">
            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <div className="text-zinc-400 text-xs uppercase mb-1">Reconocidas por fabrica</div>
              <div className="text-3xl font-bold text-green-400">
                {confirmacionAyer.medReconocidas}
              </div>
            </div>
            {confirmacionAyer.observacion && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-300 text-sm">
                {confirmacionAyer.observacion}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="text-white font-semibold">Medialunas que reconocio la fabrica</div>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={medReconocidas}
                onChange={(e) => setMedReconocidas(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Observacion</label>
              <textarea
                placeholder="Ej: no reconocieron 5 porque estaban en mal estado..."
                value={obsConfirmacion}
                onChange={(e) => setObsConfirmacion(e.target.value)}
                rows={2}
                className="w-full bg-zinc-800 text-white text-lg rounded-xl p-4 border-2 border-zinc-700 focus:border-blue-500 outline-none resize-none"
              />
            </div>
            <button
              onClick={handleGuardarConfirmacion}
              disabled={guardandoConf}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xl py-5 rounded-2xl transition active:scale-95"
            >
              {guardandoConf ? "Guardando..." : "Guardar confirmacion"}
            </button>
          </div>
        )}
      </div>

      {/* CIERRE DE HOY */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Cierre del dia</h2>
            <p className="text-zinc-400 text-sm capitalize">{formatFecha(hoy)}</p>
          </div>
          {cierreHoy && (
            <span className="bg-green-500/20 text-green-400 border border-green-500/40 px-3 py-1 rounded-full text-sm font-semibold">
              Cargado
            </span>
          )}
        </div>

        {cierreHoy ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800 rounded-xl p-4 text-center">
                <div className="text-zinc-400 text-xs uppercase mb-1">Para devolver</div>
                <div className="text-3xl font-bold text-blue-400">{cierreHoy.medParaDevolver}</div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4 text-center">
                <div className="text-zinc-400 text-xs uppercase mb-1">Rellenas desecho</div>
                <div className="text-3xl font-bold text-red-400">{cierreHoy.medRellenaDesecho}</div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4 text-center">
                <div className="text-zinc-400 text-xs uppercase mb-1">Trenzas sobrantes</div>
                <div className="text-3xl font-bold text-orange-400">{cierreHoy.trenzasSobrantes}</div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4 text-center">
                <div className="text-zinc-400 text-xs uppercase mb-1">Latas crudas p/ manana</div>
                <div className="text-3xl font-bold text-purple-400">{cierreHoy.latasCrudasQuedan}</div>
                {cierreHoy.medCrudasQuedan > 0 && (
                  <div className="text-zinc-400 text-xs mt-1">{cierreHoy.medCrudasQuedan} unidades</div>
                )}
              </div>
            </div>
            {cierreHoy.observacion && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-300 text-sm">
                {cierreHoy.observacion}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">

            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="text-white font-semibold">Medialunas para devolver</div>
              <div className="text-zinc-400 text-xs">Las que sobraron sin rellenar</div>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={medParaDevolver}
                onChange={(e) => setMedParaDevolver(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="text-white font-semibold">Medialunas rellenas para desecho</div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-300 text-xs mb-2">
                Costo nuestro
              </div>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={medRellenaDesecho}
                onChange={(e) => setMedRellenaDesecho(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="text-white font-semibold">Trenzas sobrantes</div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-300 text-xs mb-2">
                Costo nuestro
              </div>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={trenzasSobrantes}
                onChange={(e) => setTrenzasSobrantes(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* LATAS CRUDAS — ahora con latas Y unidades */}
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="text-white font-semibold">Latas crudas que quedan para manana</div>
              <div className="text-zinc-400 text-xs">Solo si la fabrica pidio que las dejemos</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latas</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    value={latasCrudasQuedan}
                    onChange={(e) => setLatasCrudasQuedan(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Unidades</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    value={medCrudasQuedan}
                    onChange={(e) => setMedCrudasQuedan(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Observacion</label>
              <textarea
                placeholder="Ej: sobraron muchas porque estuvo muy caluroso..."
                value={obsCierre}
                onChange={(e) => setObsCierre(e.target.value)}
                rows={3}
                className="w-full bg-zinc-800 text-white text-lg rounded-xl p-4 border-2 border-zinc-700 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <button
              onClick={handleGuardarCierre}
              disabled={guardandoCierre}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-xl py-5 rounded-2xl transition active:scale-95"
            >
              {guardandoCierre ? "Guardando..." : "Guardar cierre"}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}