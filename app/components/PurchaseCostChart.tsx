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

  /* ---------- FILTRADO ---------- */
  const filtered = movements.filter((m) => {
    const isPurchase = m.type === "ingreso";

    const inRange = m.date >= cutoff;

    const matchesLocation =
      location === "all" ||
      m.location === location;

    return (
      isPurchase &&
      inRange &&
      matchesLocation
    );
  });

  /* ---------- AGRUPAR POR FECHA ---------- */
  const grouped: Record<string, number> = {};

  filtered.forEach((m) => {
    const date = m.date.toLocaleDateString();

    const qty = Number(m.quantity || 0);
    const price = Number(m.unitPrice || 0);

    const cost = qty * price;

    if (!grouped[date]) {
      grouped[date] = 0;
    }

    grouped[date] += cost;
  });

  /* ---------- DATA FINAL ---------- */
  const data = Object.entries(grouped).map(
    ([date, cost]) => ({
      date,
      costo: Number(cost) || 0,
    })
  );

  return (
    <div className="bg-zinc-900 p-4 rounded">
      <ResponsiveContainer
        width="100%"
        height={250}
      >
        <LineChart data={data}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="costo"
            stroke="#38bdf8"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
