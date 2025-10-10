// frontend/src/pages/Positions/types/positions.types.ts

export interface Position {
  id: string;
  type: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  margin: number;
  tradeMargin: number;
  liquidationPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  pl: number;
  plPercentage: number;
  marginRatio: number;
  tradingFees: number;
  fundingCost: number;
  createdAt: string;
  updatedAt: string;
  status: 'open' | 'running' | 'closed';
}

export interface PositionWithLiveData extends Position {
  currentPL: number;
  plPercentage: number;
  isLiquidated: boolean;
  liquidationRisk: 'low' | 'medium' | 'high';
}

export interface PositionFilters {
  status: 'open' | 'running' | 'closed' | 'all';
  type?: 'LONG' | 'SHORT';
  minPL?: number;
  maxPL?: number;
}

export interface PositionActions {
  onClose: (id: string) => Promise<void>;
  onEditSL: (id: string, stopLoss: number) => Promise<void>;
  onEditTP: (id: string, takeProfit: number) => Promise<void>;
  onAddMargin: (id: string, amount: number) => Promise<void>;
  onCashIn: (id: string, amount: number) => Promise<void>;
  onDetails: (position: Position) => void;
}

export interface PositionModalData {
  position: PositionWithLiveData;
  marketData: {
    ticker: {
      index: number;
      index24hChange: number;
    };
    fundingRate: number;
    nextFunding: string;
  };
}

export interface PositionsData {
  positions: PositionWithLiveData[];
  totalPL: number;
  totalMargin: number;
  activeCount: number;
  isLoading: boolean;
  error?: string;
  lastUpdate: number;
}

export interface PositionCardProps {
  position: PositionWithLiveData;
  variant?: 'mobile' | 'desktop';
  onClose: (id: string) => Promise<void>;
  onEdit: (id: string, sl?: number, tp?: number) => Promise<void>;
  onDetails: (position: Position) => void;
  className?: string;
}

export interface PositionFiltersProps {
  filters: PositionFilters;
  onFiltersChange: (filters: PositionFilters) => void;
  positionCounts: {
    open: number;
    running: number;
    closed: number;
  };
}

export interface EmptyStateProps {
  status: 'open' | 'running' | 'closed';
  onAction?: () => void;
}

export interface PositionModalProps {
  position: PositionWithLiveData | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, data?: any) => Promise<void>;
}
