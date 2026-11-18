CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE CHECK (role_name IN ('tailor', 'cutting master')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pattern_and_rates (
  id SERIAL PRIMARY KEY,
  pattern_number TEXT NOT NULL UNIQUE,
  rate NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (rate >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS style_and_pattern_mapping (
  id SERIAL PRIMARY KEY,
  style_number TEXT NOT NULL,
  pattern_number TEXT NOT NULL REFERENCES pattern_and_rates(pattern_number),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (style_number, pattern_number)
);

CREATE TABLE IF NOT EXISTS orders (
  order_id SERIAL PRIMARY KEY,
  style_number TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT DEFAULT 'Other',
  channel TEXT NOT NULL,
  sync_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'PRODUCTION'
    CHECK (status IN ('PRODUCTION', 'FOUND_IN_INVENTORY', 'SHIPPED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  employee_id INTEGER REFERENCES employees(id),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id);
CREATE INDEX IF NOT EXISTS idx_style_pattern_mapping_pattern ON style_and_pattern_mapping(pattern_number);
CREATE INDEX IF NOT EXISTS idx_orders_sync_id ON orders(sync_id);
CREATE INDEX IF NOT EXISTS idx_orders_style_number ON orders(style_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_scan_tracking_order_id ON scan_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_scan_tracking_employee_id ON scan_tracking(employee_id);
CREATE INDEX IF NOT EXISTS idx_scan_tracking_scanned_at ON scan_tracking(scanned_at);
