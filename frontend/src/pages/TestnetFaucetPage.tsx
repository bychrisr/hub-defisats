/**
 * Testnet Faucet Page
 * 
 * Página principal para o sistema de funding interno via LND testnet
 */

import React from 'react';
import { TestnetFaucet } from '../components/TestnetFaucet';
import { PageHeader } from '../components/PageHeader';

export function TestnetFaucetPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Testnet Faucet"
        description="Sistema de funding interno para desenvolvimento e testes"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Testnet', href: '/testnet' },
          { label: 'Faucet', href: '/testnet/faucet' }
        ]}
      />

      <div className="mt-8">
        <TestnetFaucet />
      </div>
    </div>
  );
}
