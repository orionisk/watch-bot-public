import { relations } from 'drizzle-orm';
import { users, userPeriodChanges } from './users';
import { exchanges, usersExchanges } from './exchanges';
import { priceAlerts } from './price-alerts';

export const usersRelations = relations(users, ({ many }) => ({
  userExchanges: many(usersExchanges),
  userPeriodChanges: many(userPeriodChanges)
}));

export const exchangesRelations = relations(exchanges, ({ many }) => ({
  userExchanges: many(usersExchanges)
}));

export const usersExchangesRelations = relations(usersExchanges, ({ one }) => ({
  user: one(users, { fields: [usersExchanges.userId], references: [users.id] }),
  exchange: one(exchanges, {
    fields: [usersExchanges.exchangeName],
    references: [exchanges.name]
  })
}));

export const userPeriodChangesRelations = relations(
  userPeriodChanges,
  ({ one }) => ({
    user: one(users, {
      fields: [userPeriodChanges.userId],
      references: [users.id]
    })
  })
);

export const userPriceAlertsRelations = relations(priceAlerts, ({ one }) => ({
  user: one(users, {
    fields: [priceAlerts.userId],
    references: [users.id]
  })
}));
