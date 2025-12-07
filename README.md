
BraFit — Full UI (Docker-ready)

This repo contains a Vite + React client (client/) and an Express server that serves client/dist.
The Dockerfile is Render-safe and will build the client if client/package.json exists.
A fallback client/dist/index.html is included so Render won't error if the build step is skipped.

How to build locally:
1) cd client
2) npm install
3) npm run build
4) cd ..
5) docker build -t brafit-full-ui:latest .
6) docker run -p 3000:3000 brafit-full-ui:latest
7) Open http://localhost:3000

Deploying to Render:
- Push the repo to GitHub.
- Create a Render Web Service (Docker) and point to the repo. Clear build cache & deploy.
