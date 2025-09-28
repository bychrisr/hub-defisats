import React, { useState, useEffect } from 'react';
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
    description: 'For individuals to organize personal projects and life.',
    monthlyPrice: 0,
    quarterlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Basic trading automation',
      'Up to 3 active strategies',
      'Community support',
      'Basic analytics'
    ],
    icon: <Gift className="h-6 w-6" />,
    color: 'from-gray-500 to-gray-600',
    buttonText: 'Sign up',
    buttonVariant: 'outline'
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For small teams and professionals to work together.',
    monthlyPrice: 29,
    quarterlyPrice: 79, // 3 months with 10% discount
    yearlyPrice: 290, // 12 months with 20% discount
    features: [
      'Advanced trading strategies',
      'Up to 10 active strategies',
      'Priority support',
      'Advanced analytics',
      'Risk management tools'
    ],
    icon: <Zap className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600',
    buttonText: 'Get started',
    buttonVariant: 'default'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'For growing businesses to streamline teamwork.',
    monthlyPrice: 79,
    quarterlyPrice: 213, // 3 months with 10% discount
    yearlyPrice: 790, // 12 months with 20% discount
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
    popular: true,
    buttonText: 'Get started',
    buttonVariant: 'default'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For organizations to operate with scalability, control, and security.',
    monthlyPrice: 149,
    quarterlyPrice: 402, // 3 months with 10% discount
    yearlyPrice: 1490, // 12 months with 20% discount
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
    color: 'from-yellow-500 to-orange-500',
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary'
  }
];

const featureCategories: FeatureCategory[] = [
  {
    category: 'Trading Features',
    features: [
      {
        name: 'Active trading strategies',
        free: 'Up to 3',
        basic: 'Up to 10',
        advanced: 'Unlimited',
        pro: 'Unlimited'
      },
      {
        name: 'Strategy types',
        free: 'Basic automation',
        basic: 'Advanced strategies',
        advanced: 'Professional strategies',
        pro: 'Enterprise strategies'
      },
      {
        name: 'Risk management',
        free: 'Basic',
        basic: 'Advanced',
        advanced: 'Professional',
        pro: 'Enterprise'
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
    category: 'Analytics & Reporting',
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
        name: 'Custom reports',
        free: false,
        basic: false,
        advanced: true,
        pro: true
      },
      {
        name: 'Real-time monitoring',
        free: 'Basic',
        basic: 'Advanced',
        advanced: 'Professional',
        pro: 'Enterprise'
      }
    ]
  },
  {
    category: 'Support & Integration',
    features: [
      {
        name: 'Support level',
        free: 'Community',
        basic: 'Priority',
        advanced: '24/7 Premium',
        pro: 'Dedicated Manager'
      },
      {
        name: 'API access',
        free: false,
        basic: 'Basic',
        advanced: 'Full',
        pro: 'Full + Custom'
      },
      {
        name: 'Webhook integrations',
        free: false,
        basic: 'Basic',
        advanced: 'Advanced',
        pro: 'Enterprise'
      },
      {
        name: 'White-label options',
        free: false,
        basic: false,
        advanced: false,
        pro: true
      }
    ]
  },
  {
    category: 'Security & Compliance',
    features: [
      {
        name: 'Data encryption',
        free: 'Basic',
        basic: 'Advanced',
        advanced: 'Professional',
        pro: 'Enterprise'
      },
      {
        name: 'Audit logs',
        free: false,
        basic: 'Basic',
        advanced: 'Advanced',
        pro: 'Enterprise'
      },
      {
        name: 'SSO integration',
        free: false,
        basic: false,
        advanced: true,
        pro: true
      },
      {
        name: 'Compliance reporting',
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
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Reativar verificação quando backend estiver pronto
  // useEffect(() => {
  //   if (!location.state?.personalData) {
  //     navigate('/register');
  //   }
  // }, [location.state, navigate]);

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
    setIsLoading(true);
    
    try {
      // Simular salvamento do plano
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para o próximo passo (credenciais)
      navigate('/register/credentials', {
        state: {
          ...location.state,
          selectedPlan: selectedPlan,
          billingPeriod: billingPeriod
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
              <span className="text-white text-2xl">🤖</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              One tool for your whole trading operation.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Free for individuals to try.
            </p>
            
            {/* Billing Period Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingPeriod === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pay monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('quarterly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingPeriod === 'quarterly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pay quarterly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingPeriod === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pay yearly
                </button>
              </div>
            </div>
            
            {billingPeriod === 'yearly' && (
              <p className="text-green-600 font-medium mb-8">
                Save up to 20% with yearly billing
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const savings = getSavings(plan);
            
            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
                    Recommended
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-12 h-12 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center mb-4`}>
                    <div className="text-white">
                      {plan.icon}
                    </div>
                  </div>
                  <CardTitle className="text-gray-900 text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 text-sm mb-4">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mb-4">
                    {price === 0 ? (
                      <span className="text-3xl font-bold text-gray-900">Free</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-gray-900">${price}</span>
                        <span className="text-gray-600">/{getPeriodText()}</span>
                        {savings && (
                          <div className="text-green-600 text-sm font-medium mt-1">
                            {savings}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant={plan.buttonVariant}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect(plan.id);
                    }}
                  >
                    {plan.buttonText}
                  </Button>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed Features Table */}
        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Plans and features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Features</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Basic</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Advanced</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Pro</th>
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr className="bg-gray-100">
                      <td colSpan={5} className="py-3 px-4 font-semibold text-gray-900">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-700">{feature.name}</td>
                        <td className="py-4 px-4 text-center">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-gray-700">{feature.free}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {typeof feature.basic === 'boolean' ? (
                            feature.basic ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-gray-700">{feature.basic}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {typeof feature.advanced === 'boolean' ? (
                            feature.advanced ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-gray-700">{feature.advanced}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-gray-700">{feature.pro}</span>
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

        {/* Selected Plan Summary */}
        {selectedPlanData && (
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${selectedPlanData.color} rounded-lg flex items-center justify-center`}>
                    <div className="text-white">
                      {selectedPlanData.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedPlanData.name} Plan</h3>
                    <p className="text-gray-600 text-lg">
                      {selectedPlanData.price === 0 ? 'Free forever' : `$${getPrice(selectedPlanData)}/${getPeriodText()}`}
                    </p>
                    {getSavings(selectedPlanData) && (
                      <p className="text-green-600 font-medium">
                        {getSavings(selectedPlanData)}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={handleContinue}
                  disabled={isLoading}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 transition-all duration-200"
                >
                  {isLoading ? 'Processing...' : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-600 text-sm">
            You can change your plan at any time in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}