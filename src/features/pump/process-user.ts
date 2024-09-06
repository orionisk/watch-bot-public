import { sendPriceChangeNotification } from '@/bot/notify';
import { executePriceChangeQuery } from '@/db/db';
import { priceChangeQuery } from '@/db/queries/getPricesChangeQuery';
import {
  Cooldowns,
  PriceChangeData,
  UserGroup,
  UserWithExchanges
} from '@/types/types';

const cds: Cooldowns = {};

export const processUserGroup = async (group: UserGroup) => {
  const { period, change, users } = group;
  if (!users.length) return;

  const periodMs = (period + 2) * 1000;
  const now = Date.now();
  const timestamp = new Date(now - periodMs);

  const data = await executePriceChangeQuery(
    priceChangeQuery(timestamp.toISOString(), change)
  );

  if (!data.length) return;

  for (const user of users) {
    const filteredData = filterCooldowns(
      data,
      user.id,
      periodMs + 1000,
      change
    );

    if (!filteredData.length) continue;

    sendPriceChangeNotification(user, filteredData);
    addCooldown(user.id, filteredData, periodMs + 1000, change);
  }
};

const filterCooldowns = (
  data: PriceChangeData[],
  userId: number,
  period: number,
  change: number
): PriceChangeData[] => {
  const now = Date.now();
  const periodChange = `${period}_${change}`;

  return data.reduce(
    (filteredData: PriceChangeData[], { symbol, data: exchangeData }) => {
      const filteredExchangeData: { [key: string]: any } = {};
      let hasValidExchange = false;

      Object.entries(exchangeData).forEach(([exchangeName, exchangeInfo]) => {
        const cooldownEntry =
          cds[userId]?.[periodChange]?.[symbol]?.[exchangeName];
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

const addCooldown = (
  userId: number,
  data: PriceChangeData[],
  period: number,
  change: number
) => {
  const now = Date.now();

  for (const { symbol, data: exchangeData } of data) {
    if (!cds[userId]) {
      cds[userId] = {};
    }

    const periodChange = `${period}_${change}`;

    if (!cds[userId][periodChange]) {
      cds[userId][periodChange] = {};
    }

    for (const exchangeName of Object.keys(exchangeData)) {
      const lastPriceTimestamp = new Date(
        exchangeData[exchangeName]?.lastTime
      ).getTime();
      const cdEndTimestamp = Math.max(now, lastPriceTimestamp + period);

      if (!cds[userId][periodChange][symbol]) {
        cds[userId][periodChange][symbol] = {};
      }

      cds[userId][periodChange][symbol][exchangeName] = {
        cdEndTimestamp
      };
    }
  }
};
