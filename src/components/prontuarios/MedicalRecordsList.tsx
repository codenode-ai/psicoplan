
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicalRecord } from '@/types/database.types';
import { FileText, Edit, Calendar, User } from 'lucide-react';

interface MedicalRecordsListProps {
  records: MedicalRecord[];
  onEditRecord: (record: MedicalRecord) => void;
  isLoading: boolean;
}

export function MedicalRecordsList({ records, onEditRecord, isLoading }: MedicalRecordsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Carregando registros...</div>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Nenhum registro encontrado.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">
                    {(record.sessao as any)?.paciente?.nome_completo || 'Paciente não encontrado'}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(record.data_registro).toLocaleDateString('pt-BR')}
                    </div>
                    {record.sessao && (
                      <Badge variant="outline">
                        Sessão {record.sessao.tipo}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditRecord(record)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {record.anotacao}
              </p>
            </div>
            {record.sessao && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Sessão realizada em {' '}
                  {new Date(record.sessao.data_hora).toLocaleDateString('pt-BR')} às {' '}
                  {new Date(record.sessao.data_hora).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
