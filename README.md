# Migo

An open-source Discord-like chat platform you can self-host.

Text channels, voice chat, DMs, servers, file uploads, custom themes, and more — all in a desktop app you own.

## Features

- **Text channels** with categories, pinned messages, reactions, and search
- **Voice chat** powered by LiveKit
- **Direct messages** between users
- **Servers** with invite links, roles, and member management
- **File uploads** with drag-and-drop support
- **Custom themes** with light/dark mode (OKLCH color system)
- **Multi-workspace** — connect to multiple Migo servers from one client
- **Auto-updates** via electron-updater

## Download

Grab the latest Windows installer from [GitHub Releases](https://github.com/edproton/migo/releases).

## Host Your Own Server

Deploy your own Migo server on [Railway](https://railway.app) with [LiveKit Cloud](https://cloud.livekit.io) for voice:

### 1. Get LiveKit credentials

Sign up at [cloud.livekit.io](https://cloud.livekit.io) and create a project. Copy your **URL**, **API Key**, and **API Secret**.

### 2. Create a Railway project

Go to [railway.app](https://railway.app), create a new project, and add a **PostgreSQL** service.

### 3. Add a Node service

Click **New** → **GitHub Repo** and connect your fork/clone of this repository. Railway auto-detects the pnpm monorepo and builds the server.

### 4. Set environment variables

In the Node service settings, add these variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Reference the Railway PostgreSQL service (click **Add Reference Variable**) |
| `JWT_ACCESS_SECRET` | A random string (e.g. `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | A different random string |
| `LIVEKIT_URL` | Your LiveKit Cloud WebSocket URL (e.g. `wss://your-project.livekit.cloud`) |
| `LIVEKIT_API_KEY` | Your LiveKit API key |
| `LIVEKIT_API_SECRET` | Your LiveKit API secret |
| `UPLOAD_DIR` | `/data/uploads` |

### 5. Add persistent storage

In the Node service, go to **Volumes** and mount a volume at `/data/uploads` so uploaded files survive redeploys.

### 6. (Optional) Custom domain

Under **Networking**, add a custom domain and point your DNS to Railway.

### 7. Deploy

Railway auto-deploys on every push to `main`. Your server is live once the first deploy completes.

### 8. Connect the client

Open Migo → click **Add Workspace** → enter your server URL (e.g. `https://your-domain.com`).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Fastify 5, PostgreSQL, Drizzle ORM |
| Auth | Argon2 + JWT (jose) |
| Voice | LiveKit |
| Frontend | React 19, Electron 40 |
| Styling | Tailwind CSS 4, Radix UI |
| State | Zustand |
| Validation | Zod |

## Project Structure

```
packages/
  shared/    # @migo/shared — Zod schemas, TypeScript types, API route constants
  server/    # @migo/server — Fastify REST API + WebSocket server
  client/    # @migo/client — Electron desktop app (React renderer)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `HOST` | `0.0.0.0` | Server bind address |
| `DATABASE_URL` | `postgres://localhost:5432/migo` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Random (generated) | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Random (generated) | Secret for refresh tokens |
| `ACCESS_TOKEN_EXPIRY` | `15m` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRY` | `7d` | Refresh token lifetime |
| `LIVEKIT_URL` | `ws://localhost:7880` | LiveKit server WebSocket URL |
| `LIVEKIT_PUBLIC_URL` | Same as `LIVEKIT_URL` | LiveKit URL exposed to clients |
| `LIVEKIT_API_KEY` | `devkey` | LiveKit API key |
| `LIVEKIT_API_SECRET` | `secret` | LiveKit API secret |
| `UPLOAD_DIR` | `./uploads` | Directory for file uploads |
| `MAX_FILE_SIZE_MB` | `25` | Maximum upload file size in MB |

## License

[MIT](LICENSE)
