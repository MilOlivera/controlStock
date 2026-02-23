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
    getProductsByLocation,
    updateVariantStock,
  } = useInventory();

  const { orders, deliverOrder } =
    useOrders();

  const products =
    getProductsByLocation(location);

  /* ---------- estados ---------- */

  const [quantities, setQuantities] =
    useState<Record<string, number>>({});

  const [prices, setPrices] =
    useState<Record<string, number>>({});

  const [toast, setToast] =
    useState<string | null>(null);

  const [openProduct, setOpenProduct] =
    useState<string | null>(null);

  function toggleProduct(id: string) {
    setOpenProduct((prev) =>
      prev === id ? null : id
    );
  }

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

  function setPrice(
    productId: string,
    variantId: string,
    price: number
  ) {
    const key = makeKey(
      productId,
      variantId
    );

    const safePrice = Number.isNaN(price)
      ? 0
      : Math.max(0, price);

    setPrices((prev) => ({
      ...prev,
      [key]: safePrice,
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

        updateVariantStock(
          product.name,
          variantId,
          location,
          currentStock + qty
        );

        autoDeliverOrders(
          product.name,
          qty
        );
      }
    );

    setQuantities({});
    setPrices({});

    setToast("Entrega aplicada correctamente");

    setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  /* ---------- UI ---------- */

  return (
    <div className="space-y-4">
      {products.map((p) => {
        const isOpen =
          openProduct === p.id;

        return (
          <div
            key={p.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg"
          >
            <button
              onClick={() =>
                toggleProduct(p.id)
              }
              className="w-full text-left p-4 flex justify-between items-center"
            >
              <span className="font-semibold">
                {p.name}
              </span>

              <span className="text-zinc-500">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
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
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                          <span>
                            {v.brand} • {v.presentation} • {v.volume}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-500">
                          Stock actual: {stockActual}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Cantidad"
                          value={
                            quantities[key] ??
                            ""
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
                          className="w-24 bg-zinc-800 p-2 rounded text-right"
                        />

                        <input
                          type="number"
                          min="0"
                          placeholder="Precio"
                          value={
                            prices[key] ??
                            ""
                          }
                          onChange={(e) =>
                            setPrice(
                              p.id,
                              v.id,
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-28 bg-zinc-800 p-2 rounded text-right"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        className="bg-green-700 px-5 py-2 rounded mx-auto block hover:bg-green-600 transition"
      >
        Aplicar entregas
      </button>

      {toast && (
        <div className="bg-green-800 text-green-100 px-4 py-2 rounded text-center">
          {toast}
        </div>
      )}
    </div>
  );
}