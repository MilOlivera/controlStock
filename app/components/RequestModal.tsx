"use client";

import { useEffect, useState } from "react";
import { useOrders } from "../context/OrdersContext";
import { useUser } from "../context/UserContext";

export default function RequestModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const {
    addOrder,
    orders,
    replaceOrderQuantity,
  } = useOrders();

  const { user } = useUser();

  const [quantity, setQuantity] =
    useState<string>("");

  const [variantId, setVariantId] =
    useState<string>("");

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  /* ---------- SUGERENCIA ---------- */

  useEffect(() => {
    if (!product) return;

    if (product.variants?.length) {
      setVariantId(product.variants[0].id);
    }

    const suggested =
      product.targetStock - product.stock;

    if (suggested > 0) {
      setQuantity(String(suggested));
    } else {
      setQuantity("");
    }
  }, [product]);

  if (!product) return null;

  const selectedVariant = product.variants?.find(
    (v: any) => v.id === variantId
  );

  /* ---------- SUBMIT ---------- */

  function handleSubmit() {
    if (!user?.location) {
      alert("Usuario sin local asignado");
      return;
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      alert("Ingresá una cantidad válida");
      return;
    }

    const existing = orders.find(
      (o) =>
        o.product === product.name &&
        o.location === user.location &&
        o.status !== "cumplido"
    );

    if (existing) {
      setShowConfirm(true);
      return;
    }

    createOrder(qty);
  }

  function createOrder(qty: number) {
    if (!user?.location) return;

    addOrder(
      user.location,
      product.name,
      product.category,
      qty,
      variantId
    );

    setSuccess(true);

    setTimeout(() => {
      setQuantity("");
      onClose();
    }, 1200);
  }

  function confirmReplace() {
    if (!user?.location) return;

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      alert("Cantidad inválida");
      return;
    }

    replaceOrderQuantity(
      product.name,
      user.location,
      qty
    );

    setSuccess(true);

    setTimeout(() => {
      setQuantity("");
      setShowConfirm(false);
      onClose();
    }, 1200);
  }

  /* ---------- UI ---------- */

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-zinc-900 p-4 rounded w-80 space-y-4">

        <h2 className="text-lg font-semibold">
          Solicitar {product.name}
        </h2>

        {/* SELECT VARIANTE */}

        {product.variants?.length > 0 && (
          <select
            value={variantId}
            onChange={(e) =>
              setVariantId(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
            disabled={success}
          >
            {product.variants.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.brand} • {v.presentation} • {v.volume}
              </option>
            ))}
          </select>
        )}

        {/* CANTIDAD */}

        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => {
            const val = e.target.value;

            if (val === "") {
              setQuantity("");
              return;
            }

            const num = Number(val);
            if (num < 0) return;

            setQuantity(val);
          }}
          className="w-full bg-zinc-800 p-2 rounded"
          placeholder="Cantidad"
          disabled={success}
        />

        {/* SUCCESS */}

        {success && (
          <div className="bg-green-800 text-green-100 px-4 py-2 rounded text-center animate-expandFade">
            Pedido enviado correctamente
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={success}
            className="flex-1 bg-green-700 p-2 rounded disabled:opacity-50"
          >
            Solicitar
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-zinc-700 p-2 rounded"
          >
            Cancelar
          </button>
        </div>

        {showConfirm && !success && (
          <div className="bg-yellow-900 p-3 rounded space-y-2">
            <div className="text-sm">
              Ya existe un pedido abierto.
              ¿Reemplazarlo?
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmReplace}
                className="flex-1 bg-red-700 p-2 rounded"
              >
                Reemplazar
              </button>

              <button
                onClick={() =>
                  setShowConfirm(false)
                }
                className="flex-1 bg-zinc-700 p-2 rounded"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}