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
  Legend,
} from "recharts";

export default function PurchaseVsConsumptionChart({
  location,
}: {
  location: string | "all";
}) {
  const { movements } = useMovements();

  function matchesLocation(m: any) {
    return location === "all" || m.location === location;
  }

  const filtered = movements.filter(matchesLocation);

  const monthly: Record<string, { comprado: number; consumido: number }> = {};

  filtered.forEach((m: any) => {
    const d = new Date(m.date);
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");

    if (!monthly[key]) monthly[key] = { comprado: 0, consumido: 0 };

    if (m.type === "ingreso") {
      monthly[key].comprado += Number(m.quantity || 0);
    }

    if (m.type === "ajuste" && m.quantity < 0) {
      monthly[key].consumido += Math.abs(Number(m.quantity || 0));
    }
  });

  // Ordenar cronológicamente (más viejo primero)
  const data = Object.entries(monthly)
    .sort(([a], [b]) => new Date(a + "-01").getTime() - new Date(b + "-01").getTime())
    .map(([month, vals]) => ({
      month,
      comprado: vals.comprado,
      consumido: vals.consumido,
    }));

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 p-4 rounded text-zinc-500 text-sm text-center py-10">
        Sin datos suficientes
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-4 rounded">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
          <YAxis tick={{ fill: '#888', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '0.5px solid #333', borderRadius: 8, fontSize: 12 }}
          />
          <Legend />
          <Bar dataKey="comprado" fill="#60a5fa" radius={[3, 3, 0, 0]} name="Comprado" />
          <Bar dataKey="consumido" fill="#22c55e" radius={[3, 3, 0, 0]} name="Consumido" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}