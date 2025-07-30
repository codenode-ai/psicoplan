
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionWithPatient } from '@/types/database.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UpcomingSessionsProps {
  sessions: SessionWithPatient[];
}

export function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Próximas Sessões
          <Link to="/agenda">
            <Button variant="outline" size="sm">
              Ver todas
            </Button>
          </Link>
        </CardTitle>
        <CardDescription>
          Suas próximas sessões agendadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">
                    {session.paciente?.nome_completo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.data_hora), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    session.tipo === 'online' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-accent/10 text-accent'
                  }`}>
                    {session.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma sessão agendada nos próximos dias
          </p>
        )}
      </CardContent>
    </Card>
  );
}
