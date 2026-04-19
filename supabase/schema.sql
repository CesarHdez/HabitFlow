-- ============================================================
-- HabitFlow — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Habilitar extensión UUID (ya viene habilitada en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tabla: habits ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS habits (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  category        TEXT        NOT NULL DEFAULT 'custom',
  icon            TEXT        NOT NULL DEFAULT 'Star',
  color           TEXT        NOT NULL DEFAULT '#6366F1',
  goal_frequency  TEXT        NOT NULL DEFAULT 'DAILY',
  goal_count      INTEGER     NOT NULL DEFAULT 1,
  goal_period     INTEGER     NOT NULL DEFAULT 1,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  start_date      DATE        NOT NULL,
  end_date        DATE,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabla: habit_logs ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS habit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id    UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  completed   BOOLEAN     NOT NULL DEFAULT false,
  value       NUMERIC,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

-- ── Índices ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS habits_user_active_idx   ON habits (user_id, is_active);
CREATE INDEX IF NOT EXISTS habits_sort_idx           ON habits (user_id, sort_order);
CREATE INDEX IF NOT EXISTS logs_user_date_idx        ON habit_logs (user_id, date);
CREATE INDEX IF NOT EXISTS logs_habit_date_idx       ON habit_logs (habit_id, date);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE habits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve y modifica sus propios datos
CREATE POLICY "own_habits" ON habits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_habit_logs" ON habit_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Trigger: updated_at automático ───────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER habit_logs_updated_at
  BEFORE UPDATE ON habit_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
