"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useOrders } from "../context/OrdersContext";
import { useMovements } from "../context/MovementsContext";
import ConsumptionChart from "./ConsumptionChart";
import PurchaseCostChart from "./PurchaseCostChart";
import PurchaseVsConsumptionChart from "./PurchaseVsConsumptionChart";

export default function AdminPanel({
  location,
}: {
  location: string;
}) {
  const { products, getStock } =
    useInventory();

  const { orders } = useOrders();
  const { movements } = useMovements();

  const [days, setDays] = useState(30);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  /* ---------- CONSUMO ---------- */

  const consumption = movements
    .filter((m: any) => {
      const movementDate =
        m.date instanceof Date
          ? m.date
          : new Date(m.date);

      return (
        m.type === "ajuste" &&
        m.quantity < 0 &&
        movementDate >= cutoff &&
        m.location === location
      );
    })
    .reduce((acc: any, m: any) => {
      const qty = Math.abs(m.quantity);
      acc[m.product] =
        (acc[m.product] || 0) + qty;
      return acc;
    }, {});

  const ranking = Object.entries(consumption)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  /* ---------- STOCK POR LOCAL ---------- */

  function getTotalStock(product: any) {
    return getStock(product.name, location);
  }

  /* ---------- STOCK CRÍTICO ---------- */

  const criticalProducts = products.filter(
    (p) =>
      getTotalStock(p) <= p.criticalStock
  );

  /* ---------- PEDIDOS ACTIVOS ---------- */

  const activeOrders = orders.filter(
    (o) =>
      o.status !== "cumplido" &&
      o.location === location
  );

  /* ---------- UI ---------- */

  return (
    <div className="space-y-6">
      {/* STOCK CRÍTICO */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          ⚠ Stock crítico
        </h2>

        {criticalProducts.length === 0 && (
          <div className="text-zinc-400">
            No hay productos críticos.
          </div>
        )}

        <div className="space-y-2">
          {criticalProducts.map((p) => (
            <div
              key={p.name}
              className="bg-red-900 p-3 rounded flex justify-between"
            >
              <span>{p.name}</span>
              <span>
                Stock: {getTotalStock(p)} /
                Crítico: {p.criticalStock}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PEDIDOS ACTIVOS */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          📦 Pedidos activos
        </h2>

        {activeOrders.length === 0 && (
          <div className="text-zinc-400">
            No hay pedidos pendientes.
          </div>
        )}

        <div className="space-y-2">
          {activeOrders.map((o) => (
            <div
              key={o.id}
              className="bg-zinc-900 p-3 rounded flex justify-between"
            >
              <span>{o.product}</span>
              <span>
                Faltan:{" "}
                {o.quantity - o.delivered}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* INVENTARIO */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          📊 Inventario actual
        </h2>

        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.name}
              className="bg-zinc-900 p-3 rounded flex justify-between"
            >
              <span>{p.name}</span>
              <span>
                {getTotalStock(p)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CONSUMO */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          📈 Productos más consumidos
        </h2>

        <div className="flex gap-2 mb-2 justify-center">
          <button
            onClick={() => setDays(7)}
            className={`px-2 py-1 rounded ${
              days === 7
                ? "bg-zinc-700"
                : "bg-zinc-900"
            }`}
          >
            7 días
          </button>

          <button
            onClick={() => setDays(30)}
            className={`px-2 py-1 rounded ${
              days === 30
                ? "bg-zinc-700"
                : "bg-zinc-900"
            }`}
          >
            30 días
          </button>
        </div>

        <div className="space-y-2">
          {ranking.map(
            ([name, qty]: any) => (
              <div
                key={name}
                className="bg-zinc-900 p-3 rounded flex justify-between"
              >
                <span>{name}</span>
                <span>
                  {qty} usados
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* CHARTS */}
      <ConsumptionChart
        days={days}
        location={location}
      />

      <PurchaseCostChart
        days={days}
        location={location}
      />

      <PurchaseVsConsumptionChart
        location={location}
      />
    </div>
  );
}
