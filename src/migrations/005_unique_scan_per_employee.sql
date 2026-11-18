CREATE UNIQUE INDEX IF NOT EXISTS ux_scan_order_employee ON scan_tracking(order_id, employee_id);
