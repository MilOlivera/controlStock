"use client";

import { useState } from "react";
import { useInventory } from "../context/InventoryContext";

export default function AdminProducts() {
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
    useState("Genérica");

  const [criticalStock, setCriticalStock] =
    useState(0);
  const [targetStock, setTargetStock] =
    useState(0);

  const [newVariantBrand, setNewVariantBrand] =
    useState("");

  const [newVariantPrice, setNewVariantPrice] =
    useState(0);

  function handleCreateProduct() {
    if (!name) return alert("Nombre requerido");

    const productId = name
      .toLowerCase()
      .replace(/\s/g, "-");

    const variantId =
      productId +
      "-" +
      brand.toLowerCase().replace(/\s/g, "-");

    addProduct({
      id: productId,
      name,
      category,
      criticalStock,
      targetStock,
      variants: [
        {
          id: variantId,
          brand,
          defaultPrice: 0,
          stock: {},
        },
      ],
    });

    setShowForm(false);
    setName("");
  }

  function handleAddVariant(productId: string) {
    if (!newVariantBrand) return;

    addVariant(
      productId,
      newVariantBrand,
      newVariantPrice
    );

    setNewVariantBrand("");
    setNewVariantPrice(0);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        📦 Productos cargados
      </h2>

      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-zinc-800 px-3 py-2 rounded"
      >
        ➕ Nuevo producto
      </button>

      {showForm && (
        <div className="bg-zinc-900 p-4 rounded space-y-2">
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
            placeholder="Marca inicial"
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value)
            }
            className="w-full bg-zinc-800 p-2 rounded"
          />

          <button
            onClick={handleCreateProduct}
            className="bg-green-700 px-3 py-2 rounded w-full"
          >
            Crear producto
          </button>
        </div>
      )}

      {products.map((p) => (
        <div
          key={p.firestoreId}
          className="bg-zinc-900 p-3 rounded space-y-2"
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
                  <span>{v.brand}</span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newBrand =
                          prompt(
                            "Nueva marca:",
                            v.brand
                          );
                        if (!newBrand) return;

                        updateVariant(
                          p.id,
                          v.id,
                          { brand: newBrand }
                        );
                      }}
                      className="bg-zinc-700 px-2 rounded"
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
                      className="bg-red-700 px-2 rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  placeholder="Nueva marca"
                  value={newVariantBrand}
                  onChange={(e) =>
                    setNewVariantBrand(
                      e.target.value
                    )
                  }
                  className="flex-1 bg-zinc-800 p-2 rounded"
                />

                <button
                  onClick={() =>
                    handleAddVariant(p.id)
                  }
                  className="bg-green-700 px-3 rounded"
                >
                  Agregar
                </button>
              </div>

              <button
                onClick={() =>
                  deleteProduct(p.id)
                }
                className="bg-red-800 w-full py-2 rounded"
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
