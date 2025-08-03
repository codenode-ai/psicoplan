
import { StatsCard } from '@/components/ui/stats-card';
import { Users, Calendar, DollarSign, Clock } from 'lucide-react';

interface DashboardStatsProps {
  totalPacientes: number;
  sessoesMes: number;
  receitaMes: number;
  proximasSessoes: number;
  isNearLimit?: boolean;
}

export function DashboardStats({
  totalPacientes,
  sessoesMes,
  receitaMes,
  proximasSessoes,
  isNearLimit = false
}: DashboardStatsProps) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total de Pacientes"
        value={totalPacientes}
        description="Pacientes cadastrados"
        icon={Users}
        className={isNearLimit ? 'ring-2 ring-warning/20' : ''}
      />
      
      <StatsCard
        title="Sessões do Mês"
        value={sessoesMes}
        description="Sessões realizadas"
        icon={Calendar}
      />
      
      <StatsCard
        title="Receita do Mês"
        value={`R$ ${receitaMes.toLocaleString('pt-BR')}`}
        description="Faturamento mensal"
        icon={DollarSign}
      />
      
      <StatsCard
        title="Próximas Sessões"
        value={proximasSessoes}
        description="Nos próximos 7 dias"
        icon={Clock}
      />
    </div>
  );
}
