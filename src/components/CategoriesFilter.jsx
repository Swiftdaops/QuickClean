"use client";

import React from 'react';
import { CATEGORIES } from '@/lib/categories';

export default function CategoriesFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {CATEGORIES.map((c) => {
        const Icon = c.Icon;
        const active = selected === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border ${active ? 'bg-cyan-200' : ''}`}
            aria-pressed={active}
          >
            {Icon ? <Icon className="w-4 h-4" /> : null}
            <span className="text-sm">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
