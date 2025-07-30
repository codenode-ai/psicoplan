import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, TrendingUp, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatsCard } from '@/components/ui/stats-card';
import { FinancialRecordForm } from '@/components/financeiro/FinancialRecordForm';
import { FinancialTable } from '@/components/financeiro/FinancialTable';
import { FinancialCharts } from '@/components/financeiro/FinancialCharts';
import { EmptyFinancialState } from '@/components/financeiro/EmptyFinancialState';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { supabase } from '@/integrations/supabase/client';
import { FinancialRecord } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Financeiro() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  console.log('💰 Financeiro render:', { 
    userId: user?.id, 
    selectedMonth, 
    selectedYear 
  });

  const { data: records = [], isLoading, error, refetch } = useQuery({
    queryKey: ['financial-records', selectedMonth, selectedYear, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      console.log('📊 Buscando registros financeiros:', { 
        userId: user.id, 
        period: `${monthNames[selectedMonth]}/${selectedYear}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const { data, error } = await supabase
        .from('financeiro')
        .select(`
          *,
          paciente:pacientes(nome_completo),
          sessao:sessoes(data_hora, tipo)
        `)
        .eq('user_id', user.id)
        .gte('data_recebimento', startDate.toISOString())
        .lte('data_recebimento', endDate.toISOString())
        .order('data_recebimento', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar registros financeiros:', error);
        throw error;
      }

      console.log('✅ Registros financeiros carregados:', data?.length || 0);
      return data as FinancialRecord[];
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 30000,
  });

  const { data: yearlyStats } = useQuery({
    queryKey: ['yearly-financial-stats', selectedYear, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31);

      const { data, error } = await supabase
        .from('financeiro')
        .select('valor, data_recebimento')
        .eq('user_id', user.id)
        .gte('data_recebimento', startDate.toISOString())
        .lte('data_recebimento', endDate.toISOString());
      
      if (error) throw error;

      const total = data.reduce((sum, record) => sum + Number(record.valor), 0);
      const monthlyData = Array(12).fill(0);
      
      data.forEach(record => {
        const month = new Date(record.data_recebimento).getMonth();
        monthlyData[month] += Number(record.valor);
      });

      return { total, monthlyData };
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 60000,
  });

  const currentMonthTotal = records.reduce((sum, record) => sum + Number(record.valor), 0);
  const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

  const { data: previousMonthTotal = 0 } = useQuery({
    queryKey: ['previous-month-total', previousMonth, previousYear, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const startDate = new Date(previousYear, previousMonth, 1);
      const endDate = new Date(previousYear, previousMonth + 1, 0);

      const { data, error } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data_recebimento', startDate.toISOString())
        .lte('data_recebimento', endDate.toISOString());
      
      if (error) throw error;
      return data.reduce((sum, record) => sum + Number(record.valor), 0);
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 60000,
  });

  const monthlyGrowth = previousMonthTotal > 0 
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
    : 0;

  const handleNewRecord = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: FinancialRecord) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  // Authentication error
  if (!user) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso não autorizado</h3>
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para acessar o controle financeiro.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Fazer Login
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Data loading error
  if (error) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar os registros financeiros.
            </p>
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <ErrorBoundary>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Controle Financeiro</h1>
              <p className="text-muted-foreground">
                {monthNames[selectedMonth]} {selectedYear}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewRecord}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Registro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedRecord ? 'Editar Registro' : 'Novo Registro'}
                    </DialogTitle>
                  </DialogHeader>
                  <ErrorBoundary>
                    <FinancialRecordForm 
                      record={selectedRecord} 
                      onSuccess={() => setIsFormOpen(false)} 
                    />
                  </ErrorBoundary>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <ErrorBoundary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                title="Faturamento do Mês"
                value={`R$ ${currentMonthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                description={`${records.length} registros`}
                icon={DollarSign}
                trend={{
                  value: Math.round(monthlyGrowth),
                  label: "vs mês anterior"
                }}
              />
              
              <StatsCard
                title="Faturamento do Ano"
                value={`R$ ${(yearlyStats?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                description={`Ano de ${selectedYear}`}
                icon={TrendingUp}
              />
              
              <StatsCard
                title="Média por Sessão"
                value={`R$ ${records.length > 0 ? (currentMonthTotal / records.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`}
                description="Valor médio"
                icon={Calendar}
              />
            </div>
          </ErrorBoundary>

          {/* Empty state or content */}
          {!isLoading && records.length === 0 ? (
            <EmptyFinancialState 
              onAddRecord={handleNewRecord}
              monthName={monthNames[selectedMonth]}
              year={selectedYear}
            />
          ) : (
            <Tabs defaultValue="records" className="space-y-4">
              <TabsList>
                <TabsTrigger value="records">Registros</TabsTrigger>
                <TabsTrigger value="charts">Relatórios</TabsTrigger>
              </TabsList>

              <TabsContent value="records">
                <ErrorBoundary>
                  <FinancialTable 
                    records={records}
                    onEditRecord={handleEditRecord}
                    isLoading={isLoading}
                  />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="charts">
                <ErrorBoundary>
                  <FinancialCharts 
                    monthlyData={yearlyStats?.monthlyData || []}
                    records={records}
                    year={selectedYear}
                  />
                </ErrorBoundary>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </ErrorBoundary>
    </AuthLayout>
  );
}
