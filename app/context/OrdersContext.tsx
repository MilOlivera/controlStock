"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useInventory } from "./InventoryContext";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

/* ---------- TIPOS ---------- */

export type Order = {
  firestoreId?: string;
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
  ) => Promise<boolean>;

  replaceOrderQuantity: (
    product: string,
    location: string,
    quantity: number
  ) => Promise<void>;

  removeOrdersByProduct: (
    product: string,
    location: string
  ) => Promise<void>;

  deliverOrder: (
    id: number,
    deliveredQty: number
  ) => Promise<void>;
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
  const { getStock, updateStock } = useInventory();

/* ---------- CARGA DESDE FIRESTORE ---------- */

useEffect(() => {
  const unsub = onSnapshot(
    collection(db, "orders"),
    (snapshot) => {
      const list: Order[] = snapshot.docs.map((d) => ({
        ...(d.data() as Order),
        firestoreId: d.id,
      }));

      setOrders(list);
    }
  );

  return () => unsub();
}, []);

/* ---------- CREAR PEDIDO ---------- */

async function addOrder(
  location: string,
  product: string,
  category: string,
  quantity: number
): Promise<boolean> {
  if (!quantity || quantity <= 0) return false;

  const existingOpenOrder = orders.find(
    (o) =>
      o.product === product &&
      o.location === location &&
      o.status !== "cumplido"
  );

  if (existingOpenOrder) return false;

  await addDoc(collection(db, "orders"), {
    id: Date.now() + Math.random(),
    location,
    product,
    category,
    quantity,
    delivered: 0,
    status: "pendiente",
  });

  return true;
}

/* ---------- REEMPLAZAR PEDIDO ---------- */

async function replaceOrderQuantity(
  product: string,
  location: string,
  quantity: number
) {
  const order = orders.find(
    (o) =>
      o.product === product &&
      o.location === location &&
      o.status !== "cumplido"
  );

  if (!order?.firestoreId) return;

  await updateDoc(
    doc(db, "orders", order.firestoreId),
    {
      quantity,
      delivered: 0,
      status: "pendiente",
    }
  );
}

/* ---------- BORRAR PEDIDOS ---------- */

async function removeOrdersByProduct(
  product: string,
  location: string
) {
  const toDelete = orders.filter(
    (o) =>
      o.product === product &&
      o.location === location
  );

  for (const o of toDelete) {
    if (!o.firestoreId) continue;
    await deleteDoc(doc(db, "orders", o.firestoreId));
  }
}

/* ---------- ENTREGAS ---------- */

async function deliverOrder(
  id: number,
  deliveredQty: number
) {
  const order = orders.find((o) => o.id === id);
  if (!order?.firestoreId) return;

  const newDelivered =
    order.delivered + deliveredQty;

  const remaining =
    order.quantity - newDelivered;

  await updateDoc(
    doc(db, "orders", order.firestoreId),
    {
      delivered:
        remaining <= 0
          ? order.quantity
          : newDelivered,
      status:
        remaining <= 0
          ? "cumplido"
          : "parcial",
    }
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
