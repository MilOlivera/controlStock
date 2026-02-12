"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useOrders } from "../context/OrdersContext";
import { useMovements } from "../context/MovementsContext";
import DeliveryForm from "./DeliveryForm";

export default function AdminPurchases({
  location,
}: {
  location: string;
}) {
  const { products, updateVariantStock } =
    useInventory();

  const { orders, deliverOrder } =
    useOrders();

  const { addMovement } =
    useMovements();

  const [selectedProduct, setSelectedProduct] =
    useState<string>("");

  const [selectedVariant, setSelectedVariant] =
    useState<string>("");

  const [quantity, setQuantity] =
    useState<number>(0);

  const [unitPrice, setUnitPrice] =
    useState<number>(0);

  /* ---------- COMPRA SUGERIDA ---------- */

  const suggestedPurchases =
    orders.reduce((acc: any, o) => {
      if (o.status === "cumplido")
        return acc;

      const remaining =
        o.quantity - o.delivered;

      acc[o.product] =
        (acc[o.product] || 0) +
        remaining;

      return acc;
    }, {});

  /* ---------- ENTREGA AUTO ---------- */

  function autoDeliverOrders(
    product: string,
    availableQty: number,
    loc: string
  ) {
    let remaining = availableQty;

    const pending = orders.filter(
      (o) =>
        o.product === product &&
        o.location === loc &&
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

  /* ---------- APLICAR ---------- */

  function handleApply() {
    if (
      !selectedProduct ||
      !selectedVariant ||
      quantity <= 0
    )
      return;

    const product = products.find(
      (p) => p.name === selectedProduct
    );

    if (!product) return;

    const variant =
      product.variants.find(
        (v: any) =>
          v.brand === selectedVariant
      );

    if (!variant) return;

    const current =
      variant.stock?.[location] ?? 0;

    /* 🔥 ahora se actualiza la variante correcta */
    updateVariantStock(
      selectedProduct,
      variant.id,
      location,
      current + quantity
    );

    autoDeliverOrders(
      selectedProduct,
      quantity,
      location
    );

    addMovement(
      selectedProduct,
      location,
      "ingreso",
      quantity,
      unitPrice
    );

    setQuantity(0);
    setUnitPrice(0);
  }

  /* ---------- UI ---------- */

  const selectedProductData =
    products.find(
      (p) => p.name === selectedProduct
    );

  return (
    <div className="space-y-6">
      {/* COMPRA SUGERIDA */}
      <div>
        <h2 className="text-lg font-semibold">
          🧠 Compra sugerida
        </h2>

        <div className="space-y-2 mt-2">
          {Object.entries(
            suggestedPurchases
          ).map(([name, qty]: any) => (
            <div
              key={name}
              className="bg-zinc-900 p-3 rounded flex justify-between"
            >
              <span>{name}</span>
              <span>
                Comprar: {qty}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* REPARTO MANUAL */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          🛒 Reparto manual
        </h2>

        <div className="flex gap-3 items-center">
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(
                e.target.value
              );
              setSelectedVariant("");
            }}
            className="bg-zinc-800 p-2 rounded flex-1"
          >
            <option value="">
              Producto
            </option>

            {products.map((p) => (
              <option
                key={p.name}
                value={p.name}
              >
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedVariant}
            onChange={(e) =>
              setSelectedVariant(
                e.target.value
              )
            }
            className="bg-zinc-800 p-2 rounded flex-1"
            disabled={!selectedProductData}
          >
            <option value="">
              Marca
            </option>

            {selectedProductData?.variants.map(
              (v: any) => (
                <option
                  key={v.brand}
                  value={v.brand}
                >
                  {v.brand}
                </option>
              )
            )}
          </select>

          <input
            type="number"
            min="0"
            placeholder="Cant."
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(
                  0,
                  Number(e.target.value)
                )
              )
            }
            className="bg-zinc-800 p-2 rounded w-24 text-right"
          />

          <input
            type="number"
            min="0"
            placeholder="$"
            value={unitPrice}
            onChange={(e) =>
              setUnitPrice(
                Math.max(
                  0,
                  Number(e.target.value)
                )
              )
            }
            className="bg-zinc-800 p-2 rounded w-24 text-right"
          />
        </div>

        <button
          onClick={handleApply}
          className="bg-green-700 px-4 py-2 rounded mx-auto block"
        >
          Aplicar reparto
        </button>
      </div>

      {/* ENTREGA MASIVA */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          🚚 Entrega masiva
        </h2>

        <DeliveryForm location={location} />
      </div>
    </div>
  );
}
