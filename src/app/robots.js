export default function robots() { return { rules: [ { userAgent: '*', allow: '/' }, { userAgent: '*', disallow: '/admin' }, ], sitemap: 'https://quickclean.store/sitemap.xml', };
}
