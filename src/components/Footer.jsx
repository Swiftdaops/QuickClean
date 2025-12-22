import Link from "next/link";

export default function Footer() {
	return (
		<footer className="card text-stone-950 ">
			<div className="max-w-7xl mx-auto px-6 py-14">
				{/* Top Grid */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-10">
					{/* Brand */}
					<div>
						<h3 className="text-stone-950 text-xl font-semibold mb-3">
							Quick Clean
						</h3>
						<p className="text-sm leading-relaxed">
							Fast, reliable cleaning and laundry services for students,
							homes, and apartments within Ifite Awka.
						</p>
						<p className="mt-3 text-sm text-stone-950">
							Average response time: ~1 hour
						</p>
					</div>

					{/* Services */}
					<div>
						<h4 className="text-stone-950 font-semibold mb-3">Services</h4>
						<div className="grid grid-cols-1 gap-3">
							{[
								{
									title: 'Help Me Buy',
									desc: 'We purchase and deliver items from nearby stores fast.',
									href: '/booking',
								},
								{
									title: 'Clean Lodge',
									desc: 'Room and lodge cleaning by trusted agents — quick and tidy.',
									href: '/booking',
								},
								{
									title: 'Dry Cleaning',
									desc: 'Wash, dry and fold with on-time delivery at your doorstep.',
									href: '/booking',
								},
								{
									title: 'Homes & Apartments',
									desc: 'Deep cleans including move-in/out and post-construction detailing.',
									href: '/booking',
								},
								{
									title: 'Premium Subscription',
									desc: 'Priority support and scheduled services on a monthly plan.',
									href: '/booking',
								},
							].map((s) => (
								<Link
									key={s.title}
									href={s.href}
									className="group relative block rounded-lg border border-gray-200 bg-white/70 p-4 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400"
								>
									<div className="flex items-center justify-between gap-3">
										<span className="text-stone-950 text-sm font-medium">{s.title}</span>
										<span className="text-xs text-stone-950 transition-colors">Learn more →</span>
									</div>
									{/* Mobile: always show description */}
									<p className="mt-2 text-xs text-stone-950 md:hidden">{s.desc}</p>
									{/* Desktop: reveal on hover */}
									<p className="mt-0 hidden text-xs text-stone-950 md:block md:max-h-0 md:opacity-0 md:group-hover:opacity-100 md:group-hover:max-h-24 md:transition-all md:duration-200 md:ease-out md:mt-2">
										{s.desc}
									</p>
								</Link>
							))}
						</div>
					</div>

					{/* Company */}
					<div>
						<h4 className="text-stone-950 font-semibold mb-3">Company</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link href="/about" className="hover:text-stone-900">
									About Us
								</Link>
							</li>
							<li>
								<Link href="/booking" className="hover:text-stone-900">
									Services
								</Link>
							</li>
							<li>
								<Link href="/booking" className="hover:text-stone-900">
									Book a Service
								</Link>
							</li>
							<li>
								<Link href="/contact" className="hover:text-stone-900">
									Contact
								</Link>
							</li>
						</ul>

						<div className="mt-4 text-sm space-y-1">
							<div>Ifite Awka, Anambra State</div>
							<a
								href="https://wa.me/2349079529836"
								className="text-stone-950 hover:text-stone-900 block"
								target="_blank"
								rel="noopener noreferrer"
							>
								WhatsApp: +2349079529836
							</a>
						</div>
					</div>
				</div>

				{/* Divider */}
				<div className="border-t border-gray-300 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-sm">
					<p>
						© {new Date().getFullYear()} Quick Clean. All rights reserved.
					</p>

					<div className="flex gap-6 mt-4 md:mt-0">
						<Link href="/privacy" className="hover:text-stone-900">
							Privacy Policy
						</Link>
						<Link href="/terms" className="hover:text-stone-900">
							Terms of Service
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
