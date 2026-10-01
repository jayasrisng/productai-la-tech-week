CREATE TABLE IF NOT EXISTS visit_slots (id TEXT PRIMARY KEY, starts_at TEXT NOT NULL, capacity INTEGER NOT NULL CHECK(capacity > 0), active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, slot_id TEXT NOT NULL REFERENCES visit_slots(id), member_name TEXT NOT NULL, member_email TEXT NOT NULL, guest_name TEXT, attendee_count INTEGER NOT NULL CHECK(attendee_count IN (1,2)), status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')), idempotency_key TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, cancelled_at TEXT);
CREATE INDEX IF NOT EXISTS reservations_slot_status ON reservations(slot_id,status);
-- DEMO ONLY. Replace times and capacity after Tess confirms operating rules.
INSERT OR IGNORE INTO visit_slots (id,starts_at,capacity) VALUES ('demo-oct-7-1600','2026-10-07T16:00:00-07:00',12),('demo-oct-7-1700','2026-10-07T17:00:00-07:00',12);
