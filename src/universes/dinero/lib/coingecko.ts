/**
 * CoinGecko REST helper — free tier (no API key).
 * Rate limit: ~30 req/min. Callers should poll at >= 60s intervals.
 */

const BASE = 'https://api.coingecko.com/api/v3';

/**
 * Ticker → CoinGecko ID map for the coins most commonly used in the Radar.
 * Extend this as new pairs appear. Unknown tickers fall back to lowercase ticker
 * (CoinGecko's `/coins/list` is too heavy to fetch client-side).
 */
export const TICKER_TO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  TRX: 'tron',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  LTC: 'litecoin',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  SUI: 'sui',
  TON: 'the-open-network',
  PEPE: 'pepe',
  SHIB: 'shiba-inu',
  INJ: 'injective-protocol',
  RNDR: 'render-token',
  FIL: 'filecoin',
  FTM: 'fantom',
  ICP: 'internet-computer',
  TIA: 'celestia',
  SEI: 'sei-network',
};

export interface CoinPrice {
  id: string;
  price: number;
  change24h: number; // percent
  marketCap?: number;
  volume24h?: number;
}

/**
 * Extract the base ticker from a pair string like "BTC/USDT" or "ETHUSD".
 */
export function extractTicker(pair: string): string {
  const clean = pair.toUpperCase().replace(/\s/g, '');
  if (clean.includes('/')) return clean.split('/')[0];
  // Strip common quote suffixes.
  for (const suffix of ['USDT', 'USDC', 'BUSD', 'USD', 'EUR']) {
    if (clean.endsWith(suffix) && clean.length > suffix.length) {
      return clean.slice(0, -suffix.length);
    }
  }
  return clean;
}

export function resolveCoinId(pair: string): string | null {
  const ticker = extractTicker(pair);
  if (TICKER_TO_ID[ticker]) return TICKER_TO_ID[ticker];
  return null;
}

/**
 * Fetch spot prices + 24h change for a list of CoinGecko IDs.
 */
export async function fetchPrices(ids: string[]): Promise<Record<string, CoinPrice>> {
  if (ids.length === 0) return {};
  const unique = Array.from(new Set(ids));
  const url = `${BASE}/simple/price?ids=${unique.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();
  const out: Record<string, CoinPrice> = {};
  for (const id of unique) {
    const entry = data[id];
    if (!entry) continue;
    out[id] = {
      id,
      price: entry.usd ?? 0,
      change24h: entry.usd_24h_change ?? 0,
      marketCap: entry.usd_market_cap,
      volume24h: entry.usd_24h_vol,
    };
  }
  return out;
}

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

/**
 * Fetch full market snapshot for a list of coin IDs (image, rank, sparkline).
 */
export async function fetchMarkets(ids: string[]): Promise<CoinMarket[]> {
  if (ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const url = `${BASE}/coins/markets?vs_currency=usd&ids=${unique.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return (await res.json()) as CoinMarket[];
}
