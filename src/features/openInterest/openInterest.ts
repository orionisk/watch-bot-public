import { ExchangeInstance } from '@/types/types';
import { getSymbols } from '@/common/utils';

export const fetchOpenInterest = async (...exchanges: ExchangeInstance[]) => {
  // create a promise for each exchange
  const promises = exchanges.map(async ex => {
    console.time('loadMarkets');
    const symbols = await getSymbols(exchanges[0]);
    console.timeEnd('loadMarkets');
    return Promise.all(
      symbols.map((pairs: string) => ex.fetchOpenInterest(pairs))
    );
  });

  try {
    console.time('fetchOpenInterest');
    const data = await Promise.all(promises);
    // const data = await promises[1];
    console.timeEnd('fetchOpenInterest');
    return data;
  } catch (error) {
    console.log(error);
    throw new Error('Error fetching open interest');
  }
};

export const insertOpenInterest = async () => {};

// const [binanceData, bybitData] = await fetchOpenInterest(binance, bybit);

// await db
//   .insert(pairs)
//   .values([
//     ...groupData(binanceData, 'binance'),
//     ...groupData(bybitData, 'bybit')
//   ]);
