-- Optional additive indexes. Run with psql against the intended database after
-- inspecting pg_indexes / EXPLAIN on staging. Do not wrap in BEGIN/COMMIT:
-- CREATE INDEX CONCURRENTLY must run outside a transaction.
-- Nonunique phone index intentionally preserves historical shared-phone accounts.
SET lock_timeout = '5s';
SET statement_timeout = '10min';
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_phone_idx ON public.users (phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_created_id_idx ON public.users (created_at DESC, id DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_log_ref_created_idx ON public.activity_log (ref_type, ref_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS stored_files_request_created_idx ON public.stored_files (request_id, created_at DESC);
RESET lock_timeout;
RESET statement_timeout;
-- After any interrupted/failed build, inspect validity before retrying:
-- SELECT c.relname, i.indisvalid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
-- WHERE c.relname IN ('users_phone_idx', 'users_created_id_idx',
--   'activity_log_ref_created_idx', 'stored_files_request_created_idx');
-- IF NOT EXISTS does not repair an existing invalid index. Have the DBA repair
-- that named index concurrently before retrying; do not drop unrelated indexes.
