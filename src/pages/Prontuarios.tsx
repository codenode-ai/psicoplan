
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, FileText, User, Calendar } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MedicalRecordForm } from '@/components/prontuarios/MedicalRecordForm';
import { MedicalRecordsList } from '@/components/prontuarios/MedicalRecordsList';
import { supabase } from '@/integrations/supabase/client';
import { MedicalRecord, Patient } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';

export default function Prontuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const queryClient = useQueryClient();

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

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['medical-records', selectedPatient],
    queryFn: async () => {
      let query = supabase
        .from('prontuarios')
        .select(`
          *,
          sessao:sessoes(
            id,
            data_hora,
            tipo,
            paciente:pacientes(nome_completo)
          )
        `)
        .order('data_registro', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data as any[]; // Temporarily using any to fix type issues
    }
  });

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.anotacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.sessao as any)?.paciente?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPatient = selectedPatient === 'all' || 
      (record.sessao as any)?.paciente_id === selectedPatient;
    
    return matchesSearch && matchesPatient;
  });

  const handleNewRecord = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const recordsByPatient = patients.map(patient => ({
    patient,
    records: filteredRecords.filter(record => 
      record.sessao?.paciente_id === patient.id
    )
  })).filter(item => item.records.length > 0);

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Prontuários</h1>
            <p className="text-muted-foreground">
              {filteredRecords.length} registros encontrados
            </p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewRecord}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedRecord ? 'Editar Registro' : 'Novo Registro'}
                </DialogTitle>
              </DialogHeader>
              <MedicalRecordForm 
                record={selectedRecord} 
                onSuccess={() => setIsFormOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar registros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="by-patient">Por Paciente</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <MedicalRecordsList 
              records={filteredRecords}
              onEditRecord={handleEditRecord}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="by-patient">
            <div className="space-y-6">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">Carregando registros...</div>
                  </CardContent>
                </Card>
              ) : recordsByPatient.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                recordsByPatient.map(({ patient, records }) => (
                  <Card key={patient.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {patient.nome_completo}
                        <Badge variant="secondary">{records.length} registros</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {records.map((record) => (
                          <div
                            key={record.id}
                            className="p-4 border rounded-lg hover:bg-secondary/50 cursor-pointer"
                            onClick={() => handleEditRecord(record)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {new Date(record.data_registro).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              {record.sessao && (
                                <Badge variant="outline">
                                  Sessão {record.sessao.tipo}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm line-clamp-3">{record.anotacao}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  );
}
