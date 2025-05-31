import { insertUsersSchema } from '@/db/zod';
import { z } from 'zod';

export const generateUsersExchangeData = (
  usersData: z.infer<typeof insertUsersSchema>[],
  exchangesData: Array<{ name: string }>,
  insertUsersExchangesSchema: z.ZodSchema<any>
): z.infer<typeof insertUsersExchangesSchema>[] =>
  usersData
    .map(u => exchangesData.map(e => ({ userId: u.id, exchangeName: e.name })))
    .flat();

export const generateUsersPeriodChangesData = (
  usersData: z.infer<typeof insertUsersSchema>[],
  insertUserPeriodChangesSchema: z.ZodSchema<any>
): z.infer<typeof insertUserPeriodChangesSchema>[] =>
  usersData
    .map(u => [
      // { userId: u.id, change: 2, period: 2 },
      { userId: u.id, change: 10, period: 20 },
      { userId: u.id, change: -10, period: 20 }
    ])
    .flat();
