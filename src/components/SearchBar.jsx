"use client";

import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search products...' }) {
  return (
    <div className="w-full max-w-xl">
      <label className="sr-only">Search</label>
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border px-3 py-2 shadow-sm"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
