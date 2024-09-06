import { logger } from '@/logger/logger';
import { getUsers } from '@/users/users';
import { UserGroup, UserWithExchanges } from '@/types/types';
import { processUserGroup } from './process-user';

export const staggeredCheckPriceChange = async (ms: number): Promise<void> => {
  const userGroups = await getUserGroups();
  const interval = ms / userGroups.length;

  userGroups.forEach((group, index) => {
    setTimeout(() => {
      processUserGroup(group).catch(err =>
        logger.error(`Error processing user ${group}: ${err}`)
      );
    }, interval * index);
  });
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
    for (const periodChange of user.userPeriodChanges) {
      const key = `${periodChange.period}`;
      if (!userGroups[key]) {
        userGroups[key] = {
          period: periodChange.period,
          users: []
        };
      }
      userGroups[key].users.push(user);
    }
  }

  return Object.values(userGroups);
};
