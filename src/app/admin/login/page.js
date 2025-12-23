"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import posthog from 'posthog-js';

export default function AdminLoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const router = useRouter();
	const { login } = useAuth();

	async function submit(e) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		// Track login attempt
		posthog.capture('admin_login_attempted', {
			username: username,
		});

		try {
			const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
			const res = await fetch(`${apiBase}/api/admin/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
				credentials: 'include',
			});
			if (!res.ok) {
				// Try to extract a helpful error message from the response
				let msg = `Login failed (HTTP ${res.status})`;
				try {
					const ctype = res.headers.get('content-type') || '';
					if (ctype.includes('application/json')) {
						const body = await res.json();
						msg = body.error || body.message || msg;
					} else {
						const text = await res.text();
						msg = text?.slice(0, 300) || msg;
					}
				} catch {}

				// Track login failure
				posthog.capture('admin_login_failed', {
					username: username,
					error_message: msg,
					http_status: res.status,
				});

				throw new Error(msg);
			}
			// If API returns a token, sync it with AuthContext so ProtectedRoute lets us in
			try {
				const ctype = res.headers.get('content-type') || '';
				let tokenFromResponse = null;
				if (ctype.includes('application/json')) {
					const data = await res.json().catch(() => ({}));
					tokenFromResponse = data?.token || null;
				}
				if (typeof window !== 'undefined') {
					if (tokenFromResponse) {
						localStorage.setItem('adminToken', tokenFromResponse);
					}
					const finalToken = tokenFromResponse || localStorage.getItem('adminToken');
					if (finalToken) {
						login(finalToken);
					}
				}
			} catch {}

			// Identify the admin user and track successful login
			posthog.identify(username, {
				username: username,
				role: 'admin',
			});
			posthog.capture('admin_login_success', {
				username: username,
			});

			router.push('/admin/dashboard');
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-md rounded shadow p-6">
				<h2 className="font-semibold mb-4">Admin Login</h2>
				<form onSubmit={submit} className="space-y-4">
					<div>
						<label className="block font-medium">Username</label>
						<input className="w-full rounded border px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} />
					</div>
					<div>
						<label className="block font-medium">Password</label>
						<input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
					</div>
					{error && <div className="text-red-600 text-sm">{error}</div>}
					<div className="flex justify-end">
						<button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white" disabled={loading}>
							{loading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
