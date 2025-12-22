import AdminLayoutClient from '@/components/AdminLayoutClient';

export const metadata = {
	title: 'Admin',
	robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
	return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
