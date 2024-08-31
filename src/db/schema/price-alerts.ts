import {
  pgTable,
  bigint,
  text,
  real,
  timestamp,
  boolean,
  uuid
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const priceAlerts = pgTable('price_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  exchange: text('exchange').notNull(),
  prev: real('prev').notNull(),
  prevTs: timestamp('prev_ts', {
    mode: 'string',
    precision: 2,
    withTimezone: true
  }).notNull(),
  last: real('last').notNull(),
  lastTs: timestamp('last_ts', {
    mode: 'string',
    precision: 2,
    withTimezone: true
  }).notNull(),
  period: real('period').notNull(),
  change: real('change').notNull(),
  changePercent: real('change_percent').notNull(),
  notificationSent: boolean('notification_sent').notNull().default(false)
});
