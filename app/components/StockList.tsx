"use client";

import { useState } from "react";
import RequestModal from "./RequestModal";
import { useInventory } from "../context/InventoryContext";
import { useUser } from "../context/UserContext";
import { formatStock } from "../lib/stockFormatter";

export default function StockList({
  locationOverride,
}: {
  locationOverride?: string;
}) {
  const {
    products,
    getStock,
    updateVariantStock,
  } = useInventory();

  const { user } = useUser();

  const [selectedProduct, setSelectedProduct] =
    useState<any>(null);

  const [editing, setEditing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [editedVariantStocks, setEditedVariantStocks] =
    useState<Record<string, number>>({});

  const [expandedProduct, setExpandedProduct] =
    useState<string | null>(null);

  if (!locationOverride) return null;
  const loc = locationOverride;

  /* ---------- PRODUCTOS VISIBLES ---------- */

  const visibleProducts = products
    .filter(
      (p) =>
        !p.locations ||
        p.locations.includes(loc)
    )
    .filter((p) => {
      const query = search.toLowerCase();

      if (p.name.toLowerCase().includes(query))
        return true;

      return p.variants.some((v) =>
        (
          v.brand +
          " " +
          v.presentation +
          " " +
          v.volume
        )
          .toLowerCase()
          .includes(query)
      );
    });

  /* ---------- ORDEN CORRECTO ---------- */

  const sortedProducts = [...visibleProducts].sort(
    (a, b) => {
      const stockA = getStock(a.name, loc);
      const stockB = getStock(b.name, loc);

      const priority = (p: any, stock: number) => {
        if (stock <= 0) return 0;
        if (stock <= p.criticalStock) return 1;
        return 2;
      };

      const pA = priority(a, stockA);
      const pB = priority(b, stockB);

      if (pA !== pB) return pA - pB;

      return stockA - stockB;
    }
  );

  function makeVariantKey(
    productId: string,
    variantId: string
  ) {
    return `${productId}|${variantId}`;
  }

  function startEditing() {
    const initialVariants: Record<string, number> =
      {};

    visibleProducts.forEach((p) => {
      p.variants.forEach((v) => {
        const key = makeVariantKey(
          p.id,
          v.id
        );

        initialVariants[key] =
          v.stock?.[loc] || 0;
      });
    });

    setEditedVariantStocks(initialVariants);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditedVariantStocks({});
  }

  function saveChanges() {
    visibleProducts.forEach((p) => {
      p.variants.forEach((v) => {
        const key = makeVariantKey(
          p.id,
          v.id
        );

        const newStock =
          editedVariantStocks[key];

        if (newStock === undefined)
          return;

        const currentStock =
          v.stock?.[loc] || 0;

        if (currentStock === newStock)
          return;

        updateVariantStock(
          p.name,
          v.id,
          loc,
          newStock
        );
      });
    });

    setEditing(false);
    setEditedVariantStocks({});
  }

  function toggleExpand(name: string) {
    setExpandedProduct((prev) =>
      prev === name ? null : name
    );
  }

  /* ---------- UI ---------- */

  return (
    <>
      {/* BOTONES */}
      <div className="flex justify-center mb-3 gap-3">
        {!editing ? (
          <button
            onClick={startEditing}
            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm transition"
          >
            Editar stock
          </button>
        ) : (
          <>
            <button
              onClick={saveChanges}
              className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm transition"
            >
              Guardar cambios
            </button>

            <button
              onClick={cancelEditing}
              className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm transition"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      {/* BUSCADOR */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full bg-zinc-800 p-2 rounded outline-none"
        />
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {sortedProducts.map((p) => {
          const totalStock = getStock(
            p.name,
            loc
          );

          const noStock = totalStock <= 0;

          const critical =
            totalStock > 0 &&
            totalStock <= p.criticalStock;

          const expanded =
            expandedProduct === p.name;

          return (
            <div
              key={p.id}
              onClick={() =>
                toggleExpand(p.name)
              }
              className={`
                p-3 rounded-lg border transition-all duration-200 cursor-pointer
                ${
                  noStock
                    ? "bg-red-900/60 border-red-600 hover:border-red-400"
                    : critical
                    ? "bg-yellow-900/40 border-yellow-600 hover:border-yellow-400"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/70 hover:shadow-lg hover:shadow-black/40 hover:scale-[1.01]"
                }
              `}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {expanded ? "▼" : "▶"}{" "}
                    {p.name}
                  </div>

                  <div className="text-sm text-zinc-400">
                    Stock total:{" "}
                    <span className="text-white font-semibold">
                      {formatStock(totalStock)}
                    </span>
                  </div>

                  {noStock && (
                    <div className="text-xs text-red-300">
                      ⚠ Sin stock
                    </div>
                  )}

                  {critical && (
                    <div className="text-xs text-yellow-300">
                      ⚠ Stock crítico
                    </div>
                  )}
                </div>

                {!editing &&
                  user?.role !== "ADMIN" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                      }}
                      className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm transition"
                    >
                      + Pedido
                    </button>
                  )}
              </div>

              {expanded && (
                <div className="mt-3 space-y-1 pl-3 border-l border-zinc-700 animate-expandFade">
                  {p.variants.map((v) => {
                    const key =
                      makeVariantKey(
                        p.id,
                        v.id
                      );

                    return (
                      <div
                        key={v.id}
                        className="flex justify-between text-sm text-zinc-300"
                      >
                        <span>
                          {v.brand} • {v.presentation} • {v.volume}
                        </span>

                        {!editing ? (
                          <span className="font-semibold">
                            {formatStock(
                              v.stock?.[loc] || 0
                            )}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            step="0.25"
                            inputMode="decimal"
                            value={
                              editedVariantStocks[
                                key
                              ] ?? 0
                            }
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                            onChange={(e) => {
                              const num =
                                Number(
                                  e.target.value
                                );

                              if (num < 0) return;

                              setEditedVariantStocks(
                                (prev) => ({
                                  ...prev,
                                  [key]: num,
                                })
                              );
                            }}
                            className="bg-zinc-800 p-1 rounded w-20 text-right"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <RequestModal
        product={selectedProduct}
        onClose={() =>
          setSelectedProduct(null)
        }
      />
    </>
  );
}