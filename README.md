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

### Backend API security (Railway)

The backend uses **rate limiting** (per IP) and optional **API key** auth:

- **Backend service** – set in the API service env:
  - `API_KEY` – (optional) If set, every request must send header `X-API-Key` with this value; otherwise 401.
  - `RATE_LIMIT_REQUESTS` – max requests per IP per window (default `40`).
  - `RATE_LIMIT_WINDOW_SEC` – window in seconds (default `60`).
  - `BLOCK_WINDOW_SEC` – when limit exceeded, block that IP for this many seconds (default `300`).
- **Frontend service** – set at build time so the app can call the API:
  - `VITE_API_KEY` – same value as backend `API_KEY`; the app sends it as `X-API-Key` on each request.

Use the same strong secret for `API_KEY` and `VITE_API_KEY` so only your frontend (and anyone with the key) can access the API; bots without the key get 401.

## Android app (`mobile_app/`)

Copy `.env.example` → `.env` and fill the keys. Need JDK 17 and the Android SDK.

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:GRADLE_USER_HOME = "$env:USERPROFILE\.gradle"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;" + $env:Path
```

**Emulator** — start AVD `mushroom`, then install:

```powershell
emulator -avd mushroom
cd mobile_app\android
.\gradlew.bat assembleDebug
Copy-Item app\build\outputs\apk\debug\app-debug.apk ..\dist\MushroomRadar-1.0.0.apk -Force
adb install -r ..\dist\MushroomRadar-1.0.0.apk
```

**Phone** — same APK (`dist\MushroomRadar-1.0.0.apk`). Copy it onto the phone and open it, or `adb install -r` with USB debugging.
