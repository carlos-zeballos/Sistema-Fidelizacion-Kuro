-- SQLite Schema for Loyalty System
PRAGMA foreign_keys = ON;

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  dni_hash TEXT NOT NULL, -- Hash del DNI para login (bcrypt)
  sex TEXT NOT NULL CHECK(sex IN ('M', 'F', 'O')),
  birthdate TEXT NOT NULL, -- YYYY-MM-DD
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  qr_token TEXT NOT NULL UNIQUE,
  last_point_at TEXT, -- Última vez que obtuvo punto/visita
  last_nearby_push_at TEXT, -- Última notificación por cercanía
  last_mandatory_push_at TEXT, -- Última notificación obligatoria 56h
  last_location_lat REAL, -- Última latitud reportada
  last_location_lng REAL, -- Última longitud reportada
  last_location_at TEXT, -- Última vez que reportó ubicación
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Puntos (contador simple)
CREATE TABLE IF NOT EXISTS loyalty_points (
  customer_id INTEGER PRIMARY KEY,
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Eventos de puntos (historial)
CREATE TABLE IF NOT EXISTS point_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  staff_id INTEGER,
  points INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'QR_SCAN', -- QR_SCAN, MANUAL, etc.
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- Staff (administradores)
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STAFF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Promociones
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  push_title TEXT, -- Título para notificación push
  push_message TEXT, -- Mensaje para notificación push
  cta_url TEXT, -- URL al hacer clic en la notificación
  start_at TEXT, -- Fecha de inicio (opcional)
  end_at TEXT, -- Fecha de fin (opcional)
  active INTEGER NOT NULL DEFAULT 1,
  audience TEXT NOT NULL DEFAULT 'ALL', -- ALL, NEARBY, REACTIVATION
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Códigos OTP (para recuperación de sesión)
CREATE TABLE IF NOT EXISTS otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Suscripciones Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE(customer_id, endpoint)
);

-- Log de notificaciones push (auditoría)
CREATE TABLE IF NOT EXISTS push_notifications_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  promotion_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_url TEXT,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  success INTEGER NOT NULL DEFAULT 1, -- 1 = éxito, 0 = fallo
  error_message TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_qr_token ON customers(qr_token);
CREATE INDEX IF NOT EXISTS idx_customers_dni ON customers(dni);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_events_customer_id ON point_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_events_created_at ON point_events(created_at);
CREATE INDEX IF NOT EXISTS idx_point_events_source ON point_events(source);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_start_at ON promotions(start_at);
CREATE INDEX IF NOT EXISTS idx_promotions_end_at ON promotions(end_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_customer_id ON push_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_log_customer_id ON push_notifications_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_log_sent_at ON push_notifications_log(sent_at);
