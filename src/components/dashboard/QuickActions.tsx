
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, DollarSign } from 'lucide-react';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>
          Acesso rápido às principais funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link to="/pacientes" className="block">
          <Button variant="outline" className="w-full justify-start gap-3">
            <Plus className="w-4 h-4" />
            Adicionar Paciente
          </Button>
        </Link>
        
        <Link to="/agenda" className="block">
          <Button variant="outline" className="w-full justify-start gap-3">
            <Calendar className="w-4 h-4" />
            Agendar Sessão
          </Button>
        </Link>
        
        <Link to="/prontuarios" className="block">
          <Button variant="outline" className="w-full justify-start gap-3">
            <FileText className="w-4 h-4" />
            Novo Prontuário
          </Button>
        </Link>
        
        <Link to="/financeiro" className="block">
          <Button variant="outline" className="w-full justify-start gap-3">
            <DollarSign className="w-4 h-4" />
            Registrar Pagamento
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
