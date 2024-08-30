import { ExchangeInstance } from '../types/types';
import { logger } from '@/logger/logger';

export const loadMarkets = async (...exchanges: ExchangeInstance[]) => {
  // fetch all futures pairs for exchange
  try {
    const promises = exchanges.map(exchange => exchange.loadMarkets());
    await Promise.all(promises);
  } catch (error) {
    logger.error(error);
  }
};

export const getSymbols = async (
  exchange: ExchangeInstance,
  marketType = 'swap',
  subtype = 'linear',
  symbolWithActiveStatus = true,
  filter = 'USDT'
) => {
  if (!exchange.markets) await loadMarkets(exchange);

  return exchange
    .getSymbolsForMarketType(marketType, subtype, symbolWithActiveStatus)
    .filter(symbol => symbol.includes(filter));
};

export const normalizeSymbol = (pair: string) =>
  pair.split(':')[0]!.replace('/', '');

// export const groupData = (data: OpenInterest[], exchange: string) => {
//   const validData = [];

//   for (const d of data) {
//     const parse = insertPairsSchema.safeParse({
//       exchange,
//       symbol: normalizeSymbol(d.symbol),
//       openInterest: d.openInterestAmount ?? d.openInterestValue,
//       timestamp: d.datetime?.toString()
//     });

//     if (parse.success) {
//       validData.push(parse.data);
//     } else {
//       // console.log(parse.error);
//     }
//   }

//   return validData;
// };

export const r = <T>(data: T) => {
  return [data, null] as const;
};

export const e = <T>(error: T) => {
  return [null, error] as const;
};

export const startAtNextSecond = (fn: () => void) => {
  const now = new Date();
  const nextSecond = new Date(now.getTime() + 1000 - now.getMilliseconds());
  const delay = nextSecond.getTime() - now.getTime();

  setTimeout(fn, delay);
};
