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
	const [creatingStore, setCreatingStore] = useState(false);
	const [newStoreName, setNewStoreName] = useState("");
	const [newStoreLocation, setNewStoreLocation] = useState("");
	const [newStoreAvgDelivery, setNewStoreAvgDelivery] = useState("");
	const [savingStore, setSavingStore] = useState(false);
	const [addingProduct, setAddingProduct] = useState(false);

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
	  <div className="flex items-center justify-between gap-4">
		<h1 className=" font-bold ">Store Management</h1>
		<Button onClick={() => setCreatingStore((v) => !v)} variant="default">
		  {creatingStore ? "Close" : "Add Store"}
		</Button>
	  </div>

	  {creatingStore && (
		<Card className="mt-2">
		  <CardHeader>
			<CardTitle>Create New Store</CardTitle>
		  </CardHeader>
		  <CardContent className="space-y-3">
			<div className="grid gap-3 md:grid-cols-3">
			  <div>
				<label className="block text-sm mb-1">Name</label>
				<Input
				  value={newStoreName}
				  onChange={(e) => setNewStoreName(e.target.value)}
				  placeholder="e.g. Chijohnz's Supermarket"
				/>
			  </div>
							<div>
								<label className="block text-sm mb-1">Location</label>
								<Input
									value={newStoreLocation}
									onChange={(e) => setNewStoreLocation(e.target.value)}
									placeholder="e.g. Yahoo junction"
								/>
							</div>
							<div>
								<label className="block text-sm mb-1">Avg delivery time (mins)</label>
								<Input
									type="number"
									value={newStoreAvgDelivery}
									onChange={(e) => setNewStoreAvgDelivery(e.target.value)}
									placeholder="e.g. 30"
								/>
							</div>
							{/* Address removed from create flow; can be set later via admin edit */}
			</div>
			<div className="flex items-center justify-end gap-2 mt-2">
			  <Button
				variant="secondary"
								onClick={() => {
									setCreatingStore(false);
									setNewStoreName("");
									setNewStoreLocation("");
								}}
				disabled={savingStore}
			  >
				Cancel
			  </Button>
			  <Button
				onClick={async () => {
				  if (!newStoreName.trim() || !newStoreLocation.trim()) {
					toast.error("Name and location are required");
					return;
				  }
				  try {
					setSavingStore(true);
					const res = await fetch(`${apiBase}/api/stores`, {
					  method: "POST",
					  headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
												name: newStoreName.trim(),
												location: newStoreLocation.trim(),
												avgDeliveryTime: newStoreAvgDelivery ? Number(newStoreAvgDelivery) : undefined,
											}),
					});
					const data = await res.json().catch(() => ({}));
					if (!res.ok) {
					  throw new Error(data.error || data.message || "Failed to create store");
					}
					setStoresList((prev) => [...prev, data]);
					toast.success("Store created");
					setCreatingStore(false);
					setNewStoreName("");
					setNewStoreLocation("");
					setNewStoreAvgDelivery("");
				  } catch (err) {
					console.error(err);
					toast.error(err.message || "Failed to create store");
				  } finally {
					setSavingStore(false);
				  }
				}}
				disabled={savingStore}
			  >
				{savingStore ? "Saving..." : "Save Store"}
			  </Button>
			</div>
		  </CardContent>
		</Card>
	  )}

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
									{s.avgDeliveryTime != null && (
										<div className=" text-sm text-muted-foreground">Avg delivery: {s.avgDeliveryTime} mins</div>
									)}
									<div className="mt-2">
										<Button variant="outline" className="px-2 py-1 text-sm" onClick={() => setAddingProduct(true)}>
											Add Product
										</Button>
									</div>
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
						{Number(product.price) > 0 ? (
							<p className="">₦{Number(product.price).toFixed(2)}</p>
						) : (
							<p className="text-sm text-stone-500">Price not set</p>
						)}
						<p className=" mt-2">{product.description}</p>
						{typeof product.quantity === 'number' && (
							<p className="text-sm text-stone-700 mt-2">Quantity: {product.quantity}</p>
						)}
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

			{addingProduct && selectedStoreFilter && (
				<EditProduct
					product={null}
					createForStoreId={selectedStoreFilter}
					onClose={() => setAddingProduct(false)}
					onUpdate={(created) => {
						// Only add products that belong to the selected store
						if (String(created.store) === String(selectedStoreFilter)) {
							setProducts((prev) => [created, ...prev]);
						}
						setAddingProduct(false);
					}}
				/>
			)}
	</div>
  );
}
