#!/usr/bin/env bash
# ============================================================
#  AI Student Productivity Assistant
#  One-command setup and launch for Linux / macOS
#  Usage:  chmod +x run.sh && ./run.sh
# ============================================================
set -e

echo ""
echo " ╔══════════════════════════════════════════════════╗"
echo " ║   StudyAI — AI Student Productivity Assistant   ║"
echo " ╚══════════════════════════════════════════════════╝"
echo ""

# ── Check Node.js ─────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo " ERROR: Node.js is not installed."
    echo ""
    echo " Install it from: https://nodejs.org  (choose LTS)"
    echo " Or via nvm:  https://github.com/nvm-sh/nvm"
    exit 1
fi

NODE_VER=$(node --version)
echo " [1/4] Node.js found: $NODE_VER"

# ── Install dependencies ──────────────────────────────────
echo " [2/4] Installing npm dependencies..."
npm install --silent
echo "        Done."

# ── Create data directory ─────────────────────────────────
echo " [3/4] Setting up data directory..."
mkdir -p data
echo "        Done."

# ── Copy .env if missing ──────────────────────────────────
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo "        .env created from .env.example"
fi

# ── Seed demo data ────────────────────────────────────────
echo " [4/4] Seeding demo data..."
node scripts/seed.js || echo "        (Seed skipped — continuing)"

echo ""
echo " ╔══════════════════════════════════════════════════╗"
echo " ║   App is starting...                            ║"
echo " ║                                                  ║"
echo " ║   Open in browser:  http://localhost:3000        ║"
echo " ║   Press CTRL+C to stop the server               ║"
echo " ╚══════════════════════════════════════════════════╝"
echo ""

# ── Start server ──────────────────────────────────────────
node server/index.js
