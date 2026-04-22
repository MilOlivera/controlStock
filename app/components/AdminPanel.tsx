"use client";

import { useState, useMemo } from "react";
import { useInventory } from "../context/InventoryContext";
import { useMovements } from "../context/MovementsContext";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";

export default function AdminPanel({
  location,
}: {
  location: string;
}) {
  const { products, getStock } = useInventory();
  const { movements } = useMovements();
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<"resumen" | "compras" | "rotacion">("resumen");

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }, [days]);

  /* ---------- MOVIMIENTOS FILTRADOS ---------- */
  const filteredMovements = useMemo(() =>
    movements.filter((m) => {
      const d = m.date instanceof Date ? m.date : new Date(m.date);
      return d >= cutoff && m.location === location;
    }),
    [movements, cutoff, location]
  );

  const ingresos = filteredMovements.filter((m) => m.type === "ingreso");
  const ajustes = filteredMovements.filter((m) => m.type === "ajuste" && m.quantity < 0);

  /* ---------- KPIs ---------- */
  const gastoTotal = ingresos.reduce((acc, m) => acc + (m.quantity * (m.unitPrice || 0)), 0);
  const unidadesCompradas = ingresos.reduce((acc, m) => acc + m.quantity, 0);
  const unidadesConsumidas = ajustes.reduce((acc, m) => acc + Math.abs(m.quantity), 0);

  const productosEnStock = products.filter((p) => {
    if (!p.locations || p.locations.includes(location)) {
      return getStock(p.name, location) > 0;
    }
    return false;
  }).length;

  const productosSinStock = products.filter((p) => {
    if (!p.locations || p.locations.includes(location)) {
      return getStock(p.name, location) <= 0;
    }
    return false;
  }).length;

  const productosCriticos = products.filter((p) => {
    if (!p.locations || p.locations.includes(location)) {
      const s = getStock(p.name, location);
      return s > 0 && s <= p.criticalStock;
    }
    return false;
  }).length;

  /* ---------- GASTO POR CATEGORIA ---------- */
  const gastoPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    ingresos.forEach((m) => {
      const product = products.find((p) => p.name === m.product);
      const cat = product?.category || "Sin categoría";
      map[cat] = (map[cat] || 0) + (m.quantity * (m.unitPrice || 0));
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => ({ cat, total: Math.round(total) }));
  }, [ingresos, products]);

  /* ---------- GASTO POR MES ---------- */
  const gastoPorMes = useMemo(() => {
    const map: Record<string, { gasto: number; unidades: number }> = {};
    ingresos.forEach((m) => {
      const d = m.date instanceof Date ? m.date : new Date(m.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { gasto: 0, unidades: 0 };
      map[key].gasto += m.quantity * (m.unitPrice || 0);
      map[key].unidades += m.quantity;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, vals]) => ({
        mes,
        gasto: Math.round(vals.gasto),
        unidades: vals.unidades,
      }));
  }, [ingresos]);

  /* ---------- COMPRAS POR DIA ---------- */
  const comprasPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    ingresos.forEach((m) => {
      const d = m.date instanceof Date ? m.date : new Date(m.date);
      const key = d.toLocaleDateString("es-AR");
      map[key] = (map[key] || 0) + (m.quantity * (m.unitPrice || 0));
    });
    return Object.entries(map)
      .slice(-14)
      .map(([fecha, costo]) => ({ fecha, costo: Math.round(costo) }));
  }, [ingresos]);

  /* ---------- TOP PRODUCTOS MAS COMPRADOS ---------- */
  const topComprados = useMemo(() => {
    const map: Record<string, { unidades: number; gasto: number }> = {};
    ingresos.forEach((m) => {
      if (!map[m.product]) map[m.product] = { unidades: 0, gasto: 0 };
      map[m.product].unidades += m.quantity;
      map[m.product].gasto += m.quantity * (m.unitPrice || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1].gasto - a[1].gasto)
      .slice(0, 6)
      .map(([name, vals]) => ({
        name,
        unidades: vals.unidades,
        gasto: Math.round(vals.gasto),
      }));
  }, [ingresos]);

  /* ---------- ROTACION ---------- */
  const rotacion = useMemo(() => {
    const map: Record<string, { comprado: number; consumido: number }> = {};
    filteredMovements.forEach((m) => {
      if (!map[m.product]) map[m.product] = { comprado: 0, consumido: 0 };
      if (m.type === "ingreso") map[m.product].comprado += m.quantity;
      if (m.type === "ajuste" && m.quantity < 0) map[m.product].consumido += Math.abs(m.quantity);
    });
    return Object.entries(map)
      .filter(([, v]) => v.comprado > 0 || v.consumido > 0)
      .sort((a, b) => b[1].consumido - a[1].consumido)
      .map(([name, vals]) => ({
        name,
        comprado: vals.comprado,
        consumido: vals.consumido,
        pct: vals.comprado > 0 ? Math.round((vals.consumido / vals.comprado) * 100) : 0,
      }));
  }, [filteredMovements]);

  /* ---------- DIAS DE STOCK RESTANTE ---------- */
  const diasStock = useMemo(() => {
    return products
      .filter((p) => !p.locations || p.locations.includes(location))
      .map((p) => {
        const stock = getStock(p.name, location);
        const consumoPorDia = ajustes
          .filter((m) => m.product === p.name)
          .reduce((a, m) => a + Math.abs(m.quantity), 0) / days;
        const diasRestantes = consumoPorDia > 0 ? Math.round(stock / consumoPorDia) : null;
        return { name: p.name, stock, diasRestantes };
      })
      .filter((p) => p.stock > 0)
      .sort((a, b) => (a.diasRestantes ?? 999) - (b.diasRestantes ?? 999))
      .slice(0, 8);
  }, [products, ajustes, days, location]);

  const fmtARS = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

  const tabClass = (t: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${
      activeTab === t
        ? "bg-blue-600 text-white"
        : "bg-zinc-800 text-zinc-400 hover:text-white"
    }`;

  return (
    <div className="space-y-6">

      {/* SELECTOR PERIODO */}
      <div className="flex gap-2 justify-center">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              days === d ? "bg-zinc-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {d} días
          </button>
        ))}
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-400 text-xs uppercase mb-1">Gasto total</div>
          <div className="text-2xl font-bold text-blue-400">{fmtARS(gastoTotal)}</div>
          <div className="text-zinc-500 text-xs mt-1">{days} días</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-400 text-xs uppercase mb-1">Unidades compradas</div>
          <div className="text-2xl font-bold text-purple-400">{unidadesCompradas.toLocaleString("es-AR")}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-400 text-xs uppercase mb-1">Unidades consumidas</div>
          <div className="text-2xl font-bold text-teal-400">{unidadesConsumidas.toLocaleString("es-AR")}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-400 text-xs uppercase mb-1">En stock</div>
          <div className="text-2xl font-bold text-green-400">{productosEnStock}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-400 text-xs uppercase mb-1">Sin stock</div>
          <div className="text-2xl font-bold text-red-400">{productosSinStock}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-400 text-xs uppercase mb-1">Stock critico</div>
          <div className="text-2xl font-bold text-yellow-400">{productosCriticos}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        <button className={tabClass("resumen")} onClick={() => setActiveTab("resumen")}>Resumen</button>
        <button className={tabClass("compras")} onClick={() => setActiveTab("compras")}>Compras</button>
        <button className={tabClass("rotacion")} onClick={() => setActiveTab("rotacion")}>Rotacion</button>
      </div>

      {/* TAB RESUMEN */}
      {activeTab === "resumen" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Gasto por categoria</h3>
            {gastoPorCategoria.length === 0 ? (
              <div className="text-zinc-500 text-sm">Sin datos</div>
            ) : (
              <div className="space-y-2">
                {gastoPorCategoria.map((g, i) => {
                  const max = gastoPorCategoria[0].total;
                  const pct = max > 0 ? (g.total / max) * 100 : 0;
                  const colors = ["#3b82f6","#a78bfa","#4ade80","#f5a623","#f87171","#34d399"];
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-300">{g.cat}</span>
                        <span className="text-white font-medium">{fmtARS(g.total)}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Dias de stock restante</h3>
            {diasStock.length === 0 ? (
              <div className="text-zinc-500 text-sm">Sin datos suficientes</div>
            ) : (
              <div className="space-y-2">
                {diasStock.map((p, i) => (
                  <div key={i} className="bg-zinc-900 rounded-xl p-3 flex justify-between items-center border border-zinc-800">
                    <span className="text-zinc-300 text-sm">{p.name}</span>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        p.diasRestantes === null ? "text-zinc-500" :
                        p.diasRestantes <= 3 ? "text-red-400" :
                        p.diasRestantes <= 7 ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {p.diasRestantes === null ? "Sin consumo" : `${p.diasRestantes} dias`}
                      </div>
                      <div className="text-zinc-500 text-xs">Stock: {p.stock}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB COMPRAS */}
      {activeTab === "compras" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Gasto por mes</h3>
            {gastoPorMes.length === 0 ? (
              <div className="text-zinc-500 text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gastoPorMes}>
                  <CartesianGrid stroke="#222" />
                  <XAxis dataKey="mes" tick={{ fill: "#666", fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fill: "#666", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "0.5px solid #222", borderRadius: 8 }}
                    formatter={(v: any) => [fmtARS(v), "Gasto"]}
                  />
                  <Bar dataKey="gasto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div>
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Top productos por gasto</h3>
            {topComprados.length === 0 ? (
              <div className="text-zinc-500 text-sm">Sin datos</div>
            ) : (
              <div className="space-y-2">
                {topComprados.map((p, i) => (
                  <div key={i} className="bg-zinc-900 rounded-xl p-3 flex justify-between items-center border border-zinc-800">
                    <div>
                      <div className="text-zinc-300 text-sm font-medium">{p.name}</div>
                      <div className="text-zinc-500 text-xs">{p.unidades} unidades</div>
                    </div>
                    <div className="text-blue-400 font-bold text-sm">{fmtARS(p.gasto)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Gasto diario (ultimos 14 dias)</h3>
            {comprasPorDia.length === 0 ? (
              <div className="text-zinc-500 text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={comprasPorDia}>
                  <CartesianGrid stroke="#222" />
                  <XAxis dataKey="fecha" tick={{ fill: "#666", fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fill: "#666", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "0.5px solid #222", borderRadius: 8 }}
                    formatter={(v: any) => [fmtARS(v), "Gasto"]}
                  />
                  <Line type="monotone" dataKey="costo" stroke="#38bdf8" strokeWidth={2} dot={{ fill: "#38bdf8", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* TAB ROTACION */}
      {activeTab === "rotacion" && (
        <div className="space-y-4">
          <h3 className="text-sm text-zinc-400 uppercase tracking-wider">Comprado vs consumido por producto</h3>
          {rotacion.length === 0 ? (
            <div className="text-zinc-500 text-sm">Sin datos en este periodo</div>
          ) : (
            <div className="space-y-2">
              {rotacion.map((p, i) => (
                <div key={i} className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-300 text-sm font-medium">{p.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      p.pct >= 80 ? "bg-green-500/20 text-green-400" :
                      p.pct >= 50 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {p.pct}% rotacion
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-zinc-500">
                    <span>Comprado: <span className="text-blue-400 font-medium">{p.comprado}</span></span>
                    <span>Consumido: <span className="text-green-400 font-medium">{p.consumido}</span></span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${Math.min(p.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}