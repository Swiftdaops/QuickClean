"use client";
import React from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import posthog from 'posthog-js';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export default function Hero() {
    const router = useRouter();

    const [customerName, setCustomerName] = React.useState(null);
    const [playHandshake, setPlayHandshake] = React.useState(false);

    const fetchCustomerName = async () => {
        try {
            if (typeof window !== 'undefined') {
                const name = window.localStorage?.getItem('customerName') || null;
                return name;
            }
            return null;
        } catch (err) {
            return null;
        }
    };

    React.useEffect(() => {
        // on mount try to resolve cid from localStorage or cookie
        const tryResolve = async () => {
            if (typeof window === 'undefined') return;
            const name = await fetchCustomerName();
            if (name) {
                setCustomerName(name);
                // trigger handshake once
                setPlayHandshake(true);
                setTimeout(() => setPlayHandshake(false), 1800);
            }
        };
        tryResolve();

        // listen for cid being set in other parts of the app (storage events)
        const onStorage = (e) => {
            if (e.key === 'customerName' && e.newValue) {
                setCustomerName(e.newValue);
                setPlayHandshake(true);
                setTimeout(() => setPlayHandshake(false), 1800);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleBookingClick = (e) => {
        e.preventDefault();

        // Track CTA click
        posthog.capture('cta_clicked', {
            cta_type: 'quick_clean_services',
            cta_text: 'Quick Clean Services',
            destination: '/booking',
        });

        const url = 'https://res.cloudinary.com/dnitzkowt/video/upload/v1766391771/water-splash-02-352021_lhlh3q.mp3';
        try {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.currentTime = 0;
            audio.play()
                .then(() => {
                    // give a short moment for the splash to start, then navigate
                    setTimeout(() => router.push('/booking'), 150);
                })
                .catch(() => {
                    // if play fails (autoplay policy), still navigate
                    router.push('/booking');
                });
        } catch (err) {
            router.push('/booking');
        }
    };

    const handleShopClick = (e) => {
        e.preventDefault();
        // Track CTA click
        posthog.capture('cta_clicked', {
            cta_type: 'help_me_buy',
            cta_text: 'Help Me Buy Something',
            destination: '/shop',
        });

        const url = 'https://res.cloudinary.com/dnitzkowt/video/upload/v1766339273/new-notification-3-398649_pxhiar.mp3';
        try {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.currentTime = 0;
            audio.play()
                .then(() => {
                    setTimeout(() => router.push('/shop'), 120);
                })
                .catch(() => {
                    router.push('/shop');
                });
        } catch (err) {
            router.push('/shop');
        }
    };
    return (
        <section className="relative w-full py-20 px-6 ">
            <div className="mx-auto max-w-5xl">
                {/* Headline */}
                <Link href="/" className="inline-block">
                    <h1 className="font-bold leading-tight">
                        Fast & Reliable Cleaning Services in Ifite Awka
                    </h1>
                </Link>

                {/* Subheadline with handshake lottie */}
                <div className="mt-6 max-w-3xl mx-auto text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold greeting">Hello, {customerName || 'Valued Customer'}</h2>
                                <div className="text-sm text-stone-950 mt-1 hidden sm:block">Reliable, friendly cleaning — scheduled on your terms.</div>

                                {/* Welcome subheader with handshake Lottie (fades in) */}
                                <div className="mt-3 flex items-center justify-center gap-3 welcome-fade">
                                    <div className={`handshake-wrapped w-12 h-12 sm:w-14 sm:h-14 ${playHandshake ? 'shake-once' : ''}`}>
                                        <DotLottieReact
                                            key={String(playHandshake)}
                                            src="https://lottie.host/19ace919-3012-4c75-9b48-23ec358bb406/cuSRcBqQI8.lottie"
                                            loop={!playHandshake}
                                            autoplay
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>

                                    <h3 className="text-base sm:text-lg font-medium">Welcome to <span className="font-semibold">QuickClean</span></h3>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-stone-950 mt-3 max-w-2xl">
                            We provide professional cleaning services for homes, lodges, and residences within Ifite Awka — fast response time and dependable delivery across all our services.
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .handshake-wrapped { display: inline-block; transform-origin: center; }
                    .greeting { animation: fadeInUp 420ms ease both; }
                    .welcome-fade { animation: fadeInUp 520ms ease both; }

                    /* one-time shake animation */
                    .shake-once { animation: handshake 900ms cubic-bezier(.22,.9,.3,1) both; }

                    @keyframes handshake {
                        0% { transform: rotate(0); }
                        20% { transform: rotate(-18deg); }
                        40% { transform: rotate(14deg); }
                        60% { transform: rotate(-8deg); }
                        80% { transform: rotate(6deg); }
                        100% { transform: rotate(0); }
                    }

                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(6px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    /* Gentle bob for the lottie on larger screens */
                    @media (min-width: 640px) {
                        .handshake-wrapped { animation: bob 2000ms ease-in-out infinite; }
                        @keyframes bob { 0%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} 100%{ transform: translateY(0);} }
                    }

                    /* Slightly larger on desktop */
                    @media (min-width: 1024px) {
                        .handshake-wrapped { width: 64px; height: 64px; }
                    }
                `}</style>

                {/* Trust / Speed Badge */}
                <div className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-2 font-medium">
                    🚀 Average response time: an agent arrives within 1 hour
                </div>

                {/* Value Points */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl border p-5">
                        <p className="font-semibold">Lodge Cleaning</p>
                        <p className="mt-2">Fast, thorough cleaning for lodges and student residences.</p>
                    </div>

                    <div className="rounded-xl border p-5">
                        <p className="font-semibold">Home & Apartment</p>
                        <p className="mt-2">Reliable cleaning services for homes and apartments.</p>
                    </div>

                    <div className="rounded-xl border p-5">
                        <p className="font-semibold">Dry Cleaning</p>
                        <p className="mt-2">Clean, safe, and handled with care.</p>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="/booking"
                        onClick={handleBookingClick}
                        className="inline-flex items-center justify-center rounded-xl px-8 py-4 font-semibold transition border-black border-2"
                    >
                        Quick Clean Services
                    </a>

                    <a
                        href="/shop"
                        onClick={handleShopClick}
                        className="inline-flex items-center justify-center rounded-xl border px-8 py-4 font-semibold transition"
                    >
                        Help Me Buy Something
                    </a>
                </div>
            </div>
        </section>
    );
}
