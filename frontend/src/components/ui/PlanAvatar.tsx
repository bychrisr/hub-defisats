import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Check, 
  CreditCard, 
  Zap, 
  Crown, 
  Star 
} from 'lucide-react';

interface PlanAvatarProps {
  email?: string;
  planType?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

// Função para obter as cores do plano
const getPlanColors = (planType: string) => {
  switch (planType) {
    case 'lifetime':
      return {
        border: 'border-yellow-500',
        bg: 'bg-yellow-500/20',
        ring: 'ring-yellow-500/30',
        text: 'text-yellow-600 dark:text-yellow-400'
      };
    case 'pro':
      return {
        border: 'border-yellow-500',
        bg: 'bg-yellow-500/20',
        ring: 'ring-yellow-500/30',
        text: 'text-yellow-600 dark:text-yellow-400'
      };
    case 'advanced':
      return {
        border: 'border-purple-500',
        bg: 'bg-purple-500/20',
        ring: 'ring-purple-500/30',
        text: 'text-purple-600 dark:text-purple-400'
      };
    case 'basic':
      return {
        border: 'border-blue-500',
        bg: 'bg-blue-500/20',
        ring: 'ring-blue-500/30',
        text: 'text-blue-600 dark:text-blue-400'
      };
    case 'free':
    default:
      return {
        border: 'border-green-500',
        bg: 'bg-green-500/20',
        ring: 'ring-green-500/30',
        text: 'text-green-600 dark:text-green-400'
      };
  }
};

// Função para obter o ícone do plano
const getPlanIcon = (planType: string) => {
  switch (planType) {
    case 'lifetime':
      return <Star className="h-3 w-3" />;
    case 'pro':
      return <Crown className="h-3 w-3" />;
    case 'advanced':
      return <Zap className="h-3 w-3" />;
    case 'basic':
      return <CreditCard className="h-3 w-3" />;
    case 'free':
    default:
      return <Check className="h-3 w-3" />;
  }
};

// Função para obter o tamanho do avatar
const getAvatarSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'h-6 w-6';
    case 'md':
      return 'h-8 w-8';
    case 'lg':
      return 'h-20 w-20';
    default:
      return 'h-8 w-8';
  }
};

// Função para obter o tamanho do badge
const getBadgeSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'w-4 h-4';
    case 'md':
      return 'w-5 h-5';
    case 'lg':
      return 'w-6 h-6';
    default:
      return 'w-5 h-5';
  }
};

export const PlanAvatar: React.FC<PlanAvatarProps> = ({
  email,
  planType = 'free',
  size = 'md',
  showBadge = true,
  className
}) => {
  const planColors = getPlanColors(planType);
  const planIcon = getPlanIcon(planType);
  const avatarSize = getAvatarSize(size);
  const badgeSize = getBadgeSize(size);
  
  const getUserInitials = (email: string) => {
    return email?.charAt(0).toUpperCase() || 'U';
  };

  // Para tamanhos pequenos, apenas mostrar o badge
  if (size === 'sm' || size === 'md') {
    return (
      <div className={cn("relative", className)}>
        <Avatar className={cn("transition-all duration-300", avatarSize)}>
          <AvatarImage src="/avatars/01.png" />
          <AvatarFallback className={cn(
            "font-medium transition-all duration-300 bg-primary text-primary-foreground",
            size === 'sm' ? 'text-xs' : 'text-xs'
          )}>
            {getUserInitials(email || '')}
          </AvatarFallback>
        </Avatar>

        {/* Badge de plano */}
        {showBadge && (
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center",
            planColors.bg,
            planColors.border,
            "border-2",
            badgeSize
          )}>
            {planIcon}
          </div>
        )}
      </div>
    );
  }

  // Para tamanho grande, mostrar círculo completo
  return (
    <div className={cn("relative", className)}>
      {/* Círculo de plano */}
      <div className="absolute -inset-1 rounded-full">
        <div className={cn(
          "w-full h-full rounded-full",
          planColors.bg,
          planColors.ring
        )}></div>
        <div className={cn(
          "absolute inset-0 rounded-full",
          planColors.border,
          "border-2"
        )}></div>
      </div>
      
      {/* Avatar */}
      <Avatar className={cn("transition-all duration-300 relative z-10", avatarSize)}>
        <AvatarImage src="/avatars/01.png" />
        <AvatarFallback className="font-medium transition-all duration-300 bg-primary text-primary-foreground text-lg">
          {getUserInitials(email || '')}
        </AvatarFallback>
      </Avatar>

      {/* Badge de plano */}
      {showBadge && (
        <div className={cn(
          "absolute -bottom-1 -right-1 rounded-full flex items-center justify-center",
          planColors.bg,
          planColors.border,
          "border-2",
          badgeSize,
          "z-20"
        )}>
          {planIcon}
        </div>
      )}
    </div>
  );
};

export default PlanAvatar;
