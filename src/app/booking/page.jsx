import React, { Suspense } from 'react';
import BookingClient from './BookingClient';

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading booking page…</div>}>
      <BookingClient />
    </Suspense>
  );
}
