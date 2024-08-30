// new.ts
import { sql } from 'drizzle-orm';

export const priceChangeQuery = (
  timestamp: string,
  change: number,
  exchanges: string[]
) => {
  const exchangeList = exchanges.map(exchange => `'${exchange}'`).join(', ');

  return sql`
    WITH filtered_1m_prices AS (
        SELECT
            ts,
            exchange,
            symbol,
            candlestick,
            low(candlestick) AS low_price,
            low_time(candlestick) AS low_time,
            high_time(candlestick) AS high_time,
            high(candlestick) AS high_price
        FROM mv_candles_1m
        WHERE ts >= ${timestamp}::timestamp
          AND exchange IN (${sql.raw(exchangeList)})
    ), 
    filtered_1s_prices AS (
        SELECT
            ts,
            exchange,
            symbol,
            candlestick,
            low(candlestick) AS low_price,
            low_time(candlestick) AS low_time,
            high_time(candlestick) AS high_time,
            high(candlestick) AS high_price
        FROM mv_candles_1s
        WHERE ts >= date_trunc('minute', ${timestamp}::timestamp) + extract(second from ${timestamp}::timestamp) * interval '1 second'
        AND ts < date_trunc('minute', ${timestamp}::timestamp) + interval '1 minute'
        AND exchange IN (${sql.raw(exchangeList)})
    ),
    filtered_prices AS (
        SELECT * FROM filtered_1m_prices
        UNION ALL
        SELECT * FROM filtered_1s_prices
    ),
    last_prices AS (
      SELECT DISTINCT ON (exchange, symbol)
        ts,
        exchange,
        symbol,
        high_time(candlestick) as last_price_time,
        high(candlestick) as last_price
      FROM mv_candles_1s
      WHERE ts >= (now() - interval '5 seconds')
      ORDER BY exchange, symbol, ts DESC
    ),
    price_summary AS (
      SELECT DISTINCT ON (exchange, symbol)
        symbol,
        exchange,
        low_price AS min_price,
        low_time AS min_price_time
      FROM filtered_prices
      WHERE low_time >= ${timestamp}::timestamp
      ORDER BY symbol, exchange, low_price ASC, low_time ASC
    ),
    calculated_changes AS (
      SELECT 
        lp.ts,
        lp.symbol,
        lp.exchange,
        lp.last_price,
        lp.last_price_time,
        ps.min_price,
        ps.min_price_time,
        ((lp.last_price - ps.min_price) / ps.min_price) * 100 AS change_percent
      FROM last_prices lp
      JOIN price_summary ps
      ON lp.symbol = ps.symbol AND lp.exchange = ps.exchange
    ),
    formatted_data AS (
      SELECT 
        symbol,
        exchange,
        max(last_price) AS last_price,
        max(last_price_time) AS last_price_time,
        min(min_price) AS min_price,
        min(min_price_time) AS min_price_time,
        max(change_percent) AS max_change_percent
      FROM calculated_changes
      WHERE change_percent >= ${change}
      GROUP BY symbol, exchange
    )
    SELECT
      symbol,
      json_object_agg(
        exchange, json_build_object(
          'last', last_price,
          'lastTime', last_price_time,
          'min', min_price,
          'minTime', min_price_time,
          'changePercent', max_change_percent
        )
      ) AS data
    FROM formatted_data
    GROUP BY symbol
    ORDER BY symbol;
  `;
};
