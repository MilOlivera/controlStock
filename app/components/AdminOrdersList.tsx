"use client";

import { useOrders } from "../context/OrdersContext";

export default function AdminOrdersList() {
  const { orders, removeOrdersByProduct } =
    useOrders();

  /* solo pedidos abiertos */
  const activeOrders = orders.filter(
    (o) => o.status !== "cumplido"
  );

  /* agrupar por local */
  const grouped: Record<string, any[]> = {};

  activeOrders.forEach((o) => {
    if (!grouped[o.location]) {
      grouped[o.location] = [];
    }

    grouped[o.location].push(o);
  });

  const locations = Object.keys(grouped);

  if (locations.length === 0) {
    return (
      <div className="text-zinc-400">
        No hay pedidos pendientes.
      </div>
    );
  }

  function handleCancel(product: string, location: string) {
    const confirmCancel = confirm(
      "¿Seguro que querés anular este pedido?"
    );

    if (!confirmCancel) return;

    removeOrdersByProduct(product, location);
  }

  return (
    <div className="space-y-6">
      {locations.map((location) => (
        <div key={location}>
          <h2 className="text-lg font-semibold mb-2">
            📍 {location.toUpperCase()}
          </h2>

          <div className="space-y-2">
            {grouped[location].map((o) => {
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
                    className="bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    Anular
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
