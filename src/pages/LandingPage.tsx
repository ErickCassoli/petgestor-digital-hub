// src/pages/LandingPage.tsx
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  ClipboardList,
  Package,
  BarChart,
  ChevronRight,
  Check,
  Menu,
  X,
  Github,
  Twitter,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import TermsOfServiceModal from "@/components/TermsOfServiceModal";
import CookiesPolicyModal from "@/components/CookiesPolicyModal";
import { supabase } from "@/integrations/supabase/client";

// Tipagens para os preços
interface PriceInfo {
  id: string;
  unit_amount: number;
  currency: string;
}
interface Prices {
  monthly: PriceInfo;
  trimestral: PriceInfo;
  semestral: PriceInfo;
}

// Hook para carregar os três preços
function useStripePrices() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-subscription-price"
      );
      if (error) throw error;
      setPrices(data as Prices);
    } catch (err: any) {
      console.error("Erro ao carregar preços:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return { prices, error, refresh: fetchPrices };
}
const features = [
  {
    title: "Agendamento de Serviços",
    description: "Organize facilmente os agendamentos do seu petshop, evitando conflitos de horários e melhorando a experiência dos clientes.",
    icon: Calendar,
  },
  {
    title: "Cadastro de Clientes e Pets",
    description: "Mantenha um banco de dados completo de clientes e seus pets, incluindo histórico de atendimentos, preferências e observações importantes.",
    icon: Users,
  },
  {
    title: "Histórico de Atendimentos",
    description: "Acesse o histórico completo de atendimentos e procedimentos realizados para cada pet, garantindo um acompanhamento contínuo e personalizado.",
    icon: ClipboardList,
  },
  {
    title: "Gestão de Produtos e Estoque",
    description: "Controle seu estoque de produtos com alertas de nível baixo, evitando quebras de estoque e otimizando suas compras.",
    icon: Package,
  },
  {
    title: "Relatórios de Vendas",
    description: "Visualize relatórios detalhados de vendas, desempenho e tendências, ajudando na tomada de decisões estratégicas para seu petshop.",
    icon: BarChart,
  },
];

const testimonials = [
  {
    quote: "O PetGestor mudou completamente a forma como gerenciamos nosso petshop. Conseguimos reduzir erros de agendamento e melhorar o controle de estoque.",
    author: "Ana Luiza",
    role: "Proprietária do Patinhas Felizes",
  },
  {
    quote: "Usamos o PetGestor há 3 meses e já notamos um aumento de 30% na eficiência do nosso atendimento. Os clientes perceberam a diferença!",
    author: "Carlos Eduardo",
    role: "Gerente do Mundo Pet",
  },
  {
    quote: "O melhor investimento que fizemos para nosso petshop. Interface intuitiva e suporte excelente. Recomendo para todos os petshops!",
    author: "Mariana Silva",
    role: "Proprietária do Amigos Pets",
  },
];

const steps = [
  {
    title: "Faça seu cadastro",
    description: "Crie sua conta gratuita e comece seu período de testes de 7 dias, sem compromisso.",
  },
  {
    title: "Configure seu petshop",
    description: "Adicione seus serviços, produtos e colaboradores em poucos minutos.",
  },
  {
    title: "Comece a usar",
    description: "Cadastre clientes, agende serviços e gerencie seu petshop com facilidade.",
  },
];

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { prices, error: priceError } = useStripePrices();

  // Configuração dos 3 planos
  const plans = [
    { key: "monthly" as const, title: "Plano Mensal", label: "/mês" },
    { key: "trimestral" as const, title: "Plano Trimestral", label: "/3 meses" },
    { key: "semestral" as const, title: "Plano Semestral", label: "/6 meses" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-petblue-600">PetGestor</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-petblue-600 transition-colors">
                Recursos
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-petblue-600 transition-colors">
                Como Funciona
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-petblue-600 transition-colors">
                Preço
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-petblue-600 transition-colors">
                Depoimentos
              </a>
              <div className="ml-4 flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline" className="border-petblue-600 text-petblue-600 hover:bg-petblue-50">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-petblue-600 text-white hover:bg-petblue-700">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden bg-white border-b border-gray-200 transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-screen py-4" : "max-h-0 overflow-hidden py-0"
          )}
        >
          <div className="container mx-auto px-4 space-y-4">
            <a
              href="#features"
              className="block py-2 text-gray-600 hover:text-petblue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Recursos
            </a>
            <a
              href="#how-it-works"
              className="block py-2 text-gray-600 hover:text-petblue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Como Funciona
            </a>
            <a
              href="#pricing"
              className="block py-2 text-gray-600 hover:text-petblue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Preço
            </a>
            <a
              href="#testimonials"
              className="block py-2 text-gray-600 hover:text-petblue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Depoimentos
            </a>
            <div className="pt-4 flex flex-col space-y-3">
              <Link
                to="/login"
                className="w-full py-2 text-center border border-petblue-600 text-petblue-600 rounded-md hover:bg-petblue-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="w-full py-2 text-center bg-petblue-600 text-white rounded-md hover:bg-petblue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Gerencie seu <span className="text-petblue-600">petshop</span> com eficiência e simplicidade
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-2xl">
                O PetGestor é a solução completa para o gerenciamento do seu petshop. Agendamentos, clientes, estoque e vendas em um só lugar.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/register">
                  <Button size="lg" className="bg-petblue-600 text-white hover:bg-petblue-700 w-full sm:w-auto">
                    Começar grátis
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="border-petblue-600 text-petblue-600 hover:bg-petblue-50 w-full sm:w-auto">
                    Conhecer recursos
                  </Button>
                </a>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Experimente grátis por 7 dias. Sem compromisso.
              </p>
            </div>
            <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                alt="Gato cinza sendo cuidado em um petshop"
                className="rounded-xl shadow-xl max-w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Recursos completos para seu petshop
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Tudo o que você precisa para gerenciar seu negócio em um só lugar.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="h-12 w-12 bg-petblue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-petblue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Como funciona
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Começar a usar o PetGestor é rápido e simples.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-petblue-100 text-petblue-600 mb-6">
                  <span className="text-2xl font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Planos simples e acessíveis
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Escolha o que cabe melhor no seu petshop.
            </p>
          </div>

          {/* Erro ao carregar preços */}
          {priceError && (
            <p className="mt-8 text-center text-red-600">
              Não foi possível carregar os planos: {priceError}
            </p>
          )}

          {/* Loading */}
          {!prices && !priceError && (
            <div className="flex items-center justify-center py-12">
              <span className="text-gray-600 animate-pulse">
                Carregando planos...
              </span>
            </div>
          )}

          {/* Cards de Planos */}
          {prices && (
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {plans.map(({ key, title, label }) => {
                const price = prices[key];
                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-petblue-200"
                  >
                    <div className="bg-petblue-50 px-6 py-8 text-center">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {title}
                      </h3>
                      <div className="mt-4 flex items-baseline justify-center">
                        <span className="text-4xl md:text-5xl font-bold text-petblue-600">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: price.currency.toUpperCase(),
                          }).format(price.unit_amount / 100)}
                        </span>
                        <span className="ml-1 text-xl text-gray-600">
                          {label}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-4">
                        {[
                          "Agendamento de serviços",
                          "Cadastro de clientes e pets",
                          "Histórico de atendimentos",
                          "Gestão de produtos e estoque",
                          "Relatórios de vendas",
                          "Múltiplos usuários",
                          "Suporte prioritário",
                        ].map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start"
                          >
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="ml-3 text-gray-600">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8">
                        <Link to="/register">
                          <Button className="w-full bg-petblue-600 text-white hover:bg-petblue-700 h-12 text-lg">
                            Assinar agora
                          </Button>
                        </Link>
                        <p className="mt-4 text-center text-sm text-gray-500">
                          7 dias grátis. Cancele quando quiser.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              O que nossos clientes dizem
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Histórias de sucesso de petshops como o seu.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1 mb-4 text-petblue-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-petblue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para transformar seu petshop?
          </h2>
          <p className="mt-4 text-xl text-petblue-100 max-w-3xl mx-auto">
            Comece hoje mesmo com 7 dias grátis. Sem compromisso e sem necessidade de cartão de crédito.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" className="bg-white text-petblue-600 hover:bg-gray-100">
                Começar gratuitamente
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">PetGestor</h3>
              <p className="text-gray-600 mb-4">
                A solução completa para a gestão do seu petshop.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-petblue-600">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-petblue-600">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-petblue-600">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produto</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="footer-link">Recursos</a></li>
                <li><a href="#pricing" className="footer-link">Preço</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
              <li><TermsOfServiceModal /></li>
              <li><PrivacyPolicyModal /></li>
              <li><CookiesPolicyModal /></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} PetGestor. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
