-- Step 1: Create hypertable and retention policy for the 'pairs_prices' table
SELECT create_hypertable('pairs_prices', by_range('timestamp', INTERVAL '1 hour'), if_not_exists => TRUE);
SELECT add_retention_policy('pairs_prices', drop_after => INTERVAL '1 hour', schedule_interval => interval '2 hours');

-- Step 2: Create the materialized view 'mv_candles_1s' without data
DO $$
BEGIN
    EXECUTE 'CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1s
              WITH (timescaledb.continuous) AS
              SELECT
                  time_bucket(''1 second''::interval, timestamp) AS ts,
                  exchange,
                  symbol,
                  candlestick_agg("timestamp", price, NULL) AS candlestick
              FROM pairs_prices
              GROUP BY ts, exchange, symbol
              WITH NO DATA';
    
    -- Add retention policy to the materialized view 'mv_candles_1s'
    PERFORM add_retention_policy('mv_candles_1s', drop_after => INTERVAL '2 hours', schedule_interval => interval '3 hours');

    -- Alter the materialized view to disable materialized_only
    EXECUTE 'ALTER MATERIALIZED VIEW IF EXISTS mv_candles_1s SET (timescaledb.materialized_only = false)';

    -- Add continuous aggregate policy to 'mv_candles_1s'
    PERFORM add_continuous_aggregate_policy('mv_candles_1s',
        start_offset => INTERVAL '1 hour',
        end_offset => INTERVAL '2 seconds',
        schedule_interval => INTERVAL '1 second');
END $$;

-- Step 3: Create the materialized view 'mv_candles_1m' without data
DO $$
BEGIN
    EXECUTE 'CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1m
              WITH (timescaledb.continuous) AS
              SELECT
                  time_bucket(''1 minute''::interval, ts) AS ts,
                  exchange,
                  symbol,
                  rollup(candlestick) AS candlestick
              FROM mv_candles_1s
              GROUP BY time_bucket(''1 minute''::interval, ts), exchange, symbol
              WITH NO DATA';

    -- Add retention policy to the materialized view 'mv_candles_1m'
    PERFORM add_retention_policy('mv_candles_1m', drop_after => INTERVAL '3 hours', schedule_interval => interval '4 hours');

    -- Alter the materialized view to disable materialized_only
    EXECUTE 'ALTER MATERIALIZED VIEW IF EXISTS mv_candles_1m SET (timescaledb.materialized_only = false)';

    -- Add continuous aggregate policy to 'mv_candles_1m'
    PERFORM add_continuous_aggregate_policy('mv_candles_1m',
        start_offset => INTERVAL '2 hours',
        end_offset => INTERVAL '1 minute',
        schedule_interval => INTERVAL '1 minute',
        initial_start => date_trunc('minute', now()) + INTERVAL '1 minute');
END $$;
