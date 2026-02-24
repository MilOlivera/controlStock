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
} from "firebase/firestore";

import { db } from "../lib/firebase";

export type Supplier = {
  firestoreId?: string;
  name: string;
};

type SupplierContextType = {
  suppliers: Supplier[];
  addSupplier: (name: string) => Promise<void>;
};

const SupplierContext =
  createContext<SupplierContextType | null>(
    null
  );

export function SupplierProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "suppliers"),
      (snapshot) => {
        const list: Supplier[] =
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Supplier),
            firestoreId: doc.id,
          }));

        setSuppliers(list);
      }
    );

    return () => unsub();
  }, []);

  async function addSupplier(name: string) {
    if (!name.trim()) return;

    await addDoc(collection(db, "suppliers"), {
      name,
      createdAt: new Date(),
    });
  }

  return (
    <SupplierContext.Provider
      value={{ suppliers, addSupplier }}
    >
      {children}
    </SupplierContext.Provider>
  );
}

export function useSuppliers() {
  const ctx = useContext(SupplierContext);

  if (!ctx)
    throw new Error("SupplierContext missing");

  return ctx;
}