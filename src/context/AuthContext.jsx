"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [token, setToken] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		try {
			const t = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
			if (t) {
				setToken(t);
				// keep an in-memory copy for immediate access by fetch helpers
				try { window.__adminToken = t; } catch (e) {}
			}
		} catch (err) {
			console.error("AuthProvider init error", err);
		} finally {
			setLoading(false);
		}
	}, []);

	function login(newToken) {
		try {
			if (typeof window !== "undefined" && newToken) {
				try { localStorage.setItem("adminToken", newToken); } catch (e) {}
				try { window.__adminToken = newToken; } catch (e) {}
			}
		} catch (err) {
			console.error("login error", err);
		}
		setToken(newToken);
	}

	function logout() {
		try {
			if (typeof window !== "undefined") {
				try { localStorage.removeItem("adminToken"); } catch (e) {}
				try { window.__adminToken = null; } catch (e) {}
			}
		} catch (err) {
			console.error("logout error", err);
		}
		setToken(null);
	}

	const value = { token, loading, isAuthenticated: !!token, login, logout };
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}

export default AuthContext;
