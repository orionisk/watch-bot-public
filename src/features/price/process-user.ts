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
export const processUser = async (user: UserWithExchanges) => {
  const { id, userPeriodChanges, isEnabled, userExchanges } = user;

  if (!isEnabled) return;

  for (const periodChange of userPeriodChanges) {
    const { period: periodSec, change } = periodChange;
    const period = (periodSec! + 2) * 1000;

    const now = Date.now();

    const timestamp = new Date(now - period);

    let exchanges = userExchanges
      .filter(exchange => exchange.enabled)
      .map(exchange => exchange.exchangeName);

    if (!exchanges.length) exchanges = ['Binance', 'Bybit'];

    const data = await executePriceChangeQuery(
      priceChangeQuery(timestamp.toISOString(), change!, exchanges)
    );

    if (!data.length) return;

    const filteredData = filterCooldowns(data, id, period + 1000, change!);

    if (!filteredData.length) return;

    sendPriceChangeNotification(user, filteredData);

    if (filteredData.length)
      addCooldown(id, filteredData, period + 1000, change!);
  }
};

export const processUserGroup = async (group: UserGroup) => {
  const { period, change, users } = group;
  if (!users.length) return;

  const periodMs = (period + 2) * 1000;
  const now = Date.now();
  const timestamp = new Date(now - periodMs);

  let exchanges = users[0].userExchanges
    .filter(exchange => exchange.enabled)
    .map(exchange => exchange.exchangeName);

  if (!exchanges.length) exchanges = ['Binance', 'Bybit'];

  const data = await executePriceChangeQuery(
    priceChangeQuery(timestamp.toISOString(), change, exchanges)
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
  return data.filter(({ symbol, data: exchangeData }) => {
    return Object.keys(exchangeData).some(exchangeName => {
      const periodChange = `${period}_${change}`;
      const cooldownEntry =
        cds[userId]?.[periodChange]?.[symbol]?.[exchangeName];
      return !cooldownEntry || cooldownEntry.cdEndTimestamp <= Date.now();
    });
  });
};

const addCooldown = (
  userId: number,
  data: PriceChangeData[],
  period: number,
  change: number
) => {
  for (const { symbol, data: exchangeData } of data) {
    if (!cds[userId]) {
      cds[userId] = {};
    }

    const periodChange = `${period}_${change}`;

    if (!cds[userId][periodChange]) {
      cds[userId][periodChange] = {};
    }

    for (const exchangeName of Object.keys(exchangeData)) {
      const cdEndTimestamp =
        new Date(
          exchangeData[exchangeName]?.prices[1]?.timestamp + 'Z'
        ).getTime() + period;

      if (!cds[userId][periodChange][symbol]) {
        cds[userId][periodChange][symbol] = {};
      }
      cds[userId][periodChange][symbol][exchangeName] = {
        cdEndTimestamp
      };
    }
  }
};
