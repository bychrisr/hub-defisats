import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useTotalPL } from './usePositions';

interface UsePageTitleOptions {
  baseTitle?: string;
  showPL?: boolean;
  customTitle?: string;
}

export const usePageTitle = ({
  baseTitle = 'defiSATS',
  showPL = true,
  customTitle
}: UsePageTitleOptions = {}) => {
  const { isAuthenticated } = useAuthStore();
  const totalPL = useTotalPL();

  useEffect(() => {
    const updateTitle = () => {
      console.log('🏷️ PAGE TITLE - Updating title:', { 
        totalPL, 
        showPL, 
        customTitle, 
        baseTitle, 
        isAuthenticated 
      });

      let title = customTitle || baseTitle;

      if (showPL && !customTitle && isAuthenticated) {
        // Usar P&L total das posições
        const finalPL = totalPL || 0;
        
        console.log('💰 PAGE TITLE - Positions data:', {
          totalPL: finalPL
        });
        
        const plFormatted = finalPL >= 0 ? `+${finalPL.toLocaleString()}` : finalPL.toLocaleString();

        title = `${plFormatted} sats | ${baseTitle}`;
        console.log('🏷️ PAGE TITLE - Final title with positions PL:', title);
      } else {
        console.log('🏷️ PAGE TITLE - Using base title (not authenticated or no PL):', title);
      }

      // Forçar atualização do título
      document.title = title;
      console.log('🏷️ PAGE TITLE - Document title set to:', document.title);
    };

    updateTitle();
  }, [totalPL, baseTitle, showPL, customTitle, isAuthenticated]);

  return {
    updateTitle: (newTitle: string) => {
      document.title = newTitle;
    }
  };
};
