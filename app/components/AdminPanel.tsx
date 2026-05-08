"use client";

import { useState, useMemo } from "react";
import { useInventory } from "../context/InventoryContext";
import { useMovements } from "../context/MovementsContext";
import {
  AreaChart, Area , LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const COLORS = ["#3b82f6","#a78bfa","#4ade80","#f5a623","#f87171","#34d399","#fb923c","#38bdf8"];

function fmtARS(n: number) { return "$" + Math.round(n).toLocaleString("es-AR"); }
function fmtK(n: number) {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + Math.round(n / 1000) + "k";
  return fmtARS(n);
}

const ttp = { backgroundColor: '#111', border: '0.5px solid #333', borderRadius: 8, color: '#e8eaf0', fontSize: 12 };
const tx = { fill: '#555', fontSize: 10 };

function KpiCard({ label, value, sub, color = "blue", icon }: { label: string; value: string; sub?: string; color?: string; icon: string }) {
  const colors: Record<string, string> = {
    blue: "border-l-[#3b82f6] text-[#3b82f6]",
    purple: "border-l-[#a78bfa] text-[#a78bfa]",
    green: "border-l-[#4ade80] text-[#4ade80]",
    orange: "border-l-[#f5a623] text-[#f5a623]",
    red: "border-l-[#f87171] text-[#f87171]",
    teal: "border-l-[#34d399] text-[#34d399]",
  };
  return (
    <div className={`bg-zinc-900 p-4 rounded-xl border border-zinc-800 border-l-2 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <div className="text-zinc-500 text-xs uppercase tracking-wider">{label}</div>
      </div>
      <div className={`text-2xl font-bold ${colors[color].split(' ')[1]}`}>{value}</div>
      {sub && <div className="text-zinc-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminPanel({ location }: { location: string }) {
  const { products, getStock } = useInventory();
  const { movements } = useMovements();
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<"resumen" | "compras" | "rotacion" | "alertas">("resumen");

  const cutoff = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - days); return d;
  }, [days]);

  const filteredMovements = useMemo(() =>
    movements.filter((m) => {
      const d = m.date instanceof Date ? m.date : new Date(m.date);
      return d >= cutoff && m.location === location;
    }), [movements, cutoff, location]
  );

  const todosMovimientos = useMemo(() =>
    movements.filter((m) => m.location === location),
    [movements, location]
  );

  const ingresos = filteredMovements.filter((m) => m.type === "ingreso");
  const ajustes = filteredMovements.filter((m) => m.type === "ajuste" && m.quantity < 0);

  // KPIs principales
  const gastoTotal = ingresos.reduce((acc, m) => acc + (m.quantity * (m.unitPrice || 0)), 0);
  const unidadesCompradas = ingresos.reduce((acc, m) => acc + m.quantity, 0);
  const unidadesConsumidas = ajustes.reduce((acc, m) => acc + Math.abs(m.quantity), 0);
  const productosEnStock = products.filter((p) => (!p.locations || p.locations.includes(location)) && getStock(p.name, location) > 0).length;
  const productosSinStock = products.filter((p) => (!p.locations || p.locations.includes(location)) && getStock(p.name, location) <= 0).length;
  const productosCriticos = products.filter((p) => {
    if (!p.locations || p.locations.includes(location)) {
      const s = getStock(p.name, location); return s > 0 && s <= p.criticalStock;
    }
    return false;
  }).length;

  // Gasto por categoría
  const gastoPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    ingresos.forEach((m) => {
      const cat = products.find((p) => p.name === m.product)?.category || "Sin categoría";
      map[cat] = (map[cat] || 0) + (m.quantity * (m.unitPrice || 0));
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, total]) => ({ cat, total: Math.round(total) }));
  }, [ingresos, products]);

  // Gasto por mes
  const gastoPorMes = useMemo(() => {
    const map: Record<string, number> = {};
    ingresos.forEach((m) => {
      const d = m.date instanceof Date ? m.date : new Date(m.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = 0;
      map[key] += m.quantity * (m.unitPrice || 0);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, gasto]) => ({ mes, gasto: Math.round(gasto) }));
  }, [ingresos]);

  // Gasto diario últimos 14 días (ordenado cronológico)
  const comprasPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    ingresos.forEach((m) => {
      const d = m.date instanceof Date ? m.date : new Date(m.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + (m.quantity * (m.unitPrice || 0));
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
      .map(([key, costo]) => ({ fecha: key.split("-").reverse().join("/"), costo: Math.round(costo) }));
  }, [ingresos]);

  // Top productos por gasto
  const topComprados = useMemo(() => {
    const map: Record<string, { unidades: number; gasto: number }> = {};
    ingresos.forEach((m) => {
      if (!map[m.product]) map[m.product] = { unidades: 0, gasto: 0 };
      map[m.product].unidades += m.quantity;
      map[m.product].gasto += m.quantity * (m.unitPrice || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].gasto - a[1].gasto).slice(0, 6)
      .map(([name, vals]) => ({ name, unidades: vals.unidades, gasto: Math.round(vals.gasto) }));
  }, [ingresos]);

  // Gasto por proveedor
  const gastoPorProveedor = useMemo(() => {
    const map: Record<string, number> = {};
    ingresos.forEach((m) => {
      const prov = m.supplier || "Sin proveedor";
      map[prov] = (map[prov] || 0) + (m.quantity * (m.unitPrice || 0));
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])
      .map(([name, total]) => ({ name, total: Math.round(total) }));
  }, [ingresos]);

  // Rotación
  const rotacion = useMemo(() => {
    const map: Record<string, { comprado: number; consumido: number }> = {};
    filteredMovements.forEach((m) => {
      if (!map[m.product]) map[m.product] = { comprado: 0, consumido: 0 };
      if (m.type === "ingreso") map[m.product].comprado += m.quantity;
      if (m.type === "ajuste" && m.quantity < 0) map[m.product].consumido += Math.abs(m.quantity);
    });
    return Object.entries(map).filter(([, v]) => v.comprado > 0 || v.consumido > 0)
      .sort((a, b) => b[1].consumido - a[1].consumido)
      .map(([name, vals]) => ({
        name,
        comprado: vals.comprado,
        consumido: vals.consumido,
        pct: vals.comprado > 0 ? Math.round((vals.consumido / vals.comprado) * 100) : null,
      }));
  }, [filteredMovements]);

  // Días de stock restante
  const diasStock = useMemo(() => {
    return products
      .filter((p) => !p.locations || p.locations.includes(location))
      .map((p) => {
        const stock = getStock(p.name, location);
        const consumoPorDia = ajustes
          .filter((m) => m.product === p.name)
          .reduce((a, m) => a + Math.abs(m.quantity), 0) / days;
        const diasRestantes = consumoPorDia > 0 ? Math.round(stock / consumoPorDia) : null;
        return { name: p.name, stock, diasRestantes, consumoPorDia: Math.round(consumoPorDia * 10) / 10 };
      })
      .filter((p) => p.stock > 0)
      .sort((a, b) => (a.diasRestantes ?? 999) - (b.diasRestantes ?? 999));
  }, [products, ajustes, days, location]);

  // Productos sin movimiento (stock muerto)
  const stockMuerto = useMemo(() => {
    const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30);
    return products
      .filter((p) => !p.locations || p.locations.includes(location))
      .filter((p) => {
        const stock = getStock(p.name, location);
        if (stock <= 0) return false;
        const ultimoMov = todosMovimientos
          .filter((m) => m.product === p.name)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (!ultimoMov) return true;
        return new Date(ultimoMov.date) < hace30;
      })
      .map((p) => ({ name: p.name, stock: getStock(p.name, location) }));
  }, [products, todosMovimientos, location]);

  const tabClass = (t: string) => `px-4 py-2 rounded-lg text-sm font-medium transition ${
    activeTab === t ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
  }`;

  return (
    <div className="space-y-5 pb-10">

      {/* SELECTOR PERIODO */}
      <div className="flex gap-2 justify-center">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              days === d ? "bg-zinc-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}>{d} días</button>
        ))}
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon="💰" label="Gasto total" value={fmtK(gastoTotal)} sub={`últimos ${days} días · con IVA`} color="blue" />
        <KpiCard icon="📦" label="Unidades compradas" value={unidadesCompradas.toLocaleString("es-AR")} color="purple" />
        <KpiCard icon="🔄" label="Unidades consumidas" value={unidadesConsumidas.toLocaleString("es-AR")} color="teal" />
        <KpiCard icon="✅" label="Productos en stock" value={String(productosEnStock)} color="green" />
        <KpiCard icon="❌" label="Sin stock" value={String(productosSinStock)} color="red" />
        <KpiCard icon="⚠️" label="Stock crítico" value={String(productosCriticos)} color="orange" />
      </div>

      {/* ALERTAS RÁPIDAS */}
      {(productosSinStock > 0 || productosCriticos > 0 || stockMuerto.length > 0) && (
        <div className="space-y-2">
          {productosSinStock > 0 && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <div>
                <div className="text-red-300 font-medium text-sm">{productosSinStock} producto{productosSinStock > 1 ? "s" : ""} sin stock</div>
                <div className="text-red-500 text-xs">Requiere reposición inmediata</div>
              </div>
            </div>
          )}
          {productosCriticos > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <div className="text-yellow-300 font-medium text-sm">{productosCriticos} producto{productosCriticos > 1 ? "s" : ""} en stock crítico</div>
                <div className="text-yellow-500 text-xs">Considerar reposición pronto</div>
              </div>
            </div>
          )}
          {stockMuerto.length > 0 && (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">💤</span>
              <div>
                <div className="text-zinc-300 font-medium text-sm">{stockMuerto.length} producto{stockMuerto.length > 1 ? "s" : ""} sin movimiento en 30 días</div>
                <div className="text-zinc-500 text-xs">{stockMuerto.map(p => p.name).join(", ")}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        <button className={tabClass("resumen")} onClick={() => setActiveTab("resumen")}>📊 Resumen</button>
        <button className={tabClass("compras")} onClick={() => setActiveTab("compras")}>🛒 Compras</button>
        <button className={tabClass("rotacion")} onClick={() => setActiveTab("rotacion")}>🔄 Rotación</button>
        <button className={tabClass("alertas")} onClick={() => setActiveTab("alertas")}>
          🗓 Días stock
          {diasStock.filter(p => (p.diasRestantes ?? 999) <= 7).length > 0 && (
            <span className="ml-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {diasStock.filter(p => (p.diasRestantes ?? 999) <= 7).length}
            </span>
          )}
        </button>
      </div>

      {/* TAB RESUMEN */}
      {activeTab === "resumen" && (
        <div className="space-y-6">

          {/* Gasto por categoría — donut */}
          {gastoPorCategoria.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-4">Gasto por categoría</h3>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={gastoPorCategoria} dataKey="total" nameKey="cat"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                      {gastoPorCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={ttp} formatter={(v: any) => [fmtARS(v), ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 w-full">
                  {gastoPorCategoria.map((g, i) => {
                    const total = gastoPorCategoria.reduce((a, b) => a + b.total, 0);
                    const pct = total > 0 ? Math.round((g.total / total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-zinc-300">{g.cat}</span>
                          </div>
                          <div className="flex gap-3">
                            <span style={{ color: COLORS[i % COLORS.length] }} className="font-medium">{pct}%</span>
                            <span className="text-white font-medium">{fmtK(g.total)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Gasto por proveedor */}
          {gastoPorProveedor.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Gasto por proveedor</h3>
              <div className="space-y-2">
                {gastoPorProveedor.map((p, i) => {
                  const total = gastoPorProveedor.reduce((a, b) => a + b.total, 0);
                  const pct = total > 0 ? Math.round((p.total / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-300">{p.name}</span>
                        <div className="flex gap-3">
                          <span className="text-zinc-500">{pct}%</span>
                          <span className="text-white font-medium">{fmtK(p.total)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#3b82f6]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evolución gasto mensual */}
          {gastoPorMes.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Evolución gasto mensual</h3>
              <ResponsiveContainer width="100%" height={200}>
  <AreaChart data={gastoPorMes} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
    <defs>
      <linearGradient id="gastoGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid stroke="#222" />
    <XAxis dataKey="mes" tick={tx} />
    <YAxis tickFormatter={(v) => fmtK(v)} tick={tx} />
    <Tooltip contentStyle={ttp} formatter={(v: any) => [fmtARS(v), "Gasto"]} />
    <Area
      type="monotone"
      dataKey="gasto"
      stroke="#3b82f6"
      strokeWidth={2}
      fill="url(#gastoGrad)"
      dot={{ fill: "#3b82f6", r: 4 }}
      activeDot={{ r: 6 }}
    />
  </AreaChart>
</ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* TAB COMPRAS */}
      {activeTab === "compras" && (
        <div className="space-y-6">

          {/* Gasto diario */}
          {comprasPorDia.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Gasto diario — últimos 14 días</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={comprasPorDia} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid stroke="#222" />
                  <XAxis dataKey="fecha" tick={tx} angle={-45} textAnchor="end" />
                  <YAxis tickFormatter={(v) => fmtK(v)} tick={tx} />
                  <Tooltip contentStyle={ttp} formatter={(v: any) => [fmtARS(v), "Gasto"]} />
                  <Line type="monotone" dataKey="costo" stroke="#38bdf8" strokeWidth={2} dot={{ fill: "#38bdf8", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top productos */}
          {topComprados.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Top productos por gasto</h3>
              <div className="space-y-2">
                {topComprados.map((p, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 text-sm font-bold w-5">#{i + 1}</span>
                      <div>
                        <div className="text-zinc-200 text-sm font-medium">{p.name}</div>
                        <div className="text-zinc-500 text-xs">{p.unidades} unidades</div>
                      </div>
                    </div>
                    <div className="text-[#3b82f6] font-bold text-sm">{fmtK(p.gasto)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB ROTACION */}
      {activeTab === "rotacion" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-4">Rotación de productos</h3>
            {rotacion.length === 0 ? (
              <div className="text-zinc-500 text-sm text-center py-6">Sin datos en este período</div>
            ) : (
              <div className="space-y-3">
                {rotacion.map((p, i) => {
                  const sinCompras = p.pct === null;
                  const pctColor = sinCompras ? "#888" :
                    p.pct! >= 80 ? "#4ade80" : p.pct! >= 50 ? "#f5a623" : "#f87171";
                  return (
                    <div key={i} className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-zinc-200 text-sm font-medium">{p.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${pctColor}20`, color: pctColor }}>
                          {sinCompras ? "Solo consumo" : `${p.pct}% rotación`}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-zinc-500 mb-2">
                        <span>Comprado: <span className="text-[#3b82f6] font-medium">{p.comprado}</span></span>
                        <span>Consumido: <span className="text-[#4ade80] font-medium">{p.consumido}</span></span>
                      </div>
                      {!sinCompras && (
                        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(p.pct!, 100)}%`, background: pctColor }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB DÍAS STOCK */}
      {activeTab === "alertas" && (
        <div className="space-y-3">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-4">Días de stock restante por producto</h3>
            {diasStock.length === 0 ? (
              <div className="text-zinc-500 text-sm text-center py-6">Sin datos suficientes</div>
            ) : (
              <div className="space-y-2">
                {diasStock.map((p, i) => {
                  const color = p.diasRestantes === null ? "#555" :
                    p.diasRestantes <= 3 ? "#f87171" :
                    p.diasRestantes <= 7 ? "#f5a623" : "#4ade80";
                  const bg = p.diasRestantes === null ? "bg-zinc-800/30" :
                    p.diasRestantes <= 3 ? "bg-red-900/20 border-red-800/50" :
                    p.diasRestantes <= 7 ? "bg-yellow-900/20 border-yellow-800/50" : "bg-zinc-800/30";
                  return (
                    <div key={i} className={`rounded-xl p-3 border ${bg} flex justify-between items-center`}>
                      <div>
                        <div className="text-zinc-200 text-sm font-medium">{p.name}</div>
                        <div className="text-zinc-500 text-xs">
                          Stock: {p.stock} · Consumo: {p.consumoPorDia}/día
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color }}>
                          {p.diasRestantes === null ? "∞" : `${p.diasRestantes}d`}
                        </div>
                        <div className="text-zinc-600 text-xs">restantes</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stock muerto */}
          {stockMuerto.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">💤 Stock sin movimiento +30 días</h3>
              <div className="space-y-2">
                {stockMuerto.map((p, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-zinc-400 text-sm">{p.name}</span>
                    <span className="text-zinc-500 text-sm">Stock: {p.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}