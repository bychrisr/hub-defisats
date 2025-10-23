import { useState, useEffect } from 'react';

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/me/entitlements', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })
      .then(r => r.json())
      .then(setEntitlements)
      .finally(() => setLoading(false));
  }, []);
  
  return { entitlements, loading };
}

const FEATURES = {
  free: ['view_dashboard', 'create_draft_bots', 'backtest'],
  basic: ['view_dashboard', 'create_draft_bots', 'backtest', 'connect_1_exchange', 'run_live_bots_limited'],
  advanced: ['view_dashboard', 'create_draft_bots', 'backtest', 'connect_1_exchange', 'run_live_bots_limited', 'unlimited_bots', 'advanced_reports'],
  pro: ['view_dashboard', 'create_draft_bots', 'backtest', 'connect_1_exchange', 'run_live_bots_limited', 'unlimited_bots', 'advanced_reports', 'multi_tenant', 'api_access']
};

export function hasFeature(ent: any, feature: string): boolean {
  if (!ent) return false;
  return FEATURES[ent.feature_set as keyof typeof FEATURES]?.includes(feature) ?? false;
}
