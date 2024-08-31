import {
  pgTable,
  text,
  serial,
  bigint,
  boolean,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const exchanges = pgTable('exchanges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique()
});

export const usersExchanges = pgTable(
  'user_exchanges',
  {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    exchangeName: text('exchange_name')
      .notNull()
      .references(() => exchanges.name, {
        onUpdate: 'cascade',
        onDelete: 'cascade'
      }),
    enabled: boolean('enabled').notNull().default(true)
  },
  table => ({
    pkUserExchanges: index('pk_user_exchanges').on(
      table.userId,
      table.exchangeName
    ),
    uniqueUserExchange: uniqueIndex('unique_user_exchange').on(
      table.userId,
      table.exchangeName
    )
  })
);
