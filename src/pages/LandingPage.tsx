import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign,
  Shield,
  BarChart,
  Clock,
  CheckCircle,
  Star,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Users,
      title: 'Gestão de Pacientes',
      description: 'Organize e gerencie todos os seus pacientes em um só lugar com fichas completas e histórico detalhado.'
    },
    {
      icon: Calendar,
      title: 'Agenda Inteligente',
      description: 'Agende sessões presenciais e online com confirmações automáticas e lembretes.'
    },
    {
      icon: FileText,
      title: 'Prontuários Digitais',
      description: 'Mantenha registros seguros e organizados de todas as sessões e evoluções.'
    },
    {
      icon: DollarSign,
      title: 'Controle Financeiro',
      description: 'Acompanhe receitas, pagamentos e relatórios financeiros detalhados.'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Dados protegidos com criptografia e conformidade com LGPD.'
    },
    {
      icon: BarChart,
      title: 'Relatórios e Analytics',
      description: 'Insights sobre seu consultório com gráficos e métricas importantes.'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: 'Gratuito',
      description: 'Perfeito para começar',
      features: [
        'Até 5 pacientes',
        'Agenda completa',
        'Prontuários digitais',
        'Relatórios financeiros',
        'Suporte por email'
      ],
      popular: false
    },
    {
      name: 'Plus',
      price: 'R$ 29/mês',
      description: 'Para consultórios em crescimento',
      features: [
        'Até 50 pacientes',
        'Agenda completa',
        'Prontuários digitais',
        'Relatórios financeiros',
        'Suporte prioritário'
      ],
      popular: true
    },
    {
      name: 'Pro',
      price: 'R$ 59/mês',
      description: 'Para profissionais estabelecidos',
      features: [
        'Pacientes ilimitados',
        'Agenda completa',
        'Prontuários digitais',
        'Relatórios financeiros',
        'Suporte 24/7'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button>Começar agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Sua Plataforma Completa de{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Gestão Psicológica
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Simplifique seu consultório com ferramentas profissionais para gestão de pacientes, 
              agendamentos, prontuários e controle financeiro. Tudo em um só lugar.
            </p>
            <div className="flex justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="px-8">
                  Começar gratuitamente
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">
              Tudo que você precisa para seu consultório
            </h2>
            <p className="text-xl text-muted-foreground">
              Ferramentas profissionais desenvolvidas especificamente para psicólogos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="shadow-medium hover:shadow-strong transition-smooth">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">
              Planos para todos os tamanhos
            </h2>
            <p className="text-xl text-muted-foreground">
              Escolha o plano ideal para seu consultório
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative shadow-medium hover:shadow-strong transition-smooth ${
                  plan.popular ? 'ring-2 ring-primary shadow-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="block">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.name === 'Free' ? 'Começar grátis' : 'Assinar agora'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-hero text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold">
              Pronto para transformar seu consultório?
            </h2>
            <p className="text-xl text-white/90">
              Junte-se a centenas de psicólogos que já confiam no Psicoplan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="px-8 bg-white text-primary hover:bg-white/90">
                  Começar gratuitamente
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo />
              <p className="text-muted-foreground">
                A plataforma completa para gestão de consultórios psicológicos.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Produto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground">Funcionalidades</Link></li>
                <li><Link to="#" className="hover:text-foreground">Preços</Link></li>
                <li><Link to="#" className="hover:text-foreground">Segurança</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground">Central de Ajuda</Link></li>
                <li><Link to="#" className="hover:text-foreground">Contato</Link></li>
                <li><Link to="#" className="hover:text-foreground">Status</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Empresa</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground">Sobre</Link></li>
                <li><Link to="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link to="#" className="hover:text-foreground">Carreiras</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Psicoplan. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
