import { sendPriceChangeNotification } from '@/bot/notify';
import { db } from '@/db/drizzle';
import {
  Cooldowns,
  PriceChangeData,
  PriceChangeDataDual,
  UserGroup,
  UserWithExchanges
} from '@/types/types';
import { sql } from 'drizzle-orm';

const cds: Cooldowns = {};

export const processUserGroup = async (group: UserGroup) => {
  const { period, users } = group;
  if (!users.length) return;

  const isExists = (await db.execute(sql`SELECT ps_mv_exists(${period});`))[0]
    ?.ps_mv_exists;

  if (!isExists) await db.execute(sql`SELECT create_ps_mv(${period});`);
  else await db.execute(sql`SELECT refresh_ps_mv(${period});`);

  for (const user of users) {
    processUser(user, period);
  }
};

const processUser = async (user: UserWithExchanges, period: number) => {
  const exchanges = user.userExchanges
    .map(exchange => `'${exchange.exchangeName}'`)
    .join(', ');

  const userPeriods = user.userPeriodChanges.filter(
    periodChange => periodChange.period === period
  );

  for (const { change } of userPeriods) {
    const data: PriceChangeDataDual[] = await db.execute(
      sql`
        SELECT 
          symbol,
          jsonb_object_agg(
              exchange, jsonb_build_object(
                'last', last,
                'lastTime', last_ts,
                'min', lp,
                'minTime', lp_ts,
                'max', hp_p,
                'maxTime', hp_ts,
                'lowToHigh', l_h,
                'highToLow', h_l
              )
          ) AS data
          FROM get_ps_from_mv(${period})
          WHERE exchange IN (${sql.raw(exchanges)})
            AND l_h > ${change}
          GROUP BY symbol
          ORDER BY symbol;
      `
    );

    if (!data.length) return;

    const filteredData = filterCooldowns(data, user.id, period, change);

    if (!filteredData.length) return;

    sendPriceChangeNotification(user, filteredData);
    addCooldown(user.id, filteredData, period, change);
  }
};

const filterCooldowns = (
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

const addCooldown = (
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
