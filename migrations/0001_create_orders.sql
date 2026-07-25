CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_title TEXT NOT NULL,
  product_price TEXT NOT NULL,
  product_url TEXT NOT NULL,
  product_image TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  address TEXT NOT NULL,
  address_2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL DEFAULT '',
  order_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
