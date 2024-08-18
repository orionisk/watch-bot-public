import { eq } from 'drizzle-orm';
import { db } from '@/db/schema/drizzle';
import { usersExchanges, users } from '@/db/schema/schema';
import { insertUsersSchema } from '@/db/schema/zod';
import { logger } from '@/logger/logger';
import { z } from 'zod';
import { e, r } from '@/common/utils';

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

      const defaultExchanges = ['Binance', 'Bybit'];
      const userExchangeValues = defaultExchanges.map(exchange => ({
        userId: newUser.id,
        exchangeName: exchange,
        enabled: true,
        userName: newUser.name
      }));

      await trx.insert(usersExchanges).values(userExchangeValues);
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
