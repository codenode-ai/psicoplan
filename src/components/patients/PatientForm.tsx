
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Patient, CreatePatientData } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const patientSchema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  data_nascimento: z.string().optional(),
  observacoes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient | null;
  onSuccess: () => void;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const [tags, setTags] = useState<string[]>(patient?.tags || []);
  const [newTag, setNewTag] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nome_completo: patient?.nome_completo || '',
      cpf: patient?.cpf || '',
      telefone: patient?.telefone || '',
      email: patient?.email || '',
      data_nascimento: patient?.data_nascimento || '',
      observacoes: patient?.observacoes || '',
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const patientData = {
        nome_completo: data.nome_completo,
        cpf: data.cpf || null,
        telefone: data.telefone || null,
        email: data.email || null,
        data_nascimento: data.data_nascimento || null,
        observacoes: data.observacoes || null,
        tags,
        status: 'ativo' as const,
        user_id: user?.id || ''
      };

      if (patient) {
        const { error } = await supabase
          .from('pacientes')
          .update(patientData)
          .eq('id', patient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pacientes')
          .insert(patientData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: patient ? "Paciente atualizado" : "Paciente criado",
        description: patient 
          ? "Dados do paciente foram atualizados com sucesso."
          : "Novo paciente foi cadastrado com sucesso."
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error saving patient:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o paciente.",
        variant: "destructive"
      });
    }
  });

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = (data: PatientFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <Input
            id="nome_completo"
            {...form.register('nome_completo')}
            placeholder="Nome completo do paciente"
          />
          {form.formState.errors.nome_completo && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.nome_completo.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            {...form.register('cpf')}
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <Label htmlFor="data_nascimento">Data de Nascimento</Label>
          <Input
            id="data_nascimento"
            type="date"
            {...form.register('data_nascimento')}
          />
        </div>

        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            {...form.register('telefone')}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="email@exemplo.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Adicionar tag"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-sm">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => removeTag(tag)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...form.register('observacoes')}
          placeholder="Observações sobre o paciente..."
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
            : patient ? 'Atualizar' : 'Criar Paciente'
          }
        </Button>
      </div>
    </form>
  );
}
