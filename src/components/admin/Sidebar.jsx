"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function Sidebar({ className = "" }) {
	const [open, setOpen] = useState(false);

	// Desktop top bar (visible >= md)
	const DesktopSidebar = (
		<header className={`w-full card p-3 rounded shadow ${className} hidden md:block`}>
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link href="/" className="hover:underline whitespace-nowrap">← Home</Link>
					<div className="hidden md:flex items-center gap-2 text-sm">
						<span className="font-semibold">Admin</span>
						<span className="opacity-70">Dashboard</span>
					</div>
				</div>
				<nav className="flex items-center flex-wrap gap-2">
					<Link href="/admin/dashboard" className="px-3 py-2 rounded">Dashboard</Link>
					<Link href="/admin/bookings" className="px-3 py-2 rounded">Bookings</Link>
					<Link href="/admin/stores" className="px-3 py-2 rounded">Store Management</Link>
					<Link href="/admin/services" className="px-3 py-2 rounded">Services Management</Link>
					<Link href="/admin/settings" className="px-3 py-2 rounded">Settings</Link>
					<Link href="/admin/login" className="px-3 py-2 rounded">Logout</Link>
				</nav>
			</div>
		</header>
	);

	// Mobile drawer
	const MobileDrawer = (
		<>
			{/* Hamburger button visible only on small screens */}
			<button
				aria-label="Open sidebar"
				className="md:hidden inline-flex items-center justify-center p-2 rounded shadow"
				onClick={() => setOpen(true)}
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>

			{/* Drawer overlay */}
			{open && (
				<div className="fixed inset-0 z-50 flex">
					<div className="fixed inset-0" onClick={() => setOpen(false)} />

					<aside className="relative w-72 max-w-full p-4 shadow ml-0 bg-white">
						<div className="flex items-center justify-between mb-4">
							<div>
								<Link href="/" className="hover:underline">
									← Home
								</Link>
							</div>
							<button aria-label="Close sidebar" onClick={() => setOpen(false)} className="p-1">
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>
						</div>

						<div className="mb-6">
							<div className="font-semibold">Admin</div>
							<div>Dashboard</div>
						</div>

						<nav className="flex flex-col gap-2">
							<Link href="/admin/dashboard" className="px-3 py-2 rounded">
								Dashboard
							</Link>
							<Link href="/admin/bookings" className="px-3 py-2 rounded">
								Bookings
							</Link>
							<Link href="/admin/stores" className="px-3 py-2 rounded">
								Store Management
							</Link>
							<Link href="/admin/services" className="px-3 py-2 rounded">
								Services Management
							</Link>
							<Link href="/admin/settings" className="px-3 py-2 rounded">
								Settings
							</Link>
							<Link href="/admin/login" className="px-3 py-2 rounded">
								Logout
							</Link>
						</nav>
					</aside>
				</div>
			)}
		</>
	);

	return (
		<div className="flex items-start gap-4">
			{MobileDrawer}
			{DesktopSidebar}
		</div>
	);
}
