
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/responsive-table';
import { SessionCard } from './SessionCard';
import { SessionWithPatient } from '@/types/database.types';
import { Video, MapPin, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface SessionListProps {
  sessions: SessionWithPatient[];
  onEditSession: (session: SessionWithPatient) => void;
  onStatusUpdate: (sessionId: string, status: string) => void;
  isLoading: boolean;
}

export function SessionList({ sessions, onEditSession, onStatusUpdate, isLoading }: SessionListProps) {
  const { isMobile } = useBreakpoint();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-100 text-blue-800';
      case 'realizada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'online' ? Video : MapPin;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Carregando sessões...</div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma sessão encontrada.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Todas as Sessões</h2>
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onEditSession={onEditSession}
              onStatusUpdate={onStatusUpdate}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todas as Sessões ({sessions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveTable>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const TypeIcon = getTypeIcon(session.tipo);
              const sessionDate = new Date(session.data_hora);
              const isToday = sessionDate.toDateString() === new Date().toDateString();
              const isPast = sessionDate < new Date();
              
              return (
                <TableRow key={session.id} className={isToday ? 'bg-blue-50' : isPast ? 'opacity-75' : ''}>
                  <TableCell className="font-medium">
                    {session.paciente?.nome_completo}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className={`text-sm ${isToday ? 'font-semibold text-blue-600' : ''}`}>
                        {sessionDate.toLocaleDateString('pt-BR')}
                        {isToday && ' (Hoje)'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sessionDate.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4" />
                      <Badge variant="outline">
                        {session.tipo}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditSession(session)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {session.status === 'agendada' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusUpdate(session.id, 'realizada')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusUpdate(session.id, 'cancelada')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </ResponsiveTable>
      </CardContent>
    </Card>
  );
}
