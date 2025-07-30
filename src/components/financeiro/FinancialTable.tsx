
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FinancialRecord } from '@/types/database.types';
import { Edit, DollarSign } from 'lucide-react';

interface FinancialTableProps {
  records: FinancialRecord[];
  onEditRecord: (record: FinancialRecord) => void;
  isLoading: boolean;
}

export function FinancialTable({ records, onEditRecord, isLoading }: FinancialTableProps) {
  const paymentMethods = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX',
    transferencia: 'Transferência',
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'pix': return 'bg-green-100 text-green-800';
      case 'cartao_credito': return 'bg-blue-100 text-blue-800';
      case 'cartao_debito': return 'bg-purple-100 text-purple-800';
      case 'dinheiro': return 'bg-yellow-100 text-yellow-800';
      case 'transferencia': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            Nenhum registro financeiro encontrado.
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = records.reduce((sum, record) => sum + Number(record.valor), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Registros Financeiros</CardTitle>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-bold">
              Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Sessão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  {record.paciente?.nome_completo}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-green-600">
                    R$ {Number(record.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {new Date(record.data_recebimento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.data_recebimento).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getPaymentMethodColor(record.forma_pagamento)}>
                    {paymentMethods[record.forma_pagamento]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {record.sessao ? (
                    <div className="text-sm">
                      <div>
                        {new Date(record.sessao.data_hora).toLocaleDateString('pt-BR')}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {record.sessao.tipo}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Avulso</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditRecord(record)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
