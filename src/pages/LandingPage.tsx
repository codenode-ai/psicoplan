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
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="h-9 px-3 sm:h-10 sm:px-4">
                Entrar
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="h-9 px-3 sm:h-10 sm:px-4">
                Começar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Sua Plataforma Completa de{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Gestão Psicológica
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed px-4 sm:px-0">
              Simplifique seu consultório com ferramentas profissionais para gestão de pacientes, 
              agendamentos, prontuários e controle financeiro. Tudo em um só lugar.
            </p>
            <div className="flex justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="h-12 px-6 sm:px-8 w-full sm:w-auto max-w-xs">
                  Começar gratuitamente
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-4 sm:px-0">
              Tudo que você precisa para seu consultório
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground px-4 sm:px-0">
              Ferramentas profissionais desenvolvidas especificamente para psicólogos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="shadow-medium hover:shadow-strong transition-smooth h-full">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <CardDescription className="text-sm sm:text-base leading-relaxed">
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
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-4 sm:px-0">
              Planos para todos os tamanhos
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground px-4 sm:px-0">
              Escolha o plano ideal para seu consultório
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative shadow-medium hover:shadow-strong transition-smooth h-full ${
                  plan.popular ? 'ring-2 ring-primary shadow-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {plan.price}
                  </div>
                  <CardDescription className="text-sm sm:text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0 flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                        <span className="text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="block">
                    <Button 
                      className="w-full h-11 mt-4" 
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
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-hero text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-4 sm:px-0">
              Pronto para transformar seu consultório?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 px-4 sm:px-0">
              Junte-se a centenas de psicólogos que já confiam no Psicoplan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 px-6 sm:px-8 w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                  Começar gratuitamente
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-4 sm:col-span-2 md:col-span-1">
              <Logo />
              <p className="text-muted-foreground text-sm sm:text-base">
                A plataforma completa para gestão de consultórios psicológicos.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Produto</h4>
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li><Link to="#" className="hover:text-foreground transition-smooth">Funcionalidades</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-smooth">Preços</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-smooth">Segurança</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li><Link to="#" className="hover:text-foreground transition-smooth">Central de Ajuda</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-smooth">Contato</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-smooth">Status</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Empresa</h4>
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li><Link to="#" className="hover:text-foreground transition-smooth">Sobre</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-smooth">Blog</Link></li>
                <li><Link to="#" className="hover:text-foreground transition-smooth">Carreiras</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-muted-foreground">
            <p className="text-xs sm:text-sm">&copy; 2025 Psicoplan. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
