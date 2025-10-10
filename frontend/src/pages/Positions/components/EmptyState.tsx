// frontend/src/pages/Positions/components/EmptyState.tsx

import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { EmptyStateProps } from '../types/positions.types';
import { useNavigate } from 'react-router-dom';

export const EmptyState: React.FC<EmptyStateProps> = ({
  status,
  onAction
}) => {
  const navigate = useNavigate();

  const getEmptyStateConfig = () => {
    switch (status) {
      case 'open':
        return {
          icon: <Plus className="h-12 w-12 text-[#3773F5]" />,
          title: 'Nenhuma posição aberta',
          description: 'Você não tem posições aguardando execução no momento.',
          actionText: 'Abrir Nova Posição',
          action: () => navigate('/trading')
        };
      
      case 'running':
        return {
          icon: <TrendingUp className="h-12 w-12 text-[#0ECB81]" />,
          title: 'Nenhuma posição ativa',
          description: 'Suas posições em execução aparecerão aqui quando você abrir trades.',
          actionText: 'Começar Trading',
          action: () => navigate('/trading')
        };
      
      case 'closed':
        return {
          icon: <TrendingDown className="h-12 w-12 text-[#B8BCC8]" />,
          title: 'Nenhuma posição fechada',
          description: 'O histórico de posições fechadas aparecerá aqui.',
          actionText: 'Ver Posições Ativas',
          action: () => navigate('/positions')
        };
      
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-[#F6465D]" />,
          title: 'Nenhuma posição encontrada',
          description: 'Não há posições para exibir com os filtros atuais.',
          actionText: 'Limpar Filtros',
          action: onAction
        };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <Card className="bg-[#1A1F2E] border-[#2A3441]">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-6">
          {config.icon}
        </div>
        
        <h3 className="text-xl font-semibold text-[#E6E6E6] mb-2">
          {config.title}
        </h3>
        
        <p className="text-[#B8BCC8] mb-6 max-w-md">
          {config.description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {config.action && (
            <Button
              onClick={config.action}
              className="bg-[#3773F5] hover:bg-[#3773F5]/90 text-white"
            >
              {config.actionText}
            </Button>
          )}
          
          <Button
            variant="outline"
            className="border-[#2A3441] hover:bg-[#2A3441] text-[#E6E6E6]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        
        {/* Dicas adicionais baseadas no status */}
        {status === 'running' && (
          <div className="mt-6 p-4 bg-[#0ECB81]/10 border border-[#0ECB81]/20 rounded-lg max-w-md">
            <h4 className="text-sm font-medium text-[#0ECB81] mb-2">
              💡 Dica para iniciantes
            </h4>
            <p className="text-xs text-[#B8BCC8]">
              Comece com posições pequenas para entender o mercado antes de aumentar o tamanho das suas operações.
            </p>
          </div>
        )}
        
        {status === 'closed' && (
          <div className="mt-6 p-4 bg-[#3773F5]/10 border border-[#3773F5]/20 rounded-lg max-w-md">
            <h4 className="text-sm font-medium text-[#3773F5] mb-2">
              📊 Análise de performance
            </h4>
            <p className="text-xs text-[#B8BCC8]">
              Use o histórico de posições fechadas para analisar sua performance e melhorar suas estratégias.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
