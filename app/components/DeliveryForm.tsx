"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useOrders } from "../context/OrdersContext";
import { useMovements } from "../context/MovementsContext";

export default function DeliveryForm({
  location,
}: {
  location: string;
}) {
  const { getProductsByLocation, updateVariantStock } = useInventory();
  const { orders, deliverOrder } = useOrders();
  const { addMovement } = useMovements();

  const products = getProductsByLocation(location);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [openProduct, setOpenProduct] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function toggleProduct(id: string) {
    setOpenProduct((prev) => prev === id ? null : id);
  }

  function makeKey(productId: string, variantId: string) {
    return `${productId}|${variantId}`;
  }

  function setQty(productId: string, variantId: string, qty: number) {
    const key = makeKey(productId, variantId);
    setQuantities((prev) => ({ ...prev, [key]: Math.max(0, qty) }));
  }

  function setPrice(productId: string, variantId: string, price: number) {
    const key = makeKey(productId, variantId);
    setPrices((prev) => ({ ...prev, [key]: Math.max(0, price) }));
  }

  function autoDeliverOrders(productName: string, availableQty: number) {
    let remaining = availableQty;
    const pending = orders.filter(
      (o) => o.product === productName && o.location === location && o.status !== "cumplido"
    );
    pending.forEach((o) => {
      if (remaining <= 0) return;
      const need = o.quantity - o.delivered;
      const deliver = Math.min(need, remaining);
      deliverOrder(o.id, deliver);
      remaining -= deliver;
    });
  }

  async function handleSubmit() {
    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (entries.length === 0) {
      alert("Ingresá al menos una cantidad");
      return;
    }

    setGuardando(true);
    try {
      for (const [key, qty] of entries) {
        const parts = key.split("|");
        if (parts.length !== 2) continue;
        const [productId, variantId] = parts;

        const product = products.find((p) => p.id === productId);
        if (!product) continue;

        const variant = product.variants.find((v) => v.id === variantId);
        if (!variant) continue;

        const currentStock = variant.stock?.[location] ?? 0;
        const price = prices[key] ?? 0;

        await updateVariantStock(product.name, variantId, location, currentStock + qty);
        autoDeliverOrders(product.name, qty);
        await addMovement(product.name, location, "ingreso", qty, price);
      }

      setQuantities({});
      setPrices({});
      setToast("Entrega aplicada correctamente");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error(err);
      alert("Error al aplicar la entrega");
    } finally {
      setGuardando(false);
    }
  }

  const totalItems = Object.values(quantities).filter((q) => q > 0).length;

  return (
    <div className="space-y-4">
      {products.map((p) => {
        const isOpen = openProduct === p.id;
        return (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              onClick={() => toggleProduct(p.id)}
              className="w-full text-left p-4 flex justify-between items-center"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-zinc-500 text-lg">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
                {p.variants.map((v) => {
                  const key = makeKey(p.id, v.id);
                  const stockActual = v.stock?.[location] ?? 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full shrink-0" />
                        <span>{v.brand} • {v.presentation} • {v.volume}</span>
                      </div>
                      <div className="text-xs text-zinc-500 pl-3 mb-2">
                        Stock actual: {stockActual}
                      </div>
                      <div className="flex gap-2 pl-3">
                        <input
                          type="number"
                          min="0"
                          placeholder="Cantidad"
                          value={quantities[key] ?? ""}
                          onChange={(e) => setQty(p.id, v.id, Number(e.target.value))}
                          className="w-28 bg-zinc-800 p-2 rounded-lg text-right border border-zinc-700 focus:border-blue-500 outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Precio unit."
                          value={prices[key] ?? ""}
                          onChange={(e) => setPrice(p.id, v.id, Number(e.target.value))}
                          className="w-32 bg-zinc-800 p-2 rounded-lg text-right border border-zinc-700 focus:border-blue-500 outline-none"
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
        disabled={guardando || totalItems === 0}
        className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold text-lg py-4 rounded-2xl transition active:scale-95"
      >
        {guardando ? "Guardando..." : `Aplicar entrega${totalItems > 0 ? ` (${totalItems} productos)` : ""}`}
      </button>

      {toast && (
        <div className="bg-green-800/50 border border-green-600/40 text-green-300 px-4 py-3 rounded-xl text-center">
          {toast}
        </div>
      )}
    </div>
  );
}