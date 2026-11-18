CREATE INDEX IF NOT EXISTS idx_scan_tracking_order_latest ON scan_tracking(order_id, scanned_at DESC, id DESC);
