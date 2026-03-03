"use client";

import { useState, useMemo } from "react";
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

  const { movements } = useMovements();

  const [days, setDays] = useState(30);

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }, [days]);

  /* ================= CONSUMO ================= */

  const filteredMovements = movements.filter(
    (m: any) => {
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
    }
  );

  const consumption: Record<string, number> =
  filteredMovements.reduce(
    (acc: Record<string, number>, m: any) => {
      const qty = Math.abs(m.quantity);
      acc[m.product] =
        (acc[m.product] || 0) + qty;
      return acc;
    },
    {}
  );

  const ranking = Object.entries(consumption)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  /* ================= KPI ================= */

  const totalConsumption = Object.values(
    consumption
  ).reduce(
    (acc: any, val: any) => acc + val,
    0
  );

  const avgDailyConsumption =
    totalConsumption / days;

  const productsWithoutMovement =
    products.filter(
      (p) => !consumption[p.name]
    ).length;

  const totalStockValue = products.reduce(
    (acc, p) =>
      acc + getStock(p.name, location),
    0
  );

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      {/* RANGE SELECTOR */}
      <div className="flex gap-2 justify-center">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded ${
              days === d
                ? "bg-zinc-700"
                : "bg-zinc-900"
            }`}
          >
            {d} días
          </button>
        ))}
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="bg-zinc-900 p-4 rounded">
          <div className="text-zinc-400 text-sm">
            Consumo total
          </div>
          <div className="text-xl font-semibold">
            {totalConsumption}
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <div className="text-zinc-400 text-sm">
            Promedio diario
          </div>
          <div className="text-xl font-semibold">
            {avgDailyConsumption.toFixed(2)}
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <div className="text-zinc-400 text-sm">
            Productos sin movimiento
          </div>
          <div className="text-xl font-semibold">
            {productsWithoutMovement}
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <div className="text-zinc-400 text-sm">
            Stock actual total
          </div>
          <div className="text-xl font-semibold">
            {totalStockValue}
          </div>
        </div>

      </div>

      {/* RANKING */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          📈 Top 5 productos más consumidos
        </h2>

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

          {ranking.length === 0 && (
            <div className="text-zinc-400">
              Sin consumo en este período.
            </div>
          )}
        </div>
      </div>

      {/* CHARTS (NO LOS TOCAMOS) */}

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