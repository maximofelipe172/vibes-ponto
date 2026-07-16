-- Migração: users → profiles, com RBAC (role/status) preservando os dados.
-- Idempotente o suficiente para rodar uma vez com segurança.

-- 1) Tabela users → profiles
ALTER TABLE users RENAME TO profiles;

-- 2) Novos enums
CREATE TYPE role AS ENUM ('admin', 'employee');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- 3) tipo (ADMIN|FUNCIONARIO) → role (admin|employee), preservando o valor
ALTER TABLE profiles ADD COLUMN role role NOT NULL DEFAULT 'employee';
UPDATE profiles
   SET role = CASE WHEN tipo::text = 'ADMIN' THEN 'admin'::role
                   ELSE 'employee'::role END;
ALTER TABLE profiles DROP COLUMN tipo;

-- 4) Novas colunas do perfil
ALTER TABLE profiles ADD COLUMN status user_status NOT NULL DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN cargo TEXT;
ALTER TABLE profiles ADD COLUMN departamento TEXT;
ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 5) FK do ponto: user_id → profile_id (mantém os registros existentes)
ALTER TABLE time_records RENAME COLUMN user_id TO profile_id;

-- 6) Enum antigo não é mais usado
DROP TYPE user_type;
