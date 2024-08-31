import { pgTable, text, real, timestamp, index } from 'drizzle-orm/pg-core';

export const pairsPrices = pgTable(
  'pairs_prices',
  {
    exchange: text('exchange').notNull(),
    symbol: text('symbol').notNull(),
    price: real('price').notNull(),
    timestamp: timestamp('timestamp', {
      mode: 'string',
      precision: 2,
      withTimezone: true
    }).notNull(),
    createdAt: timestamp('created_at', {
      mode: 'string',
      precision: 2,
      withTimezone: true
    }).defaultNow()
  },
  table => ({
    idxPairsPricesTimestampSymbolExchange: index(
      'idx_pairs_prices_exchange_symbol_timestamp'
    ).on(table.exchange, table.symbol, table.timestamp.desc())
  })
);
