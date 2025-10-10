// frontend/src/pages/Positions/components/PositionFilters.tsx

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { X, RefreshCw } from 'lucide-react';
import { PositionFiltersProps } from '../types/positions.types';

export const PositionFilters: React.FC<PositionFiltersProps> = ({
  filters,
  onFiltersChange,
  positionCounts
}) => {
  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status as 'open' | 'running' | 'closed' | 'all'
    });
  };

  const handleTypeChange = (type: 'LONG' | 'SHORT' | undefined) => {
    onFiltersChange({
      ...filters,
      type: type
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      type: undefined,
      minPL: undefined,
      maxPL: undefined
    });
  };

  const hasActiveFilters = filters.type || filters.minPL || filters.maxPL || filters.status !== 'all';

  return (
    <div className="flex flex-col space-y-4">
      {/* Tabs de Status */}
      <Tabs value={filters.status} onValueChange={handleStatusChange}>
        <TabsList className="grid w-full grid-cols-4 bg-[#1A1F2E] border border-[#2A3441]">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-[#3773F5] data-[state=active]:text-white"
          >
            All
            <Badge variant="secondary" className="ml-2 text-xs">
              {positionCounts.open + positionCounts.running + positionCounts.closed}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="open" 
            className="data-[state=active]:bg-[#3773F5] data-[state=active]:text-white"
          >
            Open
            <Badge variant="secondary" className="ml-2 text-xs">
              {positionCounts.open}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="running" 
            className="data-[state=active]:bg-[#3773F5] data-[state=active]:text-white"
          >
            Running
            <Badge variant="secondary" className="ml-2 text-xs">
              {positionCounts.running}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="closed" 
            className="data-[state=active]:bg-[#3773F5] data-[state=active]:text-white"
          >
            Closed
            <Badge variant="secondary" className="ml-2 text-xs">
              {positionCounts.closed}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtros adicionais */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Filtro por tipo */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-[#B8BCC8]">Type:</span>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={filters.type === 'LONG' ? 'default' : 'outline'}
              className={cn(
                'h-8 px-3 text-xs',
                filters.type === 'LONG' 
                  ? 'bg-[#0ECB81] text-black hover:bg-[#0ECB81]/90' 
                  : 'border-[#2A3441] hover:bg-[#2A3441]'
              )}
              onClick={() => handleTypeChange(filters.type === 'LONG' ? undefined : 'LONG')}
            >
              LONG
            </Button>
            <Button
              size="sm"
              variant={filters.type === 'SHORT' ? 'default' : 'outline'}
              className={cn(
                'h-8 px-3 text-xs',
                filters.type === 'SHORT' 
                  ? 'bg-[#F6465D] text-white hover:bg-[#F6465D]/90' 
                  : 'border-[#2A3441] hover:bg-[#2A3441]'
              )}
              onClick={() => handleTypeChange(filters.type === 'SHORT' ? undefined : 'SHORT')}
            >
              SHORT
            </Button>
          </div>
        </div>

        {/* Filtro por PL */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-[#B8BCC8]">PL Range:</span>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPL || ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                minPL: e.target.value ? Number(e.target.value) : undefined
              })}
              className="w-20 h-8 px-2 text-xs bg-[#1A1F2E] border border-[#2A3441] rounded text-[#E6E6E6] placeholder-[#B8BCC8]"
            />
            <span className="text-[#B8BCC8]">to</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPL || ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                maxPL: e.target.value ? Number(e.target.value) : undefined
              })}
              className="w-20 h-8 px-2 text-xs bg-[#1A1F2E] border border-[#2A3441] rounded text-[#E6E6E6] placeholder-[#B8BCC8]"
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center space-x-2 ml-auto">
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-[#B8BCC8] hover:text-[#E6E6E6]"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs border-[#2A3441] hover:bg-[#2A3441]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function para className condicional
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
