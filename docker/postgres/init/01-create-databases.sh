#!/bin/bash
set -e
# Creates _dev and _test databases so knex development/testing configs work.
# POSTGRES_DB is the base name (e.g. authbox_db); we create ${BASE}_dev and ${BASE}_test.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "${POSTGRES_DB}_dev";
    CREATE DATABASE "${POSTGRES_DB}_test";
EOSQL
