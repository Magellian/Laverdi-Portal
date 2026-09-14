#!/bin/sh
set -e

echo "Waiting for database..."
for i in $(seq 1 30); do
  if npx prisma migrate deploy 2>/dev/null; then
    echo "Migrations complete!"
    break
  fi
  echo "Database not ready, retrying in 2s... ($i/30)"
  sleep 2
done

echo "Starting LaVerdi Portal..."
npm start
