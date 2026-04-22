"use client";

import { useState } from "react";
import { useRemitos } from "../context/RemitosContext";
import { useUser } from "../context/UserContext";

export default function RemitoDelDia({
  location,
}: {
  location: string;
}) {
  const { addRemito, getRemitoByDate, getRemitosDelDia } = useRemitos();
  const { user } = useUser();

  const hoy = new Date();

  const remitoHoy = getRemitoByDate(location, hoy);
  const todosLosRemitosHoy = getRemitosDelDia(location, hoy);
  const refuerzosHoy = todosLosRemitosHoy.filter((r) => r.esRefuerzo);

  const [nroRemito, setNroRemito] = useState("");
  const [latasMedialunas, setLatasMedialunas] = useState("");
  const [unidadesMedialunas, setUnidadesMedialunas] = useState("");
  const [latasTrenzas, setLatasTrenzas] = useState("");
  const [unidadesTrenzas, setUnidadesTrenzas] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [observacion, setObservacion] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [guardandoRemito, setGuardandoRemito] = useState(false);

  const [mostrarRefuerzo, setMostrarRefuerzo] = useState(false);
  const [nroRefuerzo, setNroRefuerzo] = useState("");
  const [latasRef, setLatasRef] = useState("");
  const [unidadesRef, setUnidadesRef] = useState("");
  const [obsRefuerzo, setObsRefuerzo] = useState("");
  const [guardandoRef, setGuardandoRef] = useState(false);

  function formatFecha(d: Date) {
    return d.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFoto(f);
    setFotoPreview(URL.createObjectURL(f));
  }

  async function handleGuardarRemito() {
    if (
      !nroRemito ||
      !latasMedialunas ||
      !unidadesMedialunas ||
      !latasTrenzas ||
      !unidadesTrenzas
    ) {
      alert("Completá todos los campos del remito");
      return;
    }
    setGuardandoRemito(true);
    try {
      await addRemito(
        {
          location,
          fecha: hoy,
          nroRemito,
          latasMedialunas: Number(latasMedialunas),
          unidadesMedialunas: Number(unidadesMedialunas),
          latasTrenzas: Number(latasTrenzas),
          unidadesTrenzas: Number(unidadesTrenzas),
          esRefuerzo: false,
          observacion,
          creadoPor: user?.email ?? "desconocido",
        },
        foto ?? undefined,
        setUploadProgress
      );
      setUploadProgress(null);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el remito");
    } finally {
      setGuardandoRemito(false);
    }
  }

  async function handleGuardarRefuerzo() {
    if (!latasRef || !unidadesRef) {
      alert("Completá latas y unidades del refuerzo");
      return;
    }
    setGuardandoRef(true);
    try {
      await addRemito({
        location,
        fecha: hoy,
        nroRemito: nroRefuerzo || "Refuerzo",
        latasMedialunas: Number(latasRef),
        unidadesMedialunas: Number(unidadesRef),
        latasTrenzas: 0,
        unidadesTrenzas: 0,
        esRefuerzo: true,
        observacion: obsRefuerzo,
        creadoPor: user?.email ?? "desconocido",
      });
      setMostrarRefuerzo(false);
      setNroRefuerzo("");
      setLatasRef("");
      setUnidadesRef("");
      setObsRefuerzo("");
    } catch (err) {
      console.error(err);
      alert("Error al guardar el refuerzo");
    } finally {
      setGuardandoRef(false);
    }
  }

  const inputClass =
    "w-full bg-zinc-800 text-white text-2xl font-bold text-center rounded-xl p-4 border-2 border-zinc-700 focus:border-blue-500 outline-none";

  const labelClass =
    "text-zinc-400 text-sm uppercase tracking-wider mb-1 block";

  return (
    <div className="space-y-6 pb-10">

      {/* REMITO DE HOY */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Remito del dia</h2>
            <p className="text-zinc-400 text-sm capitalize">{formatFecha(hoy)}</p>
          </div>
          {remitoHoy && (
            <span className="bg-green-500/20 text-green-400 border border-green-500/40 px-3 py-1 rounded-full text-sm font-semibold">
              Cargado
            </span>
          )}
        </div>

        {remitoHoy ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800 rounded-xl p-4 text-center">
                <div className="text-zinc-400 text-xs uppercase mb-1">Medialunas</div>
                <div className="text-3xl font-bold text-blue-400">
                  {remitoHoy.unidadesMedialunas}
                </div>
                <div className="text-zinc-500 text-xs">{remitoHoy.latasMedialunas} latas</div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4 text-center">
                <div className="text-zinc-400 text-xs uppercase mb-1">Trenzas</div>
                <div className="text-3xl font-bold text-purple-400">
                  {remitoHoy.unidadesTrenzas}
                </div>
                <div className="text-zinc-500 text-xs">{remitoHoy.latasTrenzas} latas</div>
              </div>
            </div>
            <div className="text-zinc-500 text-sm text-center">
              Remito #{remitoHoy.nroRemito}
            </div>
            {remitoHoy.observacion && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-300 text-sm">
                {remitoHoy.observacion}
              </div>
            )}
            {remitoHoy.fotoUrl && (
              <a
                href={remitoHoy.fotoUrl}
                target="_blank"
                rel="noreferrer"
                className="block bg-zinc-800 rounded-xl p-3 text-center text-blue-400 text-sm hover:bg-zinc-700"
              >
                Ver foto del remito
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nro. Remito</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="118"
                value={nroRemito}
                onChange={(e) => setNroRemito(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="text-white font-semibold text-lg">Medialunas</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latas</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="7"
                    value={latasMedialunas}
                    onChange={(e) => setLatasMedialunas(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Unidades</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="343"
                    value={unidadesMedialunas}
                    onChange={(e) => setUnidadesMedialunas(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="text-white font-semibold text-lg">Trenzas</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latas</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="1"
                    value={latasTrenzas}
                    onChange={(e) => setLatasTrenzas(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Unidades</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="45"
                    value={unidadesTrenzas}
                    onChange={(e) => setUnidadesTrenzas(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Foto del remito</label>
              <label className="w-full flex flex-col items-center justify-center bg-zinc-800 rounded-xl p-6 border-2 border-dashed border-zinc-600 cursor-pointer hover:border-blue-500 transition">
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="preview"
                    className="max-h-40 rounded-lg object-contain"
                  />
                ) : (
                  <span className="text-zinc-400 text-sm">
                    Toca para sacar o subir foto
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFoto}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className={labelClass}>Observacion</label>
              <textarea
                placeholder="Ej: vinieron chicas las medialunas..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={3}
                className="w-full bg-zinc-800 text-white text-lg rounded-xl p-4 border-2 border-zinc-700 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {uploadProgress !== null && (
              <div className="w-full bg-zinc-800 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <button
              onClick={handleGuardarRemito}
              disabled={guardandoRemito}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xl py-5 rounded-2xl transition active:scale-95"
            >
              {guardandoRemito ? "Guardando..." : "Guardar remito"}
            </button>
          </div>
        )}
      </div>

      {/* REFUERZOS DEL DIA */}
      {remitoHoy && (
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Refuerzos</h2>
            <button
              onClick={() => setMostrarRefuerzo(!mostrarRefuerzo)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              + Agregar refuerzo
            </button>
          </div>

          {refuerzosHoy.length > 0 && (
            <div className="space-y-2 mb-4">
              {refuerzosHoy.map((r, i) => (
                <div key={i} className="bg-zinc-800 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <div className="text-white text-sm font-semibold">Refuerzo #{r.nroRemito}</div>
                    <div className="text-zinc-400 text-xs">{r.unidadesMedialunas} medialunas — {r.latasMedialunas} latas</div>
                  </div>
                  {r.observacion && (
                    <div className="text-yellow-300 text-xs max-w-32 text-right">{r.observacion}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {mostrarRefuerzo && (
            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div>
                <label className={labelClass}>Nro. Remito refuerzo</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={nroRefuerzo}
                  onChange={(e) => setNroRefuerzo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latas</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="1"
                    value={latasRef}
                    onChange={(e) => setLatasRef(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Unidades</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="49"
                    value={unidadesRef}
                    onChange={(e) => setUnidadesRef(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Observacion</label>
                <textarea
                  placeholder="Ej: pidimos refuerzo porque se vendio todo..."
                  value={obsRefuerzo}
                  onChange={(e) => setObsRefuerzo(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-800 text-white text-lg rounded-xl p-4 border-2 border-zinc-700 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <button
                onClick={handleGuardarRefuerzo}
                disabled={guardandoRef}
                className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-xl py-5 rounded-2xl transition active:scale-95"
              >
                {guardandoRef ? "Guardando..." : "Guardar refuerzo"}
              </button>
            </div>
          )}

          {refuerzosHoy.length === 0 && !mostrarRefuerzo && (
            <p className="text-zinc-500 text-sm text-center">Sin refuerzos hoy</p>
          )}
        </div>
      )}

    </div>
  );
}