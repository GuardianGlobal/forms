#!/bin/bash
set -euo pipefail

# Connect to a maintenance database (e.g. postgres), not test_control.
# Credentials may be supplied in the URL or through standard libpq settings.
if [[ $# -ne 1 || -z "${1:-}" ]]; then
    echo "Usage: $0 CONNECTION_STRING" >&2
    exit 1
fi

psql --no-psqlrc --dbname="$1" --set=ON_ERROR_STOP=1 \
    --command='DROP DATABASE IF EXISTS test_control WITH (FORCE);'

exit 0
