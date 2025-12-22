"use client";
import React, { useEffect, useState } from "react";
import EditProduct from "@/components/EditProduct";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { toast } from "@/lib/toast";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminStorePage() {
  const [products, setProducts] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [storeCounts, setStoreCounts] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState(null);

  useEffect(() => {
	let mounted = true;
	async function fetchProductsForAllStores() {
	  try {
		const storesRes = await fetch(`${apiBase}/api/stores`);
		if (!storesRes.ok) throw new Error("Failed to fetch stores");
		const stores = await storesRes.json();
		if (mounted) setStoresList(stores);

		// fetch products for each store in parallel
		const productsLists = await Promise.all(
		  stores.map(async (s) => {
			const r = await fetch(`${apiBase}/api/stores/${s._id}/products`);
			if (!r.ok) return [];
			return r.json();
		  })
		);
		const flat = productsLists.flat();
		if (mounted) setProducts(flat);

		// fetch order counts per store (use bookings endpoint)
		try {
		  const countsArr = await Promise.all(
			stores.map(async (s) => {
			  const r = await fetch(
				`${apiBase}/api/bookings?store=${encodeURIComponent(s.name)}&limit=1`
			  );
			  if (!r.ok) return { id: s._id, total: 0 };
			  const j = await r.json();
			  return { id: s._id, total: j.meta?.total || 0 };
			})
		  );
		  const map = {};
		  countsArr.forEach((c) => {
			map[c.id] = c.total;
		  });
		  if (mounted) setStoreCounts(map);
		} catch (e) {
		  // ignore counts failure
		  console.warn("Could not fetch store booking counts", e);
		}
	  } catch (err) {
		toast.error(err?.message || "Failed to load products");
	  }
	}
	fetchProductsForAllStores();
	return () => {
	  mounted = false;
	};
  }, []);

  const filteredProducts = products.filter(
	(p) =>
	  (p.name || "").toLowerCase().includes(search.toLowerCase()) &&
	  (!selectedStoreFilter || String(p.store) === String(selectedStoreFilter))
  );

  return (
	<div className="p-4 md:p-8 lg:p-12 space-y-6">
	  <h1 className=" font-bold ">Store Management</h1>

	  {/* Hero that reflects current store selection */}
	  <div className="rounded-lg p-4 shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<div>
		  {selectedStoreFilter ? (
			(() => {
			  const s = storesList.find((x) => String(x._id) === String(selectedStoreFilter));
			  if (!s) return <div className=" ">Selected store</div>;
			  return (
				<>
				  <div className=" font-semibold">{s.name}</div>
				  <div className=" ">{s.location || s.address || "No location"}</div>
				</>
			  );
			})()
		  ) : (
			<div>
			  <div className=" font-semibold">All Stores</div>
			  <div className=" ">Managing {storesList.length} store(s)</div>
			</div>
		  )}
		</div>

		<div className="ml-auto flex items-center gap-4">
		  <div className=" ">Total Orders</div>
		  <div className=" font-bold ">
			{selectedStoreFilter ? (storeCounts[selectedStoreFilter] ?? 0) : products.length}
		  </div>
		</div>
	  </div>

	  <div className="flex items-center gap-4">
		<Input
		  placeholder="Search products..."
		  value={search}
		  onChange={(e) => setSearch(e.target.value)}
		  className="max-w-md"
		/>
		<div className="flex gap-2 items-center">
		  <label className="">Filter:</label>
		  <select
			value={selectedStoreFilter || ""}
			onChange={(e) => setSelectedStoreFilter(e.target.value || null)}
			className="rounded border px-2 py-1"
		  >
			<option value="">All stores</option>
			{storesList.map((s) => (
			  <option key={s._id} value={s._id}>
				{s.name}
			  </option>
			))}
		  </select>
		</div>
	  </div>

	  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{filteredProducts.map((product) => {
		  const imageUrl =
			product?.image && (product.image.startsWith("http") ? product.image : `${apiBase}${product.image}`);
		  return (
			<Card key={product._id} className="hover:shadow-lg transition-shadow cursor-pointer">
			  <CardHeader>
				<CardTitle>{product.name}</CardTitle>
			  </CardHeader>
			  <CardContent>
				{imageUrl && (
				  <div className="w-full overflow-hidden rounded mb-3" style={{ aspectRatio: "3/4" }}>
					<img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
				  </div>
				)}
				<p className="">₦{Number(product.price || 0).toFixed(2)}</p>
				<p className=" mt-2">{product.description}</p>
				<Button variant="secondary" className="mt-4" onClick={() => setSelectedProduct(product)}>
				  Edit Product
				</Button>
			  </CardContent>
			</Card>
		  );
		})}
	  </div>

	  {selectedProduct && (
		<EditProduct
		  product={selectedProduct}
		  onClose={() => setSelectedProduct(null)}
		  onUpdate={(updatedProduct) => {
			setProducts(products.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)));
			setSelectedProduct(null);
		  }}
		/>
	  )}
	</div>
  );
}
