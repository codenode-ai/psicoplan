
import { Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SessionForm } from './SessionForm';
import { SessionWithPatient } from '@/types/database.types';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface AgendaHeaderProps {
  todaySessionsCount: number;
  viewMode: 'calendar' | 'list';
  setViewMode: (mode: 'calendar' | 'list') => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  selectedSession: SessionWithPatient | null;
  handleNewSession: () => void;
  selectedDate: Date;
}

export function AgendaHeader({
  todaySessionsCount,
  viewMode,
  setViewMode,
  isFormOpen,
  setIsFormOpen,
  selectedSession,
  handleNewSession,
  selectedDate,
}: AgendaHeaderProps) {
  const { isMobile } = useBreakpoint();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            {todaySessionsCount} {todaySessionsCount === 1 ? 'sessão hoje' : 'sessões hoje'}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* View Mode Buttons */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
              size={isMobile ? 'sm' : 'default'}
              className="flex-1 sm:flex-none"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isMobile ? 'Cal' : 'Calendário'}
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              size={isMobile ? 'sm' : 'default'}
              className="flex-1 sm:flex-none"
            >
              <Clock className="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>

          {/* New Session Button */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleNewSession}
                size={isMobile ? 'sm' : 'default'}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isMobile ? 'Nova' : 'Nova Sessão'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto touch-manipulation">
              <DialogHeader>
                <DialogTitle>
                  {selectedSession ? 'Editar Sessão' : 'Nova Sessão'}
                </DialogTitle>
              </DialogHeader>
              <SessionForm 
                session={selectedSession} 
                onSuccess={() => setIsFormOpen(false)}
                defaultDate={selectedDate}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
