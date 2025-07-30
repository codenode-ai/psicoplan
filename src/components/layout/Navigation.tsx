
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/ui/logo';
import { NotificationCenter } from '@/components/ui/notification-center';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Crown,
  Settings,
  LogOut,
  Menu,
  Shield
} from 'lucide-react';

const navigationItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Pacientes', href: '/pacientes' },
  { icon: Calendar, label: 'Agenda', href: '/agenda' },
  { icon: FileText, label: 'Prontuários', href: '/prontuarios' },
  { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
  { icon: Crown, label: 'Assinatura', href: '/subscription' },
];

const adminItems = [
  { icon: Shield, label: 'Administração', href: '/admin' },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  const NavContent = () => (
    <div className="space-y-4">
      <div className="pb-4 border-b border-border">
        <Logo />
      </div>
      
      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth font-medium ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-soft'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Administração
              </p>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth font-medium ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-soft'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      <div className="pt-4 mt-auto border-t border-border">
        <div className="space-y-2">
          <div className="px-3 py-2 text-sm">
            <p className="font-medium">{userProfile?.nome_completo}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full inline-block capitalize">
                {userProfile?.plano}
              </p>
              <NotificationCenter />
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="fixed top-4 left-4 z-60 h-12 w-12 p-0 touch-manipulation min-h-[44px] min-w-[44px]">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs p-6">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-40">
        <div className="flex flex-col w-full p-6">
          <NavContent />
        </div>
      </div>
    </>
  );
}
