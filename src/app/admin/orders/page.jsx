"use client";

import React, { useEffect, useState } from "react";
import ServiceIcon from '@/components/ServiceIcon';

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminOrdersPage() {
	const [orders, setOrders] = useState([]);
	const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchPage(1);
	}, []);

	async function fetchPage(page = 1) {
		setLoading(true);
		try {
			const res = await fetch(`${apiBase}/api/bookings?page=${page}&limit=20`);
			if (!res.ok) throw new Error('Failed to load orders');
			const j = await res.json();
			setOrders(j.bookings || []);
			setMeta(j.meta || {});
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="p-6">
			<h1 className=" font-semibold mb-4">Orders</h1>
			{loading ? (
				<div>Loading...</div>
			) : (
				<div className="space-y-4">
					<div className="overflow-x-auto rounded shadow">
						<table className="min-w-full ">
							<thead>
								<tr className="">
									<th className="px-4 py-2">CID</th>
									<th className="px-4 py-2">Customer</th>
									<th className="px-4 py-2">Phone</th>
									<th className="px-4 py-2">Service</th>
									<th className="px-4 py-2">Store</th>
									<th className="px-4 py-2">Status</th>
									<th className="px-4 py-2">Created</th>
								</tr>
							</thead>
							<tbody>
								{orders.map((o) => (
									<tr key={o._id} className=" ">
										<td className="px-4 py-2">{o._id}</td>
										<td className="px-4 py-2">{o.customer?.name || o.customerName || '-'}</td>
										<td className="px-4 py-2">{o.customer?.phone || o.customerPhone || '-'}</td>
										<td className="px-4 py-2">
											<div className="flex items-center gap-2">
												<ServiceIcon name={o.service} className="w-4 h-4" />
												<span className="truncate">{o.service}</span>
											</div>
										</td>
										<td className="px-4 py-2">{o.store || o.lodge || '-'}</td>
										<td className="px-4 py-2">{o.status}</td>
										<td className="px-4 py-2">{new Date(o.createdAt).toLocaleString()}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="flex items-center justify-between">
						<div>Showing page {meta.page} of {meta.pages} — {meta.total} orders</div>
						<div className="flex gap-2">
							<button disabled={meta.page <= 1} onClick={() => fetchPage(meta.page - 1)} className="px-3 py-1 rounded border">Prev</button>
							<button disabled={meta.page >= meta.pages} onClick={() => fetchPage(meta.page + 1)} className="px-3 py-1 rounded border">Next</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
