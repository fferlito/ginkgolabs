# MycoRadar SaaS Platform

This is a code bundle for MycoRadar SaaS Platform. The original project is available at https://www.figma.com/design/n1FdXZUGhj9WaAfN8uz91c/MycoRadar-SaaS-Platform.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Deploy on Railway

This repo is set up for [Railway](https://railway.app):

1. Push this repo to GitHub (if it isn't already).
2. In [Railway](https://railway.app), click **New Project** → **Deploy from GitHub repo** and select this repo.
3. Railway will use `npm run build` then `npm start` (serving the Vite `dist/` folder). No extra config needed.
4. Open the generated URL or attach a custom domain in the service settings.

Build and runtime are configured via `nixpacks.toml` (Node 20).
