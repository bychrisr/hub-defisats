import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type BasketItem = {
  exchange: string;
  weight: number; // em %
};

interface PriceReferenceProps {
  title?: string;
  description?: string;
  basket?: BasketItem[];
  className?: string;
}

/**
 * Exibição customizada do "Price reference" no estilo da LN Markets.
 * Permite sobrescrever o texto e a composição do basket via props.
 */
const PriceReference: React.FC<PriceReferenceProps> = ({
  title = 'Price reference',
  description = 'The BTCUSD Basket Last Price serves as the benchmark for calculating profit and loss (P&L) and triggering events such as liquidation, take profit, or stop loss. It is a weighted average of the last traded prices of BTC/USD perpetual futures from the exchanges included in LN Markets’ selected basket. The current composition of the basket is as follows:',
  basket = [
    { exchange: 'Bitmex', weight: 20 },
    { exchange: 'Bybit', weight: 30 },
    { exchange: 'Deribit', weight: 10 },
    { exchange: 'Binance', weight: 40 },
  ],
  className = ''
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-2 rounded-md overflow-hidden border border-border/40">
          <div className="grid grid-cols-2 text-xs uppercase tracking-wide bg-muted/40 px-4 py-2">
            <div>Exchange</div>
            <div>Weight</div>
          </div>
          <div className="divide-y divide-border/40">
            {basket.map((item) => (
              <div key={item.exchange} className="grid grid-cols-2 items-center px-4 py-3">
                <div className="text-sm">{item.exchange}</div>
                <div className="text-sm">{item.weight}%</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs opacity-70 mt-4">
          This composition may be modified without prior notice.
        </p>
      </CardContent>
    </Card>
  );
};

export default PriceReference;


