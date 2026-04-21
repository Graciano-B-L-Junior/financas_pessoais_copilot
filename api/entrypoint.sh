#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Wait for DB to be ready (best-effort)
if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for DB to be ready..."
  until python manage.py showmigrations >/dev/null 2>&1; do
    sleep 1
  done
fi

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files (if configured)..."
python manage.py collectstatic --noinput || true

echo "Starting Gunicorn..."
exec gunicorn api.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-3}
