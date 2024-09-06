import { logger } from '@/logger/logger';
import { getUsers } from '@/users/users';
import { UserGroup, UserWithExchanges } from '@/types/types';
import { processUserGroup } from './process-user';

const runningQueries = new Set<string>();
const MAX_EXECUTION_TIME = 1000; // 1 second in milliseconds
const TOTAL_INTERVAL = 1000; // 1 second in milliseconds

export const checkPriceChange = async (): Promise<void> => {
  const userGroups = await getUserGroups();
  const groupCount = userGroups.length;
  const DELAY_BETWEEN_GROUPS =
    groupCount > 1 ? TOTAL_INTERVAL / (groupCount - 1) : 0;

  for (let i = 0; i < groupCount; i++) {
    const group = userGroups[i];
    await processGroupIfNotRunning(group);

    if (i < groupCount - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_GROUPS));
    }
  }
};

const processGroupIfNotRunning = async (group: UserGroup): Promise<void> => {
  const queryKey = `${group.period}`;
  if (runningQueries.has(queryKey)) {
    logger.info(
      `Query for period ${group.period} is already running. Skipping.`
    );
    return;
  }

  runningQueries.add(queryKey);
  const startTime = Date.now();

  try {
    await processUserGroup(group);
  } catch (err) {
    logger.error(
      `Error processing user group for period ${group.period}: ${err}`
    );
  } finally {
    runningQueries.delete(queryKey);
    const executionTime = Date.now() - startTime;
    if (executionTime > MAX_EXECUTION_TIME) {
      logger.warn(
        `Query for period ${group.period} took longer than expected: ${executionTime}ms`
      );
    }
  }
};

const getUserGroups = async (): Promise<UserGroup[]> => {
  try {
    const [users, error] = await getUsers();

    if (!users) return [];

    if (error) logger.error('Error getting users:', error);

    return groupUsersByPeriod(users);
  } catch (error) {
    logger.error(`Error getting users: ${error}`);
    return [];
  }
};

const groupUsersByPeriod = (users: UserWithExchanges[]): UserGroup[] => {
  const userGroups: Record<string, UserGroup> = {};

  for (const user of users) {
    if (!user.isEnabled) continue;

    const uniquePeriods = new Set(
      user.userPeriodChanges.map(change => change.period)
    );

    for (const period of uniquePeriods) {
      const key = `${period}`;
      if (!userGroups[key]) {
        userGroups[key] = { period, users: [] };
      }
      userGroups[key].users.push(user);
    }
  }

  return Object.values(userGroups);
};
