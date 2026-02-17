"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useOrders } from "../context/OrdersContext";

export default function GlobalRequestForm({
  location,
}: {
  location: string;
}) {
  const { products } = useInventory();
  const { addOrder } = useOrders();

  const [quantities, setQuantities] =
    useState<Record<string, number>>({});

  const [resultMessage, setResultMessage] =
    useState<string | null>(null);

  function setQty(
    product: string,
    qty: number
  ) {
    setQuantities((prev) => ({
      ...prev,
      [product]: Math.max(0, qty),
    }));
  }

  /* ---------- ENVIAR PEDIDOS ---------- */
  async function handleSubmit() {
    const locationFinal = location;

    const created: string[] = [];
    const skipped: string[] = [];

    for (const [product, qty] of Object.entries(
      quantities
    )) {
      if (!qty || qty <= 0) continue;

      const p = products.find(
        (p) => p.name === product
      );

      if (!p) continue;

      const success = await addOrder(
        locationFinal,
        p.name,
        p.category,
        qty
      );

      if (success) {
        created.push(product);
      } else {
        skipped.push(product);
      }
    }

    setQuantities({});

    if (
      created.length === 0 &&
      skipped.length === 0
    ) {
      setResultMessage(
        "No se enviaron pedidos."
      );
      return;
    }

    let message = "";

    if (created.length > 0) {
      message +=
        "Pedidos creados: " +
        created.join(", ");
    }

    if (skipped.length > 0) {
      if (message) message += " | ";
      message +=
        "No agregados (pedido abierto): " +
        skipped.join(", ");
    }

    setResultMessage(message);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        Solicitud masiva
      </h2>

      {products.map((p) => (
        <div
          key={p.name}
          className="bg-zinc-900 p-3 rounded flex justify-between"
        >
          <span>{p.name}</span>

          <input
            type="number"
            placeholder="0"
            value={
              quantities[p.name] ?? ""
            }
            onChange={(e) =>
              setQty(
                p.name,
                Number(e.target.value)
              )
            }
            className="w-20 bg-zinc-800 p-1 rounded text-right"
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-700 px-4 py-2 rounded mx-auto block"
      >
        Enviar pedidos
      </button>

      {resultMessage && (
        <div className="bg-zinc-800 p-3 rounded text-sm">
          {resultMessage}
        </div>
      )}
    </div>
  );
}
