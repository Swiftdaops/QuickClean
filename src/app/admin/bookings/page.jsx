"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/sonner";
import authFetch from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminBookingsPage() {
	const router = useRouter();
	
	const [isAdmin, setIsAdmin] = useState(true);
	const [meta, setMeta] = useState({ page: 1, pages: 0, total: 0 });
	const [loading, setLoading] = useState(true);
	// removed diagnostic lastFetchInfo/lastFetchedAt
	const [searchTerm, setSearchTerm] = useState('');
	const [expandedKey, setExpandedKey] = useState(null);
	const [rawBookings, setRawBookings] = useState([]);
	const [groups, setGroups] = useState([]);

	useEffect(() => {
		fetchPage(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function fetchPage(page = 1) {
		setLoading(true);
		try {
			let res;
			try {
				res = await authFetch(`${apiBase}/api/bookings/admin?page=${page}&limit=20`);
			} catch (e) {
				// network or fetch-level error (CORS, network down, etc.)
				console.error('Network error fetching admin bookings:', e);
				throw e;
			}
			if (!res) {
				throw new Error('No response from authFetch');
			}
			if (res.status === 401) {
				// not authenticated as admin -> fall back to public bookings
				setIsAdmin(false);
				const pub = await fetch(`${apiBase}/api/bookings?page=${page}&limit=20`);
				if (!pub.ok) throw new Error("Failed to load public bookings");
				const pj = await pub.json();
				const list = (pj.bookings || []).slice().sort((a, b) => {
					const ta = new Date(a.createdAt).getTime();
					const tb = new Date(b.createdAt).getTime();
					return tb - ta; // newest first
				});
				setRawBookings(list);
				setMeta(pj.meta || {});
				setGroups(groupBookings(list));
				return;
			}
			if (!res.ok) throw new Error("Failed to load bookings");
			const j = await res.json();
			// successful admin response
			const list = (j.bookings || []).slice().sort((a, b) => {
				const ta = new Date(a.createdAt).getTime();
				const tb = new Date(b.createdAt).getTime();
				return tb - ta; // newest first
			});
			setRawBookings(list);
			setMeta(j.meta || {});
			setGroups(groupBookings(list));
			// no diagnostics state to set
		} catch (err) {
			toast.error(err.message || "Failed to load bookings");
		} finally {
			setLoading(false);
		}
	}

	const statuses = ["pending", "assigned", "in-progress", "completed", "cancelled"];

	function computeBookingTotal(b) {
		// Prefer explicit orderSummary.total, fall back to summing item subtotals or known total fields
		if (!b) return 0;
		const osTotal = Number(b?.orderSummary?.total ?? NaN);
		if (!Number.isNaN(osTotal)) return osTotal || 0;
		// Sum orderSummary.items if present
		const osItems = b?.orderSummary?.items;
		if (Array.isArray(osItems) && osItems.length) {
			return osItems.reduce((s, it) => s + (Number(it?.subtotal ?? (it?.qty ? Number(it?.qty) * Number(it?.unitPrice ?? it?.price ?? 0) : Number(it?.unitPrice ?? it?.price ?? 0))) || 0), 0);
		}
		// Fall back to b.total or items array
		if (b?.total != null) return Number(b.total) || 0;
		const items = b?.items;
		if (Array.isArray(items) && items.length) {
			return items.reduce((s, it) => s + (Number(it?.subtotal ?? (it?.qty ? Number(it?.qty) * Number(it?.unitPrice ?? it?.price ?? 0) : Number(it?.unitPrice ?? it?.price ?? 0))) || 0), 0);
		}
		return Number(b?.itemsTotal ?? 0) || 0;
	}

	async function handleDeleteBooking(id) {
		const ok = confirm('Delete booking? This cannot be undone.');
		if (!ok) return;
		try {
			const del = await authFetch(`${apiBase}/api/bookings/admin/${id}`, { method: 'DELETE' });
			if (del.status === 401) { setIsAdmin(false); toast.error('Unauthorized — please login as admin'); return; }
			const dj = await del.json().catch(() => ({}));
			if (!del.ok) throw new Error(dj.error || 'Could not delete booking');
			setRawBookings((prev) => {
				const updated = prev.filter((it) => it._id !== id);
				setGroups(groupBookings(updated));
				return updated;
			});
			toast.success('Booking deleted');
		} catch (err) { console.error(err); toast.error(err.message || 'Delete failed'); }
	}

	async function handleEditBooking(b) {
		if (!isAdmin) { toast.error('Login as admin to edit'); return; }
		try {
			const newNotes = window.prompt('Edit notes', b.notes || '');
			if (newNotes === null) return;
			const newDate = window.prompt('Edit date (YYYY-MM-DD)', b.date ? new Date(b.date).toISOString().slice(0,10) : '');
			const payload = { notes: newNotes, date: newDate || undefined };
			const res = await authFetch(`${apiBase}/api/bookings/admin/${b._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			if (res.status === 401) { setIsAdmin(false); toast.error('Unauthorized — please login as admin'); return; }
			const rj = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(rj.error || 'Could not update booking');
			setRawBookings((prev) => {
				const updated = prev.map((it) => it._id === b._id ? (rj.booking || { ...it, ...payload }) : it);
				setGroups(groupBookings(updated));
				return updated;
			});
			toast.success('Booking updated');
		} catch (err) { console.error(err); toast.error(err.message || 'Update failed'); }
	}

	function normalizePhone(p) {
		if (!p) return '';
		return String(p).replace(/\D/g, '');
	}

	function groupBookings(list) {
		const map = Object.create(null);
		(list || []).forEach((b) => {
			const cid = b?.customer?.cid || b.customerCid || b?.customer?._id || b.cid || null;
			const phone = normalizePhone(b?.customer?.phone || b.customerPhone || b.phone || '');
			const key = cid || phone || (b._id || 'unknown');
			if (!map[key]) {
				map[key] = {
					key,
					cid: cid || null,
					phone: phone || null,
					name: b?.customer?.name || b.customerName || '-',
					ordersCount: 0,
					totalSpent: 0,
					lastOrderAt: null,
					bookings: [],
				};
			}
			const g = map[key];
			const t = computeBookingTotal(b) || 0;
			g.ordersCount += 1;
			g.totalSpent += t;
			const created = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			if (!g.lastOrderAt || created > g.lastOrderAt) g.lastOrderAt = created;
			g.bookings.push(b);
		});
		const arr = Object.keys(map).map((k) => {
			const x = map[k];
			return { ...x, totalSpent: Number(x.totalSpent) };
		});
		// sort groups by lastOrderAt desc
		arr.sort((a, b) => (b.lastOrderAt || 0) - (a.lastOrderAt || 0));
		return arr;
	}

	async function updateStatus(id, newStatus) {
		if (!isAdmin) {
			toast.error("You must be logged in as admin to change status");
			return;
		}
		try {
			const res = await authFetch(`${apiBase}/api/bookings/admin/${id}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (res.status === 401) {
				setIsAdmin(false);
				toast.error("Unauthorized — please login as admin");
				return;
			}
			const j = await res.json();
			if (!res.ok) throw new Error(j.error || "Could not update status");
			setRawBookings((prev) => {
				const updated = prev.map((it) => (it._id === id ? (j.booking || it) : it));
				setGroups(groupBookings(updated));
				return updated;
			});
			toast.success("Status updated");
		} catch (err) {
			console.error(err);
			toast.error(err.message || "Failed to update status");
		}
	}

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-4">
				<h1 className=" font-semibold">Bookings</h1>
				<button
					onClick={() => fetchPage(1)}
					className="px-3 py-2 rounded border"
					disabled={loading}
				>
					{loading ? 'Refreshing…' : 'Refresh'}
			</button>
		</div>

		{isAdmin ? (
			<div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">Viewing as <strong>Admin</strong></div>
		) : (
			<div className="mb-4 p-3 rounded bg-amber-50 text-amber-800 border border-amber-100">
				Not authenticated as admin — showing <strong>public</strong> bookings. <a href="/admin/login" className="underline ml-2">Sign in</a> to manage bookings.
			</div>
		)}
		{/* animated loading indicator */}
		<AnimatePresence>
			{loading && (
				<motion.div
					initial={{ opacity: 0, y: -6 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -6 }}
					className="mb-4"
				>
					<div className="p-4 rounded bg-white shadow text-sm">Loading bookings…</div>
				</motion.div>
			)}
		</AnimatePresence>
		<div>
					{/* Desktop table */}
					<div className="hidden md:block">
						<Card className="">
							<CardHeader>
								<CardTitle>All Bookings</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="min-w-full ">
										<thead>
											<tr className="">
												<th className="px-4 py-2">ID</th>
												<th className="px-4 py-2">Customer</th>
												<th className="px-4 py-2">Phone</th>
												<th className="px-4 py-2">Service</th>
												<th className="px-4 py-2">Actions</th>
												<th className="px-4 py-2">Store</th>
												<th className="px-4 py-2">Status</th>
												<th className="px-4 py-2">Created</th>
											</tr>
										</thead>
										<tbody>
											{groups
												.filter((g) => {
													const q = searchTerm.trim().toLowerCase();
													if (!q) return true;
													return (
														String(g.cid || '').toLowerCase().includes(q) ||
														(String(g.phone || '')).toLowerCase().includes(q) ||
														(String(g.name || '')).toLowerCase().includes(q) ||
														String(g.ordersCount || '').toLowerCase().includes(q) ||
														String(g.totalSpent || '').toLowerCase().includes(q)
													);
												})
												.map((g) => (
													<React.Fragment key={g.key}>
														<tr className="">
															<td className="px-4 py-2">{g.cid || (g.bookings[0]?._id || '').slice(0,8)}</td>
															<td className="px-4 py-2">{g.name}</td>
															<td className="px-4 py-2">{g.phone || '-'}</td>
															<td className="px-4 py-2">{g.ordersCount}</td>
															<td className="px-4 py-2">₦{Number(g.totalSpent || 0).toLocaleString('en-NG')}</td>
															<td className="px-4 py-2">{g.bookings[0]?.service || '-'}</td>
															<td className="px-4 py-2">{g.bookings[0]?.store || '-'}</td>
															<td className="px-4 py-2">{g.lastOrderAt ? new Date(g.lastOrderAt).toLocaleString() : '-'}</td>
															<td className="px-4 py-2">
																<button
																	className="px-2 py-1 border rounded"
																	onClick={() => setExpandedKey(expandedKey === g.key ? null : g.key)}
																>
																	{expandedKey === g.key ? 'Collapse' : 'Expand'}
																</button>
															</td>
														</tr>

														{expandedKey === g.key && (
															<tr>
																<td colSpan={9} className="p-4 bg-gray-50">
																	<div className="space-y-2">
																		<AnimatePresence initial={false} mode="popLayout">
											{g.bookings.map((b) => (
												<motion.div layout key={b._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="p-2 border rounded bg-white">
																				<div className="flex items-center justify-between">
																					<div>
																						<div className="font-semibold">{b.customer?.name || '-'}</div>
																						<div className="text-sm">{b.customer?.phone || '-'}</div>
																					</div>
																					<div className="text-sm">{new Date(b.createdAt).toLocaleString()}</div>
																				</div>

																				{/* Order totals / summary */}
																				<div className="mt-2">
																					<div className="text-sm">Order total: <strong>₦{Number(computeBookingTotal(b) || 0).toLocaleString('en-NG')}</strong></div>
																					{b.orderSummary ? (
																						<div className="text-xs text-slate-600 mt-1">
																							Subtotal: ₦{Number(b.orderSummary.subtotal || 0).toLocaleString('en-NG')} • Tax: ₦{Number(b.orderSummary.tax || 0).toLocaleString('en-NG')} • Shipping: ₦{Number(b.orderSummary.shipping || 0).toLocaleString('en-NG')} • Total: ₦{Number(b.orderSummary.total || 0).toLocaleString('en-NG')}
																						</div>
																					) : null}
																				</div>

																				<div className="mt-2 flex gap-2">
																					<select
																						value={b.status}
																						onChange={async (e) => await updateStatus(b._id, e.target.value)}
																						className="rounded-md border px-2 py-1"
																					>
																						{statuses.map((s) => (
																							<option key={s} value={s}>
																								{s.replaceAll ? s.replaceAll('-', ' ') : s.split('-').join(' ')}
																							</option>
																						))}
																					</select>

																						{((b.orderSummary && Array.isArray(b.orderSummary.items) && b.orderSummary.items.length) || (Array.isArray(b.items) && b.items.length)) ? (
																							<div className="w-full">
																								<div className="text-sm font-medium">Items ordered</div>
																								<ul className="list-disc ml-5 text-sm">
																								{(b.orderSummary?.items || b.items || []).map((it, idx) => (
																									<li key={it._id || it.productId || idx}>
																										{it.name || it.title || it.productName || 'Item'} — {it.qty ?? 1} × ₦{Number(it.unitPrice ?? it.price ?? it.subtotal ?? 0).toLocaleString('en-NG')}{it.subtotal ? ` (₦${Number(it.subtotal).toLocaleString('en-NG')})` : ''}
																									</li>
																								))}
																								</ul>
																							</div>
																						) : null}




																					<button onClick={() => handleDeleteBooking(b._id)}>Delete</button>
																					<button onClick={() => handleEditBooking(b)}>Edit</button>
																				</div>
												</motion.div>
											))}
											</AnimatePresence>
																	</div>
																</td>
															</tr>
														)}
													</React.Fragment>
												))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Mobile grouped list */}
					<div className="md:hidden space-y-3">
						{groups
							.filter((g) => {
								const q = searchTerm.trim().toLowerCase();
								if (!q) return true;
								return (
									String(g.cid || '').toLowerCase().includes(q) ||
									(String(g.phone || '')).toLowerCase().includes(q) ||
									(String(g.name || '')).toLowerCase().includes(q)
								);
							})
							.map((g) => (
									<motion.div layout key={g.key} className="p-3 rounded shadow-sm border" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
									<div className="flex justify-between items-start">
										<div>
											<div className=" font-semibold">{g.name || 'Unknown'}</div>
											<div className=" ">{g.phone || '-'}</div>
											<div className=" mt-2">Orders: {g.ordersCount}</div>
											<div className=" mt-1">Total purchased: <strong>₦{Number(g.totalSpent || 0).toLocaleString('en-NG')}</strong></div>
										</div>
										<div className=" text-sm text-slate-600">
											<div>Last merged on</div>
											<div className="font-medium">{g.lastOrderAt ? new Date(g.lastOrderAt).toLocaleString() : '-'}</div>
										</div>
									</div>

									{expandedKey === g.key ? (
										<div className="mt-3 space-y-2">
											{g.bookings.map((b) => (
												<motion.div layout key={b._id} className="p-2 rounded border bg-white" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
													<div className="flex justify-between">
														<div>
															<div className="font-semibold">{b.service}</div>
															<div className="text-sm">{b.store || ''}</div>
														</div>
														<div>
															<div className="text-sm">{new Date(b.createdAt).toLocaleString()}</div>
															<div className="text-sm mt-1">Order total: <strong>₦{Number(computeBookingTotal(b) || 0).toLocaleString('en-NG')}</strong></div>
															{b.orderSummary ? (
																<div className="text-xs text-slate-600 mt-1">
																	Subtotal: ₦{Number(b.orderSummary.subtotal || 0).toLocaleString('en-NG')} • Tax: ₦{Number(b.orderSummary.tax || 0).toLocaleString('en-NG')} • Shipping: ₦{Number(b.orderSummary.shipping || 0).toLocaleString('en-NG')}
																</div>
															) : null}
														</div>
													</div>

													<div className="mt-2 flex gap-2">
														<select
															value={b.status}
															onChange={async (e) => await updateStatus(b._id, e.target.value)}
															className="rounded-md border px-2 py-1"
														>
															{statuses.map((s) => (
																<option key={s} value={s}>
																	{s.replaceAll ? s.replaceAll('-', ' ') : s.split('-').join(' ')}
																</option>
															))}
														</select>

														{((b.orderSummary && Array.isArray(b.orderSummary.items) && b.orderSummary.items.length) || (Array.isArray(b.items) && b.items.length)) ? (
															<div className="w-full">
																<div className="text-sm font-medium">Items ordered</div>
																<ul className="list-disc ml-5 text-sm">
																{(b.orderSummary?.items || b.items || []).map((it, idx) => (
																	<li key={it._id || it.productId || idx}>
																		{it.name || it.title || it.productName || 'Item'} — {it.qty ?? 1} × ₦{Number(it.unitPrice ?? it.price ?? it.subtotal ?? 0).toLocaleString('en-NG')}{it.subtotal ? ` (₦${Number(it.subtotal).toLocaleString('en-NG')})` : ''}
																	</li>
																))}
																</ul>
															</div>
														) : null}
														<button onClick={() => handleDeleteBooking(b._id)}>Delete</button>
														<button onClick={() => handleEditBooking(b)}>Edit</button>
													</div>
												</motion.div>
											))}
										</div>
									) : (
										<div className="mt-3">
											<button className="px-2 py-1 border rounded" onClick={() => setExpandedKey(g.key)}>
												Show orders
											</button>
										</div>
									)}
								</motion.div>
							))}
					</div>

					<div className="flex items-center justify-between mt-4">
						<div>
							Page {meta.page} of {meta.pages} — {meta.total} bookings
						</div>
						<div className="flex gap-2">
							<Button
								disabled={meta.page <= 1}
								variant="outline"
								size="sm"
								onClick={() => fetchPage((meta.page || 1) - 1)}
							>
								Prev
							</Button>
							<Button
								disabled={meta.page >= meta.pages}
								variant="outline"
								size="sm"
								onClick={() => fetchPage((meta.page || 1) + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
		</div>
	);
}
