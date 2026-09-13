-- Durable product-wide attendance counter.
-- It is intentionally separate from check_ins: deleting or editing event data
-- must not rewrite the historical number shown on the public landing page.
CREATE TABLE platform_metrics (
    metric_key VARCHAR(80) PRIMARY KEY,
    metric_value BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO platform_metrics (metric_key, metric_value)
SELECT 'TOTAL_CHECKINS', COUNT(*)
FROM check_ins;

CREATE OR REPLACE FUNCTION increment_total_checkins()
RETURNS VOID AS $$
BEGIN
    UPDATE platform_metrics
    SET metric_value = metric_value + 1, updated_at = NOW()
    WHERE metric_key = 'TOTAL_CHECKINS';
END;
$$ LANGUAGE plpgsql;
