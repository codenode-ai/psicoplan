
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Video, MapPin } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SessionList } from '@/components/agenda/SessionList';
import { SessionCard } from '@/components/agenda/SessionCard';
import { supabase } from '@/integrations/supabase/client';
import { SessionWithPatient } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getLocalDayRange } from '@/utils/dateUtils';

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithPatient | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const queryClient = useQueryClient();
  const { isMobile, isTablet } = useBreakpoint();

  // Query for all sessions (used in list mode and for statistics) - only active patients
  const { data: allSessions = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessoes')
        .select(`
          *,
          paciente:pacientes!inner(nome_completo, status)
        `)
        .eq('paciente.status', 'ativo')
        .order('data_hora', { ascending: false });
      
      if (error) throw error;
      return data as SessionWithPatient[];
    }
  });

  // Query for sessions of selected date (used in calendar mode) - only active patients
  const { data: daySelectedSessions = [], isLoading: isLoadingDay } = useQuery({
    queryKey: ['day-sessions', selectedDate],
    queryFn: async () => {
      const { start, end } = getLocalDayRange(selectedDate);

      const { data, error } = await supabase
        .from('sessoes')
        .select(`
          *,
          paciente:pacientes!inner(nome_completo, status)
        `)
        .eq('paciente.status', 'ativo')
        .gte('data_hora', start)
        .lte('data_hora', end)
        .order('data_hora');
      
      if (error) throw error;
      return data as SessionWithPatient[];
    },
    enabled: viewMode === 'calendar'
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: 'agendada' | 'realizada' | 'cancelada' }) => {
      const { error } = await supabase
        .from('sessoes')
        .update({ status })
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['day-sessions'] });
      toast({
        title: "Status atualizado",
        description: "Status da sessão foi atualizado com sucesso."
      });
    }
  });

  // Statistics based on all sessions using proper timezone handling
  const todaySessions = allSessions.filter(session => {
    const sessionDate = new Date(session.data_hora);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  });

  const upcomingSessions = allSessions.filter(session => {
    const sessionDate = new Date(session.data_hora);
    const now = new Date();
    return sessionDate > now;
  });

  const onlineSessions = allSessions.filter(session => session.tipo === 'online');

  // Get the sessions to display based on view mode
  const displaySessions = viewMode === 'calendar' ? daySelectedSessions : allSessions;
  const isLoading = viewMode === 'calendar' ? isLoadingDay : isLoadingAll;

  const handleNewSession = () => {
    setSelectedSession(null);
    setIsFormOpen(true);
  };

  const handleEditSession = (session: SessionWithPatient) => {
    setSelectedSession(session);
    setIsFormOpen(true);
  };

  const handleStatusUpdate = (sessionId: string, status: 'agendada' | 'realizada' | 'cancelada') => {
    updateSessionMutation.mutate({ sessionId, status });
  };

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

  // Mobile layout: stack everything vertically
  if (isMobile) {
    return (
      <AuthLayout>
        <div className="space-y-6 p-4">
          <AgendaHeader
            todaySessionsCount={todaySessions.length}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isFormOpen={isFormOpen}
            setIsFormOpen={setIsFormOpen}
            selectedSession={selectedSession}
            handleNewSession={handleNewSession}
            selectedDate={selectedDate}
          />

          {viewMode === 'calendar' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Calendário</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border w-full"
                />
              </CardContent>
            </Card>
          )}

          {viewMode === 'calendar' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  {selectedDate.toLocaleDateString('pt-BR', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {isLoading ? (
                  <div className="text-center py-8">Carregando sessões...</div>
                ) : displaySessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma sessão agendada para este dia.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displaySessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onEditSession={handleEditSession}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <SessionList 
              sessions={displaySessions}
              onEditSession={handleEditSession}
              onStatusUpdate={handleStatusUpdate}
              isLoading={isLoading}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-xl font-bold">{todaySessions.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Próximas</p>
                  <p className="text-xl font-bold">{upcomingSessions.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Tablet and Desktop layout
  return (
    <AuthLayout>
      <div className="space-y-6">
        <AgendaHeader
          todaySessionsCount={todaySessions.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isFormOpen={isFormOpen}
          setIsFormOpen={setIsFormOpen}
          selectedSession={selectedSession}
          handleNewSession={handleNewSession}
          selectedDate={selectedDate}
        />

        <div className={`grid gap-6 ${viewMode === 'calendar' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {viewMode === 'calendar' && (
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Calendário</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          )}

          <div className={viewMode === 'calendar' ? 'lg:col-span-2' : 'col-span-1'}>
            {viewMode === 'calendar' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {selectedDate.toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Carregando sessões...</div>
                  ) : displaySessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma sessão agendada para este dia.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displaySessions.map((session) => {
                        const TypeIcon = getTypeIcon(session.tipo);
                        return (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                            onClick={() => handleEditSession(session)}
                          >
                            <div className="flex items-center gap-3">
                              <TypeIcon className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {session.paciente?.nome_completo}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(session.data_hora).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(session.status)}>
                                {session.status}
                              </Badge>
                              <Badge variant="outline">
                                {session.tipo}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <SessionList 
                sessions={displaySessions}
                onEditSession={handleEditSession}
                onStatusUpdate={handleStatusUpdate}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">{todaySessions.length}</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Próximas</p>
                  <p className="text-2xl font-bold">{upcomingSessions.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online</p>
                  <p className="text-2xl font-bold">{onlineSessions.length}</p>
                </div>
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
