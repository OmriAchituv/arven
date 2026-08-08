-- The walking skeleton's proof of life. Every database that has been migrated
-- carries this row, including the branch created for a pull request preview, so
-- a deployment reading it back has demonstrated the whole path.
INSERT INTO "meta" ("key", "value")
VALUES ('schema_version', '1')
ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value", "updated_at" = now();
