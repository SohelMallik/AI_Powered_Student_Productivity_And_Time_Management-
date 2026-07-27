#!/usr/bin/env bash
# ============================================================
# AI Student Productivity – ONE COMMAND SETUP & RUN (Linux/Mac)
# chmod +x run.sh && ./run.sh
# ============================================================

set -e
echo ""
echo "========================================================"
echo "  AI Student Productivity - Setup and Launch"
echo "========================================================"
echo ""

# ── Check Python ─────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found. Install Python 3.10+"
  exit 1
fi
echo "[1/5] Python: $(python3 --version)"

# ── Virtual environment ───────────────────────────────────────
if [ ! -d "venv" ]; then
  echo "[2/5] Creating virtual environment..."
  python3 -m venv venv
else
  echo "[2/5] venv exists, skipping."
fi

# ── Activate ──────────────────────────────────────────────────
# shellcheck disable=SC1091
source venv/bin/activate
echo "[3/5] Virtual environment activated."

# ── Install deps ─────────────────────────────────────────────
echo "[4/5] Installing packages..."
pip install -r requirements.txt -q

# ── Migrate ──────────────────────────────────────────────────
echo "[5/5] Running migrations..."
mkdir -p data
python manage.py migrate --run-syncdb

# ── Admin user ───────────────────────────────────────────────
python manage.py shell -c "
from django.contrib.auth import get_user_model
U = get_user_model()
if not U.objects.filter(username='admin').exists():
    U.objects.create_superuser('admin','admin@studyai.local','admin123')
    print('Admin created: admin / admin123')
else:
    print('Admin already exists.')
"

echo ""
echo "========================================================"
echo "  App running at   → http://localhost:8000"
echo "  Admin panel at   → http://localhost:8000/admin"
echo "  Login: admin / admin123"
echo "  Press CTRL+C to stop"
echo "========================================================"
echo ""

python manage.py runserver 8000
