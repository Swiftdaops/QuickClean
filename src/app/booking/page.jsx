"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { MdShoppingCart, MdCleaningServices, MdHome, MdLocalLaundryService, MdAutoAwesome } from 'react-icons/md';
import { Input, Textarea, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { toast } from "@/components/ui/sonner";
import { playProductAddedSound } from "@/lib/sound";
import Splash from '@/components/Splash';

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const SERVICE_DESCRIPTIONS = {};

function ServiceIcon({ name, className = "w-6 h-6 text-emerald-600" }) {
	const key = (name || "").toLowerCase();
	if (key.includes("help") || key.includes("buy")) return <MdShoppingCart className={className} aria-hidden />;
	if (key.includes("lodge") || key.includes("clean")) return <MdCleaningServices className={className} aria-hidden />;
	if (key.includes("home") || key.includes("apartment")) return <MdHome className={className} aria-hidden />;
	if (key.includes("laundry") || key.includes("dry") || key.includes("wash")) return <MdLocalLaundryService className={className} aria-hidden />;
	return <MdAutoAwesome className={className} aria-hidden />;
}

export default function BookingPage() {
	const search = useSearchParams();
	const [orderData, setOrderData] = useState(null);
	const [formData, setFormData] = useState({ name: "", phone: "", date: "", notes: "" });
	const [services, setServices] = useState([]);
	const [stores, setStores] = useState([]);
	const [selected, setSelected] = useState([]);
	const [selectedStore, setSelectedStore] = useState("");
	const [loading, setLoading] = useState(false);
	const [loadingServices, setLoadingServices] = useState(true);
	const [fetchError, setFetchError] = useState(null);
	const [splashes, setSplashes] = useState([]);

	useEffect(() => {
		let mounted = true;


			const tryParseOrder = () => {
				try {
					const qsOrder = search?.get('order');
					if (!qsOrder) {
						// if no order in query, try to restore from localStorage (cart persistence)
						try {
							const saved = typeof window !== 'undefined' ? window.localStorage.getItem('quickclean_cart') : null;
							if (saved) {
								const obj = JSON.parse(saved);
								if (obj && Array.isArray(obj.items) && obj.items.length > 0) {
									setOrderData(obj);
									setSelected(['Help Me Buy Pack']);
									if (obj.store) setSelectedStore(obj.store);
									return;
								}
							}
						} catch (e) { /* ignore parse errors */ }
						return;
					}
					const decoded = decodeURIComponent(qsOrder);
					const obj = JSON.parse(decoded);

					if (obj && Array.isArray(obj.items) && obj.items.length > 0) {
						setOrderData(obj);
						// persist cart to localStorage and in-memory so it survives reloads
						try {
							if (typeof window !== 'undefined') {
								window.localStorage.setItem('quickclean_cart', JSON.stringify(obj));
								window.__quickclean_cart = obj;
							}
						} catch (e) {}

						setSelected(['Help Me Buy Pack']);
						if (obj.store) setSelectedStore(obj.store);
						try {
							toast.success('Help Me Buy Pack selected');
							playProductAddedSound('https://res.cloudinary.com/dnitzkowt/video/upload/v1766339273/new-notification-3-398649_pxhiar.mp3');
						} catch (e) {
							console.debug('Auto-select notification failed', e);
						}

						
						(async function refreshPrices() {
							try {
								
								const storesRes = await fetch(`${apiBase}/api/stores`);
								if (!storesRes.ok) return;
								const storesJson = await storesRes.json();
								const storeObj = (storesJson || []).find((s) => (s.name || '').toLowerCase() === (obj.store || '').toLowerCase());
								if (!storeObj || !storeObj._id) return;
								
								const prodsRes = await fetch(`${apiBase}/api/stores/${storeObj._id}/products`);
								if (!prodsRes.ok) return;
								const prods = await prodsRes.json();
								const byId = (prods || []).reduce((m, p) => { m[String(p._id)] = p; return m; }, {});
								const updatedItems = obj.items.map((it) => {
									const p = byId[String(it._id)];
									const unitPrice = p ? Number(p.price || 0) : (it.unitPrice ?? it.price ?? 0);
									const qty = it.qty || 1;
									return { ...it, unitPrice, subtotal: unitPrice * qty };
								});
									const newItemsTotal = updatedItems.reduce((s, it) => s + (it.subtotal || 0), 0);
									const newTotal = newItemsTotal;
									if (mounted) {
										const newCart = { ...(obj || {}), items: updatedItems, itemsTotal: newItemsTotal, helpFee: 0, total: newTotal };
										setOrderData(newCart);
										// persist updated cart with refreshed prices (localStorage + in-memory)
										try {
											if (typeof window !== 'undefined') {
												window.localStorage.setItem('quickclean_cart', JSON.stringify(newCart));
												window.__quickclean_cart = newCart;
											}
										} catch (e) {}
									}
							} catch (e) {
								console.debug('Failed to refresh product prices for order', e);
							}
						})();
					}
				} catch (e) {
					console.debug('Failed to parse order from query', e);
				}
			};
		tryParseOrder();

		async function fetchServices() {
			setFetchError(null);
			setLoadingServices(true);
			try {
				const [sRes, stRes] = await Promise.all([
					fetch(`${apiBase}/api/services`),
					fetch(`${apiBase}/api/stores`),
				]);

				if (!mounted) return;

				if (!sRes.ok) {
					const txt = await sRes.text().catch(() => sRes.statusText || 'Failed to fetch services');
					throw new Error(txt || 'Failed to fetch services');
				}
				if (!stRes.ok) {
					const txt = await stRes.text().catch(() => stRes.statusText || 'Failed to fetch stores');
					throw new Error(txt || 'Failed to fetch stores');
				}

				const sJson = await sRes.json();
				const stJson = await stRes.json();

				const svcList = Array.isArray(sJson) ? sJson : [];
				setServices(svcList);
				const storeObjs = (stJson.stores || stJson || []);
				const names = storeObjs.map((s) => s.name || s);
				setStores(names);

				const partnerFound = names.find((n) => n && n.toLowerCase().includes("chijohnz"));
				if (partnerFound) setSelectedStore(partnerFound);
				if (svcList.length) setSelected([]);
			} catch (err) {
				console.error('Failed to load services or stores', err);
				if (mounted) setFetchError(err.message || String(err));
			} finally {
				if (mounted) setLoadingServices(false);
			}
		}

		fetchServices();
		return () => { mounted = false };
	}, []);

	
	const itemsTotalFromOrder = orderData
		? (orderData.itemsTotal ?? (Array.isArray(orderData.items) ? orderData.items.reduce((s, it) => s + ((it.qty || 1) * (it.unitPrice || it.price || 0)), 0) : 0))
		: 0;

	
	const servicesTotalFromSelected = Array.isArray(selected) && services.length
		? selected.reduce((s, nameKey) => {
			const svcObj = services.find((x) => x.name === nameKey);
			return s + (svcObj ? Number(svcObj.price || 0) : 0);
		}, 0)
		: 0;

	const displayedGrandTotal = itemsTotalFromOrder + servicesTotalFromSelected;

	function handleChange(e) {
		setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
	}



	async function handleSubmit(e) {
		e.preventDefault();
		if (!selected || selected.length === 0) return toast.error('Please select at least one service');
		 if (selected.includes('Help Me Buy Pack') && !selectedStore) return toast.error('Please select a store for Help Me Buy orders');
		const name = (formData.name || '').trim();
		const phone = (formData.phone || '').trim();
		if (!name || !phone) return toast.error('Name and phone are required');

		// Ensure we have a customer CID captured and persist customer name for greetings
		let customerCid = null;
		try {
			if (typeof window !== 'undefined') {
				customerCid = window.localStorage?.getItem('cid') || null;
				if (!customerCid) {
					customerCid = `cid_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
					window.localStorage.setItem('cid', customerCid);
				}
				// Save latest customer name for Hero greeting
				window.localStorage.setItem('customerName', name);
			}
		} catch (e) { customerCid = customerCid || null; }

		const items = orderData && Array.isArray(orderData.items) && orderData.items.length > 0 ? orderData.items : undefined;


		const svcEntries = selected.map((nameKey) => {
			const svcObj = services.find((x) => x.name === nameKey) || { name: nameKey, price: 0 };
			const entry = { service: svcObj.name, price: svcObj.price || 0, notes: formData.notes || undefined };
			if (svcObj.name === 'Help Me Buy Pack') {
				entry.store = selectedStore;

				if (items && Array.isArray(items) && items.length > 0) {
					entry.productId = items[0]._id || items[0].productId || null;
				}
			}
			return entry;
		});


		
		


		const servicesTotal = svcEntries.reduce((s, it) => s + (Number(it.price || 0)), 0);
		const itemsTotal = items ? (orderData.itemsTotal ?? orderData.items.reduce((s, it) => s + ((it.qty || 1) * (it.unitPrice ?? it.price ?? 0)), 0)) : 0;
		const totalAmount = servicesTotal + itemsTotal;

		const orderSummary = {
			items: items || [],
			itemsTotal,
			servicesTotal,
			total: totalAmount,
			store: orderData?.store || selectedStore || null,
		};

		const payload = {
			name,
			phone,
			date: formData.date || undefined,
			services: svcEntries,
			items,
			customerCid,
			orderSummary,
			// Add top-level fields for backend/admin compatibility
			service: selected && selected.length ? selected.join(", ") : undefined,
			store: orderData?.store || selectedStore || undefined,
		};

		console.debug('Booking payload', payload);

		// Open a blank popup synchronously so later navigation is considered a user gesture
		let popup = null;
		try {
			if (typeof window !== 'undefined') {
				popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
			}
		} catch (e) {
			console.debug('Popup open failed', e);
			popup = null;
		}

		setLoading(true);
		try {
			const res = await fetch(`${apiBase}/api/bookings`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const j = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(j.error || j.message || 'Booking failed');
			toast.success('Booking created — we will contact you');

			let adminWhatsApp = (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '').trim();
			try {
				if (!adminWhatsApp) {
					const sres = await fetch(`${apiBase}/api/settings`);
					if (sres.ok) {
						const sj = await sres.json().catch(() => ({}));
						adminWhatsApp = sj.whatsapp || '';
					}
				}
			} catch (e) { console.debug('Failed to fetch settings', e); }

			if (!adminWhatsApp) {
				adminWhatsApp = '+2349079529836';
			}

			const waPhone = adminWhatsApp.replace(/\D/g, '');
			const orderId = j?.booking?._id || (Array.isArray(j?.bookings) && j.bookings[0]?._id) || j?._id || j?.id || '';
			const listLines = (items || []).map((it) => {
				const qty = it.qty || 1;
				const unit = (it.unitPrice ?? it.price ?? 0);
				const sub = it.subtotal ?? (qty * unit);
				return `- ${it.name || it.title || 'Item'} x${qty} — ₦${Number(sub).toLocaleString('en-NG')}`;
			}).join('\n');
			const storeName = orderData?.store || selectedStore || '';
			const details = [
				`Hi, my name is ${name}. I'd like to complete my order payment (₦${totalAmount.toLocaleString('en-NG')}).`,
				orderId ? `Order ID: ${orderId}` : '',
				storeName ? `Store: ${storeName}` : '',
				items && items.length ? `Items:\n${listLines}` : (selected && selected.length ? `Services: ${selected.join(', ')}` : ''),
				`Total: ₦${totalAmount.toLocaleString('en-NG')}`,
				formData.phone ? `Phone: ${formData.phone}` : '',
				formData.date ? `Preferred date: ${formData.date}` : '',
				formData.notes ? `Notes: ${formData.notes}` : '',
				'Thank you.',
			].filter(Boolean).join('\n');
			const encoded = encodeURIComponent(details);


			const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
			const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua);
			const waUrl = isMobile
				? `whatsapp://send?phone=${waPhone}&text=${encoded}`
				: `https://wa.me/${waPhone}?text=${encoded}`;
			try {
				if (popup) {
					try {
						popup.location.href = waUrl;
					} catch (err) {
						// setting location failed (closed or blocked) — try opening directly
						const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
						if (!opened) window.location.href = waUrl;
					}
				} else {
					const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
					if (!opened) window.location.href = waUrl;
				}
			} catch (e) {
				console.debug('WhatsApp redirect failed, copying message to clipboard', e);
				try {
					await navigator.clipboard.writeText(details);
					toast.success('Order summary copied. Send it via WhatsApp.');
				} catch (copyErr) {
					console.debug('Clipboard copy failed', copyErr);
				}
			}


			setFormData({ name: '', phone: '', date: '', notes: '' });
			setSelected([]);

					// clear persisted cart after successful booking (localStorage + in-memory)
					try {
						if (typeof window !== 'undefined') {
							window.localStorage.removeItem('quickclean_cart');
							if (window.__quickclean_cart) delete window.__quickclean_cart;
						}
					} catch (e) {}


		} catch (err) {
			console.error(err);
			toast.error(err.message || String(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="p-6 md:p-12 max-w-4xl mx-auto bg-cyan-100 dark:bg-[#677d7e] text-stone-950 dark:text-white ">
			<Card className="shadow-lg bg-cyan-100 dark:bg-[#677d7e] text-stone-950 dark:text-white">
				<CardHeader>
					<CardTitle className="text-2xl">Book a Service</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-4">
						<p className="text-sm text-muted-foreground">Choose a service and provide your details. Prices are shown below.</p>
					</div>

					{orderData && Array.isArray(orderData.items) && orderData.items.length > 0 && (
						<div className="mb-6 p-4 rounded border bg-white/60 dark:bg-black/40">
							<h3 className="font-semibold">Order Summary</h3>
							<div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
								{orderData.items && orderData.items.length ? (
									<ul className="space-y-1">
										{orderData.items.map((it, i) => (
											<li key={i} className="flex justify-between">
												<span>{it.name} × {it.qty || 1}</span>
												<span>₦{(it.subtotal ?? ((it.qty || 1) * (it.unitPrice ?? it.price ?? 0))).toLocaleString('en-NG')}</span>
											</li>
										))}
									</ul>
								) : (
									<div className="text-sm text-gray-500">No items found in order.</div>
								)}
							</div>

							{/* Prompt user to select Help Me Buy Pack to enable delivery */}
							{orderData && Array.isArray(orderData.items) && orderData.items.length > 0 && !selected.includes('Help Me Buy Pack') && (
								<div className="mt-4 mb-4 p-3 rounded border-l-4 border-amber-400 bg-amber-50 text-amber-800 flex items-start justify-between">
									<div>
										<strong>Note:</strong> You need to select the <strong>Help Me Buy Pack</strong> service to have your items purchased and delivered.
									</div>
									<div>
										<button type="button" onClick={() => {
											setSelected((prev) => prev.includes('Help Me Buy Pack') ? prev : prev.concat(['Help Me Buy Pack']));
											const partner = stores.find((n) => n && n.toLowerCase().includes('chijohnz'));
											if (partner) setSelectedStore(partner);
											try { toast.success('Help Me Buy Pack selected'); playProductAddedSound('https://res.cloudinary.com/dnitzkowt/video/upload/v1766339273/new-notification-3-398649_pxhiar.mp3'); } catch (e) { console.debug(e); }
										}} className="px-3 py-1 bg-amber-600 text-white rounded">Select Help Me Buy Pack</button>
									</div>
								</div>
							)}
							<div className="mt-4 text-sm">
								<div className="flex justify-between"><span>Items total</span><span>₦{itemsTotalFromOrder.toLocaleString('en-NG')}</span></div>
								<div className="flex justify-between"><span>Selected services total</span><span>₦{servicesTotalFromSelected.toLocaleString('en-NG')}</span></div>
								<div className="mt-2 font-semibold flex justify-between"><span>Grand total</span><span>₦{displayedGrandTotal.toLocaleString('en-NG')}</span></div>
								<p className="mt-2 text-xs text-gray-500">Delivery average time: <strong>1hr</strong>.</p>
							</div>
						</div>
					)}

					{loadingServices ? (
						<div className="p-6">Loading services...</div>
					) : fetchError ? (
						<div className="p-6 text-center text-red-600">
							<div className="mb-2">Failed to load services: {fetchError}</div>
							<div>
								<button
									onClick={() => {
										setLoadingServices(true);
										setFetchError(null);
										window.location.reload();
									}}
									className="px-4 py-2 bg-emerald-600 text-white rounded"
								>Retry</button>
							</div>
						</div>
					) : services.length === 0 ? (
						<div className="p-6 text-center text-gray-500">No services available right now. Please try again later.</div>
					) : (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
								{services.map((svc) => (
									<button
										type="button"
										key={svc._id || svc.name}
										onClick={(e) => {
													const rect = e.currentTarget.getBoundingClientRect();
													const pageX = rect.left + rect.width / 2;
													const pageY = rect.top + rect.height / 2;
													const id = Date.now() + Math.random();
													setSplashes((s) => s.concat([{ id, svcKey: svc._id || svc.name, pageX, pageY }]));

													// toggle service selection (multi-select)
													setSelected((prev) => {
														const exists = prev.includes(svc.name);
														const next = exists ? prev.filter((p) => p !== svc.name) : prev.concat([svc.name]);
														try { toast.success(`${svc.name} ${exists ? 'removed' : 'selected'}`); playProductAddedSound(); } catch (e) { console.debug('Selection notification failed', e); }
														return next;
													});

													if (svc.name === 'Help Me Buy Pack') {
														const partner = stores.find((n) => n && n.toLowerCase().includes('chijohnz'));
														if (partner) setSelectedStore(partner);
														else if (stores.length) setSelectedStore(stores[0]);
													}
												}}
												className={`relative overflow-visible text-left p-4 rounded-lg border transform transition-shadow ${selected.includes(svc.name) ? 'shadow-lg border-emerald-500 bg-emerald-50' : 'hover:shadow-sm'}`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="flex-none">
													<ServiceIcon name={svc.name} className="w-6 h-6 text-emerald-600" />
												</div>
												<div className="font-semibold">{svc.name}</div>
											</div>
											<div className="font-medium text-lime-600">₦{(svc.price || 0).toLocaleString('en-NG')}</div>
										</div>
										<div className="mt-2 text-sm text-gray-600">{svc.description || ''}</div>
									</button>
								))}
							</div>

							{splashes.map((sp) => (
								<Splash key={sp.id} x={sp.pageX} y={sp.pageY} onComplete={() => setSplashes((s) => s.filter((it) => it.id !== sp.id))} />
							))}
						</>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<Input name="name" placeholder="Full name" value={formData.name} onChange={handleChange} required />
							<Input name="phone" placeholder="Phone (e.g. +2348012345678)" value={formData.phone} onChange={handleChange} required />
						</div>

						{selected.includes('Help Me Buy Pack') && (
							<div>
								<label className="block text-sm font-medium mb-1">Select Store</label>
								<select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="w-full rounded border px-3 py-2">
									{stores.length ? stores.map((s) => (<option key={s} value={s}>{s}</option>)) : <option value="">No stores available</option>}
								</select>
								<div className="text-xs text-gray-500 mt-1">Store is required for Help Me Buy orders.</div>
								<div className="mt-2 text-sm text-emerald-700">We partner with <strong>Chijohnz's Supermarket</strong> — only groceries from their stores are sold online.</div>
							</div>
						)}

						<Input name="date" type="date" value={formData.date} onChange={handleChange} />
						<Textarea name="notes" placeholder="Additional notes (optional)" value={formData.notes} onChange={handleChange} />

						<div className="flex items-center gap-3">
							<Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Book Now'}</Button>
							<div className="text-sm text-gray-600">{selected && selected.length ? `Selected: ${selected.join(', ')}` : 'No service selected'}</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
