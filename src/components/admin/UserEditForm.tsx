
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/database.types';

const userEditSchema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  plano: z.enum(['free', 'plus', 'pro']),
  role: z.enum(['user', 'admin', 'super_admin']).optional(),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

interface UserEditFormProps {
  user: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => void;
  canEditRole: boolean;
}

export function UserEditForm({ user, onSave, canEditRole }: UserEditFormProps) {
  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      nome_completo: user?.nome_completo || '',
      plano: user?.plano || 'free',
      role: user?.role || 'user',
    }
  });

  const onSubmit = (data: UserEditFormData) => {
    const updates: Partial<UserProfile> = {
      nome_completo: data.nome_completo,
      plano: data.plano,
    };

    if (canEditRole && data.role) {
      updates.role = data.role;
    }

    onSave(updates);
  };

  if (!user) return null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nome_completo">Nome Completo</Label>
        <Input
          id="nome_completo"
          {...form.register('nome_completo')}
        />
        {form.formState.errors.nome_completo && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.nome_completo.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email (somente leitura)</Label>
        <Input
          id="email"
          value={user.email}
          disabled
          className="bg-muted"
        />
      </div>

      <div>
        <Label htmlFor="plano">Plano</Label>
        <Select 
          value={form.watch('plano')} 
          onValueChange={(value) => form.setValue('plano', value as 'free' | 'plus' | 'pro')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="plus">Plus</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {canEditRole && (
        <div>
          <Label htmlFor="role">Papel</Label>
          <Select 
            value={form.watch('role')} 
            onValueChange={(value) => form.setValue('role', value as 'user' | 'admin' | 'super_admin')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuário</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
