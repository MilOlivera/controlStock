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

  function handleCreateProduct() {
    if (!name) return alert("Nombre requerido");
    if (!brand) return alert("Marca requerida");
    if (!presentation) return alert("Presentación requerida");
    if (!volume) return alert("Volumen requerido");

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
        onClick={() => setShowForm(!showForm)}
        className="bg-zinc-800 px-3 py-2 rounded cursor-pointer hover:bg-zinc-700 transition"
      >
        ➕ Nuevo producto
      </button>

      {showForm && (
        <div className="bg-zinc-900 p-4 rounded space-y-3 border border-zinc-800">
          <input
            placeholder="Nombre"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <input
            placeholder="Categoría"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <input
            placeholder="Marca"
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <input
            placeholder="Presentación (caja, pack, etc)"
            value={presentation}
            onChange={(e) =>
              setPresentation(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <input
            placeholder="Volumen (500g, 2kg, etc)"
            value={volume}
            onChange={(e) =>
              setVolume(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <input
            type="number"
            min={0}
            placeholder="Stock crítico"
            value={criticalStock}
            onChange={(e) =>
              setCriticalStock(
                e.target.value === ""
                  ? ""
                  : Math.max(
                      0,
                      Number(e.target.value)
                    )
              )
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <input
            type="number"
            min={0}
            placeholder="Stock objetivo"
            value={targetStock}
            onChange={(e) =>
              setTargetStock(
                e.target.value === ""
                  ? ""
                  : Math.max(
                      0,
                      Number(e.target.value)
                    )
              )
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={createInBoth}
              onChange={(e) =>
                setCreateInBoth(
                  e.target.checked
                )
              }
            />
            Crear también en el otro local
          </label>

          <button
            onClick={handleCreateProduct}
            className="bg-green-700 px-3 py-2 rounded w-full cursor-pointer hover:bg-green-600 transition"
          >
            Crear producto
          </button>
        </div>
      )}

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
            className="bg-zinc-900 p-3 rounded space-y-2 border border-zinc-800"
          >
            <div
              className="flex justify-between cursor-pointer"
              onClick={() =>
                setOpenProduct(
                  openProduct === p.id
                    ? null
                    : p.id
                )
              }
            >
              <span className="font-semibold">
                {p.name}
              </span>

              <span className="text-zinc-400">
                {p.category}
              </span>
            </div>

            {openProduct === p.id && (
              <div className="space-y-2">
                {p.variants.map((v) => (
                  <div
                    key={v.id}
                    className="bg-zinc-800 p-2 rounded flex justify-between"
                  >
                    <span>
                      {v.brand} •{" "}
                      {v.presentation} •{" "}
                      {v.volume}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newBrand =
                            prompt(
                              "Nueva marca:",
                              v.brand
                            );
                          if (!newBrand)
                            return;

                          updateVariant(
                            p.id,
                            v.id,
                            { brand: newBrand }
                          );
                        }}
                        className="bg-zinc-700 px-2 rounded cursor-pointer"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          deleteVariant(
                            p.id,
                            v.id
                          )
                        }
                        className="bg-red-700 px-2 rounded cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="Marca"
                    value={newVariantBrand}
                    onChange={(e) =>
                      setNewVariantBrand(
                        e.target.value
                      )
                    }
                    className="bg-zinc-800 p-2 rounded"
                  />

                  <input
                    placeholder="Presentación"
                    value={
                      newVariantPresentation
                    }
                    onChange={(e) =>
                      setNewVariantPresentation(
                        e.target.value
                      )
                    }
                    className="bg-zinc-800 p-2 rounded"
                  />

                  <input
                    placeholder="Volumen"
                    value={newVariantVolume}
                    onChange={(e) =>
                      setNewVariantVolume(
                        e.target.value
                      )
                    }
                    className="bg-zinc-800 p-2 rounded"
                  />
                </div>

                <button
                  onClick={() =>
                    handleAddVariant(p.id)
                  }
                  className="bg-green-700 px-3 py-2 rounded cursor-pointer w-full"
                >
                  Agregar variante
                </button>

                <button
                  onClick={() =>
                    deleteProduct(p.id)
                  }
                  className="bg-red-800 w-full py-2 rounded cursor-pointer"
                >
                  Eliminar producto
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}