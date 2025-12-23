"use client";
import React from 'react';
import Sidebar from '@/components/admin/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePathname } from 'next/navigation';

export default function AdminLayoutClient({ children }) {
	const pathname = usePathname();
	const isLoginPage = pathname.startsWith('/admin/login');

	const content = (
		<div className="min-h-screen">
			<div className="max-w-6xl mx-auto px-4 py-6">
				{!isLoginPage && <Sidebar />}
				<div className="mt-4">{children}</div>
			</div>
		</div>
	);

	if (isLoginPage) return content;

	return (
		<ProtectedRoute redirectTo="/admin/login">
			{content}
		</ProtectedRoute>
	);
}
