"use client";

import { useEffect, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminServicesPage() {
	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [editingService, setEditingService] = useState(null);
	const [form, setForm] = useState({
		name: "",
		price: "",
		description: "",
		isActive: true,
		icon: "",
	});

	useEffect(() => {
		let mounted = true;
		async function load() {
			try {
				const res = await fetch(`${apiBase}/api/services`, { credentials: "include" });
				if (!mounted) return;
				if (!res.ok) {
					setError(`Failed to load services (${res.status})`);
					setServices([]);
					setLoading(false);
					return;
				}
				const data = await res.json().catch(() => []);
				setServices(Array.isArray(data) ? data : []);
				setLoading(false);
			} catch (err) {
				console.error("Failed to load services", err);
				setError("Could not load services. Check API and auth.");
				setServices([]);
				setLoading(false);
			}
		}
		load();
		return () => {
			mounted = false;
		};
	}, []);

	const openEdit = (service) => {
		setEditingService(service || {});
		setForm({
			name: service?.name || "",
			price: service?.price || "",
			description: service?.description || "",
			isActive: service?.isActive ?? true,
			icon: service?.icon || "",
		});
	};

	const closeEdit = () => {
		setEditingService(null);
		setForm({ name: "", price: "", description: "", isActive: true });
	};

	const handleSubmit = async () => {
		const isEdit = editingService && editingService._id;
		const method = isEdit ? "PATCH" : "POST";
		const url = isEdit
			? `${apiBase}/api/services/${editingService._id}`
			: `${apiBase}/api/services`;
		try {
			const res = await fetch(url, {
				method,
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			if (!res.ok) throw new Error("Request failed");

			const updated = await fetch(`${apiBase}/api/services`, { credentials: "include" })
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []);
			setServices(Array.isArray(updated) ? updated : []);
			closeEdit();
			setError("");
		} catch (err) {
			console.error("Failed to save service", err);
			setError("Save failed. Please try again.");
		}
	};

	const toggleStatus = async (service) => {
		try {
			await fetch(`${apiBase}/api/services/${service._id}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: !service.isActive }),
			});
		} catch (err) {
			console.error("Failed to toggle service status", err);
		}
		setServices((prev) =>
			prev.map((s) => (s._id === service._id ? { ...s, isActive: !s.isActive } : s))
		);
	};

	return (
		<section className="p-6 max-w-6xl mx-auto min-h-screen">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-xl font-bold">Services Management</h1>
				<button
					onClick={() => openEdit({})}
					className="px-5 py-2 rounded-lg font-semibold border"
				>
					+ Add Service
				</button>
			</div>

			{loading ? (
				<p>Loading services...</p>
			) : error ? (
				<div className="rounded border p-4">
					<p className="mb-2">{error}</p>
					<button
						className="px-3 py-1 rounded border"
						onClick={() => {
							setLoading(true);
							setError("");
							// trigger reload
							(async () => {
								try {
									const res = await fetch(`${apiBase}/api/services`, { credentials: "include" });
									if (!res.ok) throw new Error("reload failed");
									const j = await res.json().catch(() => []);
									setServices(Array.isArray(j) ? j : []);
								} catch (e) {
									setServices([]);
								} finally {
									setLoading(false);
								}
							})();
						}}
					>
						Retry
					</button>
				</div>
			) : services.length === 0 ? (
				<div className="rounded border p-4">No services found.</div>
			) : (
				<div className="overflow-x-auto border rounded-xl">
					<table className="w-full">
						<thead>
							<tr>
								<th className="p-3 text-left">Name</th>
								<th className="p-3 text-left">Icon</th>
								<th className="p-3 text-left">Price (₦)</th>
								<th className="p-3 text-left">Status</th>
								<th className="p-3 text-left">Actions</th>
							</tr>
						</thead>
						<tbody>
							{services.map((service) => (
								<tr key={service._id}>
										<td className="p-3 font-medium">{service.name}</td>
										<td className="p-3">{service.icon || '—'}</td>
										<td className="p-3">₦{Number(service.price || 0).toLocaleString()}</td>
									<td className="p-3">
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												service.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"
											}`}
										>
											{service.isActive ? "Active" : "Inactive"}
										</span>
									</td>
									<td className="p-3">
										<div className="flex gap-3">
											<button
												onClick={() => openEdit(service)}
												className="underline"
											>
												Edit
											</button>
											<button onClick={() => toggleStatus(service)} className="underline">
												Toggle
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{editingService && (
				<div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
					<div className="bg-white rounded-xl p-6 w-full max-w-md">
						<h2 className="text-lg font-bold mb-4">
							{editingService._id ? "Edit Service" : "Add Service"}
						</h2>

						<div className="space-y-3">
							<input
								placeholder="Service name"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								className="w-full border rounded-lg p-3"
							/>
							<input
								type="number"
								placeholder="Price (NGN)"
								value={form.price}
								onChange={(e) => setForm({ ...form, price: e.target.value })}
								className="w-full border rounded-lg p-3"
							/>
							<input
								placeholder="Icon (e.g. MdCleaningServices)"
								value={form.icon}
								onChange={(e) => setForm({ ...form, icon: e.target.value })}
								className="w-full border rounded-lg p-3"
							/>
							<textarea
								placeholder="Description (optional)"
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="w-full border rounded-lg p-3"
							/>
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={form.isActive}
									onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
								/>
								Service is active
							</label>
						</div>

						<div className="flex justify-end gap-3 mt-6">
							<button onClick={closeEdit} className="px-4 py-2 border rounded-lg">
								Cancel
							</button>
							<button onClick={handleSubmit} className="px-4 py-2 rounded-lg font-semibold border">
								Save
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
