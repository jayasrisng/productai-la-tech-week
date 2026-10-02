-- Old demo records are not served by the new API. Retention also cleans legacy records.
UPDATE visit_slots SET active = 0;
CREATE TABLE booking_slots (
  id TEXT PRIMARY KEY,
  starts_at TEXT NOT NULL UNIQUE,
  ends_at TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK(capacity = 20),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  attendee_count INTEGER NOT NULL CHECK(attendee_count IN (1,2)),
  referral TEXT NOT NULL,
  disclosure_version TEXT NOT NULL,
  idempotency_hash TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  management_hash TEXT NOT NULL UNIQUE,
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK(email_status IN ('pending','unconfigured','sent')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL DEFAULT (unixepoch() + 2592000)
);
CREATE TABLE booking_attendees (
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK(ordinal IN (0,1)),
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT NOT NULL,
  linkedin TEXT NOT NULL,
  PRIMARY KEY(booking_id,ordinal),
  UNIQUE(booking_id,email)
);
CREATE INDEX booking_attendee_email ON booking_attendees(email);
CREATE TABLE booking_hours (
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL REFERENCES booking_slots(id),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
  cancelled_at INTEGER,
  PRIMARY KEY(booking_id,slot_id)
);
CREATE INDEX booking_hours_occupancy ON booking_hours(slot_id,status);
CREATE INDEX bookings_expiry ON bookings(expires_at);
-- Each INSERT runs inside the same D1 batch transaction as the complete booking.
-- A trigger exception rolls back ALL selected hours and attendee rows.
CREATE TRIGGER booking_hour_capacity BEFORE INSERT ON booking_hours
WHEN NEW.status = 'confirmed'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM booking_slots s WHERE s.id=NEW.slot_id AND s.active=1
      AND s.capacity >= (SELECT attendee_count FROM bookings WHERE id=NEW.booking_id) +
        (SELECT COALESCE(SUM(b.attendee_count),0) FROM booking_hours h JOIN bookings b ON b.id=h.booking_id WHERE h.slot_id=NEW.slot_id AND h.status='confirmed')
  ) THEN RAISE(ABORT, 'SLOT_CAPACITY') END;
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM booking_attendees incoming JOIN booking_attendees existing ON incoming.email=existing.email
      JOIN booking_hours h ON h.booking_id=existing.booking_id
    WHERE incoming.booking_id=NEW.booking_id AND existing.booking_id<>NEW.booking_id
      AND h.slot_id=NEW.slot_id AND h.status='confirmed'
  ) THEN RAISE(ABORT, 'ATTENDEE_OVERLAP') END;
END;
WITH RECURSIVE days(n) AS (SELECT 12 UNION ALL SELECT n+1 FROM days WHERE n<16),
hours(n) AS (SELECT 11 UNION ALL SELECT n+1 FROM hours WHERE n<15)
INSERT INTO booking_slots(id, starts_at, ends_at, capacity)
SELECT printf('la-2026-10-%02d-%02d',days.n,hours.n),
  printf('2026-10-%02dT%02d:00:00-07:00',days.n,hours.n),
  printf('2026-10-%02dT%02d:00:00-07:00',days.n,hours.n+1),20
FROM days CROSS JOIN hours;
