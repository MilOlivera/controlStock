"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import { db } from "../lib/firebase";

/* ---------- TIPOS ---------- */

type MovementType = "ingreso" | "ajuste";

export type Movement = {
  firestoreId?: string;
  id: number;
  product: string;
  location: string;
  type: MovementType;
  quantity: number;
  unitPrice: number;
  supplier?: string;
  date: Date;
};

type MovementsContextType = {
  movements: Movement[];
  addMovement: (
    product: string,
    location: string,
    type: MovementType,
    quantity: number,
    unitPrice: number,
    supplier?: string
  ) => Promise<void>;
  getSuppliers: () => string[];
};

const MovementsContext =
  createContext<MovementsContextType | null>(null);

/* ---------- PROVIDER ---------- */

export function MovementsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [movements, setMovements] = useState<Movement[]>([]);

  /* LISTENER FIRESTORE */
  useEffect(() => {
    const q = query(
      collection(db, "movements"),
      orderBy("date", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: Movement[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          firestoreId: d.id,
          date: data.date?.toDate?.() ?? new Date(),
        } as Movement;
      });
      setMovements(list);
    });

    return () => unsub();
  }, []);

  /* SUPPLIERS */
  function getSuppliers() {
    const set = new Set<string>();
    movements.forEach((m) => {
      if (m.supplier) set.add(m.supplier);
    });
    return Array.from(set);
  }

  /* ADD MOVEMENT */
  async function addMovement(
    product: string,
    location: string,
    type: MovementType,
    quantity: number,
    unitPrice: number,
    supplier?: string
  ) {
    await addDoc(collection(db, "movements"), {
      id: Date.now() + Math.random(),
      product,
      location,
      type,
      quantity,
      unitPrice: unitPrice || 0,
      supplier: supplier || "",
      date: Timestamp.now(),
    });
  }

  return (
    <MovementsContext.Provider
      value={{ movements, addMovement, getSuppliers }}
    >
      {children}
    </MovementsContext.Provider>
  );
}

export function useMovements() {
  const ctx = useContext(MovementsContext);
  if (!ctx) throw new Error("MovementsContext missing");
  return ctx;
}