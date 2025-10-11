import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PositionData {
  side: 'long' | 'short';
  quantity: number;
  entry_price: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  margin: number;
  leverage: number;
  notes?: string;
  created_at: string;
  status: 'open' | 'closed';
}

export function usePositionCreation() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPosition = useCallback(async (positionData: PositionData) => {
    setLoading(true);
    
    try {
      // For now, we'll simulate the API call
      // Later this will be replaced with actual LN Markets API call
      console.log('Creating position:', positionData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock position ID
      const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Mock successful position creation
      const createdPosition = {
        id: positionId,
        ...positionData,
        current_price: positionData.entry_price,
        pl: 0,
        pl_percentage: 0,
        margin_ratio: 0,
        liquidation_price: positionData.side === 'long' 
          ? positionData.entry_price * 0.8 // 20% below entry for long
          : positionData.entry_price * 1.2, // 20% above entry for short
        opening_fee: positionData.quantity * 0.001, // 0.1% fee
        sum_carry_fees: 0,
        creation_ts: Date.now(),
        updated_at: new Date().toISOString()
      };
      
      toast({
        title: "Posição criada com sucesso!",
        description: `Posição ${positionId} foi criada e está ativa.`,
      });
      
      return createdPosition;
      
    } catch (error) {
      console.error('Error creating position:', error);
      
      toast({
        title: "Erro ao criar posição",
        description: "Não foi possível criar a posição. Tente novamente.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createMultiplePositions = useCallback(async (positionsData: PositionData[]) => {
    setLoading(true);
    
    try {
      const results = [];
      
      for (const positionData of positionsData) {
        const result = await createPosition(positionData);
        results.push(result);
        
        // Small delay between positions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({
        title: "Posições criadas com sucesso!",
        description: `${results.length} posições foram criadas.`,
      });
      
      return results;
      
    } catch (error) {
      console.error('Error creating multiple positions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [createPosition, toast]);

  const generateTestPositions = useCallback(async () => {
    const testPositions: PositionData[] = [
      {
        side: 'long',
        quantity: 100,
        entry_price: 65000,
        stop_loss: 62000,
        take_profit: 68000,
        margin: 1000,
        leverage: 10,
        notes: 'Teste - Long BTC conservador',
        created_at: new Date().toISOString(),
        status: 'open'
      },
      {
        side: 'short',
        quantity: 200,
        entry_price: 67000,
        stop_loss: 70000,
        take_profit: 64000,
        margin: 2000,
        leverage: 15,
        notes: 'Teste - Short BTC agressivo',
        created_at: new Date().toISOString(),
        status: 'open'
      },
      {
        side: 'long',
        quantity: 50,
        entry_price: 66000,
        stop_loss: 65800,
        take_profit: 66200,
        margin: 500,
        leverage: 5,
        notes: 'Teste - Scalping BTC',
        created_at: new Date().toISOString(),
        status: 'open'
      },
      {
        side: 'long',
        quantity: 300,
        entry_price: 64500,
        stop_loss: 60000,
        take_profit: 75000,
        margin: 3000,
        leverage: 20,
        notes: 'Teste - Swing trade BTC',
        created_at: new Date().toISOString(),
        status: 'open'
      },
      {
        side: 'short',
        quantity: 150,
        entry_price: 68000,
        stop_loss: 72000,
        take_profit: 63000,
        margin: 1500,
        leverage: 12,
        notes: 'Teste - Short médio prazo',
        created_at: new Date().toISOString(),
        status: 'open'
      }
    ];
    
    return await createMultiplePositions(testPositions);
  }, [createMultiplePositions]);

  return {
    createPosition,
    createMultiplePositions,
    generateTestPositions,
    loading
  };
}
