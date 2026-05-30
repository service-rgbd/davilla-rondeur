#!/usr/bin/env bash
# Déploie UN worker Cloudflare — ne pas mélanger boutique et portail.
set -euo pipefail

CONFIG="${1:?Usage: wrangler-deploy.sh <config.toml> <label>}"
LABEL="${2:?Usage: wrangler-deploy.sh <config.toml> <label>}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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

echo ""
echo "══════════════════════════════════════════"
echo "  Cloudflare — $LABEL"
echo "  Config : $CONFIG"
echo "  Assets : $ASSETS_DIR"
echo "══════════════════════════════════════════"
echo ""

pnpm exec wrangler deploy --config "$CONFIG"
