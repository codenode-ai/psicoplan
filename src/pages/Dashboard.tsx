import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { PlanLimitWarning } from '@/components/dashboard/PlanLimitWarning';
import { UpcomingSessions } from '@/components/dashboard/UpcomingSessions';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EnhancedSubscriptionStatus } from '@/components/subscription/EnhancedSubscriptionStatus';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PLAN_LIMITS } from '@/types/database.types';

export default function Dashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { metrics, loading, refreshMetrics } = useOptimizedDashboard();

  console.log('🔍 Dashboard render:', { 
    authLoading, 
    userId: user?.id, 
    userProfile: userProfile?.nome_completo,
    loading,
    metrics
  });

  // Loading state
  if (authLoading || loading) {
    return (
      <AuthLayout>
        <DashboardSkeleton />
      </AuthLayout>
    );
  }

  // Authentication error
  if (!user) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso não autorizado</h3>
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para acessar o dashboard.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Fazer Login
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const planLimit = PLAN_LIMITS[userProfile?.plano || 'free'];
  const isNearLimit = metrics && planLimit.pacientes !== Infinity && 
    metrics.total_pacientes >= planLimit.pacientes * 0.8;

  return (
    <AuthLayout>
      <ErrorBoundary>
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo de volta, {userProfile?.nome_completo || user.email}
            </p>
          </div>

          {/* Stats Grid */}
          <ErrorBoundary>
            <DashboardStats
              totalPacientes={metrics?.total_pacientes || 0}
              sessoesMes={metrics?.sessoes_mes || 0}
              receitaMes={metrics?.receita_mes || 0}
              proximasSessoes={metrics?.proximas_sessoes || 0}
            />
          </ErrorBoundary>

          {/* Plan Limit Warning */}
          {isNearLimit && (
            <ErrorBoundary>
              <PlanLimitWarning
                currentCount={metrics?.total_pacientes || 0}
                planLimit={planLimit.pacientes}
                planName={userProfile?.plano || 'free'}
              />
            </ErrorBoundary>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <ErrorBoundary>
              <UpcomingSessions sessions={[]} />
            </ErrorBoundary>
            <ErrorBoundary>
              <QuickActions />
            </ErrorBoundary>
            <ErrorBoundary>
              <EnhancedSubscriptionStatus />
            </ErrorBoundary>
          </div>
        </div>
      </ErrorBoundary>
    </AuthLayout>
  );
}
