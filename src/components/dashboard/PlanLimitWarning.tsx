
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface PlanLimitWarningProps {
  currentCount: number;
  planLimit: number;
  planName: string;
}

export function PlanLimitWarning({ currentCount, planLimit, planName }: PlanLimitWarningProps) {
  return (
    <Card className="border-warning/20 bg-warning-light">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertCircle className="w-5 h-5" />
          Atenção: Limite do Plano
        </CardTitle>
        <CardDescription>
          Você está próximo do limite de pacientes para o plano {planName}. 
          ({currentCount}/{planLimit} pacientes)
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
