#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

guardian_db_path="${GUARDIAN_DB_PATH:-$PWD/../../guardian-db}"
npm --prefix "$guardian_db_path" run sync:api -- --api "$PWD"
exec npx tsc --noEmit "$@"
