import { useState, useEffect, useRef } from 'react';
import { Target, Activity } from 'lucide-react';
import { WinRateWidget } from '../charts/WinRateWidget';
import { Card, CardLabel, CardValue, Badge } from '../ui/AetherUI';

interface CryptoRadarTrade {
  id: string;
  user_id: string;
  pair: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  position_size: number;
  leverage: number;
  stop_loss: number | null;
  take_profit: number | null;
  commissions: number;
  notes: string;
  status: string;
  pnl_neto: number | null;
  trade_date: string;
}

interface DineroRadarProps {
  cryptoTrades: CryptoRadarTrade[];
}

export function DineroRadar({ cryptoTrades }: DineroRadarProps) {
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const openTrades = cryptoTrades.filter(t => t.status === 'Open');
    if (openTrades.length === 0) return;

    const uniquePairs = Array.from(new Set(openTrades.map(t => t.pair.replace('/', '').toLowerCase())));
    const streams = uniquePairs.map(pair => `${pair}@ticker`).join('/');

    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.s && data.c) {
            const symbol = data.s.toUpperCase();
            const price = parseFloat(data.c);
            setLivePrices(prev => ({ ...prev, [symbol]: price }));
        }
    };

    ws.onerror = (error) => console.error("Binance WS Error:", error);

    return () => {
        if (ws.readyState === 1) ws.close();
    };
  }, [cryptoTrades]);

  const closedTrades = cryptoTrades.filter(t => t.status === 'Closed');
  const winningTrades = closedTrades.filter(t => (t.pnl_neto || 0) > 0);
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0';
  const netProfit = closedTrades.reduce((acc, t) => acc + (t.pnl_neto || 0), 0);
  const activeTradesCount = cryptoTrades.filter(t => t.status === 'Open').length;

  return (
    <div className="w-full max-w-7xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KPIs Superiores (Ahora con tarjetas blancas inmaculadas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WinRateWidget winRate={winRate} totalClosedTrades={closedTrades.length} />
        
        <Card className="p-6 gap-2 justify-center">
          <CardLabel>Net Profit (Closed)</CardLabel>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netProfit >= 0 ? '+' : ''}
            </span>
            <CardValue className={netProfit >= 0 ? 'text-gray-900' : 'text-rose-600'}>
              {netProfit.toLocaleString()}
            </CardValue>
            <span className="text-sm font-mono text-gray-500">USD</span>
          </div>
        </Card>
        
        <Card className="p-6 gap-2 justify-center">
          <CardLabel>Active Trades</CardLabel>
          <CardValue>{activeTradesCount}</CardValue>
        </Card>
      </div>

      {/* Bitácora de Operaciones */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Bitácora de Operaciones</h3>
        </div>
        
        <div className="flex flex-col">
          {cryptoTrades.map((trade, index) => {
            const isWinner = trade.status === 'Closed' && (trade.pnl_neto || 0) > 0;
            const isLoser = trade.status === 'Closed' && (trade.pnl_neto || 0) <= 0;
            const isOpen = trade.status === 'Open';

            let livePnl = null;
            const currentPrice = livePrices[trade.pair.toUpperCase()];

            if (isOpen && currentPrice) {
                const priceDiff = trade.direction === 'Long' 
                    ? currentPrice - trade.entry_price 
                    : trade.entry_price - currentPrice;
                const pnlPercentage = priceDiff / trade.entry_price;
                livePnl = (pnlPercentage * trade.position_size * trade.leverage).toFixed(2);
            }
            
            // Colores claros y legibles
            let borderColor = 'border-l-gray-200';
            let iconBg = 'bg-gray-100';
            let iconColor = 'text-gray-500';
            
            if (isWinner) { borderColor = 'border-l-emerald-500'; iconBg = 'bg-emerald-50'; iconColor = 'text-emerald-600'; }
            if (isLoser) { borderColor = 'border-l-rose-500'; iconBg = 'bg-rose-50'; iconColor = 'text-rose-600'; }
            if (isOpen) { borderColor = 'border-l-blue-500'; iconBg = 'bg-blue-50'; iconColor = 'text-blue-600'; }

            const isLast = index === cryptoTrades.length - 1;

            return (
              <div key={trade.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 hover:bg-gray-50 transition-colors border-l-4 ${borderColor} ${!isLast ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center`}>
                    <Activity size={24} className={iconColor} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-gray-900">{trade.pair}</span>
                      <Badge variant={isOpen ? 'blue' : (isWinner ? 'green' : 'red')}>
                        {trade.direction} {trade.leverage}x
                      </Badge>
                      {isOpen && currentPrice && (
                         <span className="ml-2 text-[11px] font-mono bg-gray-900 text-white px-2 py-0.5 rounded-md animate-pulse font-bold">
                           ${currentPrice.toFixed(4)}
                         </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Entry: ${trade.entry_price} {trade.stop_loss ? `• SL: $${trade.stop_loss}` : ''} {trade.take_profit ? `• TP: $${trade.take_profit}` : ''}
                    </p>
                    {trade.notes && <p className="text-xs text-gray-400 mt-2 italic border-l-2 pl-2 border-gray-200">"{trade.notes}"</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Result</p>
                    {isOpen ? (
                        <p className={`text-xl font-mono font-bold ${livePnl && Number(livePnl) > 0 ? 'text-emerald-600' : livePnl && Number(livePnl) < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                            {livePnl ? `${Number(livePnl) > 0 ? '+' : ''}${livePnl} USD` : 'Active'}
                        </p>
                    ) : (
                        <p className={`text-xl font-mono font-bold ${isWinner ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isWinner ? '+' : ''}{trade.pnl_neto} USD
                        </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {cryptoTrades.length === 0 && (
            <div className="text-center py-16">
              <Target size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-900 font-bold">Sin operaciones en la bitácora</p>
              <p className="text-gray-500 text-sm mt-2">Registra tu primer trade para habilitar el Radar Cripto.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}