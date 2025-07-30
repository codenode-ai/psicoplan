import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { RefreshCw, ExternalLink, Crown, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PLAN_LIMITS } from '@/types/database.types';

export function EnhancedSubscriptionStatus() {
  const { userProfile } = useAuth();
  const { subscription, loading, checkSubscription, openCustomerPortal } = useSubscription();
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkSubscription();
      setAutoRefreshCount(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [checkSubscription]);

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-500';
      case 'plus': return 'bg-blue-500';
      case 'pro': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Gratuito';
      case 'plus': return 'Plus';
      case 'pro': return 'Pro';
      default: return 'Desconhecido';
    }
  };

  const getCurrentPlanLimits = () => {
    const plan = userProfile?.plano || 'free';
    return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  };

  const getPlanFeatures = (plan: string) => {
    switch (plan) {
      case 'free':
        return [
          '5 pacientes',
          '50 sessões/mês',
          'Funcionalidades básicas'
        ];
      case 'plus':
        return [
          '50 pacientes',
          '500 sessões/mês',
          'Agenda online completa',
          'Prontuários eletrônicos',
          'Controle financeiro',
          'Suporte por email'
        ];
      case 'pro':
        return [
          'Pacientes ilimitados',
          'Sessões ilimitadas',
          'Recursos avançados',
          'Relatórios e análises',
          'Suporte prioritário',
          'Backup automático'
        ];
      default:
        return [];
    }
  };

  const planLimits = getCurrentPlanLimits();
  const currentPlan = userProfile?.plano || 'free';
  const planFeatures = getPlanFeatures(currentPlan);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Status da Assinatura
        </CardTitle>
        <CardDescription>
          Gerencie seu plano e acompanhe o uso
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Plan Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`${getPlanColor(currentPlan)} text-white`}>
              {getPlanName(currentPlan)}
            </Badge>
            {subscription.subscribed && (
              <Badge variant="outline" className="border-green-500 text-green-600">
                Ativo
              </Badge>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={checkSubscription}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <Separator />

        {/* Subscription Details */}
        {subscription.subscribed && subscription.subscription_end && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Renovação:</span>
              <span className="font-medium">
                {format(new Date(subscription.subscription_end), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR
                })}
              </span>
            </div>
            
            {subscription.subscription_tier && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Nível:</span>
                <span className="font-medium capitalize">
                  {subscription.subscription_tier}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Plan Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recursos do Plano:</h4>
          <ul className="space-y-2">
            {planFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {subscription.subscribed ? (
            <Button
              onClick={openCustomerPortal}
              disabled={loading}
              className="flex-1 gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Gerenciar Assinatura
              <ExternalLink className="w-3 h-3" />
            </Button>
          ) : (
            <div className="flex-1 text-center p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Faça upgrade para acessar recursos premium
              </p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            Informações de Debug
          </summary>
          <div className="mt-2 space-y-1 font-mono">
            <div>Plano atual: {currentPlan}</div>
            <div>Assinado: {subscription.subscribed ? 'Sim' : 'Não'}</div>
            <div>Tier: {subscription.subscription_tier || 'N/A'}</div>
            <div>Auto-refresh: {autoRefreshCount}</div>
            {subscription.subscription_end && (
              <div>Fim: {subscription.subscription_end}</div>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}