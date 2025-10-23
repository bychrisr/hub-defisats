import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, ArrowLeft } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useToast } from '@/components/ui/use-toast';

const plans = [
  {
    id: 'FREE',
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
    current: true,
    popular: false
  },
  {
    id: 'BASIC',
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
    current: false,
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
    current: false,
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
    current: false,
    popular: false
  }
];

export default function Plans() {
  const navigate = useNavigate();
  const { entitlements, loading } = useEntitlements();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (entitlements) {
      setSelectedPlan(entitlements.plan);
    }
  }, [entitlements]);

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'FREE') {
      toast({
        title: 'Already on Free plan',
        description: 'You are currently on the Free plan.',
      });
      return;
    }

    if (planId === entitlements?.plan) {
      toast({
        title: 'Current plan',
        description: `You are already on the ${planId} plan.`,
      });
      return;
    }

    setIsUpgrading(true);
    try {
      // TODO: Implement plan selection API call
      console.log(`Upgrading to ${planId}`);
      
      toast({
        title: 'Plan upgrade initiated',
        description: `You will be redirected to complete your ${planId} plan upgrade.`,
      });
      
      // TODO: Redirect to payment/upgrade flow
      // navigate('/upgrade', { state: { plan: planId } });
      
    } catch (error) {
      toast({
        title: 'Upgrade failed',
        description: 'There was an error processing your plan upgrade. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your trading needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Current Plan Status */}
        {entitlements && (
          <div className="mb-8 p-4 bg-primary/10 rounded-lg">
            <p className="text-center">
              <strong>Current Plan:</strong> {entitlements.plan} 
              {entitlements.demo_mode && ' (Demo Mode)'}
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular ? 'ring-2 ring-primary scale-105' : ''
              } ${
                plan.current ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
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
                  variant={
                    plan.current 
                      ? 'outline' 
                      : plan.popular 
                        ? 'default' 
                        : 'outline'
                  }
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isUpgrading || plan.current}
                >
                  {plan.current ? 'Current Plan' : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
}
