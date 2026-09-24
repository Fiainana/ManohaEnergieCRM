# Manoha Énergie CRM

Front Angular 22 — CRM commercial pour Manoha Énergie.

**Powered by [Aikflow](https://github.com/Fiainana)**

## Prérequis

- Node.js 20+
- API backend démarrée (`http://localhost:5063`)

## Démarrage

```bash
npm install
ng serve
```

Ouvrez http://localhost:4200/ → page de connexion.

## Authentification

- Endpoint : `POST /api/auth/login` (`{ login, password }`)
- JWT stocké en localStorage, injecté via interceptor
- Routes protégées par `authGuard`

## Architecture

```
src/app/
  core/           # services, guards, interceptors, models
  features/       # auth, home, (modules métier…)
  layout/         # shell (sidebar + topbar)
environments/     # apiUrl + appName
```

Normes suivies : standalone components, signals, functional guards/interceptors, design system rouge & blanc.
