"use client";

import React from 'react';

/**
 * @typedef {import('@/lib/cart').CartPayload} CartPayload
 */

/**
 * @param {{ cart: CartPayload }} props
 */
export default function OrderSummary({ cart }) {
  if (!cart) return null;

  const items = Array.isArray(cart.items) ? cart.items : [];
  const baseItems = items.filter((it) => it.type !== 'service');
  const serviceItems = items.filter((it) => it.type === 'service');

  const baseItemsTotal = Number(cart.baseItemsTotal ?? cart.itemsTotal ?? 0);
  const servicesTotal = Number(cart.servicesTotal ?? 0);
  const total = Number(
    cart.total ??
    ((cart.itemsTotal != null ? cart.itemsTotal : baseItemsTotal) + servicesTotal)
  );

  return (
    <div className="mb-6 p-4 rounded border bg-white/70 dark:bg-black/40">
      <h3 className="font-semibold mb-2">Order Summary</h3>

      {baseItems.length > 0 && (
        <ul className="space-y-2 text-sm border-2 border-green-600 rounded-md p-2">
          {baseItems.map((it) => {
            const qty = Number(it.qty || 1);
            const unit = Number(it.unitPrice ?? 0);
            const sub = Number(it.subtotal ?? qty * unit);
            return (
              <li key={it._id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {it.image && (
                    <img
                      src={it.image}
                      alt={it.name}
                      className="h-10 w-10 rounded object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{it.name}</p>
                  </div>
                </div>
                <span className="font-medium text-right text-xs sm:text-sm">
                  {qty} × ₦{unit.toLocaleString('en-NG')} ({`₦${sub.toLocaleString('en-NG')}`})
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {serviceItems.length > 0 && (
        <div className="mt-2 border-2 border-green-600 rounded-md p-2">
          <p className="text-xs font-semibold mb-1">Services</p>
          <ul className="space-y-1 text-sm">
            {serviceItems.map((it) => {
              const qty = Number(it.qty || 1);
              const unit = Number(it.unitPrice ?? it.price ?? it.subtotal ?? 0);
              const sub = Number(it.subtotal ?? qty * unit);
              return (
                <li key={it._id} className="flex justify-between">
                  <span>{it.name}</span>
                  <span className="text-xs sm:text-sm font-medium">
                    {qty} × ₦{unit.toLocaleString('en-NG')} ({`₦${sub.toLocaleString('en-NG')}`})
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="border-t mt-3 pt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₦{baseItemsTotal.toLocaleString('en-NG')}</span>
        </div>

        {servicesTotal > 0 && (
          <div className="flex justify-between">
            <span>Services total</span>
            <span>₦{servicesTotal.toLocaleString('en-NG')}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Tax</span>
          <span>₦0</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping</span>
          <span>₦0</span>
        </div>

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>₦{total.toLocaleString('en-NG')}</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        To have these items delivered, please also select the
        {' '}<strong>Help Me Buy Pack</strong> service below.
      </p>
    </div>
  );
}
