import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from './Navigation';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:ml-80 min-h-screen transition-smooth">
        <div className="p-3 pt-[72px] sm:p-4 sm:pt-[72px] md:p-6 md:pt-6 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}