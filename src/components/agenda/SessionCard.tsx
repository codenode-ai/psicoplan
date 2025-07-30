
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SessionWithPatient } from '@/types/database.types';
import { Video, MapPin, Edit, CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface SessionCardProps {
  session: SessionWithPatient;
  onEditSession: (session: SessionWithPatient) => void;
  onStatusUpdate: (sessionId: string, status: string) => void;
}

export function SessionCard({ session, onEditSession, onStatusUpdate }: SessionCardProps) {
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

  const TypeIcon = getTypeIcon(session.tipo);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">
                {session.paciente?.nome_completo}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditSession(session)}
              className="flex-shrink-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(session.data_hora).toLocaleDateString('pt-BR')} às{' '}
              {new Date(session.data_hora).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Type and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TypeIcon className="w-4 h-4" />
              <Badge variant="outline">
                {session.tipo}
              </Badge>
            </div>
            <Badge className={getStatusColor(session.status)}>
              {session.status}
            </Badge>
          </div>

          {/* Actions */}
          {session.status === 'agendada' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate(session.id, 'realizada')}
                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Realizada
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate(session.id, 'cancelada')}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
