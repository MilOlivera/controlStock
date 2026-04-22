"use client";

import { useState, useMemo } from "react";
import { useInventory } from "../context/InventoryContext";
import { useOrders } from "../context/OrdersContext";
import { useMovements } from "../context/MovementsContext";
import { useSuppliers } from "../context/SupplierContext";

export default function AdminPurchases({
  location,
}: {
  location: string;
}) {
  const { getProductsByLocation, updateVariantStock } = useInventory();
  const { orders, deliverOrder } = useOrders();
  const { addMovement } = useMovements();
  const { suppliers, addSupplier } = useSuppliers();

  const visibleProducts = getProductsByLocation(location);

  const sortedProducts = useMemo(() =>
    [...visibleProducts].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    ),
    [visibleProducts]
  );

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [success, setSuccess] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const selectedProductData = visibleProducts.find(
    (p) => p.name === selectedProduct
  );

  const brands = useMemo(() => {
    if (!selectedProductData) return [];
    return [...new Set(selectedProductData.variants.map((v) => v.brand))];
  }, [selectedProductData]);

  const filteredVariants = useMemo(() => {
    if (!selectedProductData) return [];
    return selectedProductData.variants.filter((v) => v.brand === selectedBrand);
  }, [selectedProductData, selectedBrand]);

  const selectedVariantData = useMemo(() =>
    selectedProductData?.variants.find((v) => v.id === selectedVariant),
    [selectedProductData, selectedVariant]
  );

  const stockActual = selectedVariantData?.stock?.[location] ?? 0;
  const costoTotal = quantity * unitPrice;

  async function createSupplier() {
    const name = prompt("Nombre del proveedor");
    if (!name) return;
    await addSupplier(name);
    setSupplier(name);
  }

  function autoDeliverOrders(product: string, availableQty: number) {
    let remaining = availableQty;
    const pending = orders.filter(
      (o) => o.product === product && o.location === location && o.status !== "cumplido"
    );
    pending.forEach((o) => {
      if (remaining <= 0) return;
      const need = o.quantity - o.delivered;
      const deliver = Math.min(need, remaining);
      deliverOrder(o.id, deliver);
      remaining -= deliver;
    });
  }

  async function handleApply() {
    if (!selectedProduct || !selectedVariant || quantity <= 0) {
      alert("Completá producto, variante y cantidad");
      return;
    }

    setGuardando(true);
    try {
      const product = visibleProducts.find((p) => p.name === selectedProduct);
      if (!product) return;

      const variant = product.variants.find((v) => v.id === selectedVariant);
      if (!variant) return;

      const current = variant.stock?.[location] ?? 0;

      await updateVariantStock(selectedProduct, variant.id, location, current + quantity);
      autoDeliverOrders(selectedProduct, quantity);
      await addMovement(selectedProduct, location, "ingreso", quantity, unitPrice, supplier);

      setQuantity(0);
      setUnitPrice(0);
      setSelectedBrand("");
      setSelectedVariant("");
      setSupplier("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Error al registrar la compra");
    } finally {
      setGuardando(false);
    }
  }

  const relatedOrders = orders.filter(
    (o) => o.product === selectedProduct && o.status !== "cumplido"
  );

  const inputClass = "bg-zinc-800 p-3 rounded-xl text-white outline-none border border-zinc-700 focus:border-blue-500 transition w-full";

  return (
    <div className="space-y-6">

      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Registrar compra</h2>

        {/* PRODUCTO */}
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Producto</label>
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setSelectedBrand("");
              setSelectedVariant("");
            }}
            className={inputClass}
          >
            <option value="">Seleccionar producto</option>
            {sortedProducts.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* MARCA */}
        {selectedProductData && (
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Marca</label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedVariant("");
              }}
              className={inputClass}
            >
              <option value="">Seleccionar marca</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        {/* VARIANTE */}
        {selectedBrand && (
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Presentacion</label>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar presentacion</option>
              {filteredVariants.map((v) => (
                <option key={v.id} value={v.id}>{v.presentation} • {v.volume}</option>
              ))}
            </select>
          </div>
        )}

        {/* STOCK ACTUAL */}
        {selectedVariantData && (
          <div className="bg-zinc-800/50 rounded-xl p-3 text-sm text-zinc-400">
            Stock actual: <span className="text-white font-semibold">{stockActual}</span> unidades
          </div>
        )}

        {/* CANTIDAD Y PRECIO */}
        {selectedVariant && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Cantidad</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={quantity || ""}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className={inputClass + " text-center text-xl font-bold"}
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Precio unitario</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={unitPrice || ""}
                onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value)))}
                className={inputClass + " text-center text-xl font-bold"}
              />
            </div>
          </div>
        )}

        {/* COSTO TOTAL */}
        {quantity > 0 && unitPrice > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
            <div className="text-zinc-400 text-xs uppercase mb-1">Costo total</div>
            <div className="text-2xl font-bold text-blue-400">
              ${Math.round(costoTotal).toLocaleString("es-AR")}
            </div>
          </div>
        )}

        {/* PROVEEDOR */}
        {selectedVariant && (
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">Proveedor</label>
            <div className="flex gap-2">
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((s) => (
                  <option key={s.firestoreId ?? s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={createSupplier}
                className="bg-zinc-700 hover:bg-zinc-600 px-4 rounded-xl text-white font-bold transition shrink-0"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* PEDIDOS RELACIONADOS */}
        {relatedOrders.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
            <div className="text-yellow-300 text-xs uppercase tracking-wider mb-2">Pedidos pendientes</div>
            {relatedOrders.map((o) => (
              <div key={o.id} className="flex justify-between text-sm text-zinc-300">
                <span>{o.location}</span>
                <span className="text-zinc-400">Faltan {o.quantity - o.delivered}</span>
              </div>
            ))}
          </div>
        )}

        {/* BOTON */}
        <button
          onClick={handleApply}
          disabled={guardando || !selectedVariant || quantity <= 0}
          className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold text-lg py-4 rounded-2xl transition active:scale-95"
        >
          {guardando ? "Guardando..." : "Registrar compra"}
        </button>

        {success && (
          <div className="bg-green-800/50 border border-green-600/40 text-green-300 px-4 py-3 rounded-xl text-center">
            Compra registrada correctamente
          </div>
        )}
      </div>

    </div>
  );
}