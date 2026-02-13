"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useMovements } from "../context/MovementsContext";

export function EditStockModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");

  const { updateStock } = useInventory();
  const { addMovement } = useMovements();

  if (!product) return null;

  function handleSave() {
    const newStock = Number(value);
    if (newStock < 0) return;

    const location = product.location; // importante
    const currentStock = product.stock ?? 0;

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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">
          Editar stock
        </h2>

        <div className="mb-3">
          <div className="text-sm text-zinc-400">
            Producto
          </div>
          <div className="bg-zinc-800 p-2 rounded mt-1">
            {product.name}
          </div>
        </div>

        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full p-2 rounded bg-zinc-800 outline-none mb-4"
          placeholder="Nuevo stock"
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-2 bg-zinc-700 rounded"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-2 bg-green-600 rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditStockModal;
