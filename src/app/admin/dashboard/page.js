"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import RevenueChart from '@/components/admin/RevenueChart';

const RevenueCard = dynamic(() => import('@/components/admin/RevenueCard'), { ssr: false });

export default function DashboardPage() {
	return (
		<section className="w-full">
			<header className="flex items-center justify-between mb-4">
				<h1 className="text-lg font-semibold">Dashboard</h1>
				<a href="/" className="underline-offset-2 hover:underline">Home</a>
			</header>

			<p className="mb-6 text-sm">Use the sidebar to manage bookings, stores, and services.</p>

			<div className="space-y-4">
				{/* Quick Actions */}
				<div className="card p-4 rounded">
					<h3 className="font-medium">Quick Actions</h3>
					<ul className="mt-3 space-y-2 text-sm">
						<li><a className="underline-offset-2 hover:underline" href="/admin/bookings">Bookings</a></li>
						<li><a className="underline-offset-2 hover:underline" href="/admin/stores">Store Management</a></li>
						<li><a className="underline-offset-2 hover:underline" href="/admin/services">Services Management</a></li>
					</ul>
				</div>

				{/* Recent Activity */}
				<div className="card p-4 rounded">
					<h3 className="font-medium">Recent Activity</h3>
					<div className="mt-2 text-sm">No activity yet.</div>
				</div>

				{/* Revenue */}
				<div className="card p-4 rounded">
					<h3 className="font-medium">Revenue</h3>
					<div className="mt-3">
						<RevenueCard />
						<div className="mt-6">
							<RevenueChart />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
