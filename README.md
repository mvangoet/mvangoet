# The Avocado Sphere – Internal Operations MVP

Application web interne bilingue FR/EN pour piloter :

- les stocks et lots d'huile d'avocat
- les clients et fournisseurs
- les commandes
- les devis et factures
- les expéditions
- les utilisateurs et rôles

## Architecture retenue

- **Frontend / Backend** : Next.js 16 (App Router, Server Components, Server Actions)
- **Base de données** : SQLite pour le MVP local
- **ORM** : Prisma
- **Authentification** : Auth.js / NextAuth avec identifiants + rôles
- **UI** : Tailwind CSS
- **PDF** : génération serveur avec `pdf-lib`
- **i18n** : dictionnaires FR/EN maison via routes `/fr` et `/en`

> Hypothèse MVP : SQLite est utilisée pour simplifier le lancement local. Le schéma Prisma reste compatible avec une bascule PostgreSQL ultérieure.

## Fonctionnalités MVP livrées

- authentification par rôle : Admin, Commercial, Logistique, Finance
- tableau de bord avec indicateurs, alertes stock bas et activité récente
- création et consultation des clients / fournisseurs
- création et consultation des lots de stock
- création et consultation des commandes avec lignes et lots associés
- création et consultation des devis / factures
- export PDF des factures
- création et consultation des expéditions
- gestion des utilisateurs par un Admin
- interface bilingue français / anglais
- tests unitaires de base sur la numérotation et les permissions

## Modèle de données

### Entités principales

- `User` : utilisateur interne, email, mot de passe hashé, rôle
- `Partner` : client ou fournisseur
- `StockLot` : lot, dates, quantités, statut, fournisseur
- `Order` + `OrderItem` : commande client et lignes de commande
- `Invoice` : devis ou facture, statut de paiement, montant, devise
- `Shipment` : expédition, tracking, transporteur, ETA, documents
- `ActivityLog` : journal simple des actions clés

### Enumérations

- `UserRole` : `ADMIN`, `COMMERCIAL`, `LOGISTICS`, `FINANCE`
- `PartnerType` : `SUPPLIER`, `CUSTOMER`
- `LotStatus` : `AVAILABLE`, `RESERVED`, `LOW_STOCK`, `EXPIRED`, `SOLD`
- `OrderStatus` : `DRAFT`, `CONFIRMED`, `PREPARING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- `InvoiceType` : `QUOTE`, `INVOICE`
- `PaymentStatus` : `PENDING`, `PARTIAL`, `PAID`, `OVERDUE`
- `ShipmentStatus` : `PLANNED`, `IN_TRANSIT`, `CUSTOMS`, `DELIVERED`, `DELAYED`

Le schéma complet est disponible dans [`prisma/schema.prisma`](./prisma/schema.prisma).

## Structure du projet

```text
prisma/
  schema.prisma
  seed.ts
src/
  app/
    api/
      auth/[...nextauth]/route.ts
      invoices/[id]/pdf/route.ts
    [locale]/
      login/
      (dashboard)/
        partners/
        inventory/
        orders/
        invoices/
        shipments/
        users/
  components/
    app-shell.tsx
    forms.tsx
    language-switcher.tsx
    message-banner.tsx
    status-badge.tsx
  lib/
    actions.ts
    data.ts
    flash.ts
    format.ts
    i18n.ts
    permissions.ts
    prisma.ts
    session.ts
  tests/
    format.test.ts
    permissions.test.ts
```

## Installation

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
```

## Lancement en local

```bash
npm run dev
```

Application disponible sur http://localhost:3000 puis redirection vers `/fr`.

## Variables d'environnement

- `DATABASE_URL` : URL Prisma
- `AUTH_SECRET` : secret Auth.js

## Comptes de démonstration

Mot de passe pour tous les comptes :

```text
Avocado123!
```

Utilisateurs seedés :

- `admin@avocadosphere.local`
- `sales@avocadosphere.local`
- `logistics@avocadosphere.local`
- `finance@avocadosphere.local`

## Scripts utiles

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run db:push
npm run db:seed
```
