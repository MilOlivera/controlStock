"use client";

import { useMovements } from "../context/MovementsContext";
import {
  LineChart,
  Line,
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

  /* ---------- FILTRO LOCAL ---------- */
  function matchesLocation(m: any) {
    return (
      location === "all" ||
      m.location === location
    );
  }

  const filtered = movements.filter(matchesLocation);

  /* ---------- AGRUPAR POR MES ---------- */
  const monthly: Record<
    string,
    { comprado: number; consumido: number }
  > = {};

  filtered.forEach((m: any) => {
    const d = new Date(m.date);

    const key =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0");

    if (!monthly[key]) {
      monthly[key] = {
        comprado: 0,
        consumido: 0,
      };
    }

    /* compras */
    if (m.type === "ingreso") {
      monthly[key].comprado +=
        Number(m.quantity || 0);
    }

    /* consumo real */
    if (
      m.type === "ajuste" &&
      m.quantity < 0
    ) {
      monthly[key].consumido +=
        Math.abs(Number(m.quantity || 0));
    }
  });

  /* ---------- ORDENAR MESES ---------- */
  const data = Object.entries(monthly)
    .sort(
      ([a], [b]) =>
        new Date(a + "-01").getTime() -
        new Date(b + "-01").getTime()
    )
    .map(([month, vals]) => ({
      month,
      comprado: vals.comprado,
      consumido: vals.consumido,
    }));

  return (
    <div className="bg-zinc-900 p-4 rounded">
      <ResponsiveContainer
        width="100%"
        height={260}
      >
        <LineChart data={data}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="comprado"
            stroke="#60a5fa"
            name="Comprado"
          />

          <Line
            type="monotone"
            dataKey="consumido"
            stroke="#22c55e"
            name="Consumido"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
