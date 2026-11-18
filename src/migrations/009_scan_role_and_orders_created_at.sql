-- Scan kis role mein hua (login par employee ka role)
ALTER TABLE scan_tracking ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

UPDATE scan_tracking s SET role_id = e.role_id
FROM employees e WHERE e.id = s.employee_id AND s.role_id IS NULL;

-- Synced orders page: created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC, order_id DESC);
