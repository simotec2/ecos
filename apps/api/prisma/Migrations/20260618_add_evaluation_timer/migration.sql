ALTER TABLE "Evaluation"
ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER;

ALTER TABLE "EvaluationSession"
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

ALTER TABLE "EvaluationSession"
ADD COLUMN IF NOT EXISTS "timedOutAt" TIMESTAMP(3);

UPDATE "Evaluation"
SET "durationMinutes" =
  CASE
    WHEN "type" = 'PETS' THEN 75
    WHEN "type" = 'ICOM' THEN 45
    WHEN "type" = 'SECURITY' THEN 30
    ELSE 30
  END
WHERE "durationMinutes" IS NULL;