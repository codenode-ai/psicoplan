
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Tag } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable, MobileCard } from '@/components/ui/responsive-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PatientForm } from '@/components/patients/PatientForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Patient } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const { isMobile } = useBreakpoint();

  const { data: patients = [], isLoading } = useQuery({
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

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('pacientes')
        .update({ status: 'inativo' })
        .eq('id', patientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: "Paciente arquivado",
        description: "Paciente foi arquivado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao arquivar",
        description: "Não foi possível arquivar o paciente.",
        variant: "destructive"
      });
    }
  });

  const filteredPatients = patients.filter(patient =>
    patient.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };

  const handleDeletePatient = (patientId: string) => {
    if (confirm('Tem certeza que deseja arquivar este paciente?')) {
      deletePatientMutation.mutate(patientId);
    }
  };

  const planLimits = {
    free: 5,
    plus: 50,
    pro: Infinity
  };

  const currentLimit = planLimits[userProfile?.plano || 'free'];
  const isAtLimit = patients.length >= currentLimit;

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground">
              {patients.length}/{currentLimit === Infinity ? '∞' : currentLimit} pacientes
            </p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewPatient} disabled={isAtLimit}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedPatient ? 'Editar Paciente' : 'Novo Paciente'}
                </DialogTitle>
              </DialogHeader>
              <PatientForm 
                patient={selectedPatient} 
                onSuccess={() => setIsFormOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {isAtLimit && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <p className="text-orange-700">
                Você atingiu o limite de pacientes do seu plano. 
                <Button variant="link" className="p-0 ml-1">
                  Faça upgrade para adicionar mais pacientes.
                </Button>
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando pacientes...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado.'}
              </div>
            ) : (
              <ResponsiveTable>
                {isMobile ? (
                  <div className="space-y-3">
                    {filteredPatients.map((patient) => (
                      <MobileCard key={patient.id}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-base leading-tight">{patient.nome_completo}</h3>
                            <div className="mt-2 space-y-1">
                              {patient.telefone && (
                                <p className="text-sm text-muted-foreground">{patient.telefone}</p>
                              )}
                              {patient.email && (
                                <p className="text-sm text-muted-foreground">{patient.email}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPatient(patient)}
                              className="min-h-[44px] min-w-[44px] p-2"
                              aria-label="Editar paciente"
                            >
                              <Edit className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePatient(patient.id)}
                              className="min-h-[44px] min-w-[44px] p-2"
                              aria-label="Arquivar paciente"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                        {patient.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mb-2">
                            {patient.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {patient.data_nascimento && (
                          <p className="text-sm text-muted-foreground">
                            Nascimento: {new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </MobileCard>
                    ))}
                  </div>
                ) : (
                  <>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Data de Nascimento</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">
                            {patient.nome_completo}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {patient.telefone && (
                                <div className="text-sm">{patient.telefone}</div>
                              )}
                              {patient.email && (
                                <div className="text-sm text-muted-foreground">{patient.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {patient.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {patient.data_nascimento 
                              ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPatient(patient)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePatient(patient.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </>
                )}
              </ResponsiveTable>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
