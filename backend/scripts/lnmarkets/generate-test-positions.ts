#!/usr/bin/env ts-node

/**
 * Script para gerar posições variadas automaticamente na LN Markets
 * 
 * Este script cria 20 posições variadas (long/short) com diferentes
 * quantidades, preços de entrada e stop loss/take profit para testar
 * o dashboard e a página de posições.
 */

import { LNMarketsAPIv2 } from '../../services/lnmarkets/LNMarketsAPIv2';
import * as fs from 'fs';
import * as path from 'path';

interface TestPosition {
  side: 'long' | 'short';
  quantity: number;
  leverage: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  margin: number;
}

class TestPositionGenerator {
  private lnMarkets: LNMarketsAPIv2;
  private positions: TestPosition[] = [];

  constructor(apiKey: string, apiSecret: string, passphrase: string) {
    this.lnMarkets = new LNMarketsAPIv2({
      credentials: {
        api_key: apiKey,
        api_secret: apiSecret,
        passphrase: passphrase
      },
      logger: console
    });
  }

  /**
   * Gera posições de teste variadas
   */
  generateTestPositions(): TestPosition[] {
    const positions: TestPosition[] = [];
    
    // Preço base atual (simulado)
    const basePrice = 120000; // $120,000
    const priceVariation = 0.02; // ±2%
    
    // Configurações de teste
    const sides: ('long' | 'short')[] = ['long', 'short'];
    const quantities = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0];
    const leverages = [1, 2, 5, 10, 20];
    
    for (let i = 0; i < 20; i++) {
      const side = sides[Math.floor(Math.random() * sides.length)];
      const quantity = quantities[Math.floor(Math.random() * quantities.length)];
      const leverage = leverages[Math.floor(Math.random() * leverages.length)];
      
      // Preço de entrada com variação
      const priceVariationFactor = 1 + (Math.random() - 0.5) * priceVariation;
      const entryPrice = Math.round(basePrice * priceVariationFactor);
      
      // Margin baseada na quantidade e leverage
      const margin = Math.round((quantity * entryPrice) / leverage);
      
      // Stop Loss e Take Profit (opcional)
      let stopLoss: number | undefined;
      let takeProfit: number | undefined;
      
      if (Math.random() > 0.3) { // 70% chance de ter SL/TP
        const slFactor = side === 'long' ? 0.95 : 1.05; // 5% abaixo/acima
        const tpFactor = side === 'long' ? 1.10 : 0.90; // 10% acima/abaixo
        
        stopLoss = Math.round(entryPrice * slFactor);
        takeProfit = Math.round(entryPrice * tpFactor);
      }
      
      positions.push({
        side,
        quantity,
        leverage,
        entryPrice,
        stopLoss,
        takeProfit,
        margin
      });
    }
    
    return positions;
  }

  /**
   * Cria uma posição na LN Markets
   */
  async createPosition(position: TestPosition): Promise<any> {
    try {
      console.log(`🔨 Creating ${position.side} position: ${position.quantity} BTC @ $${position.entryPrice}`);
      
      const orderData = {
        type: 'market',
        side: position.side,
        quantity: position.quantity,
        leverage: position.leverage,
        margin: position.margin
      };

      // Adicionar SL/TP se especificado
      if (position.stopLoss) {
        orderData.stop_loss = position.stopLoss;
      }
      if (position.takeProfit) {
        orderData.take_profit = position.takeProfit;
      }

      const result = await this.lnMarkets.futures.createOrder(orderData);
      console.log(`✅ Position created:`, result);
      
      return result;
    } catch (error: any) {
      console.error(`❌ Failed to create position:`, error.message);
      throw error;
    }
  }

  /**
   * Executa a criação de todas as posições de teste
   */
  async generateAllPositions(): Promise<void> {
    console.log('🚀 Test Position Generator');
    console.log('==========================');
    
    try {
      // 1. Gerar posições de teste
      console.log('📋 Generating test positions...');
      this.positions = this.generateTestPositions();
      
      console.log(`📊 Generated ${this.positions.length} test positions`);
      console.log('📝 Position summary:');
      
      this.positions.forEach((pos, index) => {
        console.log(`  ${index + 1}. ${pos.side.toUpperCase()} ${pos.quantity} BTC @ $${pos.entryPrice} (${pos.leverage}x leverage)`);
      });
      
      // 2. Salvar posições em arquivo para referência
      const outputFile = path.join(__dirname, '../../../.system/test-positions.json');
      fs.writeFileSync(outputFile, JSON.stringify(this.positions, null, 2));
      console.log(`💾 Test positions saved to: ${outputFile}`);
      
      // 3. Criar posições na LN Markets (com delay para evitar rate limiting)
      console.log('🔨 Creating positions in LN Markets...');
      
      for (let i = 0; i < this.positions.length; i++) {
        const position = this.positions[i];
        
        try {
          await this.createPosition(position);
          
          // Delay entre criações para evitar rate limiting
          if (i < this.positions.length - 1) {
            console.log('⏳ Waiting 2 seconds before next position...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`⚠️  Skipping position ${i + 1} due to error:`, error);
          continue;
        }
      }
      
      console.log('🎉 Test position generation completed!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Check the dashboard to see the new positions');
      console.log('2. Verify the positions page displays correctly');
      console.log('3. Test position management features');
      
    } catch (error: any) {
      console.error('❌ Error generating test positions:', error.message);
      throw error;
    }
  }

  /**
   * Limpa todas as posições de teste (fecha todas as posições abertas)
   */
  async cleanupTestPositions(): Promise<void> {
    console.log('🧹 Cleaning up test positions...');
    
    try {
      // Obter posições ativas
      const activePositions = await this.lnMarkets.futures.getRunningPositions();
      
      if (!activePositions || activePositions.length === 0) {
        console.log('✅ No active positions to clean up');
        return;
      }
      
      console.log(`📊 Found ${activePositions.length} active positions`);
      
      // Fechar todas as posições
      for (const position of activePositions) {
        try {
          console.log(`🔒 Closing position: ${position.id}`);
          
          await this.lnMarkets.futures.closePosition({
            id: position.id,
            type: 'market'
          });
          
          console.log(`✅ Position ${position.id} closed`);
          
          // Delay entre fechamentos
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Failed to close position ${position.id}:`, error);
        }
      }
      
      console.log('🎉 Cleanup completed!');
      
    } catch (error: any) {
      console.error('❌ Error during cleanup:', error.message);
      throw error;
    }
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';
  
  // Credenciais da conta testnet (C2)
  const credentials = {
    apiKey: 'test_api_key_here', // Substituir pelas credenciais reais
    apiSecret: 'test_api_secret_here',
    passphrase: 'test_passphrase_here'
  };
  
  const generator = new TestPositionGenerator(
    credentials.apiKey,
    credentials.apiSecret,
    credentials.passphrase
  );
  
  switch (command) {
    case 'generate':
      await generator.generateAllPositions();
      break;
      
    case 'cleanup':
      await generator.cleanupTestPositions();
      break;
      
    case 'help':
      console.log('Usage: npm run test:positions [command]');
      console.log('');
      console.log('Commands:');
      console.log('  generate  - Generate 20 test positions (default)');
      console.log('  cleanup   - Close all active positions');
      console.log('  help      - Show this help message');
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use "help" to see available commands');
      process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { TestPositionGenerator };
