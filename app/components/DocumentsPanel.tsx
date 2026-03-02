"use client";

import { useState } from "react";
import { useDocuments } from "../context/DocumentsContext";
import { useUser } from "../context/UserContext";

export default function DocumentsPanel({
  location,
}: {
  location: string;
}) {
  const { documents, uploadDocument, deleteDocument } =
    useDocuments();

  const { user } = useUser();

  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState("Remito");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [observation, setObservation] =
    useState("");
  const [file, setFile] = useState<File | null>(
    null
  );

  const [uploadProgress, setUploadProgress] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] =
    useState("Todos");
  const [onlyIssues, setOnlyIssues] =
    useState(false);

  /* ---------------- HELPERS ---------------- */

  function getTypeIcon(type: string) {
    switch (type) {
      case "Remito":
        return "📦";
      case "Factura":
        return "🧾";
      case "Comprobante":
        return "💳";
      case "Ticket":
        return "🎫";
      default:
        return "📄";
    }
  }

  function getLocationLabel(loc: string) {
    if (loc === "marpla-lomas") return "Lomas";
    if (loc === "evolvere") return "Evolvere";
    return loc;
  }

  /* ---------- FILTRO + BUSQUEDA ---------- */

  const docs = documents
    .filter((d) => d.location === location)
    .filter((d) => {
      if (filterType === "Todos") return true;
      return d.type === filterType;
    })
    .filter((d) => {
      if (!onlyIssues) return true;
      return !!d.observation;
    })
    .filter((d) => {
      const text =
        `${d.type} ${d.number} ${
          d.observation || ""
        }`.toLowerCase();

      return text.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      return (
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
      );
    });

  /* ---------- STATS ---------- */

  const todayDocs = docs.filter((d) => {
    const today = new Date();
    const docDate = new Date(d.date);

    return (
      today.toDateString() ===
      docDate.toDateString()
    );
  }).length;

  const withObservation = documents.filter(
    (d) => d.location === location && d.observation
  ).length;

  /* ---------- DETECTOR OTRO LOCAL ---------- */

  function hasObservationInOtherLocation(
    number: string
  ) {
    return documents.some(
      (d) =>
        d.number === number &&
        d.location !== location &&
        d.observation
    );
  }

  /* ---------- SUBIR ---------- */

  async function handleUpload() {
    if (!file) return alert("Falta archivo");
    if (!number) return alert("Falta número");
    if (!date) return alert("Falta fecha");

    setUploadProgress(10);

    await uploadDocument(
      location,
      type as any,
      number,
      new Date(date),
      file,
      observation,
      setUploadProgress
    );

    setUploadProgress(null);

    setShowForm(false);
    setNumber("");
    setObservation("");
    setFile(null);
  }

  return (
    <div className="space-y-4">

      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Documentación
        </h2>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-zinc-800 px-3 py-2 rounded hover:bg-zinc-700"
        >
          + Documento
        </button>
      </div>

      {/* STATS */}

      <div className="flex gap-4 text-sm text-zinc-400">
        <div>Hoy: {todayDocs}</div>
        <div>Observaciones: {withObservation}</div>
        <div>Total: {docs.length}</div>
      </div>

      {/* BUSCADOR + FILTRO */}

      <div className="flex flex-col md:flex-row gap-2">

        <input
          placeholder="Buscar documento..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="bg-zinc-800 p-2 rounded w-full"
        />

        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value)
          }
          className="bg-zinc-800 p-2 rounded"
        >
          <option>Todos</option>
          <option>Remito</option>
          <option>Factura</option>
          <option>Comprobante</option>
          <option>Ticket</option>
          <option>Otro</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-300 px-2">
          <input
            type="checkbox"
            checked={onlyIssues}
            onChange={(e) =>
              setOnlyIssues(e.target.checked)
            }
          />
          Solo con observación
        </label>
      </div>

      {/* FORM */}

      {showForm && (
        <div className="bg-zinc-900 p-4 rounded space-y-3 border border-zinc-800">

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          >
            <option>Remito</option>
            <option>Factura</option>
            <option>Comprobante</option>
            <option>Ticket</option>
            <option>Otro</option>
          </select>

          <input
            placeholder="Número"
            value={number}
            onChange={(e) =>
              setNumber(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <textarea
            placeholder="Observación"
            value={observation}
            onChange={(e) =>
              setObservation(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) =>
              setFile(
                e.target.files?.[0] || null
              )
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          {uploadProgress !== null && (
            <div className="w-full bg-zinc-800 rounded h-2">
              <div
                className="bg-green-500 h-2 rounded"
                style={{
                  width: `${uploadProgress}%`,
                }}
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            className="bg-green-700 w-full py-2 rounded hover:bg-green-600"
          >
            Subir documento
          </button>
        </div>
      )}

      {/* LISTA */}

      <div className="bg-zinc-900 rounded border border-zinc-800">

        {docs.length === 0 && (
          <div className="p-4 text-zinc-400">
            No hay documentos
          </div>
        )}

        {docs.map((d) => {
          const otherLocationIssue =
            hasObservationInOtherLocation(
              d.number
            );

          return (
            <div
              key={d.firestoreId}
              className="p-3 border-b border-zinc-800 space-y-2"
            >
              <div className="flex justify-between items-start">

                <div>

                  <div className="font-semibold flex items-center gap-2 flex-wrap">

                    <span className="text-lg">
                      {getTypeIcon(d.type)}
                    </span>

                    {d.type} {d.number}

                    <span className="px-2 py-0.5 text-xs rounded bg-zinc-700 text-zinc-200">
                      {getLocationLabel(
                        d.location
                      )}
                    </span>

                    {d.observation && (
                      <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                        Observación
                      </span>
                    )}

                    {otherLocationIssue && (
                      <span className="px-2 py-0.5 text-xs rounded bg-violet-500/20 text-violet-300 border border-violet-500/40">
                        Otro local
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-zinc-400">
                    {new Date(
                      d.date
                    ).toLocaleDateString()}
                  </div>

                  {d.observation && (
                    <div className="text-xs text-yellow-300 mt-1">
                      {d.observation}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">

                  <a
                    href={d.fileUrl}
                    target="_blank"
                    className="bg-zinc-800 px-3 py-1 rounded hover:bg-zinc-700 text-sm"
                  >
                    Ver
                  </a>

                  <a
                    href={d.fileUrl}
                    download
                    className="bg-zinc-800 px-3 py-1 rounded hover:bg-zinc-700 text-sm"
                  >
                    Descargar
                  </a>

                  {user?.role === "ADMIN" && d.firestoreId && (
                    <button
                     onClick={() => {
                         if (!d.firestoreId) return;
                         deleteDocument(d.firestoreId, d.filePath);
                        }}
                        className="bg-red-700 px-3 py-1 rounded hover:bg-red-600 text-sm"
                         >
                             Eliminar
                        </button>
                        )  }
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}