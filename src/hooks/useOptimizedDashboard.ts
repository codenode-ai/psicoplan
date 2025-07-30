import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DashboardMetrics {
  total_pacientes: number;
  sessoes_mes: number;
  receita_mes: number;
  proximas_sessoes: number;
}

export function useOptimizedDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async (useCache = true) => {
    if (!user) return;
    
    // Cache for 5 minutes
    if (useCache && lastUpdated && Date.now() - lastUpdated.getTime() < 5 * 60 * 1000) {
      return;
    }

    setLoading(true);
    try {
      // Use the optimized database function
      const { data, error } = await supabase.rpc('get_dashboard_metrics', {
        target_user_id: user.id
      });

      if (error) throw error;
      
      setMetrics(data as unknown as DashboardMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar métricas do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = () => {
    fetchMetrics(false);
  };

  useEffect(() => {
    if (user) {
      fetchMetrics();
      
      // Set up real-time subscriptions for data changes
      const channel = supabase
        .channel('dashboard_updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'pacientes' }, 
          () => refreshMetrics()
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'sessoes' }, 
          () => refreshMetrics()
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'financeiro' }, 
          () => refreshMetrics()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    metrics,
    loading,
    lastUpdated,
    refreshMetrics,
    fetchMetrics
  };
}