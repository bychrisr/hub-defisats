import { useState } from 'react';
import { Tour, tourProgress } from '@/services/tourService';

// Temporary implementation without react-joyride until installation is resolved
interface CallBackProps {
  status: string;
  action: string;
  index: number;
  type: string;
}

interface Step {
  target: string;
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
}

interface Styles {
  options: any;
  tooltip: any;
  tooltipContainer: any;
  tooltipTitle: any;
  tooltipContent: any;
  buttonNext: any;
  buttonBack: any;
  buttonSkip: any;
}

const STATUS = {
  FINISHED: 'finished',
  SKIPPED: 'skipped',
};

interface ProductTourProps {
  tour: Tour;
  run: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

const tourStyles: Styles = {
  options: {
    primaryColor: '#3b82f6', // blue-500
    textColor: '#f1f5f9', // slate-100
    backgroundColor: '#1e293b', // slate-800
    overlayColor: 'rgba(0, 0, 0, 0.7)',
    arrowColor: '#1e293b',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '12px',
    padding: '20px',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  buttonNext: {
    backgroundColor: '#3b82f6',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
  },
  buttonBack: {
    color: '#94a3b8',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#94a3b8',
  },
};

export const ProductTour = ({ tour, run, onComplete, onSkip }: ProductTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Temporary simple implementation
  if (!run || !tour.steps.length) {
    return null;
  }

  const currentStepData = tour.steps[currentStep];
  const isLastStep = currentStep === tour.steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      tourProgress.setCompleted(tour.id);
      onComplete?.();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {currentStepData.title || `Step ${currentStep + 1} of ${tour.steps.length}`}
          </h3>
          <p className="text-slate-300">{currentStepData.content}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            {tour.allowSkip && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Skip tour
              </button>
            )}
          </div>
          
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
        
        <div className="mt-4 text-center text-sm text-slate-500">
          {currentStep + 1} of {tour.steps.length}
        </div>
      </div>
    </div>
  );
};

