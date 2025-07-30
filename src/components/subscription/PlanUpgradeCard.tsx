import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Crown, Star } from 'lucide-react';

interface PlanUpgradeCardProps {
  plan: 'plus' | 'pro';
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export function PlanUpgradeCard({ 
  plan, 
  name, 
  price, 
  description, 
  features, 
  highlighted = false 
}: PlanUpgradeCardProps) {
  const { userProfile } = useAuth();
  const { subscription, loading, createCheckout } = useSubscription();

  const isCurrentPlan = userProfile?.plano === plan;
  const canUpgrade = !subscription.subscribed || 
    (plan === 'pro' && userProfile?.plano === 'plus');

  const handleUpgrade = () => {
    createCheckout(plan);
  };

  return (
    <Card className={`relative ${highlighted ? 'border-primary shadow-lg' : ''}`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="w-5 h-5" />
          {name}
        </CardTitle>
        <div className="text-3xl font-bold">{price}</div>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        {isCurrentPlan ? (
          <Button disabled className="w-full">
            Plano Atual
          </Button>
        ) : canUpgrade ? (
          <Button 
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full"
            variant={highlighted ? "default" : "outline"}
          >
            {loading ? 'Processando...' : `Fazer Upgrade para ${name}`}
          </Button>
        ) : (
          <Button disabled className="w-full">
            Indisponível
          </Button>
        )}
      </CardContent>
    </Card>
  );
}