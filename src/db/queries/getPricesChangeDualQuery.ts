// new.ts
import { sql } from 'drizzle-orm';

export const priceChangeDualQuery = (
  exchanges: string,
  period: number,
  change: number
) => {
  return change >= 0
    ? sql`
  SELECT 
    symbol,
    jsonb_object_agg(
        exchange, jsonb_build_object(
          'last', last,
          'lastTime', last_ts,
          'prev', lp,
          'prevTime', lp_ts,
          'changePercent', l_h
        )
    ) AS data
  FROM get_ps_from_mv(${period})
  WHERE exchange IN (${sql.raw(exchanges)})
    AND l_h >= ${change}
  GROUP BY symbol
  ORDER BY symbol
`
    : sql`
  SELECT 
    symbol,
    jsonb_object_agg(
        exchange, jsonb_build_object(
          'last', last,
          'lastTime', last_ts,
          'prev', hp_p,
          'prevTime', hp_ts,
          'changePercent', h_l
        )
    ) AS data
  FROM get_ps_from_mv(${period})
  WHERE exchange IN (${sql.raw(exchanges)})
    AND h_l <= ${change}
  GROUP BY symbol
  ORDER BY symbol
`;
};
