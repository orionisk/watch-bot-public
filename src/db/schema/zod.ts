import { createInsertSchema } from 'drizzle-zod';
import {
  pairsPrices,
  userPeriodChanges,
  users,
  usersExchanges
} from './schema';

export const insertPriceSchema = createInsertSchema(pairsPrices);
export const insertUsersSchema = createInsertSchema(users);
export const insertUsersExchangesSchema = createInsertSchema(usersExchanges);
export const insertUserPeriodChangesSchema =
  createInsertSchema(userPeriodChanges);
