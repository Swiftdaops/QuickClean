"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function UniversalSearch({ initialOpen = false }) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const doSearch = async (q) => {
    const trimmed = (q || '').trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();
      setResults(json.results || []);
    } catch (err) {
      console.error('Search error', err);
      setError(err.message || 'Search error');
    } finally {
      setLoading(false);
    }
  };

  // simple debounce using timeout
  useEffect(() => {
    const t = setTimeout(() => {
      doSearch(query);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function openFor() {
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  function goToResult(r) {
    // store -> /shop?store=NAME
    if (r.type === 'store') {
      const storeName = r.name || '';
      router.push(`/shop?store=${encodeURIComponent(storeName)}`);
      close();
      return;
    }

    // product -> open store view with product param
    if (r.type === 'product') {
      const productId = r._id;
      const storeName = r.store || '';
      const url = `/shop${storeName ? `?store=${encodeURIComponent(storeName)}&product=${encodeURIComponent(productId)}` : `?product=${encodeURIComponent(productId)}`}`;
      router.push(url);
      close();
      return;
    }
  }

  function handleHelpMeBuy(storeName) {
    // redirect to booking with store pre-selected via query param
    const url = `/booking?store=${encodeURIComponent(storeName || '')}`;
    router.push(url);
    close();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(true)} className="px-3 py-2 rounded border">Search</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded shadow-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stores and products..."
                className="w-full rounded-md border px-3 py-2 shadow-sm"
              />
              <button onClick={close} className="px-3 py-2">Close</button>
            </div>

            <div className="max-h-80 overflow-auto">
              {loading && <div className="text-sm">Searching…</div>}
              {error && <div className="text-sm text-red-600">{error}</div>}

              {!loading && results.length === 0 && query && (
                <div className="text-sm text-stone-700">No results</div>
              )}

              <ul className="space-y-2">
                {results.map((r) => (
                  <li key={`${r.type}-${r._id}`} className="flex items-center gap-3 p-2 border rounded hover:bg-slate-50">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {r.image ? (
                        <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs text-stone-600">{r.type.toUpperCase()}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs text-stone-600">
                        {r.type === 'product' ? `Product · ₦${Number(r.price || 0).toLocaleString()}` : `Store · ${r.location || ''}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.type === 'store' && (
                        <>
                          <button onClick={() => goToResult(r)} className="px-2 py-1 rounded border text-sm">View</button>
                          <button onClick={() => handleHelpMeBuy(r.name)} className="px-2 py-1 rounded bg-emerald-600 text-white text-sm">Help Me Buy</button>
                        </>
                      )}

                      {r.type === 'product' && (
                        <button onClick={() => goToResult(r)} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">Open</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
