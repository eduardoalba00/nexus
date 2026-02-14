#!/bin/bash
set -euo pipefail

# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Create project directory
mkdir -p /opt/migo
cd /opt/migo

# 3. Download production files from the repo
REPO_URL="https://raw.githubusercontent.com/eduardoalba00/migo/main/deploy"
curl -fsSL "$REPO_URL/docker-compose.yml" -o docker-compose.yml
curl -fsSL "$REPO_URL/Caddyfile" -o Caddyfile
curl -fsSL "$REPO_URL/.env.example" -o .env.example

# 4. Generate .env with random secrets (if not exists)
if [ ! -f .env ]; then
  echo ""
  echo "Enter your LiveKit Cloud credentials:"
  read -rp "  LIVEKIT_URL (e.g. wss://your-project.livekit.cloud): " LIVEKIT_URL
  read -rp "  LIVEKIT_API_KEY: " LIVEKIT_API_KEY
  read -rp "  LIVEKIT_API_SECRET: " LIVEKIT_API_SECRET
  echo ""

  cat > .env <<EOF
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
LIVEKIT_URL=${LIVEKIT_URL}
LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
POSTGRES_USER=migo
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=migo
EOF
  echo "Generated .env with random secrets."
fi

# 5. Start services
docker compose up -d

echo "Migo server is running! Point your domain's A record to this server's IP."
