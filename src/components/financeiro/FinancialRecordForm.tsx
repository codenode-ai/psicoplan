import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FinancialRecord, Patient, SessionWithPatient } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { localDateTimeToUTC, utcToLocalDateTime } from '@/utils/dateUtils';

const financialSchema = z.object({
  paciente_id: z.string().min(1, 'Selecione um paciente'),
  sessao_id: z.string().optional(),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data_recebimento: z.string().min(1, 'Data é obrigatória'),
  forma_pagamento: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia']),
  observacoes: z.string().optional(),
});

type FinancialFormData = z.infer<typeof financialSchema>;

interface FinancialRecordFormProps {
  record?: FinancialRecord | null;
  onSuccess: () => void;
}

export function FinancialRecordForm({ record, onSuccess }: FinancialRecordFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('status', 'ativo')
        .order('nome_completo');
      
      if (error) throw error;
      return data as Patient[];
    }
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-for-financial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessoes')
        .select(`
          *,
          paciente:pacientes(nome_completo)
        `)
        .eq('status', 'realizada')
        .order('data_hora', { ascending: false });
      
      if (error) throw error;
      return data as SessionWithPatient[];
    }
  });

  const form = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      paciente_id: record?.paciente_id || '',
      sessao_id: record?.sessao_id || 'none',
      valor: record?.valor ? String(record.valor) : '',
      data_recebimento: record?.data_recebimento 
        ? utcToLocalDateTime(record.data_recebimento)
        : utcToLocalDateTime(new Date().toISOString()),
      forma_pagamento: record?.forma_pagamento || 'dinheiro',
      observacoes: record?.observacoes || '',
    }
  });

  const selectedPatientId = form.watch('paciente_id');
  const filteredSessions = sessions.filter(session => 
    session.paciente_id === selectedPatientId
  );

  const mutation = useMutation({
    mutationFn: async (data: FinancialFormData) => {
      const financialData = {
        paciente_id: data.paciente_id,
        sessao_id: data.sessao_id === 'none' ? null : data.sessao_id || null,
        valor: parseFloat(data.valor.replace(',', '.')),
        data_recebimento: localDateTimeToUTC(data.data_recebimento),
        forma_pagamento: data.forma_pagamento,
        observacoes: data.observacoes || null,
        user_id: user?.id || ''
      };

      if (record) {
        const { error } = await supabase
          .from('financeiro')
          .update(financialData)
          .eq('id', record.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('financeiro')
          .insert(financialData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-records'] });
      queryClient.invalidateQueries({ queryKey: ['yearly-financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['previous-month-total'] });
      toast({
        title: record ? "Registro atualizado" : "Registro criado",
        description: record 
          ? "Registro financeiro foi atualizado com sucesso."
          : "Novo registro financeiro foi criado com sucesso."
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error saving financial record:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o registro.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: FinancialFormData) => {
    mutation.mutate(data);
  };

  const paymentMethods = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX',
    transferencia: 'Transferência',
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paciente_id">Paciente *</Label>
          <Select 
            value={form.watch('paciente_id')} 
            onValueChange={(value) => {
              form.setValue('paciente_id', value);
              form.setValue('sessao_id', 'none');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.nome_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.paciente_id && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.paciente_id.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="sessao_id">Sessão (opcional)</Label>
          <Select 
            value={form.watch('sessao_id')} 
            onValueChange={(value) => form.setValue('sessao_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma sessão ou deixe em branco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma sessão</SelectItem>
              {filteredSessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {new Date(session.data_hora).toLocaleDateString('pt-BR')} - {session.tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="valor">Valor *</Label>
          <Input
            id="valor"
            {...form.register('valor')}
            placeholder="0,00"
            type="number"
            step="0.01"
          />
          {form.formState.errors.valor && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.valor.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="data_recebimento">Data do Recebimento *</Label>
          <input
            id="data_recebimento"
            type="datetime-local"
            {...form.register('data_recebimento')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.data_recebimento && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.data_recebimento.message}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
          <Select 
            value={form.watch('forma_pagamento')} 
            onValueChange={(value) => form.setValue('forma_pagamento', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(paymentMethods).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...form.register('observacoes')}
          placeholder="Observações sobre o pagamento..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending 
            ? 'Salvando...' 
            : record ? 'Atualizar' : 'Criar Registro'
          }
        </Button>
      </div>
    </form>
  );
}
