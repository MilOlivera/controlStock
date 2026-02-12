"use client";

import { createContext, useContext, useState } from "react";
import { useInventory } from "./InventoryContext";

/* ---------- TIPOS ---------- */

export type Order = {
  id: number;
  location: string;
  product: string;
  category: string;
  quantity: number;
  delivered: number;
  status: "pendiente" | "parcial" | "cumplido";
};

type OrdersContextType = {
  orders: Order[];

  addOrder: (
    location: string,
    product: string,
    category: string,
    quantity: number
  ) => boolean;

  replaceOrderQuantity: (
    product: string,
    location: string,
    quantity: number
  ) => void;

  removeOrdersByProduct: (
    product: string,
    location: string
  ) => void;

  deliverOrder: (
    id: number,
    deliveredQty: number
  ) => void;
};

/* ---------- CONTEXTO ---------- */

const OrdersContext =
  createContext<OrdersContextType | null>(null);

/* ---------- PROVIDER ---------- */

export function OrdersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const { getStock, updateStock } =
    useInventory();

/* ---------- CREAR PEDIDO ---------- */

function addOrder(
  location: string,
  product: string,
  category: string,
  quantity: number
): boolean {
  if (!quantity || quantity <= 0) return false;

  const existingOpenOrder = orders.find(
    (o) =>
      o.product === product &&
      o.location === location &&
      o.status !== "cumplido"
  );

  if (existingOpenOrder) {
    console.log(
      "Ya existe un pedido abierto para este producto"
    );
    return false;
  }

  setOrders((prev) => [
    ...prev,
    {
      id: Date.now() + Math.random(),
      location,
      product,
      category,
      quantity,
      delivered: 0,
      status: "pendiente",
    },
  ]);

  return true;
}

/* ---------- REEMPLAZAR PEDIDO ---------- */

function replaceOrderQuantity(
  product: string,
  location: string,
  quantity: number
) {
  setOrders((prev) =>
    prev.map((o) => {
      if (
        o.product === product &&
        o.location === location &&
        o.status !== "cumplido"
      ) {
        return {
          ...o,
          quantity,
          delivered: 0,
          status: "pendiente",
        };
      }

      return o;
    })
  );
}

/* ---------- BORRAR PEDIDOS ---------- */

function removeOrdersByProduct(
  product: string,
  location: string
) {
  setOrders((prev) =>
    prev.filter(
      (o) =>
        !(
          o.product === product &&
          o.location === location
        )
    )
  );
}

/* ---------- ENTREGAS ---------- */

function deliverOrder(
  id: number,
  deliveredQty: number
) {
  setOrders((prev) =>
    prev.map((o) => {
      if (o.id !== id) return o;

      /* ---------- DESCONTAR STOCK ---------- */
      const currentStock = getStock(
        o.product,
        o.location
      );

      const newStock = Math.max(
        0,
        currentStock - deliveredQty
      );

      updateStock(
        o.product,
        o.location,
        newStock
      );

      /* ---------- ACTUALIZAR PEDIDO ---------- */
      const newDelivered =
        o.delivered + deliveredQty;

      const remaining =
        o.quantity - newDelivered;

      if (remaining <= 0) {
        return {
          ...o,
          delivered: o.quantity,
          status: "cumplido",
        };
      }

      return {
        ...o,
        delivered: newDelivered,
        status: "parcial",
      };
    })
  );
}

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        replaceOrderQuantity,
        removeOrdersByProduct,
        deliverOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

/* ---------- HOOK ---------- */

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx)
    throw new Error("OrdersContext missing");

  return ctx;
}
