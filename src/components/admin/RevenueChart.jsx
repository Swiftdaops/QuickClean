"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function RevenueChart({ className = "" }) {
	const [loading, setLoading] = useState(true);
	const [items, setItems] = useState([]);

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
				const res = await fetch(`${apiBase}/api/bookings/admin?status=completed&limit=1000`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
					credentials: token ? "omit" : "include",
				});
				if (res.status === 401) {
					toast.error("Unauthorized — login as admin to view revenue chart");
					setItems([]);
				} else if (!res.ok) {
					throw new Error("Failed to load bookings");
				} else {
					const j = await res.json();
					setItems(j.bookings || []);
				}
			} catch (err) {
				console.error(err);
				toast.error(err.message || "Failed to load revenue chart");
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const data = useMemo(() => {
		const map = new Map();
		for (const it of items) {
			const d = new Date(it.createdAt);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			const price = Number(it.price) || 0;
			map.set(key, (map.get(key) || 0) + price);
		}
		return Array.from(map.entries())
			.map(([date, total]) => ({ date, total }))
			.sort((a, b) => (a.date < b.date ? -1 : 1));
	}, [items]);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Revenue (last periods)</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div>Loading chart…</div>
				) : data.length === 0 ? (
					<div>No data.</div>
				) : (
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
								<defs>
									<linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
										<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
								<XAxis dataKey="date" tick={{ fontSize: 12 }} />
								<YAxis tickFormatter={(v) => `₦${v}`} tick={{ fontSize: 12 }} />
								<Tooltip formatter={(v) => [`₦${Number(v).toLocaleString('en-NG')}`, 'Total']} />
								<Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#revFill)" />
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
