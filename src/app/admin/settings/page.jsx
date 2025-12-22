"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
	username: "",
	whatsapp: "",
  });

  useEffect(() => {
	let mounted = true;

	async function load() {
	  try {
		const res = await fetch(`${apiBase}/api/settings`, { credentials: "include" });
		if (!mounted) return;

		if (!res.ok) {
		  // No backend settings endpoint — show empty form but don't fail hard
		  setLoading(false);
		  return;
		}

		const json = await res.json();
		setSettings((s) => ({ ...s, ...json }));
	  } catch (err) {
		console.warn("Could not load settings from API", err);
	  } finally {
		if (mounted) setLoading(false);
	  }
	}

	load();

	return () => {
	  mounted = false;
	};
  }, []);

  function handleChange(e) {
	const { name, value } = e.target;
	setSettings((p) => ({ ...p, [name]: value }));
  }

  async function handleSave(e) {
	e.preventDefault();
	setSaving(true);

	try {
	  const res = await fetch(`${apiBase}/api/settings`, {
		method: "PATCH",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(settings),
	  });

	  if (!res.ok) {
		const txt = await res.text().catch(() => "Request failed");
		throw new Error(txt || "Failed to save settings");
	  }

	  toast.success("Settings saved");
	} catch (err) {
	  console.error("Failed to save settings", err);
	  toast.error(err?.message || "Failed to save settings");
	} finally {
	  setSaving(false);
	}
  }

  return (
	<div className="p-6 max-w-3xl mx-auto">
	  <h1 className="font-bold mb-4">Admin Settings</h1>

	  {loading ? (
		<div>Loading settings...</div>
	  ) : (
		<form onSubmit={handleSave} className="space-y-4 p-6 rounded-lg shadow">
		  <div>
			<label className="block font-medium mb-1">Username</label>
			<input
			  name="username"
			  value={settings.username}
			  onChange={handleChange}
			  className="w-full border rounded px-3 py-2"
			/>
		  </div>

		  <div>
			<label className="block font-medium mb-1">WhatsApp</label>
			<input
			  name="whatsapp"
			  placeholder="WhatsApp number or link"
			  value={settings.whatsapp}
			  onChange={handleChange}
			  className="w-full border rounded px-3 py-2"
			/>
		  </div>

		  <div className="flex justify-end gap-3">
			<button
			  type="button"
			  onClick={() => window.location.reload()}
			  className="px-4 py-2 border rounded"
			>
			  Reset
			</button>
			<button type="submit" disabled={saving} className="px-4 py-2 rounded">
			  {saving ? "Saving..." : "Save Settings"}
			</button>
		  </div>
		</form>
	  )}
	</div>
  );
}
