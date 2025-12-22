"use client";

import { useState } from "react";
import { Modal, Button, Input, Textarea } from "@/components/ui";
import { toast } from "@/components/ui/sonner";
import { playProductAddedSound } from "@/lib/sound";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function EditProduct({ product, onClose, onUpdate }) {
	const [formData, setFormData] = useState({
		name: product?.name || "",
		price: product?.price || 0,
		description: product?.description || "",
	});
	const [imagePreview, setImagePreview] = useState(product?.image || "");
	const [uploading, setUploading] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "number" ? Number(value) : value,
		}));
	};

	const handleFileChange = async (e) => {
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		setImagePreview(URL.createObjectURL(file));
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch(`${apiBase}/api/upload`, { method: "POST", body: fd });
			if (!res.ok) throw new Error("Upload failed");
			const body = await res.json();
			if (body.url) {
				setFormData((p) => ({ ...p, image: body.url }));
				setImagePreview(body.url);
			}
		} catch (err) {
			toast.error(err.message || "Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await fetch(`${apiBase}/api/products/${product._id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					name: formData.name,
					price: Number(formData.price),
					description: formData.description,
				}),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || body.message || "Failed to update product");
			}
			const updatedProduct = await res.json();
			onUpdate(updatedProduct);
			toast.success("Product updated successfully!");
			try {
				playProductAddedSound();
			} catch (e) {
				console.debug(e);
			}
			onClose();
		} catch (err) {
			toast.error(err.message || String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal open={true} onOpenChange={onClose}>
			<div className=" rounded-xl shadow-xl p-6 w-full max-w-md mx-auto">
				<h2 className=" font-semibold mb-4">Edit Product</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					{imagePreview && (
						<div className="w-full overflow-hidden rounded mb-2" style={{ aspectRatio: "3/4" }}>
							<img src={imagePreview} alt={formData.name} className="w-full h-full object-cover" />
						</div>
					)}
					<div>
						<label className="block mb-1">Product Image</label>
						<input type="file" accept="image/*" onChange={handleFileChange} />
						{uploading && <div className=" ">Uploading...</div>}
					</div>
					<Input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" required />
					<Input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" required />
					<Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" />
					<div className="flex justify-end gap-2">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Updating..." : "Update"}
						</Button>
					</div>
				</form>
			</div>
		</Modal>
	);
}
