"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from '@/components/SearchBar';
import CategoriesFilter from '@/components/CategoriesFilter';
import { CATEGORIES, findCategoryByKey } from '@/lib/categories';
import { toast } from '@/components/ui/sonner';
import { buildCartPayload, saveCart } from '@/lib/cart';
import posthog from 'posthog-js';
import { MdThumbUp, MdThumbDown, MdAccessTime, MdVisibility, MdLocationOn } from 'react-icons/md';

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function normalize(s = "") {
	return (s || "")
		.toString()
		.toLowerCase()
		.replace(/'s\b/g, "")
		.replace(/[^a-z0-9]/g, "");
}

export default function ShopPage() {
	return (
		<Suspense fallback={<div className="p-6">Loading shop…</div>}>
			<ShopPageInner />
		</Suspense>
	);
}

function ShopPageInner() {
	const search = useSearchParams();
	const storeQuery = search.get("store") || "";
	const [loading, setLoading] = useState(true);
	const [stores, setStores] = useState([]);
	const [store, setStore] = useState(null);
	const [products, setProducts] = useState([]);
	const [error, setError] = useState(null);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const router = useRouter();
	const [expanded, setExpanded] = useState({});
	const [searchTerm, setSearchTerm] = useState("");
	const [category, setCategory] = useState('all');
	const [cart, setCart] = useState({}); // { productId: quantity }
	const [cartOpen, setCartOpen] = useState(false);
	const [storeStats, setStoreStats] = useState(null);
	const [ratingBusy, setRatingBusy] = useState({}); // per-product reaction loading


	function addToCart(product) {
		const currentQty = cart[String(product._id)] || 0;

		setCart((c) => {
			const id = String(product._id);
			const next = { ...c };
			next[id] = (next[id] || 0) + 1;
			return next;
		});

		// Track product added to cart
		posthog.capture('product_added_to_cart', {
			product_id: product._id,
			product_name: product.name,
			product_price: Number(product.price || 0),
			product_category: product.category || inferCategoryFor(product),
			quantity_in_cart: currentQty + 1,
			store_name: store?.name || null,
		});

		setCartOpen(true);
		toast.success(
			<div className="flex items-center gap-3">
				<div className="text-sm text-stone-950">Added</div>
				<div className="font-semibold text-stone-950 truncate">{product.name || 'Item'}</div>
			</div>
		);
	}

	function removeFromCart(productId) {
		const prod = products.find((p) => String(p._id) === String(productId)) || { name: 'Unknown', price: 0 };

		// Track product removed from cart
		posthog.capture('product_removed_from_cart', {
			product_id: productId,
			product_name: prod.name,
			product_price: Number(prod.price || 0),
			store_name: store?.name || null,
		});

		setCart((c) => {
			const next = { ...c };
			delete next[String(productId)];
			return next;
		});
	}

	function cartCount() {
		return Object.values(cart).reduce((s, v) => s + v, 0);
	}

	function handleClearCart() {
		const entries = Object.entries(cart);
		const itemsCount = entries.length;
		const totalQuantity = entries.reduce((sum, [, qty]) => sum + qty, 0);

		// Track cart cleared
		posthog.capture('cart_cleared', {
			items_count: itemsCount,
			total_quantity: totalQuantity,
			store_name: store?.name || null,
		});

		setCart({});
	}

	function handleStoreSelect(selectedStore) {
		// Track store selection
		posthog.capture('store_selected', {
			store_id: selectedStore._id,
			store_name: selectedStore.name,
			store_location: selectedStore.location || selectedStore.address || null,
		});
	}

	function inferCategoryFor(product) {
		if (product.category) return product.category;
		const name = (product.name || '') + ' ' + (product.description || '');
		const s = name.toLowerCase();
		if (s.match(/drink|cola|juice|beer|soda/)) return 'beverages';
		if (s.match(/soap|detergent|clean|bleach|wash/)) return 'cleaning';
		if (s.match(/phone|charger|electronic|tv|radio/)) return 'electronics';
		if (s.match(/fruit|vegetable|yam|potato|tomato|onion/)) return 'produce';
		if (s.match(/snack|chips|crisps|cookie|biscuit/)) return 'snacks';
		return 'groceries';
	}

	function handleCheckout() {
		if (!store) {
			toast.error('Select a store before checkout');
			return;
		}

		const entries = Object.entries(cart);
		if (entries.length === 0) {
			toast('Cart is empty');
			return;
		}


		const items = entries.map(([id, qty]) => {
			const prod = products.find((p) => String(p._id) === id) || { name: 'Unknown', price: 0 };
			const unitPrice = Number(prod.price || 0);
			return {
				_id: id,
				name: prod.name,
				image: prod.image || null,
				unitPrice,
				qty,
				subtotal: unitPrice * qty,
			};
		});

		const cartTotal = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);

		// Track checkout initiated
		posthog.capture('checkout_initiated', {
			store_name: store.name,
			items_count: items.length,
			total_quantity: items.reduce((sum, it) => sum + it.qty, 0),
			cart_total: cartTotal,
			product_names: items.map(it => it.name),
		});

		const payload = buildCartPayload(store.name, items);
		saveCart(payload);
		router.push('/booking');
	}

	async function reactToProduct(productId, action) {
		try {
			setRatingBusy((m) => ({ ...m, [productId]: true }));
			const res = await fetch(`${apiBase}/api/products/${productId}/react`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || data.message || 'Failed to update rating');

			const stats = data.productStats || {};
			setProducts((prev) =>
				prev.map((p) =>
					String(p._id) === String(productId)
						? { ...p, likes: stats.likes ?? p.likes ?? 0, dislikes: stats.dislikes ?? p.dislikes ?? 0 }
						: p
				)
			);

			if (data.storeStats) {
				const s = data.storeStats;
				const total = (s.likes || 0) + (s.dislikes || 0);
				const rating = total > 0 ? (s.likes / total) * 5 : null;
				setStoreStats({ likes: s.likes || 0, dislikes: s.dislikes || 0, rating, completedOrders: s.completedOrders || 0 });
			}
		} catch (err) {
			console.error(err);
			toast.error(err.message || 'Failed to update rating');
		} finally {
			setRatingBusy((m) => {
				const next = { ...m };
				delete next[productId];
				return next;
			});
		}
	}

	useEffect(() => {
		if (!store) return;

		const entries = Object.entries(cart);
		if (entries.length === 0) {
			try {
				if (typeof window !== 'undefined') {
					window.localStorage.removeItem('quickclean_cart');
					if (window.__quickclean_cart) delete window.__quickclean_cart;
				}
			} catch (e) {}
			return;
		}

		const items = entries.map(([id, qty]) => {
			const prod = products.find((p) => String(p._id) === id) || { name: 'Unknown', price: 0 };
			const unitPrice = Number(prod.price || 0);
			return {
				_id: id,
				name: prod.name,
				image: prod.image || null,
				unitPrice,
				qty,
				subtotal: unitPrice * qty,
			};
		});

		const payload = buildCartPayload(store.name, items);
		saveCart(payload);
	}, [cart, store, products]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true);
			try {
				const res = await fetch(`${apiBase}/api/stores`);
				if (!res.ok) throw new Error("Failed to fetch stores");
				const arr = await res.json();
				if (!mounted) return;
				setStores(arr || []);
				if (storeQuery) {
					const qn = normalize(storeQuery);
					const match = (arr || []).find((s) => {
						const sn = normalize(s.name || "");
						if (!sn) return false;
						if (sn === qn) return true;
						if (sn.includes(qn) || qn.includes(sn)) return true;
						const sTokens = sn.split(/[^a-z0-9]+/).filter(Boolean);
						const qTokens = qn.split(/[^a-z0-9]+/).filter(Boolean);
						const common = qTokens.filter((t) => sTokens.includes(t));
						if (common.length >= Math.max(1, Math.min(qTokens.length, 1))) return true;
						return false;
					});
					if (match) {
						setStore(match);
						const prodRes = await fetch(`${apiBase}/api/stores/${match._id}`);
						if (!prodRes.ok) throw new Error("Failed to fetch products for store");
						const payload = await prodRes.json();
						setStore(payload.store || match);
						setProducts(payload.products || []);
						setStoreStats(payload.storeStats || null);
					} else {
						setError(`Store '${storeQuery}' not found`);
					}
				}
			} catch (err) {
				console.error(err);
				if (mounted) setError(err.message || "Failed to load shop");
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [storeQuery]);

	useEffect(() => {
		const productQuery = search.get("product");
		if (!productQuery) return;
		if (!products || products.length === 0) return;
		const found = products.find((p) => String(p._id) === String(productQuery));
		if (found) {
			setSelectedProduct(found);
		} else {
			setSelectedProduct(null);
		}
	}, [products, search]);



	return (
				<div className="min-h-screen p-6 ">
					<div className="max-w-6xl mx-auto">
						<div className="flex items-center justify-between mb-6">
							<h1 className=" font-bold">Shop</h1>
							{store && (
								<div className="text-sm text-stone-950 space-y-1">
									<div>
										<span className="mr-2 inline-flex items-center gap-1">
											<MdVisibility className="w-3 h-3" aria-hidden />
											<span>Viewing:</span>
										</span>
										<strong className="mr-2">{store.name}</strong>
										<span className="px-2 py-1 rounded bg-slate-100 text-xs inline-flex items-center gap-1">
											<MdLocationOn className="w-3 h-3" aria-hidden />
											<span>
												{typeof store.name === 'string' && store.name.toLowerCase().includes('chijohnz')
													? 'Location: Yahoo junction'
													: (store.location || store.address || 'Location not set')}
											</span>
										</span>
									</div>
									{storeStats && (
										<div className="text-xs text-stone-950 space-y-0.5">
											{storeStats.rating != null ? (
												<span>
													Rating: {storeStats.rating.toFixed(1)} / 5 · {storeStats.likes} likes, {storeStats.dislikes} dislikes · {storeStats.completedOrders ?? 0} completed orders
												</span>
											) : (
												<span>
													No rating yet · {storeStats.completedOrders ?? 0} completed orders
												</span>
											)}
											{typeof store.name === 'string' && store.name.toLowerCase().includes('chijohnz') && (
												<p className="flex items-center gap-1">
													<MdAccessTime className="w-3 h-3" aria-hidden />
													<span>Average delivery time from Chijohnz is just 1 hour for all orders within Ifite, Awka.</span>
												</p>
											)}
										</div>
									)}
								</div>
							)}
						</div>
		
						{loading ? (
							<div>Loading…</div>
						) : error ? (
							<div className="">{error}</div>
						) : store ? (
							<>
								<p className=" mb-4">{store.description || store.location || ""}</p>
		

								<div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									<div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
										<SearchBar value={searchTerm} onChange={setSearchTerm} />
										<CategoriesFilter selected={category} onSelect={setCategory} />
									</div>
									<div className="flex items-center gap-3 relative">
										<button onClick={() => setCartOpen((v) => !v)} className="relative px-3 py-2 rounded border">
											Cart ({cartCount()})
										</button>
										<button onClick={handleCheckout} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Checkout</button>

										<div className={`fixed inset-x-0 bottom-0 md:bottom-6 md:right-6 md:left-auto md:w-80 z-50 transform ${cartOpen ? 'translate-y-0' : 'translate-y-full'} transition-transform duration-300`} aria-hidden={!cartOpen}>
											<div className="bg-white border-t md:rounded-lg md:shadow p-4 max-h-80 overflow-auto">
												<div className="flex items-center justify-between mb-3">
													<div className="font-semibold">Cart</div>
													<div className="flex items-center gap-2">
														<button onClick={() => setCartOpen(false)} className="text-sm px-2 py-1">Close</button>
														<button onClick={handleClearCart} className="text-sm text-red-600 px-2 py-1">Clear</button>
													</div>
												</div>
												{Object.keys(cart).length === 0 ? (
													<div className="text-sm">Your cart is empty</div>
												) : (
													<>
														<ul className="space-y-2">
														{Object.entries(cart).map(([id, qty]) => {
															const prod = products.find((x) => String(x._id) === id);
															if (!prod) return null;
															return (
																<li key={id} className="flex items-center justify-between">
																	<div className="truncate">{prod.name} × {qty}</div>
																	<div className="text-sm">₦{(Number(prod.price || 0) * qty).toLocaleString()}</div>
																	</li>
																);
															})}
														</ul>
														<div className="mt-3 border-t pt-3 flex items-center justify-between">
														<div className="text-sm">Items total</div>
														<div className="font-semibold">
															{(() => {
																const items = Object.entries(cart).map(([id, qty]) => {
																	const prod = products.find((p) => String(p._id) === id) || { price: 0 };
																	return Number(prod.price || 0) * qty;
																});
																const sum = items.reduce((s, v) => s + v, 0);
																return `₦${sum.toLocaleString()}`;
															})()}
														</div>
														</div>
														<div className="mt-3 flex items-center justify-end gap-2">
														<button onClick={handleCheckout} className="px-3 py-2 bg-emerald-600 text-white rounded">Checkout</button>
														</div>
													</>
												)}
											</div>
										</div>
									</div>
								</div>
		
								{products.length === 0 ? (
									<div className=" ">No products found for this store.</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
										{products
											.filter((p) => {
											
												if (searchTerm && !((p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()))) return false;
											
												const pk = p.category || inferCategoryFor(p);
												if (category && category !== 'all' && pk !== category) return false;
												return true;
											})
											.map((p) => {
												const catKey = p.category || inferCategoryFor(p);
												const cat = findCategoryByKey(catKey);
												return (
													<div key={p._id} className=" rounded-lg p-4 shadow flex flex-col">
														<div className="flex items-center gap-2 mb-2">
															{cat?.Icon ? <cat.Icon className="w-5 h-5" /> : null}
															<div className="font-semibold truncate">{p.name}</div>
														</div>
														{p.image ? (
															<div className="w-full overflow-hidden rounded-md mb-3" style={{ aspectRatio: '3/4' }}>
																<img src={p.image} alt={p.name} className="w-full h-full object-cover" />
															</div>
														) : (
															<div className="w-full rounded-md mb-3" style={{ aspectRatio: '3/4' }} />
														)}
		
														<div className="flex-1">
															<div className=" mt-1">₦{Number(p.price || 0).toLocaleString()}</div>
															{p.description && (
																<div className="mt-2">
																	<p className={`${expanded[p._id] ? '' : 'line-clamp-3'}`}>{p.description}</p>
																	<button onClick={() => setExpanded((s) => ({ ...s, [p._id]: !s[p._id] }))} className="mt-2 hover:underline" aria-expanded={!!expanded[p._id]}>
																		{expanded[p._id] ? 'Show less' : 'Show more'}
																	</button>
																</div>
															)}
														</div>

														<div className="mt-3 flex items-center justify-between text-xs text-stone-950">
															<button
																type="button"
																onClick={() => reactToProduct(p._id, 'like')}
																disabled={!!ratingBusy[p._id]}
																className="inline-flex items-center gap-1 px-2 py-1 rounded border"
															>
																<MdThumbUp className="w-4 h-4" aria-hidden />
																<span>{p.likes ?? 0}</span>
															</button>
															<button
																type="button"
																onClick={() => reactToProduct(p._id, 'dislike')}
																disabled={!!ratingBusy[p._id]}
																className="inline-flex items-center gap-1 px-2 py-1 rounded border"
															>
																<MdThumbDown className="w-4 h-4" aria-hidden />
																<span>{p.dislikes ?? 0}</span>
															</button>
														</div>
		
														<div className="mt-4 flex items-center justify-between">
															<a href={`/shop?store=${encodeURIComponent(store.name)}&product=${encodeURIComponent(p._id)}`} className=" hover:underline">View</a>
															<button onClick={() => addToCart(p)} className="px-3 py-1 rounded-md ">Add</button>
														</div>
													</div>
												);
											})}
									</div>
								)}
							</>
						) : (
							<div>
								<p className=" mb-4">No store selected. You can pick a store from the list below.</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
									{stores.map((s) => (
										<a
											key={s._id}
											href={`/shop?store=${encodeURIComponent(s.name)}`}
											onClick={() => handleStoreSelect(s)}
											className="block p-4 rounded shadow hover:shadow-md"
										>
											<div className="font-semibold">{s.name}</div>
											<div className=" ">{s.location || s.address}</div>
										</a>
									))}
								</div>
							</div>
						)}
		

						{selectedProduct && (
							<div className="fixed inset-0 z-50 flex items-center justify-center">
								<div
									className="fixed inset-0"
									onClick={() => {
										setSelectedProduct(null);
										const base = store ? `/shop?store=${encodeURIComponent(store.name)}` : "/shop";
										router.replace(base);
									}}
								/>
		
								<div className="relative max-w-3xl w-full mx-4 rounded-lg overflow-hidden shadow-lg z-10">
									<div className="p-4 flex items-start justify-between">
										<div>
											<div className=" font-semibold ">{selectedProduct.name}</div>
											<div className=" ">₦{Number(selectedProduct.price || 0).toLocaleString()}</div>
										</div>
		
										<button
											onClick={() => {
												setSelectedProduct(null);
												const base = store ? `/shop?store=${encodeURIComponent(store.name)}` : "/shop";
												router.replace(base);
											}}
											aria-label="Close"
											className=" "
										>
											✕
										</button>
									</div>
		
									{selectedProduct.image && (
										<div className="w-full" style={{ aspectRatio: "3/4" }}>
											<img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
										</div>
									)}
		
									<div className="p-4">
										<p className=" ">{selectedProduct.description}</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			);
		}
