# Davilla Rondeur

Boutique e-commerce de sirops naturels et compléments alimentaires — frontend React, API Express, PostgreSQL.

## Démarrage local

```bash
# 1. Variables d'environnement
cp .env.example env.local   # puis remplir les valeurs

# 2. API (port 8080)
pnpm --filter @workspace/api-server run dev

# 3. Frontend (port 19957)
export PORT=19957 BASE_PATH=/
pnpm --filter @workspace/davilla-rondeur run dev
```

- Boutique : http://localhost:19957/
- Admin : http://localhost:19957/admin/login
- API : http://localhost:8080/api

## Commandes utiles

- `pnpm run typecheck` — vérification TypeScript
- `pnpm run build` — build complet
- `pnpm --filter @workspace/api-spec run codegen` — regénérer hooks API / Zod
- `pnpm --filter @workspace/db run push` — appliquer le schéma DB (dev)
- `pnpm --filter @workspace/db run seed` — données de démo

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend : React 19, Vite 7, Tailwind 4, TanStack Query
- API : Express 5, OpenAPI + Orval, Zod
- DB : PostgreSQL (Neon) + Drizzle ORM
- Paiement : Stripe Checkout
- Images : Cloudflare R2
- Emails : Resend

## Structure

```
artifacts/davilla-rondeur/   # Boutique + admin
artifacts/api-server/        # API REST
lib/db/                      # Schéma Drizzle
lib/api-spec/                # OpenAPI source
env.local                    # Secrets locaux (non commité)
```
