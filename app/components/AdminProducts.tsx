"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";

export default function AdminProducts({
  selectedLocation,
}: {
  selectedLocation: string;
}) {
  const {
    products,
    addProduct,
    addVariant,
    updateProduct,
    deleteProduct,
    updateVariant,
    deleteVariant,
  } = useInventory();

  const [openProduct, setOpenProduct] =
    useState<string | null>(null);

  const [editingProductId, setEditingProductId] =
    useState<string | null>(null);

  const [editName, setEditName] =
    useState("");
  const [editCategory, setEditCategory] =
    useState("");
  const [editCritical, setEditCritical] =
    useState<number | "">("");
  const [editTarget, setEditTarget] =
    useState<number | "">("");

  const [showForm, setShowForm] =
    useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [presentation, setPresentation] =
    useState("");

  const [volume, setVolume] =
    useState("");

  const [criticalStock, setCriticalStock] =
    useState<number | "">("");

  const [targetStock, setTargetStock] =
    useState<number | "">("");

  const [newVariantBrand, setNewVariantBrand] =
    useState("");
  const [newVariantPresentation, setNewVariantPresentation] =
    useState("");
  const [newVariantVolume, setNewVariantVolume] =
    useState("");

  const [createInBoth, setCreateInBoth] =
    useState(false);

  /* ================= EDITAR PRODUCTO ================= */

  function startEditingProduct(p: any) {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditCategory(p.category);
    setEditCritical(p.criticalStock);
    setEditTarget(p.targetStock);
  }

  async function saveProductChanges(
    productId: string
  ) {
    await updateProduct(productId, {
      name: editName,
      category: editCategory,
      criticalStock:
        Number(editCritical) || 0,
      targetStock:
        Number(editTarget) || 0,
    });

    setEditingProductId(null);
  }

  /* ================= CREAR PRODUCTO ================= */

  function handleCreateProduct() {
    if (!name) return alert("Nombre requerido");
    if (!brand) return alert("Marca requerida");
    if (!presentation)
      return alert("Presentación requerida");
    if (!volume)
      return alert("Volumen requerido");

    const productId = name
      .toLowerCase()
      .replace(/\s/g, "-");

    const variantId = `${productId}-${brand}-${volume}`
      .toLowerCase()
      .replace(/\s/g, "-");

    const locations = createInBoth
      ? ["marpla-lomas", "evolvere"]
      : [selectedLocation];

    addProduct(
      {
        id: productId,
        name,
        category,
        criticalStock:
          Number(criticalStock) || 0,
        targetStock:
          Number(targetStock) || 0,
        variants: [
          {
            id: variantId,
            brand,
            presentation,
            volume,
            stock: {},
          },
        ],
      },
      locations
    );

    setShowForm(false);
    setName("");
    setCategory("");
    setBrand("");
    setPresentation("");
    setVolume("");
    setCriticalStock("");
    setTargetStock("");
    setCreateInBoth(false);
  }

  function handleAddVariant(productId: string) {
    if (!newVariantBrand) return;
    if (!newVariantPresentation) return;
    if (!newVariantVolume) return;

    addVariant(
      productId,
      newVariantBrand,
      newVariantPresentation,
      newVariantVolume
    );

    setNewVariantBrand("");
    setNewVariantPresentation("");
    setNewVariantVolume("");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        📦 Productos cargados
      </h2>

      <button
        onClick={() =>
          setShowForm(!showForm)
        }
        className="bg-zinc-800 px-3 py-2 rounded hover:bg-zinc-700"
      >
        ➕ Nuevo producto
      </button>

      {products
        .filter(
          (p) =>
            !p.locations ||
            p.locations.includes(
              selectedLocation
            )
        )
        .map((p) => (
          <div
            key={p.firestoreId}
            className="bg-zinc-900 p-3 rounded border border-zinc-800"
          >
            <div className="flex justify-between items-center">
              {editingProductId ===
              p.id ? (
                <div className="space-y-2 w-full">
                  <input
                    value={editName}
                    onChange={(e) =>
                      setEditName(
                        e.target.value
                      )
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                  />

                  <input
                    value={editCategory}
                    onChange={(e) =>
                      setEditCategory(
                        e.target.value
                      )
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                  />

                  <input
                    type="number"
                    value={editCritical}
                    onChange={(e) =>
                      setEditCritical(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                    placeholder="Stock crítico"
                  />

                  <input
                    type="number"
                    value={editTarget}
                    onChange={(e) =>
                      setEditTarget(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                    placeholder="Stock objetivo"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        saveProductChanges(
                          p.id
                        )
                      }
                      className="bg-green-700 px-3 py-1 rounded"
                    >
                      Guardar
                    </button>

                    <button
                      onClick={() =>
                        setEditingProductId(
                          null
                        )
                      }
                      className="bg-zinc-700 px-3 py-1 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="font-semibold">
                      {p.name}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {p.category}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      startEditingProduct(
                        p
                      )
                    }
                    className="bg-zinc-700 px-2 py-1 rounded text-xs"
                  >
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}