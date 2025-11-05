# Lucen Server (stubs)

This folder is **not served** by GitHub Pages. Use it to deploy a backend (Render/Railway/Fly).

## Run locally (Docker)
```
docker compose up --build
```
API at `http://localhost:8081`

Endpoints:
- GET /health
- GET /gates

## Connect front-end
On your live Lucen17 page (Gates tab), set `API Base URL` to your deployed API (e.g. `https://your-api.onrender.com`). The badge flips to Online and gates load.
