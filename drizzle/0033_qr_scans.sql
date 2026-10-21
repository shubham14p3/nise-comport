-- Anonymous QR scan counts: one row per day, source and device type. No names, IPs or cookies.
CREATE TABLE IF NOT EXISTS "qr_scans" (
  "day" date NOT NULL,
  "source" text NOT NULL,
  "device" text NOT NULL,
  "scans" integer NOT NULL DEFAULT 0,
  "clicks" jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY ("day", "source", "device")
);
