export default function sitemap() {
	const baseUrl = 'https://quickclean.store';
	const lastModified = new Date();

	// Public routes discovered in `src/app/**/page.*`.
	// Admin routes and dynamic routes (e.g. /order-status/[orderId]) are intentionally excluded.
	const routes = [
		{ path: '/', changeFrequency: 'weekly', priority: 1.0 },
		{ path: '/booking', changeFrequency: 'weekly', priority: 0.9 },
		{ path: '/shop', changeFrequency: 'weekly', priority: 0.8 },
		{ path: '/about', changeFrequency: 'monthly', priority: 0.6 },
	];

	return routes.map((r) => ({
		url: `${baseUrl}${r.path}`,
		lastModified,
		changeFrequency: r.changeFrequency,
		priority: r.priority,
	}));
}
