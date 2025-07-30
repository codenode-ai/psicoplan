
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus } from 'lucide-react';

interface EmptyFinancialStateProps {
  onAddRecord: () => void;
  monthName: string;
  year: number;
}

export function EmptyFinancialState({ onAddRecord, monthName, year }: EmptyFinancialStateProps) {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <DollarSign className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">Nenhum registro financeiro</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-6">
          Você ainda não possui registros financeiros para {monthName} de {year}.
          <br />
          Comece adicionando seu primeiro registro.
        </p>
        <Button onClick={onAddRecord} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Primeiro Registro
        </Button>
      </CardContent>
    </Card>
  );
}
