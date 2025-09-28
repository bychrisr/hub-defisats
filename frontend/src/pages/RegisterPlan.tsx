import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Gift } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      'Basic trading automation',
      'Up to 3 active strategies',
      'Community support',
      'Basic analytics'
    ],
    icon: <Gift className="h-6 w-6" />,
    color: 'from-gray-500 to-gray-600'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    period: 'month',
    features: [
      'Advanced trading strategies',
      'Up to 10 active strategies',
      'Priority support',
      'Advanced analytics',
      'Risk management tools'
    ],
    icon: <Zap className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 79,
    period: 'month',
    features: [
      'Professional trading strategies',
      'Unlimited active strategies',
      '24/7 premium support',
      'Professional analytics',
      'Advanced risk management',
      'Custom indicators',
      'API access'
    ],
    icon: <Star className="h-6 w-6" />,
    color: 'from-purple-500 to-purple-600',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    period: 'month',
    features: [
      'Enterprise trading strategies',
      'Unlimited everything',
      'Dedicated account manager',
      'Enterprise analytics',
      'Advanced risk management',
      'Custom development',
      'Full API access',
      'White-label options'
    ],
    icon: <Crown className="h-6 w-6" />,
    color: 'from-yellow-500 to-orange-500'
  }
];

export default function RegisterPlan() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Reativar verificação quando backend estiver pronto
  // useEffect(() => {
  //   if (!location.state?.personalData) {
  //     navigate('/register');
  //   }
  // }, [location.state, navigate]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    setIsLoading(true);
    
    try {
      // Simular salvamento do plano
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para o próximo passo (credenciais)
      navigate('/register/credentials', {
        state: {
          ...location.state,
          selectedPlan: selectedPlan
        }
      });
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Choose your plan</h1>
          <p className="text-slate-400 text-sm">
            Select the plan that best fits your trading needs
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 ${
                selectedPlan === plan.id
                  ? 'bg-slate-700/50 border-blue-500 shadow-lg shadow-blue-500/25'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-12 h-12 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center mb-4`}>
                  <div className="text-white">
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-slate-400">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-white">${plan.price}</span>
                      <span className="text-slate-400">/{plan.period}</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Plan Summary */}
        {selectedPlanData && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${selectedPlanData.color} rounded-lg flex items-center justify-center`}>
                    <div className="text-white">
                      {selectedPlanData.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPlanData.name} Plan</h3>
                    <p className="text-slate-400">
                      {selectedPlanData.price === 0 ? 'Free forever' : `$${selectedPlanData.price}/${selectedPlanData.period}`}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleContinue}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-2.5 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-slate-400 text-sm">
            You can change your plan at any time in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}
