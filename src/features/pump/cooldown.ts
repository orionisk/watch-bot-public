import { Cooldowns, PriceChangeDataDual } from '@/types/types';

export const filterCooldowns = (
  cds: Cooldowns,
  data: PriceChangeDataDual[],
  userId: number,
  period: number,
  change: number
): PriceChangeDataDual[] => {
  const now = Date.now();

  return data.reduce(
    (filteredData: PriceChangeDataDual[], { symbol, data: exchangeData }) => {
      const filteredExchangeData: { [key: string]: any } = {};
      let hasValidExchange = false;

      Object.entries(exchangeData).forEach(([exchangeName, exchangeInfo]) => {
        const cooldownEntry =
          cds[userId]?.[period]?.[change]?.[symbol]?.[exchangeName];
        if (!cooldownEntry || cooldownEntry.cdEndTimestamp <= now) {
          filteredExchangeData[exchangeName] = exchangeInfo;
          hasValidExchange = true;
        }
      });

      if (hasValidExchange) {
        filteredData.push({ symbol, data: filteredExchangeData });
      }

      return filteredData;
    },
    []
  );
};

export const addCooldown = (
  cds: Cooldowns,
  userId: number,
  data: PriceChangeDataDual[],
  period: number,
  change: number
) => {
  const now = Date.now();
  const periodMs = period * 60 * 1000;

  for (const { symbol, data: exchangeData } of data) {
    cds[userId] ??= {};
    cds[userId][period] ??= {};
    cds[userId][period][change] ??= {};
    cds[userId][period][change][symbol] ??= {};

    for (const exchangeName of Object.keys(exchangeData)) {
      const lastPriceTimestamp = new Date(
        exchangeData[exchangeName]?.lastTime
      ).getTime();

      const cdEndTimestamp = Math.max(now, lastPriceTimestamp + periodMs);

      cds[userId][period][change][symbol][exchangeName] = {
        cdEndTimestamp
      };
    }
  }
};
