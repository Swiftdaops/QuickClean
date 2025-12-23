"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutContent() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Where does QuickClean operate?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We operate primarily in Ifite Awka, Anambra State, Nigeria.',
        },
      },
      {
        '@type': 'Question',
        name: 'What services do you offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer lodge cleaning, home cleaning, laundry, and dry cleaning.',
        },
      },
      {
        '@type': 'Question',
        name: 'How quickly can I get service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Typical response time is about 1 hour from booking.',
        },
      },
    ],
  };

  return (
    <main className="px-6 md:px-12 lg:px-24 py-12 max-w-6xl mx-auto">
      <script
        id="jsonld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-3xl md:text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Fast, Reliable Cleaning in Ifite Awka
        </motion.h1>
        <motion.p
          className="text-stone-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          We specialize in lodge and home cleaning, laundry, and premium subscriptions. Trusted agents, quick response times, spotless results.
        </motion.p>
        <motion.div
          className="mt-6 flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md border bg-cyan-100 text-stone-950"
          >
            Book a Service
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md border bg-cyan-100 text-stone-950"
          >
            WhatsApp Us
          </Link>
        </motion.div>
      </motion.section>

      <motion.section
        className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {[
          { title: '≈ 1hr response', desc: 'Agents dispatched quickly to your location.' },
          { title: 'Trusted staff', desc: 'Vetted professionals who respect your space.' },
          { title: 'Student-friendly', desc: 'Affordable plans and discounts for NAU students.' },
        ].map((it) => (
          <motion.div
            key={it.title}
            className="rounded-lg border p-4"
            initial={{ opacity: 0, y: 16 }}
            variants={{ visible: { opacity: 1, y: 0 } }}
          >
            <div className="font-semibold">{it.title}</div>
            <p className="mt-1 text-sm text-stone-950">{it.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        className="mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <h2 className="text-xl font-semibold mb-4">Why Choose Us?</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Fast average response: about 1 hour from booking.</li>
          <li>Comprehensive services: lodge cleaning, laundry, and room organization.</li>
          <li>Professional, trained staff — safe and hygienic cleaning.</li>
          <li>Weekly subscriptions and student-friendly pricing.</li>
          <li>Local, trusted service in Ifite and surrounding areas.</li>
        </ul>
      </motion.section>

      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">How fast can you reach my home or lodge?</h3>
            <p>Our agents typically arrive within 1 hour in the Ifite area.</p>
          </div>
          <div>
            <h3 className="font-medium">Do you offer subscription plans?</h3>
            <p>Yes! Premium Subscription enables weekly cleaning and laundry for convenience.</p>
          </div>
          <div>
            <h3 className="font-medium">Are your services available for students?</h3>
            <p>Absolutely. Students at NAU enjoy exclusive discounts on lodge cleaning.</p>
          </div>
          <div>
            <h3 className="font-medium">Can I book a specific service?</h3>
            <p>Yes — lodge cleaning, help‑me‑buy errands, dry cleaning, and more.</p>
          </div>
          <div>
            <h3 className="font-medium">How do I contact QuickClean?</h3>
            <p>Book via our website or WhatsApp for a fast, personalized response.</p>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="rounded-lg border p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div>
          <h2 className="text-xl font-semibold">Get Started with QuickClean Today</h2>
          <p className="mt-1 text-sm text-stone-950">
            Experience fast, reliable, professional cleaning in Ifite Awka.
          </p>
        </div>
        <Link
          href="/booking"
          className="inline-flex items-center justify-center px-5 py-3 rounded-md border bg-cyan-100 text-stone-950"
        >
          Book a Service
        </Link>
      </motion.section>
    </main>
  );
}