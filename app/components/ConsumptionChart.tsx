"use client";

import { useState } from "react";
import { useMovements } from "../context/MovementsContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ConsumptionChart({
  location,
}: {
  days?: number;
  location: string | "all";
}) {
  const { movements } = useMovements();
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  function matchesLocation(m: any) {
    return location === "all" || m.location === location;
  }

  const filtered = movements.filter(matchesLocation);

  const products = Array.from(new Set(filtered.map((m) => m.product))).sort();

  // Agrupar consumo real por mes (ajustes negativos = lo que se consumió)
  const monthlyConsumo: Record<string, number> = {};

  filtered
    .filter((m: any) => selectedProduct ? m.product === selectedProduct : false)
    .forEach((m: any) => {
      if (m.type !== "ajuste" || m.quantity >= 0) return;
      const d = new Date(m.date);
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      if (!monthlyConsumo[key]) monthlyConsumo[key] = 0;
      monthlyConsumo[key] += Math.abs(Number(m.quantity || 0));
    });

  // Ordenar cronológicamente (más viejo primero)
  const data = Object.entries(monthlyConsumo)
    .sort(([a], [b]) => new Date(a + "-01").getTime() - new Date(b + "-01").getTime())
    .map(([month, consumido]) => ({ month, consumido }));

  return (
    <div className="bg-zinc-900 p-4 rounded space-y-3">
      <div className="flex justify-center">
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="bg-zinc-800 p-2 rounded text-sm"
        >
          <option value="">Seleccionar producto</option>
          {products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {!selectedProduct ? (
        <div className="text-zinc-500 text-sm text-center py-10">
          Seleccioná un producto para ver su consumo mensual
        </div>
      ) : data.length === 0 ? (
        <div className="text-zinc-500 text-sm text-center py-10">
          Sin datos de consumo para este producto
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
            <YAxis tick={{ fill: '#888', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '0.5px solid #333', borderRadius: 8, fontSize: 12 }}
              formatter={(v: any) => [v, 'Consumido']}
            />
            <Bar dataKey="consumido" fill="#22c55e" radius={[3, 3, 0, 0]} name="Consumido" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}