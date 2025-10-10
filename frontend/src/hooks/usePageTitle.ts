import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useTotalPL } from './usePositions';

interface UsePageTitleOptions {
  baseTitle?: string;
  showPL?: boolean;
  customTitle?: string;
}

export const usePageTitle = ({
  baseTitle = 'Axisor',
  showPL = true,
  customTitle
}: UsePageTitleOptions = {}) => {
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = user?.is_admin || false;
  const totalPL = useTotalPL();

  useEffect(() => {
    const updateTitle = () => {
      console.log('🏷️ PAGE TITLE - Updating title:', { 
        totalPL, 
        showPL, 
        customTitle, 
        baseTitle, 
        isAuthenticated,
        isAdmin
      });

      let title = customTitle || baseTitle;

      // Para admin, não mostrar P&L no título
      if (showPL && !customTitle && isAuthenticated && !isAdmin) {
        // Usar P&L total das posições apenas para usuários comuns
        const finalPL = totalPL || 0;
        
        console.log('💰 PAGE TITLE - Positions data:', {
          totalPL: finalPL
        });
        
        const plFormatted = finalPL >= 0 ? `+${finalPL.toLocaleString()}` : finalPL.toLocaleString();

        title = `${plFormatted} sats | ${baseTitle}`;
        console.log('🏷️ PAGE TITLE - Final title with positions PL:', title);
      } else {
        console.log('🏷️ PAGE TITLE - Using base title (not authenticated, no PL, or admin):', title);
      }

      // Forçar atualização do título
      document.title = title;
      console.log('🏷️ PAGE TITLE - Document title set to:', document.title);
    };

    updateTitle();
  }, [totalPL, baseTitle, showPL, customTitle, isAuthenticated, isAdmin]);

  return {
    updateTitle: (newTitle: string) => {
      document.title = newTitle;
    }
  };
};
