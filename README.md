# Migo

An open-source Discord-like chat platform you can self-host. Text channels, voice chat, DMs, file uploads, custom themes, and more.

**[Download the desktop client](https://github.com/eduardoalba00/migo/releases)**

## Host Your Own Server

You need [Railway](https://railway.app) (or any Docker host) and a free [LiveKit Cloud](https://cloud.livekit.io) account for voice.

### 1. LiveKit Cloud

Sign up at [cloud.livekit.io](https://cloud.livekit.io), create a project, and copy your **URL**, **API Key**, and **API Secret**.

### 2. Railway setup

1. Create a new Railway project
2. Add a **PostgreSQL** service
3. Click **New** → **Docker Image** and enter:
   ```
   ghcr.io/eduardoalba00/migo-server:latest
   ```
4. Add a **Volume** mounted at `/data/uploads`

### 3. Environment variables

Set these on the Docker image service:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Railway PostgreSQL reference variable |
| `JWT_ACCESS_SECRET` | Random string (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Different random string |
| `LIVEKIT_URL` | LiveKit Cloud URL (`wss://your-project.livekit.cloud`) |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `UPLOAD_DIR` | `/data/uploads` |

### 4. Connect

Open Migo → **Add Workspace** → enter your server URL. Optionally add a custom domain under Railway **Networking**.

The `:latest` tag always matches the central server, so your instance stays up to date on every redeploy.

## License

[MIT](LICENSE)
