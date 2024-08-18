import { pairsPrices } from '@/db/schema/schema';
import { sql } from 'drizzle-orm';

export const priceChangeQuery = (
  timestamp: string,
  change: number,
  exchanges: string[]
) => {
  const exchangeList = exchanges.map(exchange => `'${exchange}'`).join(', ');
  const interval = '10 seconds';

  return sql`
    WITH filtered_pairs AS (
      SELECT
        price,
        created_at,
        exchange,
        symbol,
        timestamp
      FROM ${pairsPrices}
      WHERE 
        (timestamp BETWEEN ${timestamp}::timestamp AND (${timestamp}::timestamp + interval ${sql.raw(
    `'${interval}'`
  )})
        OR timestamp >= (now() at time zone 'UTC' - interval ${sql.raw(
          `'${interval}'`
        )}))
        AND exchange IN (${sql.raw(exchangeList)})
    ),
    ranked_prices AS (
      SELECT
        price,
        created_at,
        exchange,
        symbol,
        timestamp,
        ROW_NUMBER() OVER (PARTITION BY symbol, exchange ORDER BY price ASC) AS rn_min,
        ROW_NUMBER() OVER (PARTITION BY symbol, exchange ORDER BY timestamp DESC) AS rn_latest
      FROM filtered_pairs
    ),
    data AS (
      SELECT
        symbol,
        exchange,
        json_agg(json_build_object(
          'price', price,
          'created_at', created_at,
          'timestamp', timestamp
        ) ORDER BY timestamp) AS prices,
        max(price) FILTER (WHERE rn_latest = 1) - min(price) FILTER (WHERE rn_min = 1) AS change,
        ((max(price) FILTER (WHERE rn_latest = 1) - min(price) FILTER (WHERE rn_min = 1)) / min(price) FILTER (WHERE rn_min = 1) * 100) AS changePercent
      FROM ranked_prices
      WHERE rn_min = 1 OR rn_latest = 1
      GROUP BY symbol, exchange
      HAVING ((max(price) FILTER (WHERE rn_latest = 1) - min(price) FILTER (WHERE rn_min = 1)) / min(price) FILTER (WHERE rn_min = 1) * 100) >= ${change}
    )
    SELECT
      symbol,
      json_object_agg(
        exchange, json_build_object(
          'prices', prices,
          'change', change,
          'changePercent', changePercent
        )
      ) AS data
    FROM data
    GROUP BY symbol
    ORDER BY symbol;
  `;
};
