"use client";

import React from 'react';
import { MdShoppingCart, MdCleaningServices, MdHome, MdLocalLaundryService, MdAutoAwesome } from 'react-icons/md';
import { HiOutlineSparkles } from 'react-icons/hi';

// Map known icon names (from service.icon strings) to react-icon components
const ICON_MAP = {
  MdShoppingCart: MdShoppingCart,
  MdCleaningServices: MdCleaningServices,
  MdHome: MdHome,
  MdLocalLaundryService: MdLocalLaundryService,
  MdAutoAwesome: MdAutoAwesome,
  HiOutlineSparkles: HiOutlineSparkles,
};

export default function ServiceIcon({ name, iconName, className = 'w-5 h-5 text-stone-900' }) {
  // Prefer explicit iconName if provided
  if (iconName && ICON_MAP[iconName]) {
    const C = ICON_MAP[iconName];
    return <C className={className} aria-hidden />;
  }

  // Try matching from name heuristics
  const key = (name || '').toLowerCase();
  if (key.includes('help') || key.includes('buy')) return <MdShoppingCart className={className} aria-hidden />;
  if (key.includes('lodge') || key.includes('clean')) return <MdCleaningServices className={className} aria-hidden />;
  if (key.includes('home') || key.includes('apartment')) return <MdHome className={className} aria-hidden />;
  if (key.includes('laundry') || key.includes('dry') || key.includes('wash')) return <MdLocalLaundryService className={className} aria-hidden />;
  return <MdAutoAwesome className={className} aria-hidden />;
}
