"use client";

import { useState } from "react";
import { useOrders } from "../context/OrdersContext";
import { useInventory } from "../context/InventoryContext";
import { useMovements } from "../context/MovementsContext";

export default function DeliverModal({
  order,
  onClose,
}: {
  order: any;
  onClose: () => void;
}) {
  const [qty, setQty] = useState("");

  const { deliverOrder } = useOrders();
  const { updateStock, products, getStock } =
    useInventory();
  const { addMovement } = useMovements();

  if (!order) return null;

  const product = products.find(
    (p) => p.name === order.product
  );

  function handleDeliver() {
    const delivered = Number(qty);
    if (!delivered || delivered <= 0) return;

    const remaining =
      order.quantity - order.delivered;

    if (delivered > remaining) {
      alert(
        `No se puede entregar más de lo pendiente (${remaining}).`
      );
      return;
    }

    // marcar entrega del pedido
    deliverOrder(order.id, delivered);

    if (product) {
      const location = order.location;

      // stock actual del local
      const currentStock = getStock(
        product.name,
        location
      );

      const newStock =
        currentStock + delivered;

      // actualizar stock del producto
      updateStock(
        product.name,
        location,
        newStock
      );

      // registrar movimiento de ingreso
      addMovement(
        product.name,
        location,
        "ingreso",
        delivered,
        0
      );
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">
          Entregar pedido
        </h2>

        <div className="mb-3">
          <div className="text-sm text-zinc-400">
            Producto
          </div>
          <div className="bg-zinc-800 p-2 rounded mt-1">
            {order.product}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-zinc-400">
            Pendiente total
          </div>
          <div className="bg-zinc-800 p-2 rounded mt-1">
            {order.quantity - order.delivered}
          </div>
        </div>

        <input
          type="number"
          value={qty}
          onChange={(e) =>
            setQty(e.target.value)
          }
          className="w-full p-2 rounded bg-zinc-800 outline-none mb-4"
          placeholder="Cantidad entregada ahora"
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-2 bg-zinc-700 rounded"
          >
            Cancelar
          </button>

          <button
            onClick={handleDeliver}
            className="px-3 py-2 bg-green-600 rounded"
          >
            Confirmar entrega
          </button>
        </div>
      </div>
    </div>
  );
}
