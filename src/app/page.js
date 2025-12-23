import Hero from '@/components/Hero';

export const metadata = {
  title: 'Quick Clean – Home, Laundry & Lodge Cleaning Services in Awka',
  description: 'Same-day home cleaning, student lodge cleaning, and laundry services in Awka (Ifite). Fast, affordable, and reliable agents near you.',
  alternates: { canonical: 'https://quickclean.store' },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-cyan-100 text-stone-950">
      <Hero />
    </main>
  );
}
