"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SearchBar({ value, onChange, placeholder = 'Search products...' }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // debounced search for product suggestions
  useEffect(() => {
    const q = (query || '').trim();
    if (!q) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error('Search failed');
        const j = await res.json();
        if (!mounted.current) return;
        // only keep product suggestions
        const prods = (j.results || []).filter((r) => r.type === 'product').slice(0, 6);
        setSuggestions(prods);
      } catch (err) {
        if (!mounted.current) return;
        setError(err.message || 'Search error');
      } finally {
        if (mounted.current) setLoading(false);
      }
    }, 220);

    return () => clearTimeout(t);
  }, [query]);

  function handleInputChange(v) {
    setQuery(v);
    onChange && onChange(v);
  }

  function clear() {
    setQuery('');
    setSuggestions([]);
    onChange && onChange('');
  }

  function openProduct(p) {
    // navigate to shop with product and optional store
    const storePart = p.store ? `?store=${encodeURIComponent(p.store)}&product=${encodeURIComponent(p._id)}` : `?product=${encodeURIComponent(p._id)}`;
    router.push(`/shop${storePart}`);
    // keep suggestions cleared
    setSuggestions([]);
  }

  return (
    <div className="w-full max-w-xl relative">
      <label className="sr-only">Search</label>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border px-3 py-2 shadow-sm"
          aria-label="Search products"
        />
        {query && (
          <button
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {query && (suggestions.length > 0 || loading || error) && (
        <div className="absolute z-40 mt-2 w-full bg-white border rounded shadow max-h-64 overflow-auto">
          {loading && <div className="p-2 text-sm">Searching…</div>}
          {error && <div className="p-2 text-sm text-red-600">{error}</div>}
          {suggestions.map((s) => (
            <button key={s._id} onClick={() => openProduct(s)} className="w-full text-left p-2 hover:bg-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {s.image ? <img src={s.image} alt={s.name} className="w-full h-full object-cover" /> : <div className="text-xs text-stone-600">P</div>}
              </div>
              <div className="flex-1">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-xs text-stone-600">₦{Number(s.price || 0).toLocaleString()}</div>
              </div>
            </button>
          ))}
          {!loading && suggestions.length === 0 && !error && (
            <div className="p-2 text-sm text-stone-600">No products found</div>
          )}
        </div>
      )}
    </div>
  );
}
