"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useOrders } from "../context/OrdersContext";

export default function DeliveryForm({
  location,
}: {
  location: string;
}) {
  const {
    products,
    updateVariantStock,
  } = useInventory();

  const { orders, deliverOrder } =
    useOrders();

  /* ---------- estados ---------- */
  // clave: productId|variantId
  const [quantities, setQuantities] =
    useState<Record<string, number>>({});

  function makeKey(
    productId: string,
    variantId: string
  ) {
    return `${productId}|${variantId}`;
  }

  function setQty(
    productId: string,
    variantId: string,
    qty: number
  ) {
    const key = makeKey(
      productId,
      variantId
    );

    const safeQty = Number.isNaN(qty)
      ? 0
      : Math.max(0, qty);

    setQuantities((prev) => ({
      ...prev,
      [key]: safeQty,
    }));
  }

  /* ---------- auto entrega pedidos ---------- */
  function autoDeliverOrders(
    productName: string,
    availableQty: number
  ) {
    let remaining = availableQty;

    const pending = orders.filter(
      (o) =>
        o.product === productName &&
        o.location === location &&
        o.status !== "cumplido"
    );

    pending.forEach((o) => {
      if (remaining <= 0) return;

      const need =
        o.quantity - o.delivered;

      const deliver = Math.min(
        need,
        remaining
      );

      deliverOrder(o.id, deliver);
      remaining -= deliver;
    });
  }

  /* ---------- aplicar ---------- */
  function handleSubmit() {
    Object.entries(quantities).forEach(
      ([key, qty]) => {
        if (!qty || qty <= 0) return;

        const parts = key.split("|");
        if (parts.length !== 2) return;

        const [productId, variantId] =
          parts;

        const product = products.find(
          (p) => p.id === productId
        );
        if (!product) return;

        const variant =
          product.variants.find(
            (v) => v.id === variantId
          );
        if (!variant) return;

        const currentStock =
          variant.stock?.[location] ?? 0;

        /* actualizar variante */
        updateVariantStock(
          product.name,
          variantId,
          location,
          currentStock + qty
        );

        /* entrega automática */
        autoDeliverOrders(
          product.name,
          qty
        );
      }
    );

    /* limpiar formulario */
    setQuantities({});
  }

  /* ---------- UI ---------- */
  return (
    <div className="space-y-4">
      {products.map((p) => (
        <div key={p.id}>
          <div className="text-sm text-zinc-400 mb-1">
            {p.name}
          </div>

          <div className="space-y-2">
            {p.variants.map((v) => {
              const key = makeKey(
                p.id,
                v.id
              );

              const stockActual =
                v.stock?.[location] ?? 0;

              return (
                <div
                  key={key}
                  className="bg-zinc-900 p-3 rounded flex justify-between items-center gap-3"
                >
                  <div className="flex-1">
                    <div>{v.brand}</div>
                    <div className="text-xs text-zinc-500">
                      Stock actual:{" "}
                      {stockActual}
                    </div>
                  </div>

                  <input
                    type="number"
                    min="0"
                    placeholder="Cant."
                    value={
                      quantities[key] ?? ""
                    }
                    onChange={(e) =>
                      setQty(
                        p.id,
                        v.id,
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-20 bg-zinc-800 p-1 rounded text-right"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-700 px-4 py-2 rounded mx-auto block"
      >
        Aplicar entregas
      </button>
    </div>
  );
}
