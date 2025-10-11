// frontend/src/pages/Positions/index.tsx

import React, { useState, useMemo } from 'react';
import { usePositionsData } from './hooks/usePositionsData';
import { usePositionActions } from './hooks/usePositionActions';
import { PositionCard } from './components/PositionCard';
import { PositionCardDesktop } from './components/PositionCardDesktop';
import { PositionFilters } from './components/PositionFilters';
import { PositionModal } from './components/PositionModal';
import { EmptyState } from './components/EmptyState';
import { PositionFilters as PositionFiltersType, PositionWithLiveData } from './types/positions.types';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PositionCreationModal } from '../../components/PositionCreationModal';
import { PositionTestManager } from '../../components/PositionTestManager';
import { usePositionCreation } from '../../hooks/usePositionCreation';

export default function Positions() {
  const [filters, setFilters] = useState<PositionFiltersType>({
    status: 'running',
    type: undefined,
    minPL: undefined,
    maxPL: undefined
  });
  
  const [selectedPosition, setSelectedPosition] = useState<PositionWithLiveData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { positions, totalPL, totalMargin, activeCount, isLoading, error } = usePositionsData();
  const {
    closePosition,
    updateStopLoss,
    updateTakeProfit,
    addMargin,
    cashInMargin,
    closeAllPositions,
    isClosing,
    isUpdatingSL,
    isUpdatingTP,
    isAddingMargin,
    isCashingIn,
    isClosingAll,
    isLoading: isActionLoading
  } = usePositionActions();

  const { createPosition, loading: isCreatingPosition } = usePositionCreation();

  // Filtrar posições baseado nos filtros
  const filteredPositions = useMemo(() => {
    return positions.filter(position => {
      // Filtro por status
      if (filters.status !== 'all' && position.status !== filters.status) {
        return false;
      }

      // Filtro por tipo
      if (filters.type && position.type !== filters.type) {
        return false;
      }

      // Filtro por PL
      if (filters.minPL !== undefined && position.currentPL < filters.minPL) {
        return false;
      }
      if (filters.maxPL !== undefined && position.currentPL > filters.maxPL) {
        return false;
      }

      return true;
    });
  }, [positions, filters]);

  // Contar posições por status
  const positionCounts = useMemo(() => {
    return {
      open: positions.filter(p => p.status === 'open').length,
      running: positions.filter(p => p.status === 'running').length,
      closed: positions.filter(p => p.status === 'closed').length
    };
  }, [positions]);

  // Handlers
  const handleClosePosition = async (positionId: string) => {
    await closePosition(positionId);
  };

  const handleEditPosition = async (positionId: string, sl?: number, tp?: number) => {
    if (sl !== undefined) {
      await updateStopLoss({ positionId, stopLoss: sl });
    }
    if (tp !== undefined) {
      await updateTakeProfit({ positionId, takeProfit: tp });
    }
  };

  const handlePositionDetails = (position: PositionWithLiveData) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  };

  const handleModalAction = async (action: string, data?: any) => {
    if (!selectedPosition) return;

    switch (action) {
      case 'closePosition':
        await closePosition(selectedPosition.id);
        break;
      case 'updateStopLoss':
        await updateStopLoss({ positionId: selectedPosition.id, stopLoss: data.stopLoss });
        break;
      case 'updateTakeProfit':
        await updateTakeProfit({ positionId: selectedPosition.id, takeProfit: data.takeProfit });
        break;
      case 'addMargin':
        await addMargin({ positionId: selectedPosition.id, amount: data.amount });
        break;
      case 'cashInMargin':
        await cashInMargin({ positionId: selectedPosition.id, amount: data.amount });
        break;
    }
  };

  const handleCloseAll = async () => {
    if (window.confirm('Tem certeza que deseja fechar todas as posições?')) {
      await closeAllPositions();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#E6E6E6]">Positions</h1>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#1A1F2E] border border-[#2A3441] rounded-lg p-4">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar posições: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#E6E6E6]">Positions</h1>
            <p className="text-[#B8BCC8] mt-1">
              {activeCount} posições ativas • PL Total: {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <PositionCreationModal 
              onCreatePosition={createPosition}
              disabled={isCreatingPosition}
            />
            
            <PositionTestManager 
              disabled={isCreatingPosition}
            />
            
            <Button
              variant="outline"
              className="border-[#2A3441] hover:bg-[#2A3441] text-[#E6E6E6]"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            {filteredPositions.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleCloseAll}
                disabled={isClosingAll}
                className="bg-[#F6465D] hover:bg-[#F6465D]/90"
              >
                <X className="h-4 w-4 mr-2" />
                Close All
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <PositionFilters
            filters={filters}
            onFiltersChange={setFilters}
            positionCounts={positionCounts}
          />
        </div>

        {/* Conteúdo */}
        {filteredPositions.length === 0 ? (
          <EmptyState
            status={filters.status as 'open' | 'running' | 'closed'}
            onAction={() => setFilters({ status: 'all', type: undefined, minPL: undefined, maxPL: undefined })}
          />
        ) : (
          <div className="space-y-4">
            {/* Mobile: Stack vertical */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredPositions.map(position => (
                <PositionCard
                  key={position.id}
                  position={position}
                  variant="mobile"
                  onClose={handleClosePosition}
                  onEdit={handleEditPosition}
                  onDetails={handlePositionDetails}
                />
              ))}
            </div>

            {/* Desktop: Grid horizontal */}
            <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPositions.map(position => (
                <PositionCardDesktop
                  key={position.id}
                  position={position}
                  variant="desktop"
                  onClose={handleClosePosition}
                  onEdit={handleEditPosition}
                  onDetails={handlePositionDetails}
                />
              ))}
            </div>
          </div>
        )}

        {/* Modal de detalhes */}
        <PositionModal
          position={selectedPosition}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPosition(null);
          }}
          onAction={handleModalAction}
        />

        {/* Loading overlay para ações */}
        {isActionLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1A1F2E] border border-[#2A3441] rounded-lg p-6 flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 animate-spin text-[#3773F5]" />
              <span className="text-[#E6E6E6]">Processando ação...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
