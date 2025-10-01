import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/useRegistration';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Gift, ArrowRight } from 'lucide-react';

type BillingPeriod = 'monthly' | 'quarterly' | 'yearly';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
}

interface FeatureCategory {
  category: string;
  features: {
    name: string;
    free: string | boolean;
    basic: string | boolean;
    advanced: string | boolean;
    pro: string | boolean;
  }[];
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for beginners to explore automated trading.',
    monthlyPrice: 0,
    quarterlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Basic LN Markets integration',
      'Up to 2 active trading bots',
      'Real-time market data',
      'Basic position monitoring',
      'Community Discord support',
      'Basic risk management'
    ],
    icon: <Gift className="h-6 w-6" />,
    color: 'from-gray-500 to-gray-600',
    buttonText: 'Start Free',
    buttonVariant: 'outline'
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For active traders looking to automate their strategies.',
    monthlyPrice: 19,
    quarterlyPrice: 51, // 3 months with 10% discount
    yearlyPrice: 190, // 12 months with 20% discount
    features: [
      'Full LN Markets API access',
      'Up to 5 active trading bots',
      'Advanced trading strategies',
      'Real-time WebSocket data',
      'Position & balance tracking',
      'Email support',
      'Basic analytics dashboard',
      'Stop-loss automation'
    ],
    icon: <Zap className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600',
    buttonText: 'Get Started',
    buttonVariant: 'default'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'For serious traders who need professional automation.',
    monthlyPrice: 49,
    quarterlyPrice: 132, // 3 months with 10% discount
    yearlyPrice: 490, // 12 months with 20% discount
    features: [
      'Unlimited trading bots',
      'Professional trading algorithms',
      'Advanced risk management',
      'Custom indicator development',
      'Priority WebSocket connections',
      '24/7 premium support',
      'Advanced analytics & reporting',
      'Multi-timeframe analysis',
      'Backtesting capabilities',
      'API rate limit priority'
    ],
    icon: <Star className="h-6 w-6" />,
    color: 'from-purple-500 to-purple-600',
    popular: true,
    buttonText: 'Get Started',
    buttonVariant: 'default'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For institutions and high-volume traders.',
    monthlyPrice: 99,
    quarterlyPrice: 267, // 3 months with 10% discount
    yearlyPrice: 990, // 12 months with 20% discount
    features: [
      'Everything in Advanced',
      'Dedicated account manager',
      'Custom strategy development',
      'White-label dashboard options',
      'Advanced compliance tools',
      'Priority infrastructure access',
      'Custom integrations',
      'Dedicated server resources',
      'Advanced security features',
      'SLA guarantees',
      'Custom reporting & analytics'
    ],
    icon: <Crown className="h-6 w-6" />,
    color: 'from-yellow-500 to-orange-500',
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary'
  }
];

const featureCategories: FeatureCategory[] = [
  {
    category: 'Trading Automation',
    features: [
      {
        name: 'Active trading bots',
        free: 'Up to 2',
        basic: 'Up to 5',
        advanced: 'Unlimited',
        pro: 'Unlimited'
      },
      {
        name: 'LN Markets integration',
        free: 'Basic',
        basic: 'Full API',
        advanced: 'Priority API',
        pro: 'Enterprise API'
      },
      {
        name: 'Trading strategies',
        free: 'Basic automation',
        basic: 'Advanced strategies',
        advanced: 'Professional algorithms',
        pro: 'Custom development'
      },
      {
        name: 'Risk management',
        free: 'Basic stop-loss',
        basic: 'Advanced stops',
        advanced: 'Professional risk',
        pro: 'Enterprise risk'
      },
      {
        name: 'Custom indicators',
        free: false,
        basic: false,
        advanced: true,
        pro: true
      }
    ]
  },
  {
    category: 'Real-time Data & Monitoring',
    features: [
      {
        name: 'WebSocket connections',
        free: 'Basic',
        basic: 'Standard',
        advanced: 'Priority',
        pro: 'Dedicated'
      },
      {
        name: 'Market data updates',
        free: 'Standard',
        basic: 'Fast',
        advanced: 'Real-time',
        pro: 'Ultra-fast'
      },
      {
        name: 'Position tracking',
        free: 'Basic',
        basic: 'Advanced',
        advanced: 'Professional',
        pro: 'Enterprise'
      },
      {
        name: 'Balance monitoring',
        free: 'Basic',
        basic: 'Real-time',
        advanced: 'Multi-account',
        pro: 'Enterprise'
      },
      {
        name: 'Performance analytics',
        free: 'Basic',
        basic: 'Advanced',
        advanced: 'Professional',
        pro: 'Custom'
      }
    ]
  },
  {
    category: 'Dashboard & Analytics',
    features: [
      {
        name: 'Analytics dashboard',
        free: 'Basic',
        basic: 'Advanced',
        advanced: 'Professional',
        pro: 'Enterprise'
      },
      {
        name: 'Performance reports',
        free: '7 days',
        basic: '30 days',
        advanced: '90 days',
        pro: 'Unlimited'
      },
      {
        name: 'Backtesting',
        free: false,
        basic: 'Basic',
        advanced: 'Advanced',
        pro: 'Professional'
      },
      {
        name: 'Multi-timeframe analysis',
        free: false,
        basic: false,
        advanced: true,
        pro: true
      },
      {
        name: 'Custom reporting',
        free: false,
        basic: false,
        advanced: true,
        pro: true
      }
    ]
  },
  {
    category: 'Support & Infrastructure',
    features: [
      {
        name: 'Support level',
        free: 'Discord community',
        basic: 'Email support',
        advanced: '24/7 premium',
        pro: 'Dedicated manager'
      },
      {
        name: 'API rate limits',
        free: 'Standard',
        basic: 'Enhanced',
        advanced: 'Priority',
        pro: 'Enterprise'
      },
      {
        name: 'Server resources',
        free: 'Shared',
        basic: 'Shared+',
        advanced: 'Dedicated',
        pro: 'Enterprise'
      },
      {
        name: 'SLA guarantees',
        free: false,
        basic: false,
        advanced: '99.9%',
        pro: '99.99%'
      },
      {
        name: 'White-label options',
        free: false,
        basic: false,
        advanced: false,
        pro: true
      }
    ]
  }
];

export default function RegisterPlan() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectPlan, isLoading, error, clearError, initializeRegistration } = useRegistration();
  const [selectedPlan, setSelectedPlan] = useState<string>('advanced');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  // Initialize registration with session token from location state
  useEffect(() => {
    if (location.state?.sessionToken) {
      initializeRegistration(location.state.sessionToken, location.state.progress);
    }
  }, [location.state, initializeRegistration]);

  const getPrice = (plan: Plan) => {
    switch (billingPeriod) {
      case 'quarterly':
        return plan.quarterlyPrice;
      case 'yearly':
        return plan.yearlyPrice;
      default:
        return plan.monthlyPrice;
    }
  };

  const getPeriodText = () => {
    switch (billingPeriod) {
      case 'quarterly':
        return 'per quarter';
      case 'yearly':
        return 'per year';
      default:
        return 'per month';
    }
  };

  const getSavings = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return null;
    
    const monthlyTotal = plan.monthlyPrice * (billingPeriod === 'quarterly' ? 3 : billingPeriod === 'yearly' ? 12 : 1);
    const actualPrice = getPrice(plan);
    const savings = monthlyTotal - actualPrice;
    
    if (savings > 0) {
      const percentage = Math.round((savings / monthlyTotal) * 100);
      return `Save ${percentage}%`;
    }
    return null;
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    try {
      clearError();
      
      const planData = {
        planId: selectedPlan as 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime',
        billingPeriod: billingPeriod,
        sessionToken: location.state?.sessionToken,
      };

      console.log('🚀 Plan data being sent:', planData);
      
      // Chamar a função de seleção de plano do hook
      await selectPlan(planData);
      
    } catch (error) {
      console.error('Error selecting plan:', error);
    }
  };

  const handleContinueWithPlan = async (planId: string) => {
    try {
      clearError();
      
      const planData = {
        planId: planId as 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime',
        billingPeriod: billingPeriod,
        sessionToken: location.state?.sessionToken,
      };

      console.log('🚀 Plan data being sent (direct):', planData);
      
      // Chamar a função de seleção de plano do hook
      await selectPlan(planData);
      
    } catch (error) {
      console.error('Error selecting plan:', error);
    }
  };

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
              <span className="text-white text-2xl">🤖</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Automate your Bitcoin trading with Axisor Bot.
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Professional trading automation powered by LN Markets.
            </p>
            
            {/* Billing Period Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-800/50 rounded-lg p-1 flex backdrop-blur-sm border border-slate-700">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    billingPeriod === 'monthly'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pay monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('quarterly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    billingPeriod === 'quarterly'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pay quarterly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    billingPeriod === 'yearly'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pay yearly
                </button>
              </div>
            </div>
            
            {billingPeriod === 'yearly' && (
              <p className="text-green-400 font-medium mb-8">
                Save up to 20% with yearly billing
              </p>
            )}
            
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Payment Disclaimer */}
        <div className="text-center mb-8">
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 backdrop-blur-sm inline-block">
            <p className="text-slate-300 text-sm font-medium">
              💡 Pagamentos somente em satoshis (via Lightning Network)
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Todos os planos são cobrados em Bitcoin através da rede Lightning para máxima privacidade e eficiência.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const savings = getSavings(plan);
            
            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-200 bg-slate-800/50 border-slate-700 backdrop-blur-sm ${
                  selectedPlan === plan.id
                    ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/25 bg-slate-700/50'
                    : 'hover:shadow-lg hover:shadow-slate-500/10 hover:border-slate-600'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25">
                    Recommended
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-12 h-12 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center mb-4 shadow-lg`}>
                    <div className="text-white">
                      {plan.icon}
                    </div>
                  </div>
                  <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400 text-sm mb-4">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mb-4">
                    {price === 0 ? (
                      <span className="text-3xl font-bold text-white">Free</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-white">${price}</span>
                        <span className="text-slate-400">/{getPeriodText()}</span>
                        {savings && (
                          <div className="text-green-400 text-sm font-medium mt-1">
                            {savings}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant={plan.buttonVariant}
                    className={`w-full transition-all duration-200 ${
                      plan.buttonVariant === 'default' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
                        : plan.buttonVariant === 'outline'
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (plan.id === 'free') {
                        // For free plan, immediately proceed with the correct plan
                        handleContinueWithPlan(plan.id);
                      } else {
                        // For other plans, just select
                        handlePlanSelect(plan.id);
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
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
            );
          })}
        </div>

        {/* Detailed Features Table */}
        <div className="bg-slate-800/50 rounded-lg p-8 mb-16 backdrop-blur-sm border border-slate-700 shadow-lg shadow-slate-500/10">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Plans and features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-4 px-4 font-semibold text-white">Features</th>
                  <th className="text-center py-4 px-4 font-semibold text-white">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-white">Basic</th>
                  <th className="text-center py-4 px-4 font-semibold text-white">Advanced</th>
                  <th className="text-center py-4 px-4 font-semibold text-white">Pro</th>
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr className="bg-slate-700/50">
                      <td colSpan={5} className="py-3 px-4 font-semibold text-white">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className="border-b border-slate-600 hover:bg-slate-700/30 transition-colors">
                        <td className="py-4 px-4 text-slate-300">{feature.name}</td>
                        <td className="py-4 px-4 text-center">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? (
                              <Check className="h-5 w-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-slate-500">—</span>
                            )
                          ) : (
                            <span className="text-slate-300">{feature.free}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {typeof feature.basic === 'boolean' ? (
                            feature.basic ? (
                              <Check className="h-5 w-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-slate-500">—</span>
                            )
                          ) : (
                            <span className="text-slate-300">{feature.basic}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {typeof feature.advanced === 'boolean' ? (
                            feature.advanced ? (
                              <Check className="h-5 w-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-slate-500">—</span>
                            )
                          ) : (
                            <span className="text-slate-300">{feature.advanced}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <Check className="h-5 w-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-slate-500">—</span>
                            )
                          ) : (
                            <span className="text-slate-300">{feature.pro}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>



        {/* Continue Button */}
        <div className="text-center mt-12">
          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Continue with {selectedPlanData?.name} Plan</span>
                <ArrowRight className="h-5 w-5" />
              </div>
            )}
          </Button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            You can change your plan at any time in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}