export async function authFetch(url, opts = {}) {
	// Prefer the in-memory token (set by AuthProvider) if available, fall back to localStorage.
	const inMemory = typeof window !== "undefined" ? (window.__adminToken || null) : null;
	const token = inMemory || (typeof window !== "undefined" ? localStorage.getItem("adminToken") : null);
	const headers = Object.assign({}, opts.headers || {});
	if (token) headers.Authorization = `Bearer ${token}`;
	const final = Object.assign({}, opts, { headers, credentials: token ? "omit" : "include" });
	return fetch(url, final);
}

export default authFetch;
