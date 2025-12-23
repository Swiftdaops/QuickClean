"use client"

import React from 'react';
import dynamic from 'next/dynamic';

const BookingClient = dynamic(() => import('./BookingClient'), {
  ssr: false,
  loading: () => <div className="p-6">Loading booking UI…</div>,
});

export default function BookingDynamic() {
  return <BookingClient />;
}
