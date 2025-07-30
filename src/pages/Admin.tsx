
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Activity, TrendingUp, Search, Edit, Archive } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard } from '@/components/ui/stats-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserEditForm } from '@/components/admin/UserEditForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: isAdmin
  });

  const { data: systemStats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const [usersRes, patientsRes, sessionsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('archived', false),
        supabase.from('pacientes').select('id', { count: 'exact' }).eq('status', 'ativo'),
        supabase.from('sessoes').select('id', { count: 'exact' }).eq('status', 'realizada')
      ]);

      return {
        totalUsers: usersRes.count || 0,
        totalPatients: patientsRes.count || 0,
        totalSessions: sessionsRes.count || 0,
      };
    },
    enabled: isAdmin
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userId);
      
      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: 'Updated user',
        target_user_id: userId,
        action_details: { updates }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso."
      });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive"
      });
    }
  });

  if (!isAdmin) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar o painel administrativo.
              </p>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleArchiveUser = (userId: string) => {
    if (confirm('Tem certeza que deseja arquivar este usuário?')) {
      updateUserMutation.mutate({
        userId,
        updates: { archived: true }
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-purple-100 text-purple-800';
      case 'plus': return 'bg-green-100 text-green-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Gerenciar usuários e visualizar estatísticas do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <Badge variant="outline">
              {userProfile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total de Usuários"
            value={systemStats?.totalUsers || 0}
            description="Usuários ativos"
            icon={Users}
          />
          
          <StatsCard
            title="Total de Pacientes"
            value={systemStats?.totalPatients || 0}
            description="Pacientes cadastrados"
            icon={Activity}
          />
          
          <StatsCard
            title="Sessões Realizadas"
            value={systemStats?.totalSessions || 0}
            description="Total de sessões"
            icon={TrendingUp}
          />
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando usuários...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.nome_completo}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanColor(user.plano)}>
                          {user.plano}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Usuário</DialogTitle>
                              </DialogHeader>
                              <UserEditForm 
                                user={selectedUser} 
                                onSave={(updates) => {
                                  if (selectedUser) {
                                    updateUserMutation.mutate({
                                      userId: selectedUser.user_id,
                                      updates
                                    });
                                  }
                                }}
                                canEditRole={isSuperAdmin}
                              />
                            </DialogContent>
                          </Dialog>
                          
                          {user.user_id !== userProfile?.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchiveUser(user.user_id)}
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
