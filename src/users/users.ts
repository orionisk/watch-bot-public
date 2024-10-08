import { eq, name } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import {
  usersExchanges,
  users,
  exchanges,
  userPeriodChanges
} from '@/db/schema/index';
import {
  insertUserPeriodChangesSchema,
  insertUsersExchangesSchema,
  insertUsersSchema
} from '@/db/zod';
import { logger } from '@/logger/logger';
import { z } from 'zod';
import { e, r } from '@/common/utils';
import {
  generateUsersExchangeData,
  generateUsersPeriodChangesData
} from './user-seed';

export const addUser = async (newUser: z.infer<typeof insertUsersSchema>) => {
  // set default values for period and change
  const parse = insertUsersSchema.safeParse(newUser);

  if (!parse.success) {
    logger.error(parse.error);
    return e('Data is not valid');
  }

  // check if user already exists
  const [user] = await db.select().from(users).where(eq(users.id, newUser.id));

  if (user) {
    return e('User already exists');
  }

  try {
    const user = await db.transaction(async trx => {
      const [user] = await trx.insert(users).values(parse.data).returning();

      if (!user) {
        logger.error('User insertion failed due to conflict or other issue.');
        throw new Error('User insertion failed');
      }

      const exchangesData = await trx
        .select({ name: exchanges.name })
        .from(exchanges);

      const usersExchangeData = generateUsersExchangeData(
        [user],
        exchangesData,
        insertUsersExchangesSchema
      );

      const usersPeriodChangesData = generateUsersPeriodChangesData(
        [user],
        insertUserPeriodChangesSchema
      );

      await trx.insert(usersExchanges).values(usersExchangeData);
      await trx.insert(userPeriodChanges).values(usersPeriodChangesData);
      return user;
    });

    return r(user);
  } catch (error: any) {
    logger.error({ code: error.code, detail: error.detail });
    return e(error);
  }
};

export const getUsers = async () => {
  try {
    const subscribers = await db.query.users.findMany({
      with: {
        userExchanges: true,
        userPeriodChanges: true
      }
    });
    return r(subscribers);
  } catch (error) {
    logger.error(error);
    return e('Error getting users');
  }
};

export const getUser = async (id: number) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return r(user);
  } catch (error) {
    logger.error(error);
    return e('Error getting user');
  }
};

export const checkAdmin = async (id: number) => {
  try {
    const [user] = await getUser(id);
    return r(user?.isAdmin);
  } catch (error) {
    logger.error(error);
    return e('Error getting user');
  }
};
