"use client";

import { useState } from "react";
import RequestModal from "./RequestModal";
import { useInventory } from "../context/InventoryContext";
import { useUser } from "../context/UserContext";

export default function StockList({
  locationOverride,
}: {
  locationOverride?: string;
}) {
  const {
    products,
    getStock,
    updateStock,
    updateVariantStock,
  } = useInventory();

  const { user } = useUser();

  const [selectedProduct, setSelectedProduct] =
    useState<any>(null);

  const [editing, setEditing] =
    useState(false);

  const [editedStocks, setEditedStocks] =
    useState<Record<string, number>>({});

  // clave: productId|variantId
  const [editedVariantStocks, setEditedVariantStocks] =
    useState<Record<string, number>>({});

  const [expandedProducts, setExpandedProducts] =
    useState<Record<string, boolean>>({});

  /* ---------- LOCAL ACTIVO ---------- */

  if (!locationOverride) return null;

const loc = locationOverride;


  /* ---------- ORDENAR ---------- */

  const sortedProducts = [...products].sort(
    (a, b) =>
      getStock(a.name, loc) -
      getStock(b.name, loc)
  );

  /* ---------- EDITAR ---------- */

  function makeVariantKey(
    productId: string,
    variantId: string
  ) {
    return `${productId}|${variantId}`;
  }

  function startEditing() {
    const initialTotals: Record<
      string,
      number
    > = {};

    const initialVariants: Record<
      string,
      number
    > = {};

    products.forEach((p) => {
      initialTotals[p.name] = getStock(
        p.name,
        loc
      );

      p.variants.forEach((v) => {
        const key = makeVariantKey(
          p.id,
          v.id
        );

        initialVariants[key] =
          v.stock?.[loc] || 0;
      });
    });

    setEditedStocks(initialTotals);
    setEditedVariantStocks(initialVariants);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditedStocks({});
    setEditedVariantStocks({});
  }

  function saveChanges() {
    products.forEach((p) => {
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
    setEditedStocks({});
    setEditedVariantStocks({});
  }

  function toggleExpand(name: string) {
    setExpandedProducts((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }

  /* ---------- UI ---------- */

  return (
    <>
      <div className="flex justify-center mb-3 gap-3">
        {!editing ? (
          <button
            onClick={startEditing}
            className="bg-zinc-700 px-3 py-1 rounded text-sm"
          >
            Editar stock
          </button>
        ) : (
          <>
            <button
              onClick={saveChanges}
              className="bg-green-700 px-3 py-1 rounded text-sm"
            >
              Guardar cambios
            </button>

            <button
              onClick={cancelEditing}
              className="bg-zinc-700 px-3 py-1 rounded text-sm"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      <div className="space-y-3">
        {sortedProducts.map((p) => {
          const totalStock = getStock(
            p.name,
            loc
          );

          const isCritical =
            totalStock <= p.criticalStock;

          const expanded =
            expandedProducts[p.name];

          return (
            <div
              key={p.id}
              className={`p-3 rounded-lg ${
                isCritical
                  ? "bg-red-900"
                  : "bg-zinc-900"
              }`}
            >
              {/* FILA PRINCIPAL */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {p.name}
                  </div>

                  <div className="text-sm text-zinc-400">
                    Stock total: {totalStock}
                  </div>

                  {isCritical && (
                    <div className="text-xs text-red-300">
                      Stock crítico
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleExpand(p.name)
                    }
                    className="bg-zinc-700 px-3 py-1 rounded text-sm"
                  >
                    {expanded
                      ? "Ocultar"
                      : "Marcas"}
                  </button>

                  {!editing && (
                    <button
                      onClick={() =>
                        setSelectedProduct(p)
                      }
                      className="bg-zinc-700 px-3 py-1 rounded flex items-center gap-2"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* VARIANTES */}
              {expanded && (
                <div className="mt-3 space-y-1 pl-3 border-l border-zinc-700">
                  {p.variants.map((v) => {
                    const key =
                      makeVariantKey(
                        p.id,
                        v.id
                      );

                    return (
                      <div
                        key={v.id}
                        className="flex justify-between text-sm text-zinc-400"
                      >
                        <span>
                          {v.brand}
                        </span>

                        {!editing ? (
                          <span>
                            {v.stock?.[
                              loc
                            ] || 0}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={
                              editedVariantStocks[
                                key
                              ] ?? 0
                            }
                            onChange={(e) =>
                              setEditedVariantStocks(
                                (prev) => ({
                                  ...prev,
                                  [key]: Number(
                                    e.target
                                      .value
                                  ),
                                })
                              )
                            }
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
