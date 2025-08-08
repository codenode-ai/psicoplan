import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable, MobileCard } from '@/components/ui/responsive-table';
import { FinancialRecord } from '@/types/database.types';
import { Edit, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface ResponsiveFinancialTableProps {
  records: FinancialRecord[];
  onEditRecord: (record: FinancialRecord) => void;
  isLoading: boolean;
}

export function ResponsiveFinancialTable({ records, onEditRecord, isLoading }: ResponsiveFinancialTableProps) {
  const { isMobile } = useBreakpoint();
  
  const paymentMethods = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX',
    transferencia: 'Transferência',
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'pix': return 'bg-success-light text-success border-success/20';
      case 'cartao_credito': return 'bg-primary-light text-primary border-primary/20';
      case 'cartao_debito': return 'bg-secondary text-secondary-foreground border-border';
      case 'dinheiro': return 'bg-warning-light text-warning border-warning/20';
      case 'transferencia': return 'bg-accent-light text-accent border-accent/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">Carregando registros...</div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg sm:text-xl">Registros Financeiros</CardTitle>
          <div className="flex items-center gap-2 text-success">
            <DollarSign className="w-4 h-4" />
            <span className="font-bold text-sm sm:text-base">
              Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveTable>
          {isMobile ? (
            // Mobile Cards View
            <div className="space-y-4">
              {records.map((record) => (
                <MobileCard key={record.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="font-medium text-foreground">
                        {record.paciente?.nome_completo}
                      </div>
                      <div className="text-xl font-bold text-success">
                        R$ {Number(record.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRecord(record)}
                      className="h-9 w-9 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(record.data_recebimento).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(record.data_recebimento).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <Badge className={`${getPaymentMethodColor(record.forma_pagamento)} text-xs`}>
                      {paymentMethods[record.forma_pagamento]}
                    </Badge>
                  </div>
                  
                  {record.sessao && (
                    <div className="text-sm text-muted-foreground border-t pt-2">
                      <div>Sessão: {new Date(record.sessao.data_hora).toLocaleDateString('pt-BR')}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {record.sessao.tipo}
                      </Badge>
                    </div>
                  )}
                </MobileCard>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Sessão</TableHead>
                  <TableHead className="w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.paciente?.nome_completo}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-success">
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
                        className="h-9 w-9 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ResponsiveTable>
      </CardContent>
    </Card>
  );
}