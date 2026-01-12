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

-- Para antifraude: último punto otorgado
CREATE TABLE IF NOT EXISTS point_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT DEFAULT 'QR_SCAN',
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Staff/Admin
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Promociones
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  push_title TEXT, -- Título para notificación push
  push_message TEXT, -- Mensaje corto para notificación push
  cta_url TEXT, -- URL cuando el cliente toque la notificación (ej: /dashboard.html)
  audience TEXT NOT NULL DEFAULT 'ALL' CHECK(audience IN ('ALL', 'NEARBY', 'REACTIVATION')), -- Público objetivo
  start_at TEXT,
  end_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- OTP codes (passwordless login para clientes)
CREATE TABLE IF NOT EXISTS otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Push subscriptions (opcional)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Log de notificaciones push enviadas (auditoría)
CREATE TABLE IF NOT EXISTS push_notifications_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  promotion_id INTEGER, -- NULL si es mensaje manual
  notification_type TEXT NOT NULL CHECK(notification_type IN ('NEARBY', 'MANDATORY_56H', 'MANUAL')),
  push_title TEXT NOT NULL,
  push_message TEXT NOT NULL,
  cta_url TEXT,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  success INTEGER NOT NULL DEFAULT 1, -- 1 = éxito, 0 = fallo
  error_message TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_dni ON customers(dni);
CREATE INDEX IF NOT EXISTS idx_customers_qr_token ON customers(qr_token);
CREATE INDEX IF NOT EXISTS idx_customers_last_point_at ON customers(last_point_at);
CREATE INDEX IF NOT EXISTS idx_point_events_customer_id ON point_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_events_created_at ON point_events(created_at);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_audience ON promotions(audience);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_customer_id ON push_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_log_customer_id ON push_notifications_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_log_sent_at ON push_notifications_log(sent_at);

-- Nota: Para crear un admin, ejecuta:
-- node backend/scripts/create-admin.js <username> <password>
