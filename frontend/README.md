# MedFlow — client web

Client React/Vite du projet de gestion des patients. Il utilise uniquement la gateway Spring Cloud :

- `POST /auth/login` pour obtenir le JWT ;
- `/api/patients` pour le CRUD des patients.

## Démarrage

```bash
npm install
npm run dev
```

La gateway doit être disponible sur `http://localhost:4004`. En développement, Vite proxy automatiquement `/auth` et `/api` vers cette adresse, ce qui évite un problème CORS. Pour changer l'adresse ou déployer le front sur un domaine séparé, copier `.env.example` vers `.env` puis renseigner `VITE_API_URL`.

Utilisateur de démonstration présent dans le backend : `testuser@test.com` / `password123`.
