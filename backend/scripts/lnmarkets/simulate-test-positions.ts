#!/usr/bin/env ts-node

/**
 * Script para simular posições de teste (sem criar na LN Markets real)
 * 
 * Este script gera dados de posições simuladas para testar o frontend
 * sem fazer chamadas reais para a API da LN Markets.
 */

import * as fs from 'fs';
import * as path from 'path';

interface SimulatedPosition {
  id: string;
  side: 'long' | 'short';
  quantity: number;
  leverage: number;
  entry_price: number;
  price: number;
  margin: number;
  pl: number;
  liquidation: number;
  opening_fee: number;
  sum_carry_fees: number;
  creation_ts: string;
  stoploss?: number;
  takeprofit?: number;
  status: 'open' | 'closed';
}

class PositionSimulator {
  private positions: SimulatedPosition[] = [];

  /**
   * Gera uma posição simulada
   */
  generateSimulatedPosition(index: number): SimulatedPosition {
    const sides: ('long' | 'short')[] = ['long', 'short'];
    const quantities = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0];
    const leverages = [1, 2, 5, 10, 20];
    
    const side = sides[Math.floor(Math.random() * sides.length)];
    const quantity = quantities[Math.floor(Math.random() * quantities.length)];
    const leverage = leverages[Math.floor(Math.random() * leverages.length)];
    
    // Preço base e variações
    const basePrice = 120000;
    const priceVariation = 0.02;
    const priceVariationFactor = 1 + (Math.random() - 0.5) * priceVariation;
    const entryPrice = Math.round(basePrice * priceVariationFactor);
    
    // Preço atual (com variação do preço de entrada)
    const currentPriceVariation = 1 + (Math.random() - 0.5) * 0.05; // ±5%
    const currentPrice = Math.round(entryPrice * currentPriceVariation);
    
    // Margin e PL
    const margin = Math.round((quantity * entryPrice) / leverage);
    const pl = Math.round((currentPrice - entryPrice) * quantity * (side === 'long' ? 1 : -1));
    
    // Liquidation (10% abaixo/acima do preço de entrada para long/short)
    const liquidationFactor = side === 'long' ? 0.9 : 1.1;
    const liquidation = Math.round(entryPrice * liquidationFactor);
    
    // Fees
    const openingFee = Math.round(margin * 0.001); // 0.1% da margin
    const carryFees = Math.round(margin * 0.0001 * Math.random() * 10); // 0.01% por dia
    
    // Timestamp (últimos 30 dias)
    const creationTs = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Stop Loss e Take Profit (70% chance)
    let stopLoss: number | undefined;
    let takeProfit: number | undefined;
    
    if (Math.random() > 0.3) {
      const slFactor = side === 'long' ? 0.95 : 1.05;
      const tpFactor = side === 'long' ? 1.10 : 0.90;
      
      stopLoss = Math.round(entryPrice * slFactor);
      takeProfit = Math.round(entryPrice * tpFactor);
    }
    
    return {
      id: `pos_${index.toString().padStart(3, '0')}`,
      side,
      quantity,
      leverage,
      entry_price: entryPrice,
      price: currentPrice,
      margin,
      pl,
      liquidation,
      opening_fee: openingFee,
      sum_carry_fees: carryFees,
      creation_ts: creationTs,
      stoploss: stopLoss,
      takeprofit: takeProfit,
      status: 'open'
    };
  }

  /**
   * Gera múltiplas posições simuladas
   */
  generateMultiplePositions(count: number = 20): SimulatedPosition[] {
    console.log(`🎲 Generating ${count} simulated positions...`);
    
    const positions: SimulatedPosition[] = [];
    
    for (let i = 0; i < count; i++) {
      const position = this.generateSimulatedPosition(i + 1);
      positions.push(position);
      
      console.log(`  ${i + 1}. ${position.side.toUpperCase()} ${position.quantity} BTC @ $${position.entry_price} (${position.leverage}x) - PL: ${position.pl} sats`);
    }
    
    this.positions = positions;
    return positions;
  }

  /**
   * Salva as posições simuladas em arquivo
   */
  saveToFile(filename?: string): string {
    const outputFile = filename || path.join(__dirname, '../../../.system/simulated-positions.json');
    
    const output = {
      positions: this.positions,
      generated_at: new Date().toISOString(),
      count: this.positions.length,
      summary: {
        total_long: this.positions.filter(p => p.side === 'long').length,
        total_short: this.positions.filter(p => p.side === 'short').length,
        total_pl: this.positions.reduce((sum, p) => sum + p.pl, 0),
        total_margin: this.positions.reduce((sum, p) => sum + p.margin, 0)
      }
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    
    console.log(`💾 Simulated positions saved to: ${outputFile}`);
    console.log(`📊 Summary: ${output.summary.total_long} long, ${output.summary.total_short} short, Total PL: ${output.summary.total_pl} sats`);
    
    return outputFile;
  }

  /**
   * Cria um mock do endpoint da API
   */
  createMockAPIFile(): string {
    const mockFile = path.join(__dirname, '../../../.system/mock-positions-api.json');
    
    const mockResponse = {
      success: true,
      data: {
        lnMarkets: {
          positions: this.positions,
          balance: {
            balance: 500000, // 500k sats
            equity: 500000 + this.positions.reduce((sum, p) => sum + p.pl, 0)
          },
          ticker: {
            index: this.positions[0]?.price || 120000
          }
        }
      },
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(mockFile, JSON.stringify(mockResponse, null, 2));
    
    console.log(`🎭 Mock API response saved to: ${mockFile}`);
    
    return mockFile;
  }

  /**
   * Executa a simulação completa
   */
  async runSimulation(count: number = 20): Promise<void> {
    console.log('🎯 Position Simulator');
    console.log('=====================');
    
    try {
      // 1. Gerar posições
      this.generateMultiplePositions(count);
      
      // 2. Salvar em arquivo
      const positionsFile = this.saveToFile();
      
      // 3. Criar mock da API
      const mockFile = this.createMockAPIFile();
      
      console.log('🎉 Simulation completed successfully!');
      console.log('');
      console.log('📋 Generated files:');
      console.log(`  - ${positionsFile}`);
      console.log(`  - ${mockFile}`);
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Use the mock file to test the frontend');
      console.log('2. Update the backend to serve simulated data');
      console.log('3. Test the positions page with realistic data');
      
    } catch (error: any) {
      console.error('❌ Error during simulation:', error.message);
      throw error;
    }
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 20;
  
  const simulator = new PositionSimulator();
  await simulator.runSimulation(count);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { PositionSimulator, SimulatedPosition };
