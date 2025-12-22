"use client";

import React, { useEffect, useState } from "react";
import { playProductAddedSound } from '@/lib/sound';

export default function StoreManagementPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchStoresAndProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStoresAndProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/stores`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load stores');
      const storeList = await res.json();
      setStores(storeList);

      // Fetch products for each store and flatten
      const proms = storeList.map((s) =>
        fetch(`${apiBase}/api/stores/${s._id}/products`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : []))
      );
      const productsByStore = await Promise.all(proms);
      const all = productsByStore.flat();
      setProducts(all);
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(product) {
    setEditingProduct(product);
  }

  function handleUpdate(updated) {
    setProducts((p) => p.map((x) => (x._id === updated._id ? updated : x)));
    setEditingProduct(null);
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 ">Error: {error}</div>;

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className=" font-semibold mb-4">Store Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className=" rounded shadow p-4">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded mb-3" />
              )}

              <div className="font-medium">{product.name}</div>
              <div className="">₦{product.price}</div>
              {product.description && <div className=" mt-2">{product.description}</div>}

              <div className="mt-4">
                <button className="px-3 py-1 rounded border" onClick={() => openEdit(product)}>
                  Edit Product
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingProduct && (
          <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={handleUpdate} apiBase={apiBase} />
        )}
      </div>
    </div>
  );
}

function EditProductModal({ product, onClose, onUpdate, apiBase }) {
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(product.price || 0);
  const [description, setDescription] = useState(product.description || '');
  const [isAvailable, setIsAvailable] = useState(product.isAvailable ?? true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/products/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), description, isAvailable }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      onUpdate(updated);
      try {
        playProductAddedSound();
      } catch (e) {
        console.debug(e);
      }
    } catch (err) {
      setMsg(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <div className=" rounded shadow max-w-lg w-full p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className=" font-semibold">Edit Product</h3>
          <button onClick={onClose} className=" ">Close</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block">Name</label>
            <input className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block">Price</label>
            <input type="number" className="w-full rounded border px-3 py-2" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>

          <div>
            <label className="block">Description</label>
            <textarea className="w-full rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} /> Available
            </label>
          </div>

          {msg && <div className="">{msg}</div>}

          <div className="flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded border" onClick={onClose}>
              Cancel
            </button>
            <button className="px-3 py-2 rounded" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

