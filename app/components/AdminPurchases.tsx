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

  const [success, setSuccess] =
    useState(false);

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
    setSelectedProduct("");
    setSelectedVariant("");

    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  }

  /* ---------- PEDIDOS DEL PRODUCTO ---------- */

  const relatedOrders = orders.filter(
    (o) =>
      o.product === selectedProduct &&
      o.status !== "cumplido"
  );

  /* ---------- UI ---------- */

  const selectedProductData =
    products.find(
      (p) => p.name === selectedProduct
    );

  return (
    <div className="space-y-8">

      {/* REPARTO MANUAL */}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Reparto manual
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
              Seleccionar producto
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
              Seleccionar marca
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
            placeholder="Cantidad"
            value={quantity || ""}
            onChange={(e) =>
              setQuantity(
                Math.max(
                  0,
                  Number(e.target.value)
                )
              )
            }
            className="bg-zinc-800 p-2 rounded w-28 text-right"
          />

          <input
            type="number"
            min="0"
            placeholder="Valor unitario"
            value={unitPrice || ""}
            onChange={(e) =>
              setUnitPrice(
                Math.max(
                  0,
                  Number(e.target.value)
                )
              )
            }
            className="bg-zinc-800 p-2 rounded w-36 text-right"
          />
        </div>

        <button
          onClick={handleApply}
          className="bg-green-700 px-4 py-2 rounded mx-auto block hover:bg-green-600 transition"
        >
          Aplicar reparto
        </button>

        {success && (
          <div className="text-green-400 text-center text-sm">
            Reparto aplicado correctamente
          </div>
        )}
      </div>

      {/* INFO DE PEDIDOS */}

      {selectedProduct && relatedOrders.length > 0 && (
        <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
          <div className="text-sm text-zinc-400 mb-2">
            Pedidos pendientes de este producto
          </div>

          <div className="space-y-2">
            {relatedOrders.map((o) => {
              const remaining =
                o.quantity - o.delivered;

              return (
                <div
                  key={o.id}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {o.location}
                  </span>

                  <span className="text-zinc-400">
                    Faltan {remaining}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ENTREGA MASIVA */}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Entrega masiva
        </h2>

        <DeliveryForm location={location} />
      </div>
    </div>
  );
}
