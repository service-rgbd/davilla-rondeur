#!/usr/bin/env bash
# Déploie UN worker Cloudflare — ne pas mélanger boutique et portail.
set -euo pipefail

CONFIG="${1:?Usage: wrangler-deploy.sh <config.toml> <label>}"
LABEL="${2:?Usage: wrangler-deploy.sh <config.toml> <label>}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
cd "$ROOT"

# Token Workers (≠ clés R2) — env.local à la racine du monorepo
ENV_FILE="$REPO_ROOT/env.local"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use 22 >/dev/null 2>&1 || true
fi

NODE_MAJOR="$(node -p "process.version.slice(1).split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Erreur: Wrangler exige Node.js 22+. Version actuelle: $(node -v)" >&2
  echo "Exécutez: nvm use 22" >&2
  exit 1
fi

if [ ! -f "$CONFIG" ]; then
  echo "Erreur: fichier config introuvable: $CONFIG" >&2
  exit 1
fi

WORKER_NAME="$(grep -E '^name\s*=' "$CONFIG" | head -1 | sed 's/.*=\s*"\?\([^"#]*\)"\?.*/\1/' | tr -d ' "')"
ROUTE_DOMAIN="$(grep -E '^pattern\s*=' "$CONFIG" | head -1 | sed 's/.*=\s*"\?\([^"#]*\)"\?.*/\1/' | tr -d ' "')"

case "$CONFIG" in
  wrangler.toml)
    ASSETS_DIR="./dist/public"
    ;;
  wrangler.portail.toml)
    ASSETS_DIR="./dist/portail/public"
    ;;
  *)
    echo "Erreur: config Wrangler inconnue: $CONFIG" >&2
    exit 1
    ;;
esac

if [ ! -d "$ASSETS_DIR" ] || [ ! -f "$ASSETS_DIR/index.html" ]; then
  echo "Erreur: build manquant dans $ASSETS_DIR — lancez d'abord le build correspondant." >&2
  exit 1
fi

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  if ! pnpm exec wrangler whoami >/dev/null 2>&1; then
    echo "" >&2
    echo "Erreur: non authentifié sur Cloudflare." >&2
    echo "" >&2
    echo "  Option A — connexion OAuth (recommandé) :" >&2
    echo "    nvm use 22 && npx wrangler login" >&2
    echo "" >&2
    echo "  Option B — token API dans env.local (≠ clés R2) :" >&2
    echo "    CLOUDFLARE_API_TOKEN=..." >&2
    echo "    CLOUDFLARE_ACCOUNT_ID=482f6d7406a79ec809079a667674fbdc" >&2
    echo "" >&2
    exit 1
  fi
  echo "Auth Cloudflare : session wrangler (OAuth)"
else
  echo "Auth Cloudflare : CLOUDFLARE_API_TOKEN"
fi

export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-482f6d7406a79ec809079a667674fbdc}"

echo ""
echo "══════════════════════════════════════════"
echo "  Cloudflare — $LABEL"
echo "  Worker   : $WORKER_NAME"
echo "  Domaine  : $ROUTE_DOMAIN"
echo "  Config   : $CONFIG"
echo "  Assets   : $ASSETS_DIR"
echo "══════════════════════════════════════════"
echo ""

pnpm exec wrangler deploy --config "$CONFIG"
