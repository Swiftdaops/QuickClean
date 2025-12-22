"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RevenueCard({ className = '' }) {
	const [loading, setLoading] = useState(true);
	const [revenue, setRevenue] = useState(0);
	const [count, setCount] = useState(0);

	useEffect(() => {
		load();
	}, []);

	async function load() {
		setLoading(true);
		try {
			const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
			const res = await fetch(`${apiBase}/api/bookings/admin?status=completed&limit=1000`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				credentials: token ? 'omit' : 'include',
			});
			if (res.status === 401) {
				toast.error('Unauthorized — login as admin to view revenue');
				setLoading(false);
				return;
			}
			if (!res.ok) throw new Error('Failed to load bookings');
			const j = await res.json();
			const items = j.bookings || [];
			const total = items.reduce((s, it) => s + (Number(it.price) || 0), 0);
			setCount(items.length);
			setRevenue(total);
		} catch (err) {
			console.error(err);
			toast.error(err.message || 'Failed to load revenue');
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Revenue</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div>Loading revenue…</div>
				) : count === 0 ? (
					<div>No data.</div>
				) : (
					<>
						<div className="mb-2">Total from completed services</div>
						<div className="flex items-baseline gap-4">
							<div className="font-bold">₦{revenue.toLocaleString('en-NG')}</div>
							<div className="">from <strong>{count}</strong> completed bookings</div>
						</div>
						<div className="mt-3">Last updated: {new Date().toLocaleString()}</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
