-- Add credits columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credits" real DEFAULT 500;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_credits_used" real DEFAULT 0;

-- Create credit transactions table
CREATE TABLE IF NOT EXISTS "credit_transactions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "amount" real NOT NULL,
  "balance_after" real NOT NULL,
  "type" text NOT NULL,
  "description" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "credit_transactions_user_id_idx" ON "credit_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "credit_transactions_type_idx" ON "credit_transactions"("type");
CREATE INDEX IF NOT EXISTS "credit_transactions_created_at_idx" ON "credit_transactions"("created_at");
