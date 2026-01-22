CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  last_logout_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  category TEXT NOT NULL,
  budget NUMERIC(10, 2) NOT NULL,
  desired_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

REVOKE ALL ON TABLE users, sessions, applications, categories FROM PUBLIC;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Security definer functions are the only allowed access path for the app role.
-- Izveido jaunu lietotaju ar lomu.
CREATE OR REPLACE FUNCTION create_user(
  p_username TEXT,
  p_password TEXT,
  p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;

  INSERT INTO users (username, password_hash, role)
  VALUES (p_username, crypt(p_password, gen_salt('bf')), p_role)
  RETURNING id INTO v_user_id;

  RETURN TRUE;
END;
$$;

-- Admina funkcija lietotaja izveidei.
CREATE OR REPLACE FUNCTION create_user_admin(
  p_session_token UUID,
  p_username TEXT,
  p_password TEXT,
  p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN create_user(p_username, p_password, p_role);
END;
$$;

-- Dzes lietotaju un sesijas.
CREATE OR REPLACE FUNCTION delete_user(p_user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM sessions WHERE user_id = p_user_id;
  DELETE FROM users WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- Admina funkcija lietotaja dzesanai.
CREATE OR REPLACE FUNCTION delete_user_admin(
  p_session_token UUID,
  p_user_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN delete_user(p_user_id);
END;
$$;

-- Atjauno lietotaja paroli un lomu.
CREATE OR REPLACE FUNCTION update_user(
  p_user_id INTEGER,
  p_new_password TEXT,
  p_new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      role = p_new_role
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Admina funkcija lietotaja atjaunosanai.
CREATE OR REPLACE FUNCTION update_user_admin(
  p_session_token UUID,
  p_user_id INTEGER,
  p_new_password TEXT,
  p_new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN update_user(p_user_id, p_new_password, p_new_role);
END;
$$;

-- Admina funkcija lietotaja lomas mainai.
CREATE OR REPLACE FUNCTION update_user_role_admin(
  p_session_token UUID,
  p_user_id INTEGER,
  p_new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE users
  SET role = p_new_role
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Parbauda lietotaja akreditacijas datus.
CREATE OR REPLACE FUNCTION check_user_credentials(
  p_username TEXT,
  p_password TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id INTEGER;
BEGIN
  SELECT users.id
  INTO v_user_id
  FROM users
  WHERE users.username = p_username
    AND users.password_hash = crypt(p_password, users.password_hash);

  RETURN v_user_id;
END;
$$;

-- Izveido jaunu sesiju pec login.
CREATE OR REPLACE FUNCTION login_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  session_token UUID,
  username TEXT,
  role TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id INTEGER;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Credentials are verified inside PostgreSQL so the API stays auth-agnostic.
  v_user_id := check_user_credentials(p_username, p_password);

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  v_expires := NOW() + INTERVAL '15 minutes';

  UPDATE users
  SET last_login_at = NOW()
  WHERE id = v_user_id;

  INSERT INTO sessions (user_id, session_token, expires_at)
  VALUES (v_user_id, gen_random_uuid(), v_expires)
  RETURNING sessions.session_token INTO session_token;

  RETURN QUERY
  SELECT session_token, users.username, users.role, v_expires
  FROM users
  WHERE id = v_user_id;
END;
$$;

-- Dzes sesiju un atjauno last_logout_at.
CREATE OR REPLACE FUNCTION logout_user(p_session_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id INTEGER;
BEGIN
  SELECT user_id
  INTO v_user_id
  FROM sessions
  WHERE session_token = p_session_token;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE users
  SET last_logout_at = NOW()
  WHERE id = v_user_id;

  DELETE FROM sessions WHERE session_token = p_session_token;
  RETURN FOUND;
END;
$$;

-- Parbauda sesiju un pagarina tas derigumu.
CREATE OR REPLACE FUNCTION is_user_authenticated(p_session_token UUID)
RETURNS TABLE (
  is_authenticated BOOLEAN,
  username TEXT,
  role TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id INTEGER;
  v_username TEXT;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Session check also refreshes expiry to implement sliding timeout.
  SELECT sessions.user_id, users.username, users.role, sessions.expires_at
  INTO v_user_id, v_username, v_role, v_expires
  FROM sessions
  JOIN users ON users.id = sessions.user_id
  WHERE sessions.session_token = p_session_token;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL, NULL, NULL;
    RETURN;
  END IF;

  IF v_expires <= NOW() THEN
    DELETE FROM sessions WHERE session_token = p_session_token;
    RETURN QUERY SELECT false, NULL, NULL, NULL;
    RETURN;
  END IF;

  v_expires := NOW() + INTERVAL '15 minutes';
  UPDATE sessions SET expires_at = v_expires WHERE session_token = p_session_token;

  RETURN QUERY SELECT true, v_username, v_role, v_expires;
END;
$$;

-- Atgriez publisko kategoriju sarakstu.
CREATE OR REPLACE FUNCTION list_categories()
RETURNS TABLE (
  id INTEGER,
  name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id, name
  FROM categories
  ORDER BY name;
$$;

-- Admina funkcija kategorijas izveidei.
CREATE OR REPLACE FUNCTION create_category(
  p_session_token UUID,
  p_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO categories (name)
  VALUES (p_name);

  RETURN TRUE;
END;
$$;

-- Admina funkcija kategorijas atjaunosanai.
CREATE OR REPLACE FUNCTION update_category(
  p_session_token UUID,
  p_category_id INTEGER,
  p_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE categories
  SET name = p_name
  WHERE id = p_category_id;

  RETURN FOUND;
END;
$$;

-- Admina funkcija kategorijas dzesanai.
CREATE OR REPLACE FUNCTION delete_category(
  p_session_token UUID,
  p_category_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM categories WHERE id = p_category_id;
  RETURN FOUND;
END;
$$;

-- Admina pieteikumu saraksts.
CREATE OR REPLACE FUNCTION list_applications_admin(p_session_token UUID)
RETURNS TABLE (
  id INTEGER,
  client_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  budget NUMERIC,
  desired_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role NOT IN ('admin', 'manager') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    applications.id,
    applications.client_name,
    applications.phone,
    applications.email,
    applications.address,
    applications.category,
    applications.budget,
    applications.desired_date,
    applications.status,
    applications.created_at,
    applications.updated_at,
    applications.confirmed_at
  FROM applications
  ORDER BY applications.created_at DESC;
END;
$$;

-- Admina lietotaju saraksts.
CREATE OR REPLACE FUNCTION list_users_admin(p_session_token UUID)
RETURNS TABLE (
  id INTEGER,
  username TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, is_user_authenticated.role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT users.id, users.username, users.role, users.created_at
  FROM users
  ORDER BY users.created_at DESC;
END;
$$;

-- Izveido jaunu pieteikumu.
CREATE OR REPLACE FUNCTION create_application(
  p_client_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address TEXT,
  p_category TEXT,
  p_budget NUMERIC,
  p_desired_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_application_id INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = p_category) THEN
    RAISE EXCEPTION 'Unknown category';
  END IF;

  INSERT INTO applications (
    client_name,
    phone,
    email,
    address,
    category,
    budget,
    desired_date,
    status,
    updated_at
  )
  VALUES (
    p_client_name,
    p_phone,
    p_email,
    p_address,
    p_category,
    p_budget,
    p_desired_date,
    'pending',
    NOW()
  )
  RETURNING id INTO new_application_id;

  RETURN new_application_id;
END;
$$;

-- Atjauno pieteikumu (admin/manager).
CREATE OR REPLACE FUNCTION update_application(
  p_session_token UUID,
  p_application_id INTEGER,
  p_client_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address TEXT,
  p_category TEXT,
  p_budget NUMERIC,
  p_desired_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM is_user_authenticated(p_session_token)
    WHERE is_authenticated = true
      AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = p_category) THEN
    RAISE EXCEPTION 'Unknown category';
  END IF;

  UPDATE applications
  SET client_name = p_client_name,
      phone = p_phone,
      email = p_email,
      address = p_address,
      category = p_category,
      budget = p_budget,
      desired_date = p_desired_date,
      updated_at = NOW()
  WHERE id = p_application_id;

  RETURN FOUND;
END;
$$;

-- Publisks apstiprinato pieteikumu saraksts.
CREATE OR REPLACE FUNCTION list_applications()
RETURNS TABLE (
  id INTEGER,
  client_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  budget NUMERIC,
  desired_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id, client_name, phone, email, address, category, budget, desired_date,
         status, created_at, updated_at, confirmed_at
  FROM applications
  WHERE status = 'confirmed'
  ORDER BY created_at DESC;
$$;

-- Publiskas pieteikuma detalas (apstiprinatam).
CREATE OR REPLACE FUNCTION get_application(p_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  client_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  budget NUMERIC,
  desired_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id, client_name, phone, email, address, category, budget, desired_date,
         status, created_at, updated_at, confirmed_at
  FROM applications
  WHERE id = p_id
    AND status = 'confirmed';
$$;

-- Admina pieteikuma detalas.
CREATE OR REPLACE FUNCTION get_application_admin(
  p_session_token UUID,
  p_id INTEGER
)
RETURNS TABLE (
  id INTEGER,
  client_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  budget NUMERIC,
  desired_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role NOT IN ('admin', 'manager') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    applications.id,
    applications.client_name,
    applications.phone,
    applications.email,
    applications.address,
    applications.category,
    applications.budget,
    applications.desired_date,
    applications.status,
    applications.created_at,
    applications.updated_at,
    applications.confirmed_at
  FROM applications
  WHERE applications.id = p_id;
END;
$$;

-- Apstiprina pieteikumu (admin/manager).
CREATE OR REPLACE FUNCTION confirm_application(
  p_session_token UUID,
  p_application_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE applications
  SET status = 'confirmed',
      confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_application_id;

  RETURN FOUND;
END;
$$;

-- Dzes pieteikumu (admin).
CREATE OR REPLACE FUNCTION delete_application(
  p_session_token UUID,
  p_application_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authenticated BOOLEAN;
  v_role TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT is_authenticated, role, expires_at
  INTO v_is_authenticated, v_role, v_expires
  FROM is_user_authenticated(p_session_token);

  IF NOT v_is_authenticated OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM applications WHERE id = p_application_id;
  RETURN FOUND;
END;
$$;

INSERT INTO categories (name)
VALUES
  ('Dzīvoklis'),
  ('Birojs'),
  ('Vanna'),
  ('Virtuve'),
  ('Grīdas'),
  ('Sienas')
ON CONFLICT (name) DO NOTHING;
