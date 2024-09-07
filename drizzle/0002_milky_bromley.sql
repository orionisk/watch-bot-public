-- Function to drop all existing functions
CREATE OR REPLACE FUNCTION drop_all_ps_functions() RETURNS void AS $$
BEGIN
    DROP FUNCTION IF EXISTS get_ps(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS create_ps_mv(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS refresh_ps_mv(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS get_ps_from_mv(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS ps_mv_exists(INTEGER) CASCADE;
END;
$$ LANGUAGE plpgsql;

-- Call the function to drop all existing functions
SELECT drop_all_ps_functions();

-- Drop the function used for dropping
DROP FUNCTION drop_all_ps_functions();

-- 
CREATE OR REPLACE FUNCTION get_ps(time_range_minutes INTEGER)
RETURNS TABLE (
    exchange TEXT,
    symbol TEXT,
    last NUMERIC,
    last_ts TIMESTAMP WITH TIME ZONE,
    lp NUMERIC,
    lp_ts TIMESTAMP WITH TIME ZONE,
    hp_p NUMERIC,
    hp_ts TIMESTAMP WITH TIME ZONE,
    l_h NUMERIC,
    h_l NUMERIC
) AS $$
WITH time_range AS (
    SELECT CURRENT_TIMESTAMP - interval '1 minute' * time_range_minutes AS start_time,
           CURRENT_TIMESTAMP AS end_time
),
latest_prices AS (
    SELECT DISTINCT ON (exchange, symbol)
        ts,
        exchange,
        symbol,
        high_time(candlestick) as high_ts,
        high(candlestick) as high_p
    FROM mv_candles_1s
    WHERE ts >= (SELECT end_time - interval '5 seconds' FROM time_range)
    ORDER BY exchange, symbol, ts DESC
),
price_summary AS (
    SELECT 
        exchange,
        symbol,
        MIN(low(candlestick)) AS low_p,
        first(low_time(candlestick), low(candlestick)) AS low_ts,
        MAX(high(candlestick)) AS high_p,
        last(high_time(candlestick), high(candlestick)) AS high_ts
    FROM (
        SELECT *
        FROM mv_candles_1m
        WHERE ts >= (SELECT start_time FROM time_range)
        UNION ALL
        SELECT *
        FROM mv_candles_1s
        WHERE ts >= (SELECT date_trunc('minute', start_time) FROM time_range)
          AND ts < (SELECT date_trunc('minute', start_time) + interval '1 minute' FROM time_range)
    ) combined_data
    WHERE low_time(candlestick) >= (SELECT start_time FROM time_range)
    GROUP BY exchange, symbol
),
calculated_prices as (
  SELECT 
    lp.exchange,
    lp.symbol,
    lp.high_p AS last,
    lp.high_ts AS last_ts,
    ps.low_p as lp,
    ps.low_ts as lp_ts,
    ps.high_p AS hp_p,
    ps.high_ts AS hp_ts,
    ((lp.high_p - ps.low_p) / ps.low_p) * 100 AS l_h,
    ((lp.high_p - ps.high_p) / ps.high_p) * 100 AS h_l
FROM latest_prices lp
JOIN price_summary ps
ON lp.symbol = ps.symbol AND lp.exchange = ps.exchange
)
SELECT *
FROM calculated_prices
$$ LANGUAGE SQL;

-- mvs
CREATE OR REPLACE FUNCTION create_ps_mv(period_arg integer)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        DROP MATERIALIZED VIEW IF EXISTS ps_mv_%s;
        
        CREATE MATERIALIZED VIEW ps_mv_%s AS
        SELECT * FROM get_ps(%s);
    ', period_arg, period_arg, period_arg);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_ps_mv(period_arg integer)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        REFRESH MATERIALIZED VIEW ps_mv_%s;
    ', period_arg);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ps_from_mv(period_arg integer)
RETURNS TABLE (
    exchange TEXT,
    symbol TEXT,
    last NUMERIC,
    last_ts timestamp with time zone,
    lp NUMERIC,
    lp_ts timestamp with time zone,
    hp_p NUMERIC,
    hp_ts timestamp with time zone,
    l_h NUMERIC,
    h_l NUMERIC
) AS $$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT * FROM ps_mv_%s;
    ', period_arg);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ps_mv_exists(period_arg integer)
RETURNS boolean AS $$
DECLARE
    mv_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'm'
        AND n.nspname = current_schema()
        AND c.relname = 'ps_mv_' || period_arg::text
    ) INTO mv_exists;
    
    RETURN mv_exists;
END;
$$ LANGUAGE plpgsql;
