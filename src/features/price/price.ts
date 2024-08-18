import { insertPriceSchema } from '@/db/schema/zod';
import { e, normalizeSymbol } from '@/common/utils';
import { addPriceToQueue } from './queue';
import { logger } from '@/logger/logger';
import { Ticker } from 'ccxt';
import { getUsers } from '@/users/users';
import { ParsePriceData, UserGroup, UserWithExchanges } from '@/types/types';
import { processUserGroup } from './process-user';

export const insertPrice = async (
  data: Ticker,
  exchangeName: string
): Promise<void> => {
  const parseResult = parsePrice({
    exchange: exchangeName,
    symbol: normalizeSymbol(data.symbol),
    price: data.last,
    timestamp: data.datetime
  });

  if (!parseResult) return;

  await addPriceToQueue(parseResult);
};

export const parsePrice = (data: ParsePriceData) => {
  const parseResult = insertPriceSchema.safeParse(data);

  if (!parseResult.success) {
    logger.error(`Error parsing price data: ${parseResult.error}`);
  }

  return parseResult.data;
};

export const checkPriceChange = async (): Promise<UserGroup[]> => {
  try {
    const [users, error] = await getUsers();

    if (!users) return [];
    if (error) logger.error('Error getting users:', error);

    return groupUsersByPeriodAndChange(users);
  } catch (error) {
    logger.error(`Error checking price change: ${error}`);
    return [];
  }
};

export const staggeredCheckPriceChange = async (ms: number): Promise<void> => {
  const userGroups = await checkPriceChange();
  const interval = ms / userGroups.length;

  userGroups.forEach((group, index) => {
    setTimeout(() => {
      processUserGroup(group).catch(err =>
        logger.error(`Error processing user ${group}: ${err}`)
      );
    }, interval * index);
  });
};

const groupUsersByPeriodAndChange = (
  users: UserWithExchanges[]
): UserGroup[] => {
  const userGroups: Record<string, UserGroup> = {};

  for (const user of users) {
    for (const periodChange of user.userPeriodChanges) {
      const key = `${periodChange.period}_${periodChange.change}`;
      if (!userGroups[key]) {
        userGroups[key] = {
          period: periodChange.period,
          change: periodChange.change,
          users: []
        };
      }
      userGroups[key].users.push(user);
    }
  }

  return Object.values(userGroups);
};
