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

export default function PurchaseCostChart({
  days,
  location,
}: {
  days: number;
  location: string | "all";
}) {
  const { movements } = useMovements();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filtered = movements.filter((m) => {
    return (
      m.type === "ingreso" &&
      m.date >= cutoff &&
      (location === "all" || m.location === location)
    );
  });

  // Agrupar por fecha usando clave ordenable YYYY-MM-DD
  const grouped: Record<string, number> = {};

  filtered.forEach((m) => {
    const d = m.date
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    if (!grouped[key]) grouped[key] = 0
    grouped[key] += Number(m.quantity || 0) * Number(m.unitPrice || 0)
  });

  // Ordenar cronológicamente
  const data = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, costo]) => ({
      date: key.split("-").reverse().join("/"), // DD/MM/YYYY para mostrar
      costo: Math.round(costo),
    }));

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 p-4 rounded text-zinc-500 text-sm text-center py-10">
        Sin compras en este período
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 p-4 rounded">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
          <YAxis
            tick={{ fill: '#888', fontSize: 11 }}
            tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '0.5px solid #333', borderRadius: 8, fontSize: 12 }}
            formatter={(v: any) => [`$${Number(v).toLocaleString('es-AR')}`, 'Costo']}
          />
          <Bar dataKey="costo" fill="#38bdf8" radius={[3, 3, 0, 0]} name="Costo $" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}