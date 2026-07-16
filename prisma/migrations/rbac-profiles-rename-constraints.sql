-- Alinha nomes de constraints/índices ao padrão gerado pelo Prisma
-- após o rename users → profiles. Não altera dados.

ALTER TABLE profiles RENAME CONSTRAINT users_pkey TO profiles_pkey;
ALTER INDEX users_email_key RENAME TO profiles_email_key;

ALTER TABLE time_records
  RENAME CONSTRAINT time_records_user_id_fkey TO time_records_profile_id_fkey;
ALTER INDEX time_records_user_id_entrada_idx
  RENAME TO time_records_profile_id_entrada_idx;

-- Índice novo previsto no schema (@@index([role, status]))
CREATE INDEX IF NOT EXISTS profiles_role_status_idx ON profiles (role, status);

-- `updated_at` é gerenciado pelo Prisma (@updatedAt), sem default no banco.
ALTER TABLE profiles ALTER COLUMN updated_at DROP DEFAULT;
