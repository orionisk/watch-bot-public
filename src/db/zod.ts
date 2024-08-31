import { createInsertSchema } from 'drizzle-zod';
import {
  pairsPrices,
  userPeriodChanges,
  users,
  usersExchanges,
  priceAlerts
} from './schema/index';

export const insertPriceSchema = createInsertSchema(pairsPrices);
export const insertUsersSchema = createInsertSchema(users);
export const insertUsersExchangesSchema = createInsertSchema(usersExchanges);
export const insertUserPeriodChangesSchema =
  createInsertSchema(userPeriodChanges);
export const insertPriceAlertSchema = createInsertSchema(priceAlerts);
