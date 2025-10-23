import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Check, Star } from 'lucide-react';

interface PlanDecisionSheetProps {
  trigger: 'tour_end' | 'tour_skip' | 'blocked_action';
  feature?: string;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
}

const plans = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: '$29',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Connect 1 exchange',
      'Run up to 3 live bots',
      'Basic support',
      'Real-time data'
    ],
    popular: false
  },
  {
    id: 'ADVANCED',
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
    id: 'PRO',
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
  }
];

export function PlanDecisionSheet({ trigger, feature, onClose, onUpgrade }: PlanDecisionSheetProps) {
  const getTitle = () => {
    switch (trigger) {
      case 'tour_end':
        return 'Ready to start trading?';
      case 'tour_skip':
        return 'Unlock the full potential';
      case 'blocked_action':
        return feature ? `"${feature}" requires a paid plan` : 'This feature requires a paid plan';
      default:
        return 'Choose your plan';
    }
  };

  const getSubtitle = () => {
    switch (trigger) {
      case 'tour_end':
        return 'You\'ve seen what Axisor can do. Now let\'s get you trading with real data.';
      case 'tour_skip':
        return 'Don\'t miss out on the powerful features that can transform your trading.';
      case 'blocked_action':
        return 'Upgrade to access this feature and many more.';
      default:
        return 'Select the plan that fits your trading needs.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
              <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => onUpgrade(plan.id)}
                  >
                    Choose {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              All plans include 14-day free trial. Cancel anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
