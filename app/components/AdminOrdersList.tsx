"use client";

import { useState } from "react";
import { useOrders } from "../context/OrdersContext";

export default function AdminOrdersList({
  location,
}: {
  location: string;
}) {
  const { orders, removeOrdersByProduct } =
    useOrders();

  const [openProduct, setOpenProduct] =
    useState<string | null>(null);

  /* solo pedidos abiertos */
  const activeOrders = orders.filter(
    (o) => o.status !== "cumplido"
  );

  if (activeOrders.length === 0) {
    return (
      <div className="text-zinc-400">
        No hay pedidos pendientes.
      </div>
    );
  }

  /* agrupar por producto */
  const grouped: Record<string, typeof activeOrders> =
    {};

  activeOrders.forEach((o) => {
    if (!grouped[o.product]) {
      grouped[o.product] = [];
    }
    grouped[o.product].push(o);
  });

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
    <div className="space-y-4">
      {Object.entries(grouped)
        .filter(([_, orders]) =>
          // mostrar solo productos donde el local seleccionado tiene pedido
          orders.some((o) => o.location === location)
        )
        .map(([product, productOrders]) => {
          const isShared =
            productOrders.length > 1;

          const isOpen =
            openProduct === product;

          const totalRequested =
            productOrders.reduce(
              (acc, o) => acc + o.quantity,
              0
            );

          const totalDelivered =
            productOrders.reduce(
              (acc, o) => acc + o.delivered,
              0
            );
  

          const selectedOrder =
            productOrders.find(
              (o) => o.location === location
            );

          return (
            <div
              key={product}
              className="bg-zinc-900 rounded border border-zinc-800"
            >
              {/* HEADER ACORDEÓN */}
              <div
                onClick={() =>
                  setOpenProduct(
                    isOpen ? null : product
                  )
                }
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">
                    {isOpen ? "v" : ">"}
                  </span>

                  <span className="font-semibold text-lg">
                    {product}
                  </span>

                  {isShared && (
                    <span className="text-xs px-2 py-0.5 rounded border border-violet-500 text-violet-400">
                      COMPARTIDO
                    </span>
                  )}
                </div>
              </div>

              {/* CONTENIDO */}
              {isOpen && (
                <div className="border-t border-zinc-800 p-4 space-y-3 animate-tabFade">
                  {/* PRODUCTO COMPARTIDO */}
                  {isShared ? (
                    <>
                      {productOrders.map((o) => {
                        const remaining =
                          o.quantity - o.delivered;

                        return (
                          <div
                            key={o.id}
                            className="bg-zinc-800 p-3 rounded flex justify-between items-center"
                          >
                            <div>
                              <div className="font-semibold">
                                {o.location.toUpperCase()}
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

                      <div className="pt-2 border-t border-zinc-700 text-sm text-zinc-400 space-y-1">
  <div>
    Total solicitado:{" "}
    <span className="text-white font-semibold">
      {totalRequested}
    </span>
  </div>

  <div>
    Total entregado:{" "}
    <span className="text-white font-semibold">
      {totalDelivered}
    </span>
  </div>
</div>

                    </>
                  ) : (
                    /* PRODUCTO INDIVIDUAL */
                    selectedOrder && (
                      <div className="bg-zinc-800 p-3 rounded flex justify-between items-center">
                        <div>
                          <div className="text-sm text-zinc-400">
                            Pedido:{" "}
                            {selectedOrder.quantity}
                          </div>

                          <div className="text-sm text-zinc-400">
                            Entregado:{" "}
                            {selectedOrder.delivered}
                          </div>

                          <div className="text-sm text-zinc-400">
                            Faltan:{" "}
                            {selectedOrder.quantity -
                              selectedOrder.delivered}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleCancel(
                              selectedOrder.product,
                              selectedOrder.location
                            )
                          }
                          className="bg-red-700 px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                        >
                          Anular
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
