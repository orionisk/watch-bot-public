import { sendPriceChangeNotification } from '@/bot/notify';
import { db } from '@/db/drizzle';
import { priceChangeDualQuery } from '@/db/queries/getPricesChangeDualQuery';
import {
  Cooldowns,
  PriceChangeDataDual,
  UserGroup,
  UserWithExchanges
} from '@/types/types';
import { sql } from 'drizzle-orm';
import { addCooldown, filterCooldowns } from './cooldown';

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
    processUserPeriodChange(user, exchanges, period, change);
  }
};

const processUserPeriodChange = async (
  user: UserWithExchanges,
  exchanges: string,
  period: number,
  change: number
) => {
  const data: PriceChangeDataDual[] = await db.execute(
    priceChangeDualQuery(exchanges, period, change)
  );

  if (!data.length) return;

  const filteredData = filterCooldowns(cds, data, user.id, period, change);

  if (!filteredData.length) return;

  sendPriceChangeNotification(user, filteredData);
  addCooldown(cds, user.id, filteredData, period, change);
};
