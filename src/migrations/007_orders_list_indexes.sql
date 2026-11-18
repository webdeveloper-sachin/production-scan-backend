CREATE INDEX IF NOT EXISTS idx_orders_status_id ON orders(status, order_id DESC);
CREATE INDEX IF NOT EXISTS idx_orders_style_id ON orders(style_number, order_id DESC);
DROP INDEX IF EXISTS idx_orders_status;
