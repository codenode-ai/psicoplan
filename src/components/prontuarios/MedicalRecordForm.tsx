
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { MedicalRecord, SessionWithPatient } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const recordSchema = z.object({
  sessao_id: z.string().min(1, 'Selecione uma sessão'),
  anotacao: z.string().min(10, 'Anotação deve ter pelo menos 10 caracteres'),
  data_registro: z.string().min(1, 'Data é obrigatória'),
});

type RecordFormData = z.infer<typeof recordSchema>;

interface MedicalRecordFormProps {
  record?: MedicalRecord | null;
  onSuccess: () => void;
}

export function MedicalRecordForm({ record, onSuccess }: MedicalRecordFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-for-records'],
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

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      sessao_id: record?.sessao_id || '',
      anotacao: record?.anotacao || '',
      data_registro: record?.data_registro 
        ? new Date(record.data_registro).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: RecordFormData) => {
      const recordData = {
        sessao_id: data.sessao_id,
        anotacao: data.anotacao,
        data_registro: new Date(data.data_registro).toISOString(),
        user_id: user?.id || ''
      };

      if (record) {
        const { error } = await supabase
          .from('prontuarios')
          .update(recordData)
          .eq('id', record.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prontuarios')
          .insert(recordData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      toast({
        title: record ? "Registro atualizado" : "Registro criado",
        description: record 
          ? "Registro foi atualizado com sucesso."
          : "Novo registro foi criado com sucesso."
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error saving record:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o registro.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: RecordFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sessao_id">Sessão *</Label>
          <Select 
            value={form.watch('sessao_id')} 
            onValueChange={(value) => form.setValue('sessao_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma sessão" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.paciente?.nome_completo} - {' '}
                  {new Date(session.data_hora).toLocaleDateString('pt-BR')} {' '}
                  {new Date(session.data_hora).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.sessao_id && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.sessao_id.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="data_registro">Data do Registro *</Label>
          <input
            id="data_registro"
            type="datetime-local"
            {...form.register('data_registro')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.data_registro && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.data_registro.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="anotacao">Anotação *</Label>
        <Textarea
          id="anotacao"
          {...form.register('anotacao')}
          placeholder="Descreva as observações da sessão, evolução do paciente, técnicas utilizadas..."
          rows={10}
          className="min-h-[200px]"
        />
        {form.formState.errors.anotacao && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.anotacao.message}
          </p>
        )}
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
