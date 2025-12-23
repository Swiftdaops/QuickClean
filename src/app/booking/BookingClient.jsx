"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { MdShoppingCart, MdCleaningServices, MdHome, MdLocalLaundryService, MdAutoAwesome } from 'react-icons/md';
import { Input, Textarea, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { toast } from "@/components/ui/sonner";
import { playProductAddedSound } from "@/lib/sound";
import Splash from '@/components/Splash';
import OrderSummary from '@/components/OrderSummary';
import posthog from 'posthog-js';

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const SERVICE_DESCRIPTIONS = {};

function ServiceIcon({ name, className = "w-6 h-6 text-emerald-600" }) {
    const key = (name || "").toLowerCase();
    if (key.includes("help") || key.includes("buy")) return <MdShoppingCart className={className} aria-hidden />;
    if (key.includes("lodge") || key.includes("clean")) return <MdCleaningServices className={className} aria-hidden />;
    if (key.includes("home") || key.includes("apartment")) return <MdHome className={className} aria-hidden />;
    if (key.includes("laundry") || key.includes("dry") || key.includes("wash")) return <MdLocalLaundryService className={className} aria-hidden />;
    return <MdAutoAwesome className={className} aria-hidden />;
}

export default function BookingClient() {
    const search = useSearchParams();
    const [orderData, setOrderData] = useState(null);
    const [formData, setFormData] = useState({ name: "", phone: "", date: "", notes: "" });
    const [services, setServices] = useState([]);
    const [stores, setStores] = useState([]);
    const [selected, setSelected] = useState([]);
    const [selectedStore, setSelectedStore] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingServices, setLoadingServices] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [splashes, setSplashes] = useState([]);

    useEffect(() => {
        let mounted = true;

        const tryParseOrder = () => {
            try {
                const qsOrder = search?.get('order');
                if (!qsOrder) {
                    try {
                        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('quickclean_cart') : null;
                        if (saved) {
                            const obj = JSON.parse(saved);
                            // If parsed cart has items, restore it
                            if (obj && Array.isArray(obj.items) && obj.items.length > 0) {
                                setOrderData(obj);
                                setSelected(['Help Me Buy Pack']);
                                if (obj.store) setSelectedStore(obj.store);
                                return;
                            }

                            // If saved cart exists but has no items, clear stale persistence
                            try {
                                if (typeof window !== 'undefined') {
                                    window.localStorage.removeItem('quickclean_cart');
                                    if (window.__quickclean_cart) delete window.__quickclean_cart;
                                    console.debug('Cleared empty persisted quickclean_cart');
                                }
                            } catch (e) { /* ignore */ }
                        }
                    } catch (e) { /* ignore parse errors */ }
                    return;
                }

                // decode and parse once, handle decode/parse errors explicitly
                let obj;
                try {
                    const decoded = decodeURIComponent(qsOrder);
                    obj = JSON.parse(decoded);
                } catch (e) {
                    console.debug('Failed to decode or parse order from query', e);
                    return;
                }

                if (obj && Array.isArray(obj.items) && obj.items.length > 0) {
                    setOrderData(obj);
                    try {
                        if (typeof window !== 'undefined') {
                            window.localStorage.setItem('quickclean_cart', JSON.stringify(obj));
                            window.__quickclean_cart = obj;
                        }
                    } catch (e) { /* ignore */ }

                    setSelected(['Help Me Buy Pack']);
                    if (obj.store) setSelectedStore(obj.store);

                    try {
                        toast.success('Help Me Buy Pack selected');
                        playProductAddedSound('https://res.cloudinary.com/dnitzkowt/video/upload/v1766339273/new-notification-3-398649_pxhiar.mp3');
                    } catch (e) {
                        console.debug('Auto-select notification failed', e);
                    }

                    (async function refreshPrices() {
                        try {
                            const storesRes = await fetch(`${apiBase}/api/stores`);
                            if (!storesRes.ok) return;
                            const storesJson = await storesRes.json();
                            const storeObj = (storesJson || []).find((s) => (s.name || '').toLowerCase() === (obj.store || '').toLowerCase());
                            if (!storeObj || !storeObj._id) return;

                            const prodsRes = await fetch(`${apiBase}/api/stores/${storeObj._id}/products`);
                            if (!prodsRes.ok) return;
                            const prods = await prodsRes.json();
                            const byId = (prods || []).reduce((m, p) => { m[String(p._id)] = p; return m; }, {});
                            const updatedItems = obj.items.map((it) => {
                                const p = byId[String(it._id)];
                                const unitPrice = p ? Number(p.price || 0) : (it.unitPrice ?? it.price ?? 0);
                                const qty = it.qty || 1;
                                return { ...it, unitPrice, subtotal: unitPrice * qty };
                            });
                            const newItemsTotal = updatedItems.reduce((s, it) => s + (it.subtotal || 0), 0);
                            const newTotal = newItemsTotal;
                            if (mounted) {
                                const newCart = { ...(obj || {}), items: updatedItems, itemsTotal: newItemsTotal, helpFee: 0, total: newTotal };
                                setOrderData(newCart);
                                try {
                                    if (typeof window !== 'undefined') {
                                        window.localStorage.setItem('quickclean_cart', JSON.stringify(newCart));
                                        window.__quickclean_cart = newCart;
                                    }
                                } catch (e) { /* ignore */ }
                            }
                        } catch (e) {
                            console.debug('Failed to refresh product prices for order', e);
                        }
                    })();
                }
            } catch (e) {
                console.debug('Failed to parse order from query', e);
            }
        };
        tryParseOrder();

        async function fetchServices() {
            setFetchError(null);
            setLoadingServices(true);
            try {
                const [sRes, stRes] = await Promise.all([
                    fetch(`${apiBase}/api/services`),
                    fetch(`${apiBase}/api/stores`),
                ]);

                if (!mounted) return;

                if (!sRes.ok) {
                    const txt = await sRes.text().catch(() => sRes.statusText || 'Failed to fetch services');
                    throw new Error(txt || 'Failed to fetch services');
                }
                if (!stRes.ok) {
                    const txt = await stRes.text().catch(() => stRes.statusText || 'Failed to fetch stores');
                    throw new Error(txt || 'Failed to fetch stores');
                }

                const sJson = await sRes.json();
                const stJson = await stRes.json();

                const svcList = Array.isArray(sJson) ? sJson : [];
                setServices(svcList);
                const storeObjs = (stJson.stores || stJson || []);
                const names = storeObjs.map((s) => s.name || s);
                setStores(names);

                const partnerFound = names.find((n) => n && n.toLowerCase().includes("chijohnz"));
                if (partnerFound) setSelectedStore(partnerFound);
                if (svcList.length) setSelected([]);
            } catch (err) {
                console.error('Failed to load services or stores', err);
                if (mounted) setFetchError(err.message || String(err));
            } finally {
                if (mounted) setLoadingServices(false);
            }
        }

        fetchServices();
        return () => { mounted = false; };
    }, [search]);

    const itemsTotalFromOrder = orderData
        ? (orderData.itemsTotal ?? (Array.isArray(orderData.items) ? orderData.items.reduce((s, it) => s + ((it.qty || 1) * (it.unitPrice || it.price || 0)), 0) : 0))
        : 0;

    const servicesTotalFromSelected = Array.isArray(selected) && services.length
        ? selected.reduce((s, nameKey) => {
            const svcObj = services.find((x) => x.name === nameKey);
            return s + (svcObj ? Number(svcObj.price || 0) : 0);
        }, 0)
        : 0;

    const displayedGrandTotal = itemsTotalFromOrder + servicesTotalFromSelected;

    let summaryCart = null;
    if (orderData && Array.isArray(orderData.items) && orderData.items.length > 0) {
        const baseItems = orderData.items.map((it) => {
            const qty = it.qty || 1;
            const unitPrice = it.unitPrice ?? it.price ?? 0;
            const subtotal = it.subtotal ?? qty * unitPrice;
            return {
                _id: String(it._id || ''),
                name: it.name || 'Item',
                image: it.image || null,
                unitPrice: Number(unitPrice || 0),
                qty,
                subtotal,
                type: 'item',
            };
        });

        const serviceItems = Array.isArray(selected) && services.length
            ? selected.map((nameKey) => {
                const svcObj = services.find((x) => x.name === nameKey) || { name: nameKey, price: 0 };
                const unitPrice = Number(svcObj.price || 0);
                return {
                    _id: String(svcObj._id || `svc-${nameKey}`),
                    name: svcObj.name || nameKey,
                    unitPrice,
                    qty: 1,
                    subtotal: unitPrice,
                    type: 'service',
                };
            })
            : [];

        const allItems = [...baseItems, ...serviceItems];
        const baseItemsTotal = itemsTotalFromOrder;
        const servicesTotal = servicesTotalFromSelected;
        const helpFee = 0;
        const total = baseItemsTotal + servicesTotal;

        summaryCart = {
            store: orderData.store || selectedStore || '',
            items: allItems,
            itemsTotal: total,
            baseItemsTotal,
            servicesTotal,
            helpFee,
            total,
        };
    } else if (Array.isArray(selected) && selected.length > 0 && services.length > 0) {
        // No Help Me Buy/cart items – show a summary built only from selected services
        const serviceItems = selected.map((nameKey) => {
            const svcObj = services.find((x) => x.name === nameKey) || { name: nameKey, price: 0 };
            const unitPrice = Number(svcObj.price || 0);
            return {
                _id: String(svcObj._id || `svc-${nameKey}`),
                name: svcObj.name || nameKey,
                unitPrice,
                qty: 1,
                subtotal: unitPrice,
                type: 'service',
            };
        });

        const servicesTotal = serviceItems.reduce((s, it) => s + (it.subtotal || 0), 0);
        const helpFee = 0;
        const total = servicesTotal;

        summaryCart = {
            store: selectedStore || '',
            items: serviceItems,
            itemsTotal: total,
            baseItemsTotal: 0,
            servicesTotal,
            helpFee,
            total,
        };
    } else {
        // Default empty summary when nothing has been selected yet
        summaryCart = {
            store: selectedStore || '',
            items: [],
            itemsTotal: 0,
            baseItemsTotal: 0,
            servicesTotal: 0,
            helpFee: 0,
            total: 0,
        };
    }

    function handleChange(e) {
        setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    }

    function toggleService(name) {
        const wasSelected = selected.includes(name);
        const svcObj = services.find((x) => x.name === name) || { name, price: 0 };

        // Track service selection/deselection
        posthog.capture('service_selected', {
            service_name: name,
            service_price: Number(svcObj.price || 0),
            action: wasSelected ? 'deselected' : 'selected',
            selected_services_count: wasSelected ? selected.length - 1 : selected.length + 1,
        });

        setSelected((prev) =>
            prev.includes(name)
                ? prev.filter((n) => n !== name)
                : [...prev, name]
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selected || selected.length === 0) return toast.error('Please select at least one service');
        if (selected.includes('Help Me Buy Pack') && !selectedStore) return toast.error('Please select a store for Help Me Buy orders');
        const name = (formData.name || '').trim();
        const phone = (formData.phone || '').trim();
        if (!name || !phone) return toast.error('Name and phone are required');

        let customerCid = null;
        try {
            if (typeof window !== 'undefined') {
                customerCid = window.localStorage?.getItem('cid') || null;
                if (!customerCid) {
                    customerCid = `cid_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
                    window.localStorage.setItem('cid', customerCid);
                }
                window.localStorage.setItem('customerName', name);
            }
        } catch (e) { customerCid = customerCid || null; }

        const items = orderData && Array.isArray(orderData.items) && orderData.items.length > 0 ? orderData.items : undefined;

        const svcEntries = selected.map((nameKey) => {
            const svcObj = services.find((x) => x.name === nameKey) || { name: nameKey, price: 0 };
            const entry = { service: svcObj.name, price: svcObj.price || 0, notes: formData.notes || undefined };
            if (svcObj.name === 'Help Me Buy Pack') {
                entry.store = selectedStore;

                if (items && Array.isArray(items) && items.length > 0) {
                    entry.productId = items[0]._id || items[0].productId || null;
                }
            }
            return entry;
        });

        const servicesTotal = svcEntries.reduce((s, it) => s + (Number(it.price || 0)), 0);
        const itemsTotal = items ? (orderData.itemsTotal ?? orderData.items.reduce((s, it) => s + ((it.qty || 1) * (it.unitPrice ?? it.price ?? 0)), 0)) : 0;
        const totalAmount = servicesTotal + itemsTotal;

        const baseSummaryItems = (items || []).map((it) => {
            const qty = Number(it.qty || 1);
            const unit = Number(it.unitPrice ?? it.price ?? 0);
            const sub = Number(it.subtotal ?? (qty * unit));
            return {
                productId: it.productId || it._id || null,
                name: it.name || it.title || 'Item',
                qty,
                unitPrice: unit,
                subtotal: sub,
            };
        });

        const serviceSummaryItems = svcEntries.map((svc) => ({
            productId: svc.productId || null,
            name: svc.service,
            qty: 1,
            unitPrice: Number(svc.price || 0),
            subtotal: Number(svc.price || 0),
        }));

        const orderSummary = {
            items: [...baseSummaryItems, ...serviceSummaryItems],
            subtotal: itemsTotal,
            tax: 0,
            shipping: 0,
            total: totalAmount,
            // extra fields for frontend convenience
            itemsTotal,
            servicesTotal,
            store: orderData?.store || selectedStore || null,
        };

        const payload = {
            name,
            phone,
            date: formData.date || undefined,
            services: svcEntries,
            items,
            customerCid,
            orderSummary,
            service: selected && selected.length ? selected.join(", ") : undefined,
            store: orderData?.store || selectedStore || undefined,
        };

        console.debug('Booking payload', payload);

        let popup = null;
        try {
            if (typeof window !== 'undefined') {
                popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
            }
        } catch (e) {
            console.debug('Popup open failed', e);
            popup = null;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j.error || j.message || 'Booking failed');
            toast.success('Booking created — we will contact you');

            // Track booking submission
            const bookingId = j?.booking?._id || (Array.isArray(j?.bookings) && j.bookings[0]?._id) || j?._id || j?.id || '';
            posthog.capture('booking_submitted', {
                booking_id: bookingId,
                customer_name: name,
                customer_phone: phone,
                services_selected: selected,
                services_count: selected.length,
                items_count: items ? items.length : 0,
                items_total: itemsTotal,
                services_total: servicesTotal,
                total_amount: totalAmount,
                store: orderData?.store || selectedStore || null,
                has_notes: Boolean(formData.notes),
                preferred_date: formData.date || null,
            });

            let adminWhatsApp = (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '').trim();
            try {
                if (!adminWhatsApp) {
                    const sres = await fetch(`${apiBase}/api/settings`);
                    if (sres.ok) {
                        const sj = await sres.json().catch(() => ({}));
                        adminWhatsApp = sj.whatsapp || '';
                    }
                }
            } catch (e) {
                console.debug('Failed to fetch settings', e);
            }

            if (!adminWhatsApp) {
                adminWhatsApp = '+2349079529836';
            }

            const waPhone = adminWhatsApp.replace(/\D/g, '');
            const orderId = j?.booking?._id || (Array.isArray(j?.bookings) && j.bookings[0]?._id) || j?._id || j?.id || '';
            const listLines = (items || []).map((it) => {
                const qty = it.qty || 1;
                const unit = (it.unitPrice ?? it.price ?? 0);
                const sub = it.subtotal ?? (qty * unit);
                return `- ${it.name || it.title || 'Item'} x${qty} — ₦${Number(sub).toLocaleString('en-NG')}`;
            }).join('\n');

            const serviceLines = svcEntries.map((svc) => {
                const price = Number(svc.price || 0);
                return `- ${svc.service} — ₦${price.toLocaleString('en-NG')}`;
            }).join('\n');
            const storeName = orderData?.store || selectedStore || '';
            const details = [
                `Hi, my name is ${name}. I'd like to complete my order payment (₦${totalAmount.toLocaleString('en-NG')}).`,
                orderId ? `Order ID: ${orderId}` : '',
                storeName ? `Store: ${storeName}` : '',
                items && items.length ? `Items:\n${listLines}` : '',
                svcEntries && svcEntries.length ? `Services:\n${serviceLines}` : '',
                `Total: ₦${totalAmount.toLocaleString('en-NG')}`,
                formData.phone ? `Phone: ${formData.phone}` : '',
                formData.date ? `Preferred date: ${formData.date}` : '',
                formData.notes ? `Notes: ${formData.notes}` : '',
                'Thank you.',
            ].filter(Boolean).join('\n');
            const encoded = encodeURIComponent(details);

            const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
            const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua);
            const waUrl = isMobile
                ? `whatsapp://send?phone=${waPhone}&text=${encoded}`
                : `https://wa.me/${waPhone}?text=${encoded}`;
            try {
                if (popup) {
                    try {
                        popup.location.href = waUrl;
                    } catch (err) {
                        const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
                        if (!opened) window.location.href = waUrl;
                    }
                } else {
                    const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
                    if (!opened) window.location.href = waUrl;
                }
            } catch (e) {
                console.debug('WhatsApp redirect failed, copying message to clipboard', e);
                try {
                    await navigator.clipboard.writeText(details);
                    toast.success('Order summary copied. Send it via WhatsApp.');
                } catch (copyErr) {
                    console.debug('Clipboard copy failed', copyErr);
                }
            }

            setFormData({ name: '', phone: '', date: '', notes: '' });
            setSelected([]);
            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('quickclean_cart');
                    if (window.__quickclean_cart) delete window.__quickclean_cart;
                }
            } catch (e) {}

        } catch (err) {
            console.error(err);
            toast.error(err.message || String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto bg-cyan-100 text-stone-950 ">
            <Card className="shadow-lg bg-cyan-100  text-stone-950 ">
                <CardHeader>
                    <CardTitle className="text-2xl">Book a Service</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Choose a service and provide your details. Prices are shown below.</p>
                    </div>

                    {summaryCart && (
                        <OrderSummary cart={summaryCart} />
                    )}

    					<form onSubmit={handleSubmit}>
                            <div className="grid gap-3 mb-6">
                                <div className="flex flex-col gap-1">
                                    <label className="font-medium" htmlFor="booking-name">Name</label>
                                    <Input
                                        id="booking-name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="font-medium" htmlFor="booking-phone">Phone number</label>
                                    <Input
                                        id="booking-phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="WhatsApp phone number"
                                    />
                                </div>
                            </div>

                        {/* Removed the previous form context */}
                        <div className="grid gap-3 mb-6">
                            {loadingServices && <p>Loading services…</p>}
                            {fetchError && <p className="text-red-600">{fetchError}</p>}

                            {!loadingServices && services.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No services available at the moment.
                                </p>
                            )}

                            {services.map((svc) => {
                                const active = selected.includes(svc.name);

                                return (
                                    <button
                                        type="button"
                                        key={svc._id || svc.name}
                                        onClick={() => toggleService(svc.name)}
                                                                        className={`flex items-center justify-between p-4 rounded border transition text-stone-950 dark:text-white
                    ${active ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300 bg-white'}
                `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ServiceIcon name={svc.name} />
                                            <div className="text-left">
                                                <p className="font-medium">{svc.name}</p>
                                                {svc.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {svc.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="font-semibold">
                                            ₦{Number(svc.price || 0).toLocaleString('en-NG')}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4">
                            <Button type="submit" disabled={loading}>{loading ? 'Booking…' : 'Book now'}</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
