import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SmartSelect, SmartSelectItem } from '@/components/ui/smart-select';
import { supabase } from '@/integrations/supabase/client';
import { SessionWithPatient, Patient } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { localDateTimeToUTC, utcToLocalDateTime } from '@/utils/dateUtils';

const sessionSchema = z.object({
  paciente_id: z.string().min(1, 'Selecione um paciente'),
  data_hora: z.string().min(1, 'Data e hora são obrigatórias'),
  tipo: z.enum(['presencial', 'online']),
  status: z.enum(['agendada', 'realizada', 'cancelada']),
  link: z.string().optional(),
  observacoes: z.string().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  session?: SessionWithPatient | null;
  onSuccess: () => void;
  defaultDate?: Date;
}

export function SessionForm({ session, onSuccess, defaultDate }: SessionFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const debounceRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

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
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
    refetchOnWindowFocus: false,
  });

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      paciente_id: session?.paciente_id || '',
      data_hora: session?.data_hora 
        ? utcToLocalDateTime(session.data_hora)
        : defaultDate 
          ? utcToLocalDateTime(defaultDate.toISOString())
          : '',
      tipo: session?.tipo || 'presencial',
      status: session?.status || 'agendada',
      link: session?.link || '',
      observacoes: session?.observacoes || '',
    }
  });

  const selectedTipo = form.watch('tipo');

  const mutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      const sessionData = {
        paciente_id: data.paciente_id,
        data_hora: localDateTimeToUTC(data.data_hora),
        tipo: data.tipo,
        status: data.status,
        link: data.link || null,
        observacoes: data.observacoes || null,
        user_id: user?.id || ''
      };

      if (session) {
        const { error } = await supabase
          .from('sessoes')
          .update(sessionData)
          .eq('id', session.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sessoes')
          .insert(sessionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['all-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['day-sessions'] });
      toast({
        title: session ? "Sessão atualizada" : "Sessão agendada",
        description: session 
          ? "Sessão foi atualizada com sucesso."
          : "Nova sessão foi agendada com sucesso."
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error saving session:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a sessão.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SessionFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="paciente_id">Paciente *</Label>
          <SmartSelect 
            value={form.watch('paciente_id')} 
            onValueChange={(value) => {
              if (debounceRef.current.paciente) {
                clearTimeout(debounceRef.current.paciente);
              }
              debounceRef.current.paciente = setTimeout(() => {
                form.setValue('paciente_id', value);
              }, 100);
            }}
            placeholder="Selecione um paciente"
          >
            {patients.map((patient) => (
              <SmartSelectItem key={patient.id} value={patient.id}>
                {patient.nome_completo}
              </SmartSelectItem>
            ))}
          </SmartSelect>
          {form.formState.errors.paciente_id && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.paciente_id.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="data_hora">Data e Hora *</Label>
          <Input
            id="data_hora"
            type="datetime-local"
            {...form.register('data_hora')}
          />
          {form.formState.errors.data_hora && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.data_hora.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="tipo">Tipo *</Label>
          <SmartSelect 
            value={form.watch('tipo')} 
            onValueChange={(value) => {
              if (debounceRef.current.tipo) {
                clearTimeout(debounceRef.current.tipo);
              }
              debounceRef.current.tipo = setTimeout(() => {
                form.setValue('tipo', value as 'presencial' | 'online');
              }, 100);
            }}
          >
            <SmartSelectItem value="presencial">Presencial</SmartSelectItem>
            <SmartSelectItem value="online">Online</SmartSelectItem>
          </SmartSelect>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <SmartSelect 
            value={form.watch('status')} 
            onValueChange={(value) => {
              if (debounceRef.current.status) {
                clearTimeout(debounceRef.current.status);
              }
              debounceRef.current.status = setTimeout(() => {
                form.setValue('status', value as 'agendada' | 'realizada' | 'cancelada');
              }, 100);
            }}
          >
            <SmartSelectItem value="agendada">Agendada</SmartSelectItem>
            <SmartSelectItem value="realizada">Realizada</SmartSelectItem>
            <SmartSelectItem value="cancelada">Cancelada</SmartSelectItem>
          </SmartSelect>
        </div>

        {selectedTipo === 'online' && (
          <div>
            <Label htmlFor="link">Link da Sessão</Label>
            <Input
              id="link"
              {...form.register('link')}
              placeholder="https://meet.google.com/..."
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...form.register('observacoes')}
          placeholder="Observações sobre a sessão..."
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
            : session ? 'Atualizar' : 'Agendar Sessão'
          }
        </Button>
      </div>
    </form>
  );
}
