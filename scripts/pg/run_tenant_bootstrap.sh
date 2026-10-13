#!/bin/bash
DB_REPO='/Users/philippiansone21/Dev/Guardian/guardian-db'

if [[ ! -e "$DB_REPO" ]]; then
    echo 'database repository missing'
    exit 1
fi

cd $DB_REPO
node --env-file=.env --import tsx src/runner.ts b --profile tenant --database test_tenant --apply