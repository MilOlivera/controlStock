"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

/* ---------- TIPOS ---------- */

type MovementType = "ingreso" | "ajuste";

export type Movement = {
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
  ) => void;

  getSuppliers: () => string[];
};

const MovementsContext =
  createContext<MovementsContextType | null>(
    null
  );

export function MovementsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [movements, setMovements] =
    useState<Movement[]>(() => {
      if (typeof window !== "undefined") {
        const saved =
          localStorage.getItem("movements");

        if (saved) {
          try {
            const parsed = JSON.parse(saved);

            return parsed.map((m: any) => ({
              ...m,
              date: new Date(m.date),
            }));
          } catch {
            return [];
          }
        }
      }

      return [];
    });

  useEffect(() => {
    localStorage.setItem(
      "movements",
      JSON.stringify(movements)
    );
  }, [movements]);

  function getSuppliers() {
    const set = new Set<string>();

    movements.forEach((m) => {
      if (m.supplier) set.add(m.supplier);
    });

    return Array.from(set);
  }

  function addMovement(
    product: string,
    location: string,
    type: MovementType,
    quantity: number,
    unitPrice: number,
    supplier?: string
  ) {
    setTimeout(() => {
      setMovements((prev) => [
        ...prev,
        {
          id: Date.now(),
          product,
          location,
          type,
          quantity,
          unitPrice,
          supplier,
          date: new Date(),
        },
      ]);
    }, 0);
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

  if (!ctx)
    throw new Error("MovementsContext missing");

  return ctx;
}