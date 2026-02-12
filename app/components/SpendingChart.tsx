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

export default function SpendingChart({
  location,
}: {
  location: string;
}) {
  const { movements } = useMovements();

  const filtered = movements.filter(
    (m) =>
      m.type === "ingreso" &&
      (location === "all" ||
        m.location === location)
  );

  const grouped: any = {};

  filtered.forEach((m) => {
    const month = `${m.date.getMonth() + 1}/${m.date.getFullYear()}`;

    if (!grouped[month]) {
      grouped[month] = {
        totalCost: 0,
        prices: [],
      };
    }

    grouped[month].totalCost +=
      m.quantity * m.unitPrice;

    grouped[month].prices.push(
      m.unitPrice
    );
  });

  const data = Object.entries(grouped).map(
    ([month, info]: any) => {
      const avgPrice =
        info.prices.reduce(
          (a: number, b: number) => a + b,
          0
        ) / info.prices.length;

      return {
        month,
        gasto: info.totalCost,
        precioMedio: avgPrice,
      };
    }
  );

  return (
    <div className="bg-zinc-900 p-4 rounded">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="gasto"
            stroke="#22c55e"
            name="Gasto $"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
