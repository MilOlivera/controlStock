"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useMovements } from "../context/MovementsContext";

/* ---------- HELPERS ---------- */

function formatStock(value: number) {
  const integer = Math.floor(value);
  const decimal = value - integer;

  let fraction = "";

  if (decimal >= 0.74) fraction = "3/4";
  else if (decimal >= 0.49) fraction = "1/2";
  else if (decimal >= 0.24) fraction = "1/4";

  if (!fraction) return `${integer}`;
  if (integer === 0) return fraction;

  return `${integer} + ${fraction}`;
}

function fractionToNumber(f: string) {
  if (f === "1/4") return 0.25;
  if (f === "1/2") return 0.5;
  if (f === "3/4") return 0.75;
  return 0;
}

export function EditStockModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const { updateStock } = useInventory();
  const { addMovement } = useMovements();

  const currentStock = product.stock ?? 0;

  const [integer, setInteger] = useState(
    Math.floor(currentStock)
  );

  const [fraction, setFraction] = useState("0");

  /* ---------- SUMA RÁPIDA ---------- */

  function addFraction(f: string) {
    const add = fractionToNumber(f);

    const total =
      integer + fractionToNumber(fraction) + add;

    const newInteger = Math.floor(total);
    const newFraction = total - newInteger;

    setInteger(newInteger);

    if (newFraction === 0.25) setFraction("1/4");
    else if (newFraction === 0.5) setFraction("1/2");
    else if (newFraction === 0.75) setFraction("3/4");
    else setFraction("0");
  }

  function handleSave() {
    const newStock =
      integer + fractionToNumber(fraction);

    if (newStock < 0) return;

    const location = product.location;
    const diff = newStock - currentStock;

    if (diff !== 0) {
      addMovement(
        product.name,
        location,
        "ajuste",
        diff,
        0
      );
    }

    updateStock(
      product.name,
      location,
      newStock
    );

    onClose();
  }

  /* ---------- UI ---------- */

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-lg p-5 space-y-4">

        <h2 className="text-lg font-semibold">
          Editar stock
        </h2>

        <div className="text-sm text-zinc-400">
          {product.name}
        </div>

        <div className="text-center text-xl font-semibold">
          {formatStock(
            integer + fractionToNumber(fraction)
          )}
        </div>

        {/* ENTEROS */}

        <div>
          <div className="text-sm mb-1">
            Enteros
          </div>

          <input
            type="number"
            min={0}
            value={integer}
            onChange={(e) =>
              setInteger(Number(e.target.value))
            }
            className="w-full p-2 rounded bg-zinc-800"
          />
        </div>

        {/* FRACCIONES */}

        <div>
          <div className="text-sm mb-1">
            Fracción
          </div>

          <select
            value={fraction}
            onChange={(e) =>
              setFraction(e.target.value)
            }
            className="w-full p-2 rounded bg-zinc-800"
          >
            <option value="0">Sin fracción</option>
            <option value="1/4">1/4</option>
            <option value="1/2">1/2</option>
            <option value="3/4">3/4</option>
          </select>
        </div>

        {/* SUMA RÁPIDA */}

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => addFraction("1/4")}
            className="bg-zinc-700 px-3 py-1 rounded"
          >
            +1/4
          </button>

          <button
            onClick={() => addFraction("1/2")}
            className="bg-zinc-700 px-3 py-1 rounded"
          >
            +1/2
          </button>

          <button
            onClick={() => addFraction("3/4")}
            className="bg-zinc-700 px-3 py-1 rounded"
          >
            +3/4
          </button>
        </div>

        {/* BOTONES */}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="bg-zinc-700 px-3 py-2 rounded"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="bg-green-600 px-3 py-2 rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditStockModal;