import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanUpgradeCard } from '@/components/subscription/PlanUpgradeCard';
import { EnhancedSubscriptionStatus } from '@/components/subscription/EnhancedSubscriptionStatus';
import { SubscriptionMetrics } from '@/components/subscription/SubscriptionMetrics';
import { PLAN_LIMITS } from '@/types/database.types';
import { Crown } from 'lucide-react';

export default function Subscription() {
  const plans = [
    {
      plan: 'plus' as const,
      name: 'Plus',
      price: 'R$ 29/mês',
      description: 'Para consultórios em crescimento',
      features: [
        `Até ${PLAN_LIMITS.plus.pacientes} pacientes`,
        `Até ${PLAN_LIMITS.plus.sessoes} sessões/mês`,
        'Agenda online completa',
        'Prontuários eletrônicos',
        'Controle financeiro',
        'Suporte por email'
      ]
    },
    {
      plan: 'pro' as const,
      name: 'Pro',
      price: 'R$ 59/mês',
      description: 'Para profissionais estabelecidos',
      features: [
        'Pacientes ilimitados',
        'Sessões ilimitadas',
        'Agenda online completa',
        'Prontuários eletrônicos',
        'Controle financeiro avançado',
        'Relatórios e análises',
        'Suporte prioritário',
        'Backup automático'
      ],
      highlighted: true
    }
  ];

  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
            <Crown className="w-8 h-8" />
            Escolha seu Plano
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano ideal para suas necessidades e faça upgrade a qualquer momento.
          </p>
        </div>

        {/* Current Status and Metrics */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <EnhancedSubscriptionStatus />
          <SubscriptionMetrics />
        </div>

        {/* Free Plan Display */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Plano Gratuito</CardTitle>
            <div className="text-3xl font-bold">R$ 0/mês</div>
            <p className="text-muted-foreground">Para começar</p>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></span>
                <span className="text-sm">Até {PLAN_LIMITS.free.pacientes} pacientes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></span>
                <span className="text-sm">Até {PLAN_LIMITS.free.sessoes} sessões/mês</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></span>
                <span className="text-sm">Funcionalidades básicas</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Premium Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <PlanUpgradeCard
              key={plan.plan}
              plan={plan.plan}
              name={plan.name}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              highlighted={plan.highlighted}
            />
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Por que fazer upgrade?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Sem limitações</h4>
              <p className="text-sm text-muted-foreground">
                Gerencie quantos pacientes e sessões precisar, sem se preocupar com limites.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Recursos avançados</h4>
              <p className="text-sm text-muted-foreground">
                Acesse relatórios, análises e ferramentas que ajudam a fazer seu consultório crescer.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔒 Segurança garantida</h4>
              <p className="text-sm text-muted-foreground">
                Todos os dados são criptografados e protegidos com backup automático.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}