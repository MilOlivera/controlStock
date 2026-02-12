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

  const [showConfirm, setShowConfirm] =
    useState(false);

  useEffect(() => {
    if (!product) return;

    const suggested =
      product.targetStock - product.stock;

    if (suggested > 0) {
      setQuantity(String(suggested));
    } else {
      setQuantity("");
    }
  }, [product]);

  if (!product) return null;

  function handleSubmit() {
    if (!user?.location) {
      alert("Usuario sin local asignado");
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) return;

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
      qty
    );

    setQuantity("");
    onClose();
  }

  function confirmReplace() {
    if (!user?.location) return;

    const qty = Number(quantity);
    if (!qty || qty <= 0) return;

    replaceOrderQuantity(
      product.name,
      user.location,
      qty
    );

    setQuantity("");
    setShowConfirm(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-zinc-900 p-4 rounded w-80 space-y-4">
        <h2 className="text-lg font-semibold">
          Solicitar {product.name}
        </h2>

        <input
          type="number"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value)
          }
          className="w-full bg-zinc-800 p-2 rounded"
          placeholder="Cantidad"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-green-700 p-2 rounded"
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

        {showConfirm && (
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
