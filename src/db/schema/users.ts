import {
  pgTable,
  text,
  real,
  integer,
  serial,
  bigint,
  boolean,
  uniqueIndex
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  isEnabled: boolean('is_enabled').notNull().default(true)
});

export const userPeriodChanges = pgTable(
  'user_period_changes',
  {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    period: integer('period').notNull(),
    change: real('change').notNull()
  },
  table => ({
    uniqueUserExchange: uniqueIndex('unique_user_period_changes').on(
      table.userId,
      table.period,
      table.change
    )
  })
);
