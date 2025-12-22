"use client";
import React from 'react';
import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayoutClient({ children }) {
	return (
		<div className="min-h-screen">
			<div className="max-w-6xl mx-auto px-4 py-6">
				<Sidebar />
				<div className="mt-4">{children}</div>
			</div>
		</div>
	);
}
