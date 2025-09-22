import React from 'react';
import { Settings, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomationCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'saved' | 'loading';
  onClick?: () => void;
}

const AutomationCard: React.FC<AutomationCardProps> = ({
  title,
  description,
  icon,
  className,
  variant = 'default',
  onClick
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'saved':
        return 'automation-card-saved';
      case 'loading':
        return 'automation-card-loading';
      default:
        return 'automation-card';
    }
  };

  return (
    <div
      className={cn(
        'automation-card-container',
        getVariantStyles(),
        className
      )}
      onClick={onClick}
    >
      <div className="automation-card-content">
        <div className="automation-card-header">
          <div className="automation-card-icon">
            {icon || <Settings className="w-5 h-5" />}
          </div>
          <h3 className="automation-card-title">
            {title}
          </h3>
        </div>
        <p className="automation-card-description">
          {description}
        </p>
        {variant === 'saved' && (
          <div className="automation-card-status">
            <Check className="w-4 h-4" />
            <span>Configurações Salvas</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationCard;




