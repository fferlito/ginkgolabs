-- Cloud SQL Postgres schema for MushroomRadar user data.
-- SQLAlchemy also creates these tables on startup via Base.metadata.create_all.

CREATE TABLE IF NOT EXISTS users (
  clerk_user_id TEXT PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES users (clerk_user_id),
  name TEXT NOT NULL,
  notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES users (clerk_user_id),
  species_id TEXT,
  species_name TEXT NOT NULL,
  scientific_name TEXT,
  observed_on DATE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  photo_object TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_observations_user_date
  ON observations (clerk_user_id, observed_on DESC);

CREATE INDEX IF NOT EXISTS ix_observations_public_date
  ON observations (is_public, observed_on DESC);
