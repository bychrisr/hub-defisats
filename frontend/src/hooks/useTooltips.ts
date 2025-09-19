import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

export interface TooltipConfig {
  id: string;
  card_key: string;
  tooltip_text: string;
  tooltip_position: 'top' | 'bottom' | 'left' | 'right';
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface DashboardCard {
  id: string;
  key: string;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  order_index: number;
  is_active: boolean;
  is_admin_only: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CardWithTooltip extends DashboardCard {
  tooltip?: TooltipConfig;
}

export const useTooltips = () => {
  console.log('🎯 TOOLTIPS - Hook initialized');
  console.log('🎯 TOOLTIPS - About to call useAuthStore');
  const { isAuthenticated, token } = useAuthStore();
  console.log('🎯 TOOLTIPS - useAuthStore called:', { isAuthenticated, hasToken: !!token });
  const [tooltips, setTooltips] = useState<Record<string, TooltipConfig>>({});
  const [cards, setCards] = useState<CardWithTooltip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tooltip config for a specific card
  const getTooltipConfig = useCallback(async (cardKey: string): Promise<TooltipConfig | null> => {
    if (!isAuthenticated || !token) {
      return null;
    }

    try {
      const response = await api.get(`/tooltips/${cardKey}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tooltip config:', error);
      return null;
    }
  }, [isAuthenticated, token]);

  // Fetch all tooltip configs
  const fetchAllTooltips = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/tooltips');
      const tooltipsMap: Record<string, TooltipConfig> = {};
      
      response.data.data.forEach((tooltip: TooltipConfig) => {
        tooltipsMap[tooltip.card_key] = tooltip;
      });

      setTooltips(tooltipsMap);
    } catch (error) {
      console.error('Error fetching tooltip configs:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Fetch cards with tooltips
  const fetchCardsWithTooltips = useCallback(async (category?: string, isActive?: boolean) => {
    if (!isAuthenticated || !token) {
      console.log('🎯 TOOLTIPS - Not authenticated or no token, skipping fetch');
      return;
    }

    try {
      console.log('🎯 TOOLTIPS - Starting fetchCardsWithTooltips');
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (isActive !== undefined) params.append('is_active', isActive.toString());

      console.log('🎯 TOOLTIPS - Making request to /cards-with-tooltips');
      const response = await api.get(`/cards-with-tooltips?${params}`);
      console.log('🎯 TOOLTIPS - Response received:', response.data);
      setCards(response.data.data);
    } catch (error) {
      console.error('🎯 TOOLTIPS - Error fetching cards with tooltips:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Get tooltip for a specific card
  const getTooltipForCard = useCallback((cardKey: string): TooltipConfig | null => {
    return tooltips[cardKey] || null;
  }, [tooltips]);

  // Check if tooltip is enabled for a card
  const isTooltipEnabled = useCallback((cardKey: string): boolean => {
    const tooltip = tooltips[cardKey];
    return tooltip ? tooltip.is_enabled : false;
  }, [tooltips]);

  // Get tooltip text for a card
  const getTooltipText = useCallback((cardKey: string): string | null => {
    const tooltip = tooltips[cardKey];
    return tooltip && tooltip.is_enabled ? tooltip.tooltip_text : null;
  }, [tooltips]);

  // Get tooltip position for a card
  const getTooltipPosition = useCallback((cardKey: string): 'top' | 'bottom' | 'left' | 'right' => {
    const tooltip = tooltips[cardKey];
    return tooltip ? tooltip.tooltip_position : 'top';
  }, [tooltips]);

  // Initialize tooltips and cards on mount when authenticated
  useEffect(() => {
    console.log('🎯 TOOLTIPS - useEffect triggered:', { isAuthenticated, token: !!token });
    if (isAuthenticated) {
      console.log('🎯 TOOLTIPS - User authenticated, calling fetchAllTooltips and fetchCardsWithTooltips');
      fetchAllTooltips();
      fetchCardsWithTooltips();
    } else {
      console.log('🎯 TOOLTIPS - User not authenticated, skipping initialization');
    }
  }, [isAuthenticated, fetchAllTooltips, fetchCardsWithTooltips]);

  return {
    tooltips,
    cards,
    loading,
    error,
    getTooltipConfig,
    fetchAllTooltips,
    fetchCardsWithTooltips,
    getTooltipForCard,
    isTooltipEnabled,
    getTooltipText,
    getTooltipPosition,
  };
};
