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
  date: Date;
};

type MovementsContextType = {
  movements: Movement[];

  addMovement: (
    product: string,
    location: string,
    type: MovementType,
    quantity: number,
    unitPrice: number
  ) => void;
};

/* ---------- CONTEXTO ---------- */

const MovementsContext =
  createContext<MovementsContextType | null>(
    null
  );

/* ---------- PROVIDER ---------- */

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

  /* ---------- PERSISTENCIA ---------- */

  useEffect(() => {
    localStorage.setItem(
      "movements",
      JSON.stringify(movements)
    );
  }, [movements]);

  /* ---------- ALTA MOVIMIENTO ---------- */

  function addMovement(
    product: string,
    location: string,
    type: MovementType,
    quantity: number,
    unitPrice: number
  ) {
    /* 🔥 diferir actualización para evitar error React */
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
          date: new Date(),
        },
      ]);
    }, 0);
  }

  return (
    <MovementsContext.Provider
      value={{ movements, addMovement }}
    >
      {children}
    </MovementsContext.Provider>
  );
}

/* ---------- HOOK ---------- */

export function useMovements() {
  const ctx = useContext(MovementsContext);

  if (!ctx)
    throw new Error("MovementsContext missing");

  return ctx;
}
