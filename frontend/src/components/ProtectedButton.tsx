import React from 'react';
import { Button } from '@/components/ui/button';
import { useEntitlements } from '@/hooks/useEntitlements';
import { PlanDecisionSheet } from './PlanDecisionSheet';
import { useState } from 'react';
import { Lock } from 'lucide-react';

interface ProtectedButtonProps {
  feature: string;
  children: React.ReactNode;
  onClick?: () => void;
  fallback?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export function ProtectedButton({ 
  feature, 
  children, 
  onClick, 
  fallback,
  className,
  variant = 'default',
  size = 'default',
  disabled = false
}: ProtectedButtonProps) {
  const { entitlements, loading } = useEntitlements();
  const [showPlanGate, setShowPlanGate] = useState(false);

  if (loading) {
    return (
      <Button disabled className={className} variant={variant} size={size}>
        Loading...
      </Button>
    );
  }

  const hasFeature = (entitlements: any, feature: string): boolean => {
    if (!entitlements) return false;
    
    const FEATURES = {
      free: ['view_dashboard', 'create_draft_bots', 'backtest', 'view_reports_readonly'],
      basic: ['view_dashboard', 'create_draft_bots', 'backtest', 'view_reports_readonly', 'connect_1_exchange', 'run_live_bots_limited', 'basic_support'],
      advanced: ['view_dashboard', 'create_draft_bots', 'backtest', 'view_reports_readonly', 'connect_1_exchange', 'run_live_bots_limited', 'basic_support', 'unlimited_bots', 'advanced_reports', 'priority_ws'],
      pro: ['view_dashboard', 'create_draft_bots', 'backtest', 'view_reports_readonly', 'connect_1_exchange', 'run_live_bots_limited', 'basic_support', 'unlimited_bots', 'advanced_reports', 'priority_ws', 'multi_tenant', 'compliance', 'api_access', 'white_label']
    };

    return FEATURES[entitlements.feature_set as keyof typeof FEATURES]?.includes(feature) ?? false;
  };

  const hasPermission = hasFeature(entitlements, feature);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <Button
          onClick={() => setShowPlanGate(true)}
          className={className}
          variant="outline"
          size={size}
          disabled={disabled}
        >
          <Lock className="h-4 w-4 mr-2" />
          {children}
        </Button>
        
        {showPlanGate && (
          <PlanDecisionSheet
            trigger="blocked_action"
            feature={feature}
            onClose={() => setShowPlanGate(false)}
            onUpgrade={(plan) => {
              console.log(`Upgrading to ${plan} for feature: ${feature}`);
              setShowPlanGate(false);
              // TODO: Implement upgrade flow
            }}
          />
        )}
      </>
    );
  }

  return (
    <Button
      onClick={onClick}
      className={className}
      variant={variant}
      size={size}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
