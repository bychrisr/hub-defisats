// frontend/src/pages/Positions/hooks/usePositionActions.ts

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Position } from '../types/positions.types';
import { toast } from 'sonner';

export const usePositionActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Invalidação de cache após ações
  const invalidatePositions = () => {
    queryClient.invalidateQueries({ queryKey: ['positions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // Fechar posição
  const closePosition = useMutation({
    mutationFn: async (positionId: string) => {
      console.log('🔍 POSITION ACTIONS - Closing position:', positionId);
      
      const response = await api.post(`/api/lnmarkets/close-position`, {
        positionId
      });
      
      console.log('✅ POSITION ACTIONS - Position closed:', response.data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Posição fechada com sucesso');
      invalidatePositions();
    },
    onError: (error: any) => {
      console.error('❌ POSITION ACTIONS - Error closing position:', error);
      toast.error(`Erro ao fechar posição: ${error.response?.data?.message || error.message}`);
    }
  });

  // Atualizar Stop Loss
  const updateStopLoss = useMutation({
    mutationFn: async ({ positionId, stopLoss }: { positionId: string; stopLoss: number }) => {
      console.log('🔍 POSITION ACTIONS - Updating stop loss:', { positionId, stopLoss });
      
      const response = await api.post(`/api/lnmarkets/update-stop-loss`, {
        positionId,
        stopLoss
      });
      
      console.log('✅ POSITION ACTIONS - Stop loss updated:', response.data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Stop Loss atualizado');
      invalidatePositions();
    },
    onError: (error: any) => {
      console.error('❌ POSITION ACTIONS - Error updating stop loss:', error);
      toast.error(`Erro ao atualizar Stop Loss: ${error.response?.data?.message || error.message}`);
    }
  });

  // Atualizar Take Profit
  const updateTakeProfit = useMutation({
    mutationFn: async ({ positionId, takeProfit }: { positionId: string; takeProfit: number }) => {
      console.log('🔍 POSITION ACTIONS - Updating take profit:', { positionId, takeProfit });
      
      const response = await api.post(`/api/lnmarkets/update-take-profit`, {
        positionId,
        takeProfit
      });
      
      console.log('✅ POSITION ACTIONS - Take profit updated:', response.data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Take Profit atualizado');
      invalidatePositions();
    },
    onError: (error: any) => {
      console.error('❌ POSITION ACTIONS - Error updating take profit:', error);
      toast.error(`Erro ao atualizar Take Profit: ${error.response?.data?.message || error.message}`);
    }
  });

  // Adicionar margem
  const addMargin = useMutation({
    mutationFn: async ({ positionId, amount }: { positionId: string; amount: number }) => {
      console.log('🔍 POSITION ACTIONS - Adding margin:', { positionId, amount });
      
      const response = await api.post(`/api/lnmarkets/add-margin`, {
        positionId,
        amount
      });
      
      console.log('✅ POSITION ACTIONS - Margin added:', response.data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Margem adicionada com sucesso');
      invalidatePositions();
    },
    onError: (error: any) => {
      console.error('❌ POSITION ACTIONS - Error adding margin:', error);
      toast.error(`Erro ao adicionar margem: ${error.response?.data?.message || error.message}`);
    }
  });

  // Retirar margem
  const cashInMargin = useMutation({
    mutationFn: async ({ positionId, amount }: { positionId: string; amount: number }) => {
      console.log('🔍 POSITION ACTIONS - Cashing in margin:', { positionId, amount });
      
      const response = await api.post(`/api/lnmarkets/cash-in-margin`, {
        positionId,
        amount
      });
      
      console.log('✅ POSITION ACTIONS - Margin cashed in:', response.data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Margem retirada com sucesso');
      invalidatePositions();
    },
    onError: (error: any) => {
      console.error('❌ POSITION ACTIONS - Error cashing in margin:', error);
      toast.error(`Erro ao retirar margem: ${error.response?.data?.message || error.message}`);
    }
  });

  // Fechar todas as posições
  const closeAllPositions = useMutation({
    mutationFn: async () => {
      console.log('🔍 POSITION ACTIONS - Closing all positions');
      
      const response = await api.post(`/api/lnmarkets/close-all-positions`);
      
      console.log('✅ POSITION ACTIONS - All positions closed:', response.data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Todas as posições foram fechadas');
      invalidatePositions();
    },
    onError: (error: any) => {
      console.error('❌ POSITION ACTIONS - Error closing all positions:', error);
      toast.error(`Erro ao fechar todas as posições: ${error.response?.data?.message || error.message}`);
    }
  });

  return {
    // Ações individuais
    closePosition: closePosition.mutate,
    updateStopLoss: updateStopLoss.mutate,
    updateTakeProfit: updateTakeProfit.mutate,
    addMargin: addMargin.mutate,
    cashInMargin: cashInMargin.mutate,
    
    // Ações em lote
    closeAllPositions: closeAllPositions.mutate,
    
    // Estados de loading
    isClosing: closePosition.isPending,
    isUpdatingSL: updateStopLoss.isPending,
    isUpdatingTP: updateTakeProfit.isPending,
    isAddingMargin: addMargin.isPending,
    isCashingIn: cashInMargin.isPending,
    isClosingAll: closeAllPositions.isPending,
    
    // Estado geral
    isLoading: closePosition.isPending || 
               updateStopLoss.isPending || 
               updateTakeProfit.isPending || 
               addMargin.isPending || 
               cashInMargin.isPending || 
               closeAllPositions.isPending
  };
};
