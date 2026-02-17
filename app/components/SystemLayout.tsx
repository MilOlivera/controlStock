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

import marplaLogo from "../assets/marplaLogo.jpeg";
import evolvereLogo from "../assets/evolvereLogo.png";

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

  /* ---------- LOCAL SELECCIONADO ---------- */
  const [selectedLocation, setSelectedLocation] =
    useState<string>("marpla-lomas");

  /* ---------- LOCAL EFECTIVO ---------- */
  const effectiveLocation =
    user?.role === "ADMIN"
      ? selectedLocation
      : user?.location || "marpla-lomas";

  /* ---------- LABEL LOCAL ---------- */
  function getLocationLabel(location: string) {
    if (location === "marpla-lomas")
      return "MARPLA – LOMAS";
    if (location === "evolvere")
      return "EVOLVERE";
    return location.toUpperCase();
  }

  const headerLocation =
    user?.role === "ADMIN"
      ? selectedLocation
      : user?.location || "marpla-lomas";

  const brandName =
    getLocationLabel(headerLocation);

  /* ---------- CONFIG VISUAL MARCA ---------- */
  function getBrandConfig(location: string) {
  if (location === "marpla-lomas") {
    return {
      color: "text-blue-400",
      accent: "border-blue-500",
      logo: marplaLogo,
    };
  }

  if (location === "evolvere") {
    return {
      color: "text-emerald-400",
      accent: "border-emerald-500",
      logo: evolvereLogo,
    };
  }

  return {
    color: "text-white",
    accent: "border-zinc-500",
    logo: null,
  };
}

  const brandConfig =
    getBrandConfig(headerLocation);

  /* ---------- PEDIDOS ACTIVOS ---------- */
  const activeOrders = orders.filter((o) => {
  if (o.status === "cumplido") return false;

  // ADMIN ve solo pedidos del local seleccionado
  if (user?.role === "ADMIN") {
    return o.location === effectiveLocation;
  }

  return o.location === effectiveLocation;
});


  const pendingOrdersCount = activeOrders.filter(
  (o) => o.location === effectiveLocation
).length;


  /* ---------- TABS ---------- */
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
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black">

        {user?.role === "ADMIN" ? (
          <select
            value={selectedLocation}
            onChange={(e) =>
              setSelectedLocation(e.target.value)
            }
            className="
              bg-zinc-800
              px-4 py-2
              rounded-lg
              text-sm font-semibold
              cursor-pointer
              border border-zinc-700
              hover:border-zinc-500
              hover:bg-zinc-700
              transition
              shadow-sm
            "
          >
            <option value="marpla-lomas">
              MARPLA – LOMAS
            </option>
            <option value="evolvere">
              EVOLVERE
            </option>
          </select>
        ) : (
          <div className="flex items-center gap-3">
            {brandConfig.logo && (
              <img
                src={brandConfig.logo.src}
                alt="logo"
                className="h-8 w-8 object-contain"
              />
            )}

            <h1
              className={`text-lg font-bold ${brandConfig.color}`}
            >
              {brandName}
            </h1>
          </div>
        )}

        <UserMenu />
      </header>

      {/* ---------- TABS ---------- */}
{/* ---------- TABS ---------- */}
<div className="flex border-b border-zinc-800 bg-black">
  {tabs.map((item) => (
    <button
      key={item}
      onClick={() => setTab(item)}
      className={`relative flex-1 p-3 text-sm capitalize cursor-pointer transition-colors border-b-2 ${
        tab === item
          ? `bg-zinc-800 font-semibold ${brandConfig.accent}`
          : "bg-black hover:bg-zinc-900 border-transparent"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {item}

        {item === "pedidos" &&
          pendingOrdersCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingOrdersCount}
            </span>
          )}
      </div>
    </button>
  ))}
</div>


      <main
  key={tab}
  className="
    flex-1 p-4
    animate-tabFade
  "
>


        {/* ---------- LOCAL ---------- */}
        {user?.role !== "ADMIN" && (
          <>
            {tab === "stock" && (
              <StockList
                locationOverride={
                  effectiveLocation
                }
              />
            )}

            {tab === "solicitar" && (
              <GlobalRequestForm
                location={effectiveLocation}
              />
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
                locationOverride={
                  effectiveLocation
                }
              />
            )}

           {tab === "pedidos" && (
  <AdminOrdersList
    location={effectiveLocation}
  />
)}


            {tab === "compras" && (
              <AdminPurchases
                location={effectiveLocation}
              />
            )}

            {tab === "productos" && (
              <AdminProducts
                selectedLocation={effectiveLocation}
              />
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
