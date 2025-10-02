import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeframeOption {
  value: string;
  label: string;
  category: 'MINUTES' | 'HOURS' | 'DAYS';
}

interface TimeframeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const timeframeOptions: TimeframeOption[] = [
  // MINUTES
  { value: '1m', label: '1 minute', category: 'MINUTES' },
  { value: '3m', label: '3 minutes', category: 'MINUTES' },
  { value: '5m', label: '5 minutes', category: 'MINUTES' },
  { value: '10m', label: '10 minutes', category: 'MINUTES' },
  { value: '15m', label: '15 minutes', category: 'MINUTES' },
  { value: '30m', label: '30 minutes', category: 'MINUTES' },
  { value: '45m', label: '45 minutes', category: 'MINUTES' },
  
  // HOURS
  { value: '1h', label: '1 hour', category: 'HOURS' },
  { value: '2h', label: '2 hours', category: 'HOURS' },
  { value: '3h', label: '3 hours', category: 'HOURS' },
  { value: '4h', label: '4 hours', category: 'HOURS' },
  
  // DAYS
  { value: '1d', label: '1 day', category: 'DAYS' },
  { value: '1w', label: '1 week', category: 'DAYS' },
  { value: '1M', label: '1 month', category: 'DAYS' },
  { value: '3M', label: '3 months', category: 'DAYS' },
];

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Encontrar a opção atual
  const currentOption = timeframeOptions.find(option => option.value === value) || timeframeOptions[7]; // Default to 1h

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Agrupar opções por categoria
  const groupedOptions = timeframeOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, TimeframeOption[]>);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const getDisplayValue = (value: string) => {
    // Converter para formato mais compacto para exibição
    const mapping: Record<string, string> = {
      '1m': '1M',
      '3m': '3M',
      '5m': '5M',
      '10m': '10M',
      '15m': '15M',
      '30m': '30M',
      '45m': '45M',
      '1h': '1H',
      '2h': '2H',
      '3h': '3H',
      '4h': '4H',
      '1d': '1D',
      '1w': '1W',
      '1M': '1M',
      '3M': '3M',
    };
    return mapping[value] || value;
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Botão principal - estilo LN Markets */}
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
          'bg-gradient-to-r from-purple-500 to-blue-500 text-white',
          'hover:from-purple-600 hover:to-blue-600',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'shadow-lg hover:shadow-xl',
          isOpen && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900'
        )}
      >
        <Clock className="h-4 w-4" />
        <span>{getDisplayValue(currentOption.value)}</span>
        <ChevronDown 
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Cabeçalho */}
          <div className="px-3 py-2 bg-gray-700 border-b border-gray-600">
            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Timeframe
            </div>
          </div>

          {/* Opções agrupadas */}
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(groupedOptions).map(([category, options]) => (
              <div key={category}>
                {/* Cabeçalho da categoria */}
                <div className="px-3 py-2 bg-gray-750 border-b border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {category}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </div>
                </div>

                {/* Opções da categoria */}
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHoveredValue(option.value)}
                    onMouseLeave={() => setHoveredValue(null)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors duration-150',
                      'hover:bg-gray-700 focus:bg-gray-700 focus:outline-none',
                      value === option.value && 'bg-blue-600 text-white',
                      hoveredValue === option.value && value !== option.value && 'bg-gray-700 text-white',
                      value !== option.value && hoveredValue !== option.value && 'text-gray-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Rodapé com indicador de scroll */}
          <div className="px-3 py-2 bg-gray-700 border-t border-gray-600">
            <div className="flex justify-center">
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeframeSelector;
