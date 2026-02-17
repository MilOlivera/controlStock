"use client";

import { useOrders } from "../context/OrdersContext";

export default function AdminOrdersList({
  location,
}: {
  location: string;
}) {
  const { orders, removeOrdersByProduct } =
    useOrders();

  /* solo pedidos abiertos del local seleccionado */
  const activeOrders = orders.filter(
    (o) =>
      o.status !== "cumplido" &&
      o.location === location
  );

  if (activeOrders.length === 0) {
    return (
      <div className="text-zinc-400">
        No hay pedidos pendientes.
      </div>
    );
  }

  function handleCancel(
    product: string,
    location: string
  ) {
    const confirmCancel = confirm(
      "¿Seguro que querés anular este pedido?"
    );

    if (!confirmCancel) return;

    removeOrdersByProduct(product, location);
  }

  return (
    <div className="space-y-2">
      {activeOrders.map((o) => {
        const remaining =
          o.quantity - o.delivered;

        return (
          <div
            key={o.id}
            className="bg-zinc-900 p-3 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">
                {o.product}
              </div>

              <div className="text-sm text-zinc-400">
                Pedido: {o.quantity}
              </div>

              <div className="text-sm text-zinc-400">
                Entregado: {o.delivered}
              </div>

              <div className="text-sm text-zinc-400">
                Faltan: {remaining}
              </div>
            </div>

            <button
              onClick={() =>
                handleCancel(
                  o.product,
                  o.location
                )
              }
              className="bg-red-700 px-3 py-1 rounded text-sm hover:bg-red-600 transition"
            >
              Anular
            </button>
          </div>
        );
      })}
    </div>
  );
}
