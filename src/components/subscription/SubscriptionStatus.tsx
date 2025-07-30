import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Calendar, CreditCard, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SubscriptionStatus() {
  const { userProfile } = useAuth();
  const { subscription, loading, checkSubscription, openCustomerPortal } = useSubscription();

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'plus': return 'bg-blue-500';
      case 'pro': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'plus': return 'Plus';
      case 'pro': return 'Pro';
      default: return 'Free';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Status da Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${getPlanColor(userProfile?.plano || 'free')} text-white`}
            >
              Plano {getPlanName(userProfile?.plano || 'free')}
            </Badge>
            {subscription.subscribed && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Ativo
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSubscription}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {subscription.subscribed && subscription.subscription_end && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Renovação em {format(new Date(subscription.subscription_end), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        )}

        {subscription.subscribed && (
          <Button
            variant="outline"
            onClick={openCustomerPortal}
            disabled={loading}
            className="w-full"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Gerenciar Assinatura
          </Button>
        )}

        {!subscription.subscribed && (
          <div className="text-sm text-muted-foreground">
            Você está no plano gratuito. Faça upgrade para acessar mais recursos!
          </div>
        )}
      </CardContent>
    </Card>
  );
}