"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';

export default function ThemeProviderClient({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      {children}
    </ThemeProvider>
  );
}
