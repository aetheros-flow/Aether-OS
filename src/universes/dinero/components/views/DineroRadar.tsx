import { useState, useEffect, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Target, Activity, TrendingUp, TrendingDown, Bitcoin, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import {
  resolveCoinId,
  fetchPrices,
  fetchMarkets,
  type CoinPrice,
  type CoinMarket,
} from '../../lib/coingecko';

const ACCENT = '#05DF72';
const ACCENT_SOFT = '#86EFAC';
const LOSS = '#F87171';
const NEUTRAL = '#60A5FA';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

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
  onDeleteTrade?: (id: string) => void | Promise<void>;
}

export function DineroRadar({ cryptoTrades, onDeleteTrade }: DineroRadarProps) {
  const [prices, setPrices] = useState<Record<string, CoinPrice>>({});
  const [markets, setMarkets] = useState<CoinMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tradeCoinIds = useMemo(() => {
    const ids = new Set<string>();
    cryptoTrades.forEach(t => {
      const id = resolveCoinId(t.pair);
      if (id) ids.add(id);
    });
    return Array.from(ids);
  }, [cryptoTrades]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // Always include BTC/ETH + traded coins in the market watch panel.
      const watchIds = Array.from(new Set(['bitcoin', 'ethereum', 'solana', ...tradeCoinIds]));
      const [priceMap, marketList] = await Promise.all([
        fetchPrices(watchIds),
        fetchMarkets(watchIds),
      ]);
      setPrices(priceMap);
      setMarkets(marketList);
      setLastSync(new Date());
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch prices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // Poll every 90s (CoinGecko free tier is ~30 req/min).
    const interval = setInterval(refresh, 90_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeCoinIds.join(',')]);

  const closedTrades = cryptoTrades.filter(t => t.status === 'Closed');
  const openTrades = cryptoTrades.filter(t => t.status === 'Open');
  const winningTrades = closedTrades.filter(t => (t.pnl_neto || 0) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  const netProfit = closedTrades.reduce((acc, t) => acc + (t.pnl_neto || 0), 0);

  // Compute live exposure: sum of open positions notional at current price.
  const liveExposure = useMemo(() => {
    return openTrades.reduce((acc, t) => {
      return acc + (t.position_size || 0) * (t.leverage || 1);
    }, 0);
  }, [openTrades]);

  const topMover = useMemo(() => {
    if (markets.length === 0) return null;
    return [...markets].sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))[0];
  }, [markets]);

  const aiInsight = useMemo(() => {
    if (cryptoTrades.length === 0) return 'No trades logged yet. Add your first to activate the radar.';
    if (openTrades.length > 0 && topMover) {
      const dir = topMover.price_change_percentage_24h > 0 ? 'up' : 'down';
      return `${openTrades.length} open position${openTrades.length > 1 ? 's' : ''}. ${topMover.name} is ${dir} ${Math.abs(topMover.price_change_percentage_24h).toFixed(2)}% in 24h.`;
    }
    if (closedTrades.length > 0) {
      return `Win rate ${winRate.toFixed(1)}% across ${closedTrades.length} closed trades. ${netProfit >= 0 ? '+' : ''}$${netProfit.toFixed(2)} net.`;
    }
    return 'Radar tracking your watchlist.';
  }, [cryptoTrades.length, openTrades.length, closedTrades.length, winRate, netProfit, topMover]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-6xl mx-auto px-1 md:px-0 pb-8 font-sans flex flex-col gap-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">Live</p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-white">Crypto radar</h1>
          {lastSync && (
            <p className="text-[11px] text-zinc-500 mt-1">
              Last sync: {lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · via CoinGecko
            </p>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Syncing…' : 'Refresh'}
        </motion.button>
      </motion.div>

      {/* AI insight */}
      <motion.div
        variants={itemVariants}
        className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-5 flex items-start gap-3"
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}
        >
          <Sparkles size={16} style={{ color: ACCENT }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: ACCENT_SOFT }}>
            AI insight
          </p>
          <p className="text-sm text-zinc-200 leading-relaxed">{aiInsight}</p>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-3 text-xs"
          style={{ backgroundColor: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', color: '#FCA5A5' }}
        >
          Price sync error: {error}
        </motion.div>
      )}

      {/* KPIs */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Win rate" value={`${winRate.toFixed(1)}%`} accent={winRate >= 50 ? ACCENT : LOSS} />
        <KPI label="Net P&L" value={`${netProfit >= 0 ? '+' : '−'}$${Math.abs(netProfit).toFixed(0)}`} accent={netProfit >= 0 ? ACCENT : LOSS} />
        <KPI label="Open trades" value={`${openTrades.length}`} accent={NEUTRAL} />
        <KPI label="Exposure" value={`$${liveExposure.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} accent={ACCENT_SOFT} />
      </motion.div>

      {/* Market watch */}
      <motion.div
        variants={itemVariants}
        className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 overflow-hidden"
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Market watch</p>
            <h3 className="font-serif text-lg font-medium text-white tracking-tight">Tracked coins</h3>
          </div>
          <Bitcoin size={18} style={{ color: '#F59E0B' }} />
        </div>
        <div className="divide-y divide-white/5">
          {markets.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-500">
              {loading ? 'Loading…' : 'No coins tracked yet.'}
            </div>
          ) : (
            markets.map(coin => {
              const positive = coin.price_change_percentage_24h >= 0;
              const weekly = coin.price_change_percentage_7d_in_currency ?? 0;
              return (
                <div key={coin.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors">
                  <img src={coin.image} alt={coin.symbol} className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{coin.name}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">{coin.symbol}</span>
                      {coin.market_cap_rank && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}
                        >
                          #{coin.market_cap_rank}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Vol 24h ${formatCompact(coin.total_volume)} · MCap ${formatCompact(coin.market_cap)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-sm font-bold text-white tabular-nums">
                      ${coin.current_price.toLocaleString('en-US', { maximumFractionDigits: coin.current_price < 1 ? 6 : 2 })}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold tabular-nums" style={{ color: positive ? ACCENT : LOSS }}>
                        {positive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-zinc-500 tabular-nums">
                        7d {weekly >= 0 ? '+' : ''}{weekly.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Trade log */}
      <motion.div
        variants={itemVariants}
        className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 overflow-hidden"
      >
        <div className="p-5 border-b border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Journal</p>
          <h3 className="font-serif text-lg font-medium text-white tracking-tight">Trade log</h3>
        </div>

        <div className="flex flex-col divide-y divide-white/5">
          {cryptoTrades.map(trade => {
            const isClosed = trade.status === 'Closed';
            const isWinner = isClosed && (trade.pnl_neto || 0) > 0;
            const isLoser = isClosed && (trade.pnl_neto || 0) <= 0;
            const isOpen = trade.status === 'Open';

            const coinId = resolveCoinId(trade.pair);
            const currentPrice = coinId ? prices[coinId]?.price : undefined;
            const change24h = coinId ? prices[coinId]?.change24h : undefined;

            let livePnl: number | null = null;
            if (isOpen && currentPrice) {
              const priceDiff = trade.direction === 'Long'
                ? currentPrice - trade.entry_price
                : trade.entry_price - currentPrice;
              const pnlPercentage = priceDiff / trade.entry_price;
              livePnl = pnlPercentage * trade.position_size * trade.leverage;
            }

            const sideColor = isWinner ? ACCENT : isLoser ? LOSS : NEUTRAL;

            return (
              <div key={trade.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:bg-white/[0.03] transition-colors relative overflow-hidden">
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-[3px] rounded-full"
                  style={{ background: sideColor, boxShadow: `0 0 12px ${sideColor}, 0 0 4px ${sideColor}` }}
                />
                <div className="flex items-center gap-4 pl-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${sideColor}15`, border: `1px solid ${sideColor}30` }}
                  >
                    <Activity size={18} color={sideColor} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-base text-white">{trade.pair}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                        style={{ backgroundColor: `${sideColor}15`, color: sideColor }}
                      >
                        {trade.direction} · {trade.leverage}x
                      </span>
                      {isOpen && currentPrice && (
                        <span
                          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md tabular-nums"
                          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff' }}
                        >
                          ${currentPrice < 1 ? currentPrice.toFixed(6) : currentPrice.toFixed(2)}
                          {change24h !== undefined && (
                            <span className="ml-1" style={{ color: change24h >= 0 ? ACCENT : LOSS }}>
                              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Entry ${trade.entry_price}
                      {trade.stop_loss ? ` · SL $${trade.stop_loss}` : ''}
                      {trade.take_profit ? ` · TP $${trade.take_profit}` : ''}
                    </p>
                    {trade.notes && (
                      <p className="text-[11px] text-zinc-400 mt-1.5 italic pl-2 border-l-2 border-white/10">"{trade.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right pl-3 md:pl-0">
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                      {isOpen ? 'Live P&L' : 'Result'}
                    </p>
                    {isOpen ? (
                      <p className="text-lg font-bold tabular-nums flex items-center gap-1" style={{ color: livePnl != null && livePnl > 0 ? ACCENT : livePnl != null && livePnl < 0 ? LOSS : NEUTRAL }}>
                        {livePnl != null ? (
                          <>
                            {livePnl > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {livePnl > 0 ? '+' : ''}{livePnl.toFixed(2)} USD
                          </>
                        ) : 'Active'}
                      </p>
                    ) : (
                      <p className="text-lg font-bold tabular-nums" style={{ color: isWinner ? ACCENT : LOSS }}>
                        {isWinner ? '+' : ''}{(trade.pnl_neto ?? 0).toFixed(2)} USD
                      </p>
                    )}
                  </div>
                  {onDeleteTrade && (
                    <button
                      onClick={() => onDeleteTrade(trade.id)}
                      className="p-2.5 rounded-xl text-white/25 hover:text-rose-400 hover:bg-rose-400/10 active:scale-90 transition-all"
                      aria-label={`Delete ${trade.pair} trade`}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {cryptoTrades.length === 0 && (
            <div className="text-center py-16">
              <Target size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-white font-medium">No trades logged</p>
              <p className="text-zinc-500 text-xs mt-1">Add your first trade to activate the radar.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-4">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      <p className="text-xl md:text-2xl font-bold tabular-nums tracking-tight mt-1.5" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function formatCompact(n?: number): string {
  if (!n || !Number.isFinite(n)) return '—';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(0);
}
