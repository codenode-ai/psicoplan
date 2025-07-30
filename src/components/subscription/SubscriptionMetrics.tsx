import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PLAN_LIMITS } from '@/types/database.types';
import { Users, Calendar, CreditCard, TrendingUp } from 'lucide-react';

interface UsageMetrics {
  pacientes_count: number;
  sessoes_count: number;
  financeiro_count: number;
}

export function SubscriptionMetrics() {
  const { user, userProfile } = useAuth();
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsageMetrics();
    }
  }, [user]);

  const fetchUsageMetrics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get current month usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [patientsRes, sessionsRes, financialRes] = await Promise.all([
        supabase
          .from('pacientes')
          .select('id', { count: 'exact' })
          .eq('status', 'ativo'),
        
        supabase
          .from('sessoes')
          .select('id', { count: 'exact' })
          .gte('data_hora', startOfMonth.toISOString()),
        
        supabase
          .from('financeiro')
          .select('id', { count: 'exact' })
          .gte('data_recebimento', startOfMonth.toISOString())
      ]);

      setUsage({
        pacientes_count: patientsRes.count || 0,
        sessoes_count: sessionsRes.count || 0,
        financeiro_count: financialRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uso do Plano</CardTitle>
          <CardDescription>Carregando métricas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentPlan = userProfile.plano;
  const limits = PLAN_LIMITS[currentPlan];
  
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === Infinity) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const patientsPercentage = getUsagePercentage(usage?.pacientes_count || 0, limits.pacientes);
  const sessionsPercentage = getUsagePercentage(usage?.sessoes_count || 0, limits.sessoes);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Uso do Plano
        </CardTitle>
        <CardDescription>
          Acompanhe o uso dos recursos do seu plano {currentPlan}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Patients Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pacientes</span>
            </div>
            <Badge variant="outline" className={getUsageColor(patientsPercentage)}>
              {usage?.pacientes_count || 0}
              {limits.pacientes !== Infinity && ` / ${limits.pacientes}`}
            </Badge>
          </div>
          
          {limits.pacientes !== Infinity && (
            <Progress 
              value={patientsPercentage} 
              className="h-2"
              aria-label={`${patientsPercentage.toFixed(1)}% dos pacientes utilizados`}
            />
          )}
          
          <p className="text-xs text-muted-foreground">
            {limits.pacientes === Infinity ? 
              'Pacientes ilimitados' : 
              `${(100 - patientsPercentage).toFixed(1)}% disponível`
            }
          </p>
        </div>

        {/* Sessions Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sessões (mês)</span>
            </div>
            <Badge variant="outline" className={getUsageColor(sessionsPercentage)}>
              {usage?.sessoes_count || 0}
              {limits.sessoes !== Infinity && ` / ${limits.sessoes}`}
            </Badge>
          </div>
          
          {limits.sessoes !== Infinity && (
            <Progress 
              value={sessionsPercentage} 
              className="h-2"
              aria-label={`${sessionsPercentage.toFixed(1)}% das sessões utilizadas`}
            />
          )}
          
          <p className="text-xs text-muted-foreground">
            {limits.sessoes === Infinity ? 
              'Sessões ilimitadas' : 
              `${(100 - sessionsPercentage).toFixed(1)}% disponível`
            }
          </p>
        </div>

        {/* Financial Records */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Registros Financeiros</span>
            </div>
            <Badge variant="outline">
              {usage?.financeiro_count || 0} este mês
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Registros de pagamentos e recebimentos
          </p>
        </div>

        {/* Upgrade Notice */}
        {(patientsPercentage > 80 || sessionsPercentage > 80) && currentPlan !== 'pro' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Você está próximo do limite do seu plano. 
              Considere fazer upgrade para continuar usando todos os recursos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}