"use client";

import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    if (!mounted) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <header className="card text-stone-950 dark:text-white sticky top-0 z-40">
      <div className=" card max-w-6xl mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Left: logo */}
        <div className="flex items-center gap-3 -ml-4 md:ml-0">
          <Link href="/" className="flex items-center">
            <div style={{ width: 180, height: 72 }} aria-hidden={false}>
              <DotLottieReact
                src="https://lottie.host/97794319-dc02-4f58-8d4c-da52ea3e408b/miEBlI6Gjt.lottie"
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <noscript>
              <img src="/logo.svg" alt="QuickClean" width="180" height="72" />
            </noscript>
          </Link>

          {/* Desktop nav intentionally removed */}
        </div>

        {/* Center: site title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
          <Link href="/" className="pointer-events-auto">
            <span className="font-semibold text-lg text-stone-950 dark:text-white">Quick Clean</span>
          </Link>
        </div>

        {/* Controls: theme toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {mounted && (theme === 'dark') ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      {/* Mobile menu intentionally removed */}
    </header>
  );
}
