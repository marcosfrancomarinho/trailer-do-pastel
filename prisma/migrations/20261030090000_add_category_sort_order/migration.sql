ALTER TABLE "categories" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Preserve existing alphabetical presentation on first deploy.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC, id ASC) AS position
  FROM "categories"
)
UPDATE "categories" AS category
SET "sort_order" = ranked.position
FROM ranked
WHERE category.id = ranked.id;
