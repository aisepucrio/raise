# Wait for the database
echo "Waiting for database to be ready..."
until nc -z db_raise 5432; do
    echo "Database not ready yet. Retrying in 2 seconds..."
    sleep 2
done
echo "Database is ready."

# Apply migrations
echo "Applying migrations..."
uv run python manage.py makemigrations
uv run python manage.py migrate --no-input
if [ $? -ne 0 ]; then
    echo "Error: Failed to apply migrations."
    exit 1
fi
echo "Migrations applied successfully."

echo "Creating superuser if it does not exist..."
uv run python manage.py createsuperuser --noinput --username "${DJANGO_SUPERUSER_USER}" --email "${DJANGO_SUPERUSER_EMAIL}" || true

echo "Loading initial data..."
uv run python manage.py loaddata seed/all.json
echo "Initial data loaded successfully."

echo "Collecting static files..."
uv run python manage.py collectstatic --no-input
echo "Static files collected successfully."

uv run python manage.py reset_orphaned_tasks

if [ "$IS_DEBUG" = "False" ]; then
    echo "Starting Django server with gunicorn (IS_DEBUG=False)..."
    uv run gunicorn dataminer_api.wsgi:application --bind 0.0.0.0:8000
else
    echo "Starting Django development server (IS_DEBUG=True)..."
    uv run python manage.py runserver 0.0.0.0:8000
fi