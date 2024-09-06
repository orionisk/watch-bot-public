import { Cooldowns, PriceChangeDataDual } from '@/types/types';

export const filterCooldowns = (
  cds: Cooldowns,
  data: PriceChangeDataDual[],
  userId: number,
  period: number,
  change: number
): PriceChangeDataDual[] => {
  const now = Date.now();

  return data.filter(({ symbol, data: exchangeData }) => {
    const filteredExchanges = Object.entries(exchangeData).filter(
      ([exchangeName, _]) => {
        const cooldownEntry =
          cds[userId]?.[period]?.[change]?.[symbol]?.[exchangeName];
        return !cooldownEntry || cooldownEntry.cdEndTimestamp <= now;
      }
    );

    if (filteredExchanges.length > 0) {
      exchangeData = Object.fromEntries(filteredExchanges);
      return true;
    }
    return false;
  });
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
