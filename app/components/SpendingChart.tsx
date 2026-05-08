"use client";

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

export default function SpendingChart({
  location,
}: {
  location: string;
}) {
  const { movements } = useMovements();

  const filtered = movements.filter(
    (m) =>
      m.type === "ingreso" &&
      (location === "all" || m.location === location)
  );

  const grouped: Record<string, { totalCost: number; prices: number[] }> = {};

  filtered.forEach((m) => {
    // Clave ordenable: YYYY-MM
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}`
    if (!grouped[key]) grouped[key] = { totalCost: 0, prices: [] }
    grouped[key].totalCost += m.quantity * m.unitPrice
    grouped[key].prices.push(m.unitPrice)
  });

  // Ordenar cronológicamente (más viejo → más nuevo)
  const data = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, info]) => ({
      month: key.slice(5) + "/" + key.slice(0, 4), // MM/YYYY para mostrar
      gasto: Math.round(info.totalCost),
      precioMedio: Math.round(info.prices.reduce((a, b) => a + b, 0) / info.prices.length),
    }))

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 p-4 rounded text-zinc-500 text-sm text-center py-10">
        Sin datos de gasto
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 p-4 rounded">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
          <YAxis
            tick={{ fill: '#888', fontSize: 11 }}
            tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '0.5px solid #333', borderRadius: 8, fontSize: 12 }}
            formatter={(v: any) => [`$${Number(v).toLocaleString('es-AR')}`, 'Gasto']}
          />
          <Bar dataKey="gasto" fill="#22c55e" radius={[3, 3, 0, 0]} name="Gasto $" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}