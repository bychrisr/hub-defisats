import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, ArrowLeft } from 'lucide-react';
import { useRegistration } from '@/hooks/useRegistration';
import { useToast } from '@/hooks/use-toast';
import { registrationAPI } from '@/lib/api';
import '@/styles/register-improvements.css';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with demo trading',
    features: [
      'Demo mode only',
      'Create draft bots',
      'Run backtests',
      'View reports (read-only)',
      'Basic support'
    ],
    popular: false
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$29',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Connect 1 exchange',
      'Run up to 3 live bots',
      'Real-time data',
      'Basic support',
      'All Free features'
    ],
    popular: false
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: '$99',
    period: '/month',
    description: 'For serious traders',
    features: [
      'Everything in Basic',
      'Unlimited bots',
      'Advanced analytics',
      'Priority support',
      'Advanced reports'
    ],
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$299',
    period: '/month',
    description: 'For professionals',
    features: [
      'Everything in Advanced',
      'Multi-tenant support',
      'API access',
      'White-label options',
      'Compliance tools'
    ],
    popular: false
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$999',
    period: 'one-time',
    description: 'Lifetime access',
    features: [
      'Everything in Pro',
      'Lifetime access',
      'No monthly fees',
      'Premium support',
      'Early access to features'
    ],
    popular: false
  }
];

export default function RegisterPlan() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectPlan, isLoading } = useRegistration();
  const { toast } = useToast();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string>('free');
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [registrationProgress, setRegistrationProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get data from location state
  const sessionToken = location.state?.sessionToken;
  const personalData = location.state?.personalData;
  const couponData = location.state?.couponData;

  useEffect(() => {
    if (!sessionToken) {
      navigate('/register');
      return;
    }
    
    // Load registration progress to get coupon data
    loadRegistrationProgress();
  }, [sessionToken, navigate]);

  const loadRegistrationProgress = async () => {
    try {
      setLoading(true);
      const response = await registrationAPI.getProgress(sessionToken);
      setRegistrationProgress(response.data);
      
      // If user has a 100% discount coupon with plan_type, auto-select that plan
      if (response.data?.personalData?.couponCode) {
        // This will be handled by the backend when selectPlan is called
        console.log('🎫 User has coupon:', response.data.personalData.couponCode);
      }
    } catch (error) {
      console.error('Error loading registration progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async () => {
    try {
      console.log('📋 REGISTER PLAN - Selecting plan:', selectedPlanId);
      
      const result = await selectPlan({
        planId: selectedPlanId as any,
        billingPeriod: selectedBilling,
        sessionToken,
      });

      console.log('✅ REGISTER PLAN - Plan selected:', result);

      if (result.nextStep === 'completed') {
        // Registration completed - redirect to dashboard
        navigate('/dashboard?first=true', {
          state: {
            message: 'Registration completed successfully!',
            email: personalData?.email,
          },
        });
      } else {
        // Go to payment
        navigate('/register/payment', {
          state: {
            sessionToken,
            personalData,
            selectedPlan: { planId: selectedPlanId, billingPeriod: selectedBilling },
            couponData: result.couponData,
          },
        });
      }
    } catch (error: any) {
      console.error('❌ REGISTER PLAN - Error:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao selecionar plano',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    navigate('/register');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Processando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 register-touch-target"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Selecione o plano que melhor se adequa às suas necessidades de trading
          </p>
          
          {couponData && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200 font-medium">
                🎉 Cupom aplicado: {couponData.code} - {couponData.discountValue}% de desconto
              </p>
              {couponData.planType && (
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  Plano incluído: {couponData.planType}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedBilling('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBilling === 'monthly'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setSelectedBilling('quarterly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBilling === 'quarterly'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Trimestral
            </button>
            <button
              onClick={() => setSelectedBilling('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBilling === 'yearly'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Anual
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlanId === plan.id
                  ? 'ring-2 ring-primary shadow-lg scale-105'
                  : 'hover:shadow-md'
              } ${plan.popular ? 'border-primary' : ''}`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  {plan.price}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full register-cta-button ${
                    selectedPlanId === plan.id ? 'register-cta-button-selected' : ''
                  }`}
                  variant={selectedPlanId === plan.id ? 'default' : 'outline'}
                >
                  {selectedPlanId === plan.id ? 'Selecionado' : 'Selecionar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handlePlanSelect}
            className="register-cta-button px-8 py-3 text-lg"
            size="lg"
          >
            Continuar com {plans.find(p => p.id === selectedPlanId)?.name}
          </Button>
        </div>
      </div>
    </div>
  );
}
