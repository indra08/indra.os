#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
#  Deploy Indra's Book to Cloudflare Pages
# ═══════════════════════════════════════════════════════════
#
#  Usage:
#    ./deploy.sh              → deploy to main (production)
#    ./deploy.sh preview      → deploy to preview branch
#    ./deploy.sh main --force → force deploy even if dirty
#
#  Prerequisites:
#    - Cloudflare account + API token with Pages permissions
#    - wrangler installed: npm install -g wrangler
#    - wrangler login (first time only)

PROJECT_NAME="indras-book"
BRANCH="${1:-main}"
FORCE_FLAG="${2:-}"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  Cloudflare Pages Deploy             ║"
echo "╠══════════════════════════════════════╣"
echo "║  Project:  ${PROJECT_NAME}"
echo "║  Branch:   ${BRANCH}"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Build ──────────────────────────────────────────────
echo "[1/3] Building Next.js…"
npm run build

# ── 2. Verify output ──────────────────────────────────────
if [ ! -d "out" ]; then
  echo "ERROR: 'out' directory not found. Build may have failed."
  exit 1
fi

PAGE_COUNT=$(find out -name "*.html" | wc -l | tr -d ' ')
echo "      → ${PAGE_COUNT} HTML pages, $(du -sh out | cut -f1) total"

# ── 3. Deploy ─────────────────────────────────────────────
echo ""
echo "[2/3] Deploying to Cloudflare Pages…"

DEPLOY_ARGS="--project-name=${PROJECT_NAME} --branch=${BRANCH}"
if [ "${FORCE_FLAG}" = "--force" ]; then
  DEPLOY_ARGS="${DEPLOY_ARGS} --commit-dirty=true"
  echo "      (force mode: deploying even with uncommitted changes)"
fi

npx wrangler pages deploy out ${DEPLOY_ARGS}

# ── 4. Done ───────────────────────────────────────────────
echo ""
echo "[3/3] ✓ Deploy complete!"
echo ""
if [ "${BRANCH}" = "main" ]; then
  echo "  Production:  https://${PROJECT_NAME}.pages.dev"
else
  echo "  Preview:     https://${BRANCH}.${PROJECT_NAME}.pages.dev"
fi
echo ""
