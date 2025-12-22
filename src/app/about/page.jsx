export const metadata = {
	title: 'About QuickClean | Trusted Cleaning Service in Ifite Awka',
	description:
		'Learn about QuickClean, our mission, and how we deliver fast and reliable cleaning services to homes and lodges in Ifite Awka.',
	alternates: { canonical: '/about' },
	openGraph: {
		url: 'https://quickclean.store/about',
		title: 'About QuickClean | Trusted Cleaning Service in Ifite Awka',
		description:
			'Learn about QuickClean, our mission, and how we deliver fast and reliable cleaning services to homes and lodges in Ifite Awka.',
		type: 'website',
		siteName: 'QuickClean',
	},
	robots: { index: true, follow: true },
};

import AboutContent from "./AboutContent";

export default function AboutPage() {
	return <AboutContent />;
}
