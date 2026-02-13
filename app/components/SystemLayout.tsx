"use client";

import { useState } from "react";
import StockList from "./StockList";
import { useOrders } from "../context/OrdersContext";
import DeliverModal from "./DeliverModal";
import UserMenu from "./UserMenu";
import AdminPanel from "./AdminPanel";
import { useUser } from "../context/UserContext";
import AdminOrdersList from "./AdminOrdersList";
import AdminPurchases from "./AdminPurchases";
import GlobalRequestForm from "./GlobalRequestForm";
import AdminProducts from "./AdminProducts";

export default function SystemLayout({
  brand,
}: {
  brand: "marpla" | "evolvere";
}) {
  const [tab, setTab] = useState("stock");
  const [selectedOrder, setSelectedOrder] =
    useState<any>(null);

  const { orders } = useOrders();
  const { user } = useUser();

  /* ---------- LOCAL SELECCIONADO (admin) ---------- */
  const [selectedLocation, setSelectedLocation] =
    useState<string>("marpla-lomas");

  /* ---------- LOCAL EFECTIVO ---------- */
  const effectiveLocation =
    user?.role === "ADMIN"
      ? selectedLocation
      : user?.location ?? "marpla-lomas";

  /* ---------- LABEL LOCAL ---------- */
  function getLocationLabel(location: string) {
    if (location === "marpla-lomas")
      return "MARPLA – LOMAS";
    if (location === "evolvere")
      return "EVOLVERE";
    return location.toUpperCase();
  }

  /* ---------- HEADER LOCATION ---------- */
  const headerLocation =
    user?.role === "ADMIN"
      ? selectedLocation
      : user?.location ?? "marpla-lomas";

  const brandName =
    getLocationLabel(headerLocation);

  /* ---------- PEDIDOS ACTIVOS ---------- */
  const activeOrders = orders.filter(
    (o) => {
      if (o.status === "cumplido") return false;

      if (user?.role === "ADMIN") return true;

      return o.location === effectiveLocation;
    }
  );

  const localTabs = [
    "stock",
    "solicitar",
    "pedidos",
  ];

  const adminTabs = [
    "stock",
    "pedidos",
    "compras",
    "productos",
    "metricas",
  ];

  const tabs =
    user?.role === "ADMIN"
      ? adminTabs
      : localTabs;

  function statusLabel(status: string) {
    if (status === "pendiente") return "Pendiente";
    if (status === "parcial") return "Parcial";
    return "Cumplido";
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* ---------- HEADER ---------- */}
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center">

        {user?.role === "ADMIN" ? (
          <select
            value={selectedLocation}
            onChange={(e) =>
              setSelectedLocation(e.target.value)
            }
            className="bg-zinc-800 px-3 py-1 rounded text-sm font-semibold"
          >
            <option value="marpla-lomas">
              MARPLA – LOMAS
            </option>
            <option value="evolvere">
              EVOLVERE
            </option>
          </select>
        ) : (
          <h1 className="text-lg font-bold">
            {brandName}
          </h1>
        )}

        <UserMenu />
      </header>

      {/* ---------- TABS ---------- */}
      <div className="flex border-b border-zinc-800">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`flex-1 p-3 text-sm capitalize ${
              tab === item
                ? "bg-zinc-800 font-semibold"
                : "bg-black"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4">
        {/* ---------- LOCAL ---------- */}
        {user?.role !== "ADMIN" && (
          <>
            {tab === "stock" && (
              <StockList locationOverride={effectiveLocation} />
            )}

            {tab === "solicitar" && (
              <GlobalRequestForm location={effectiveLocation} />
            )}

            {tab === "pedidos" && (
              <div className="space-y-3">
                {activeOrders.map((o) => {
                  const remaining =
                    o.quantity - o.delivered;

                  return (
                    <div
                      key={o.id}
                      className="bg-zinc-900 p-3 rounded flex justify-between"
                    >
                      <div>
                        <div className="font-semibold">
                          {o.product}
                        </div>
                        <div className="text-sm text-zinc-400">
                          Pedido: {o.quantity}
                        </div>
                        <div className="text-sm text-zinc-400">
                          Entregado: {o.delivered}
                        </div>
                        <div className="text-sm text-zinc-400">
                          Faltan: {remaining}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {statusLabel(o.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---------- ADMIN ---------- */}
        {user?.role === "ADMIN" && (
          <>
            {tab === "stock" && (
              <StockList
                locationOverride={effectiveLocation}
              />
            )}

            {tab === "pedidos" && (
              <AdminOrdersList />
            )}

            {tab === "compras" && (
              <AdminPurchases
                location={effectiveLocation}
              />
            )}

            {tab === "productos" && (
              <AdminProducts />
            )}

            {tab === "metricas" && (
              <AdminPanel
                location={effectiveLocation}
              />
            )}
          </>
        )}
      </main>

      <DeliverModal
        order={selectedOrder}
        onClose={() =>
          setSelectedOrder(null)
        }
      />
    </div>
  );
}
