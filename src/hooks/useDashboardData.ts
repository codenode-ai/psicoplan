
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionWithPatient } from '@/types/database.types';
import { addDays, startOfMonth } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { getLocalDayRange } from '@/utils/dateUtils';

interface DashboardStats {
  pacientesAtivos: number;
  sessoesHoje: number;
  proximasSessoes: SessionWithPatient[];
  faturamentoMes: number;
  sessoesMes: number;
}

export function useDashboardData(userId?: string) {
  const [stats, setStats] = useState<DashboardStats>({
    pacientesAtivos: 0,
    sessoesHoje: 0,
    proximasSessoes: [],
    faturamentoMes: 0,
    sessoesMes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!userId) {
      console.log('❌ Dashboard: userId is undefined');
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    console.log('🔄 Dashboard: Iniciando busca de dados para usuário:', userId);

    try {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      const { start: startOfToday, end: endOfToday } = getLocalDayRange(today);
      const nextWeek = addDays(today, 7);
      const startOfThisMonth = startOfMonth(today);

      // Consultas com Promise.allSettled para capturar falhas individuais
      const results = await Promise.allSettled([
        // Pacientes ativos apenas
        supabase
          .from('pacientes')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'ativo'),

        // Sessões hoje - only from active patients
        supabase
          .from('sessoes')
          .select(`
            id,
            paciente:pacientes!inner(status)
          `)
          .eq('user_id', userId)
          .eq('paciente.status', 'ativo')
          .gte('data_hora', startOfToday)
          .lte('data_hora', endOfToday),

        // Próximas sessões - only from active patients
        supabase
          .from('sessoes')
          .select(`
            id,
            user_id,
            paciente_id,
            data_hora,
            tipo,
            status,
            created_at,
            updated_at,
            paciente:pacientes!inner(nome_completo, status)
          `)
          .eq('user_id', userId)
          .eq('status', 'agendada')
          .eq('paciente.status', 'ativo')
          .gte('data_hora', today.toISOString())
          .lte('data_hora', nextWeek.toISOString())
          .order('data_hora', { ascending: true })
          .limit(5),

        // Financeiro do mês - only from active patients
        supabase
          .from('financeiro')
          .select(`
            valor,
            paciente:pacientes!inner(status)
          `)
          .eq('user_id', userId)
          .eq('paciente.status', 'ativo')
          .gte('data_recebimento', startOfThisMonth.toISOString()),

        // Sessões do mês - only from active patients
        supabase
          .from('sessoes')
          .select(`
            id,
            paciente:pacientes!inner(status)
          `)
          .eq('user_id', userId)
          .eq('status', 'realizada')
          .eq('paciente.status', 'ativo')
          .gte('data_hora', startOfThisMonth.toISOString())
      ]);

      const [
        patientsResult,
        todaySessionsResult,
        upcomingSessionsResult,
        monthlyFinancialsResult,
        monthlySessionsResult
      ] = results;

      // Log de resultados individuais
      console.log('📊 Dashboard resultados:', {
        pacientesAtivos: patientsResult.status === 'fulfilled' ? patientsResult.value.data?.length : 'erro',
        sessoesHoje: todaySessionsResult.status === 'fulfilled' ? todaySessionsResult.value.data?.length : 'erro',
        proximasSessoes: upcomingSessionsResult.status === 'fulfilled' ? upcomingSessionsResult.value.data?.length : 'erro',
        financeiro: monthlyFinancialsResult.status === 'fulfilled' ? monthlyFinancialsResult.value.data?.length : 'erro',
        sessoesMes: monthlySessionsResult.status === 'fulfilled' ? monthlySessionsResult.value.data?.length : 'erro'
      });

      // Extrair dados com fallbacks
      const pacientesAtivos = patientsResult.status === 'fulfilled' && patientsResult.value.data 
        ? patientsResult.value.data.length 
        : 0;

      const sessoesHoje = todaySessionsResult.status === 'fulfilled' && todaySessionsResult.value.data
        ? todaySessionsResult.value.data.length 
        : 0;

      const proximasSessoes = upcomingSessionsResult.status === 'fulfilled' && upcomingSessionsResult.value.data
        ? upcomingSessionsResult.value.data 
        : [];

      const faturamentoMes = monthlyFinancialsResult.status === 'fulfilled' && monthlyFinancialsResult.value.data
        ? monthlyFinancialsResult.value.data.reduce((total: number, record: any) => total + Number(record.valor), 0)
        : 0;

      const sessoesMes = monthlySessionsResult.status === 'fulfilled' && monthlySessionsResult.value.data
        ? monthlySessionsResult.value.data.length 
        : 0;

      // Log erros individuais
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const queries = ['pacientes ativos', 'sessões hoje', 'próximas sessões', 'financeiro', 'sessões do mês'];
          console.error(`❌ Falha na consulta ${queries[index]}:`, result.reason);
        }
      });

      setStats({
        pacientesAtivos,
        sessoesHoje,
        proximasSessoes,
        faturamentoMes,
        sessoesMes,
      });

      console.log('✅ Dashboard: Dados carregados com sucesso');

    } catch (error) {
      console.error('❌ Dashboard: Erro geral:', error);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  return { stats, loading, error, refetch: fetchDashboardData };
}
