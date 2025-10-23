export interface TourStep {
  target: string;
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
  allowSkip: boolean;
  continuous: boolean;
}

// Tours disponíveis
export const TOURS: Record<string, Tour> = {
  ONBOARDING: {
    id: 'onboarding',
    name: 'Platform Onboarding',
    steps: [
      {
        target: 'body',
        content: 'Welcome to Axisor! Let us show you around the platform.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="sidebar"]',
        content: 'This is your main navigation. Access all features from here.',
        placement: 'right',
      },
      {
        target: '[data-tour="dashboard"]',
        content: 'Your dashboard shows real-time trading data and performance metrics.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="margin-guard"]',
        content: 'Margin Guard protects your positions with automated risk management.',
        placement: 'right',
      },
      {
        target: '[data-tour="automations"]',
        content: 'Create and manage your trading automations here.',
        placement: 'right',
      },
      {
        target: '[data-tour="positions"]',
        content: 'Monitor all your active and closed positions.',
        placement: 'right',
      },
      {
        target: '[data-tour="profile"]',
        content: 'Manage your account settings, credentials, and preferences.',
        placement: 'left',
      },
    ],
    allowSkip: true,
    continuous: true,
  },
  
  MARGIN_GUARD: {
    id: 'margin-guard',
    name: 'Margin Guard Tutorial',
    steps: [
      {
        target: '[data-tour="mg-enable"]',
        content: 'Enable Margin Guard to protect your positions automatically.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="mg-threshold"]',
        content: 'Set your margin threshold. When reached, Margin Guard will take action.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="mg-action"]',
        content: 'Choose what action to take: add margin or close position.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="mg-amount"]',
        content: 'Set how much margin to add when threshold is reached.',
        placement: 'bottom',
      },
    ],
    allowSkip: true,
    continuous: true,
  },
};

// Gerenciar progresso dos tours
export const tourProgress = {
  setCompleted: (tourId: string) => {
    const completed = JSON.parse(localStorage.getItem('tour_completed') || '[]');
    if (!completed.includes(tourId)) {
      completed.push(tourId);
      localStorage.setItem('tour_completed', JSON.stringify(completed));
    }
  },
  
  isCompleted: (tourId: string): boolean => {
    const completed = JSON.parse(localStorage.getItem('tour_completed') || '[]');
    return completed.includes(tourId);
  },
  
  reset: (tourId?: string) => {
    if (tourId) {
      const completed = JSON.parse(localStorage.getItem('tour_completed') || '[]');
      const filtered = completed.filter((id: string) => id !== tourId);
      localStorage.setItem('tour_completed', JSON.stringify(filtered));
    } else {
      localStorage.removeItem('tour_completed');
    }
  },
};

