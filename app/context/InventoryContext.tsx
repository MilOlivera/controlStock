"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

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

export type Variant = {
  id: string;
  brand: string;
  presentation: string;
  volume: string;
  stock: {
    [location: string]: number;
  };
};

export type Product = {
  firestoreId?: string;
  id: string;
  name: string;
  category: string;
  criticalStock: number;
  targetStock: number;
  variants: Variant[];
  locations?: string[];
};

type InventoryContextType = {
  products: Product[];

  getProductsByLocation: (
    location: string
  ) => Product[];

  getStock: (
    productName: string,
    location: string
  ) => number;

  updateVariantStock: (
    productName: string,
    variantId: string,
    location: string,
    newStock: number
  ) => void;

  addProduct: (
    product: Product,
    locations?: string[]
  ) => Promise<void>;

  addVariant: (
    productId: string,
    brand: string,
    presentation: string,
    volume: string
  ) => Promise<void>;

  updateProduct: (
    productId: string,
    data: Partial<Product>
  ) => Promise<void>;

  deleteProduct: (
    productId: string
  ) => Promise<void>;

  updateVariant: (
    productId: string,
    variantId: string,
    data: Partial<Variant>
  ) => Promise<void>;

  deleteVariant: (
    productId: string,
    variantId: string
  ) => Promise<void>;
};

const InventoryContext =
  createContext<InventoryContextType | null>(
    null
  );

/* ---------- LOCALES ---------- */

const LOCATIONS = [
  "marpla-lomas",
  "evolvere",
];

/* ---------- PROVIDER ---------- */

export function InventoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [products, setProducts] =
    useState<Product[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const list: Product[] = snapshot.docs.map(
          (docSnap) => {
            const data =
              docSnap.data() as Product;

            return {
              ...data,
              firestoreId: docSnap.id,
              locations:
                data.locations ??
                LOCATIONS,
            };
          }
        );

        setProducts(list);
      }
    );

    return () => unsub();
  }, []);

  /* ---------- FILTRO POR LOCAL ---------- */

  function getProductsByLocation(
    location: string
  ) {
    return products.filter(
      (p) =>
        !p.locations ||
        p.locations.includes(location)
    );
  }

  /* ---------- STOCK TOTAL ---------- */

  function getStock(
    productName: string,
    location: string
  ) {
    const p = products.find(
      (x) => x.name === productName
    );

    if (!p) return 0;

    return p.variants.reduce(
      (acc, v) =>
        acc + (v.stock?.[location] || 0),
      0
    );
  }

  async function updateVariantStock(
    productName: string,
    variantId: string,
    location: string,
    newStock: number
  ) {
    const product = products.find(
      (p) => p.name === productName
    );

    if (!product || !product.firestoreId)
      return;

    const newVariants = product.variants.map(
      (v) =>
        v.id === variantId
          ? {
              ...v,
              stock: {
                ...v.stock,
                [location]: newStock,
              },
            }
          : v
    );

    await updateDoc(
      doc(db, "products", product.firestoreId),
      { variants: newVariants }
    );
  }

  /* ---------- CRUD PRODUCT ---------- */

  async function addProduct(
    product: Product,
    locations?: string[]
  ) {
    const finalLocations =
      locations && locations.length
        ? locations
        : LOCATIONS;

    product.locations = finalLocations;

    product.variants.forEach((v) => {
      v.stock = {};
      LOCATIONS.forEach(
        (loc) => (v.stock[loc] = 0)
      );
    });

    await addDoc(
      collection(db, "products"),
      product
    );
  }

  async function updateProduct(
    productId: string,
    data: Partial<Product>
  ) {
    const product = products.find(
      (p) => p.id === productId
    );

    if (!product?.firestoreId) return;

    await updateDoc(
      doc(db, "products", product.firestoreId),
      data
    );
  }

  async function deleteProduct(productId: string) {
    const product = products.find(
      (p) => p.id === productId
    );

    if (!product?.firestoreId) return;

    await deleteDoc(
      doc(db, "products", product.firestoreId)
    );
  }

  /* ---------- VARIANTS ---------- */

  async function addVariant(
    productId: string,
    brand: string,
    presentation: string,
    volume: string
  ) {
    const product = products.find(
      (p) => p.id === productId
    );

    if (!product?.firestoreId) return;

    const variantId =
      `${productId}-${brand}-${volume}`
        .toLowerCase()
        .replace(/\s/g, "-");

    const stock: any = {};
    LOCATIONS.forEach(
      (loc) => (stock[loc] = 0)
    );

    const newVariants = [
      ...product.variants,
      {
        id: variantId,
        brand,
        presentation,
        volume,
        stock,
      },
    ];

    await updateDoc(
      doc(db, "products", product.firestoreId),
      { variants: newVariants }
    );
  }

  async function updateVariant(
    productId: string,
    variantId: string,
    data: Partial<Variant>
  ) {
    const product = products.find(
      (p) => p.id === productId
    );

    if (!product?.firestoreId) return;

    const newVariants = product.variants.map(
      (v) =>
        v.id === variantId
          ? { ...v, ...data }
          : v
    );

    await updateDoc(
      doc(db, "products", product.firestoreId),
      { variants: newVariants }
    );
  }

  async function deleteVariant(
    productId: string,
    variantId: string
  ) {
    const product = products.find(
      (p) => p.id === productId
    );

    if (!product?.firestoreId) return;

    const newVariants =
      product.variants.filter(
        (v) => v.id !== variantId
      );

    await updateDoc(
      doc(db, "products", product.firestoreId),
      { variants: newVariants }
    );
  }

  return (
    <InventoryContext.Provider
      value={{
        products,
        getProductsByLocation,
        getStock,
        updateVariantStock,
        addProduct,
        addVariant,
        updateProduct,
        deleteProduct,
        updateVariant,
        deleteVariant,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx =
    useContext(InventoryContext);

  if (!ctx)
    throw new Error(
      "InventoryContext missing"
    );

  return ctx;
}