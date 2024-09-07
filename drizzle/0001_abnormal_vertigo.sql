-- Step 1: Create hypertable and retention policy for the 'pairs_prices' table
SELECT create_hypertable('pairs_prices', by_range('timestamp', INTERVAL '1 hour'), if_not_exists => TRUE);
SELECT add_retention_policy('pairs_prices', drop_after => INTERVAL '1 hour', if_not_exists => TRUE);

-- Step 2: Handle 'mv_candles_1s'
DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM timescaledb_information.continuous_aggregates
        WHERE view_name = 'mv_candles_1s'
    ) INTO view_exists;

    IF NOT view_exists THEN
        EXECUTE $view$
        CREATE MATERIALIZED VIEW mv_candles_1s
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 second'::interval, timestamp) AS ts,
            exchange,
            symbol,
            candlestick_agg("timestamp", price, NULL) AS candlestick
        FROM pairs_prices
        GROUP BY ts, exchange, symbol
        WITH NO DATA
        $view$;

        ALTER MATERIALIZED VIEW mv_candles_1s SET (timescaledb.materialized_only = false);
    END IF;

    -- Update or add retention policy
    PERFORM add_retention_policy('mv_candles_1s', drop_after => INTERVAL '2 hours', if_not_exists => TRUE);

    -- Update or add continuous aggregate policy
    PERFORM add_continuous_aggregate_policy('mv_candles_1s',
        start_offset => INTERVAL '1 hour',
        end_offset => INTERVAL '2 seconds',
        schedule_interval => INTERVAL '1 second',
        if_not_exists => TRUE);
END $$;

-- Step 3: Handle 'mv_candles_1m'
DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM timescaledb_information.continuous_aggregates
        WHERE view_name = 'mv_candles_1m'
    ) INTO view_exists;

    IF NOT view_exists THEN
        EXECUTE $view$
        CREATE MATERIALIZED VIEW mv_candles_1m
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 minute'::interval, ts) AS ts,
            exchange,
            symbol,
            rollup(candlestick) AS candlestick
        FROM mv_candles_1s
        GROUP BY time_bucket('1 minute'::interval, ts), exchange, symbol
        WITH NO DATA
        $view$;

        ALTER MATERIALIZED VIEW mv_candles_1m SET (timescaledb.materialized_only = false);
    END IF;

    -- Update or add retention policy
    PERFORM add_retention_policy('mv_candles_1m', drop_after => INTERVAL '3 hours', if_not_exists => TRUE);

    -- Update or add continuous aggregate policy
    PERFORM add_continuous_aggregate_policy('mv_candles_1m',
        start_offset => INTERVAL '2 hours',
        end_offset => INTERVAL '1 minute',
        schedule_interval => INTERVAL '1 minute',
        initial_start => date_trunc('minute', now()) + INTERVAL '1 minute',
        if_not_exists => TRUE);
END $$;

CREATE INDEX ON mv_candles_1m (ts, exchange, symbol);
CREATE INDEX ON mv_candles_1s (ts, exchange, symbol);
