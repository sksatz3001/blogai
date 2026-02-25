CREATE TABLE IF NOT EXISTS "system_prompts" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "prompt" text NOT NULL,
  "updated_at" timestamp DEFAULT now()
);
