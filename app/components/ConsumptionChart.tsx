"use client";

import { useState } from "react";
import { useMovements } from "../context/MovementsContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ConsumptionChart({
  location,
}: {
  days?: number; // ya no se usa, pero no rompe llamadas existentes
  location: string | "all";
}) {
  const { movements } = useMovements();

  const [selectedProduct, setSelectedProduct] =
    useState<string>("");

  /* ---------- FILTRO LOCAL ---------- */
  function matchesLocation(m: any) {
    return (
      location === "all" ||
      m.location === location
    );
  }

  /* ---------- MOVIMIENTOS FILTRADOS ---------- */
  const filtered = movements.filter(
    (m) => matchesLocation(m)
  );

  /* ---------- PRODUCTOS DISPONIBLES ---------- */
  const products = Array.from(
    new Set(filtered.map((m) => m.product))
  );

  /* ---------- AGRUPAR STOCK POR MES ---------- */
  const monthlyStock: any = {};

  let runningStock = 0;

  filtered
    .filter((m) =>
      selectedProduct
        ? m.product === selectedProduct
        : false
    )
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    )
    .forEach((m) => {
      runningStock += m.quantity;

      const d = new Date(m.date);
      const key =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(
          2,
          "0"
        );

      /* guardamos último stock del mes */
      monthlyStock[key] = runningStock;
    });

  const data = Object.entries(
    monthlyStock
  ).map(([month, stock]) => ({
    month,
    stock: Math.max(0, Number(stock)),
  }));

  return (
    <div className="bg-zinc-900 p-4 rounded space-y-3">
      {/* selector producto */}
      <div className="flex justify-center">
        <select
          value={selectedProduct}
          onChange={(e) =>
            setSelectedProduct(
              e.target.value
            )
          }
          className="bg-zinc-800 p-2 rounded"
        >
          <option value="">
            Seleccionar producto
          </option>

          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer
        width="100%"
        height={260}
      >
        <LineChart data={data}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="stock"
            stroke="#22c55e"
            name="Stock"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
