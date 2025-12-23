"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children, redirectTo = '/admin/login' }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
	if (!loading && !isAuthenticated) {
	  // perform navigation in an effect to avoid setState-in-render issues
	  router.push(redirectTo);
	}
  }, [loading, isAuthenticated, router, redirectTo]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
