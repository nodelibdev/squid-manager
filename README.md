# Squid Manager

A lightweight web UI for managing Squid proxy whitelists (`allowed_domains.txt`, `allowed_ips.txt`) without SSHing into the server.

Built with **NestJS** (backend) and vanilla JS (frontend), packaged as a Docker container.

---

## Prerequisites

- Docker + Docker Compose installed on the host
- Squid running natively on the host (`systemctl`)
- `/etc/squid/allowed_domains.txt` and `/etc/squid/allowed_ips.txt` already referenced in `squid.conf`

### squid.conf (minimum)

```squid
acl whitelist_domains dstdomain "/etc/squid/allowed_domains.txt"
acl whitelist_ips src "/etc/squid/allowed_ips.txt"

http_access allow whitelist_domains
http_access allow whitelist_ips
http_access deny all
```

---

## Host setup (required before running Docker)

### 1. Create Squid reload listener

```bash
mkfifo /tmp/squid-reload-pipe

sudo tee /etc/systemd/system/squid-reload-listener.service << 'EOF'
[Unit]
Description=Squid reload listener

[Service]
ExecStart=/bin/sh -c 'while true; do read line < /tmp/squid-reload-pipe && systemctl reload squid; done'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now squid-reload-listener
```

### 2. Ensure the whitelist files exist

```bash
sudo touch /etc/squid/allowed_domains.txt /etc/squid/allowed_ips.txt
```

---

## Running in production

### 1. Generate an auth token

```bash
openssl rand -hex 32
```

### 2. Configure `docker-compose.yml`

```yaml
environment:
  - AUTH_TOKEN=<your_generated_token>
```

### 3. Start the container

```bash
docker compose up -d --build
```

Access the UI at `http://<server-ip>:3000` — you will be prompted for the token on first load.

> **Note:** Port 3000 is bound to `127.0.0.1` by default. For remote access, place an nginx reverse proxy with HTTPS in front of it.

---

## Local development

### 1. Create mock files

```bash
mkdir -p /tmp/squid-dev
touch /tmp/squid-dev/allowed_domains.txt /tmp/squid-dev/allowed_ips.txt

mkfifo /tmp/squid-reload-pipe-dev
# Run in new Terminal to read pipe
while true; do read line < /tmp/squid-reload-pipe-dev && echo "[mock] squid reloaded"; done
```

### 2. Create `.env`

```dotenv
AUTH_TOKEN=changeme
DOMAIN_FILE=/tmp/squid-dev/allowed_domains.txt
IP_FILE=/tmp/squid-dev/allowed_ips.txt
RELOAD_PIPE=/tmp/squid-reload-pipe-dev
```

### 3. Install and run

```bash
yarn install
yarn start:dev
```

Access at `http://localhost:3000`.

---

## Project structure

```
squid-manager/
├── docker-compose.yml
├── Dockerfile                  # Multi-stage build
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   └── bearer-auth.guard.ts
│   └── whitelist/
│       ├── whitelist.controller.ts
│       ├── whitelist.service.ts
│       └── whitelist.module.ts
└── public/
    └── index.html
```

---

## API

All endpoints require the header:

```
Authorization: Bearer <token>
```

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/domain` | List allowed domains |
| `POST` | `/api/domain` | Add a domain — body: `{ "entry": "example.com" }` |
| `DELETE` | `/api/domain` | Remove a domain — body: `{ "entry": "example.com" }` |
| `GET` | `/api/ip` | List allowed IPs |
| `POST` | `/api/ip` | Add an IP/CIDR — body: `{ "entry": "192.168.1.0/24" }` |
| `DELETE` | `/api/ip` | Remove an IP — body: `{ "entry": "192.168.1.0/24" }` |
| `POST` | `/api/reload` | Reload Squid (`squid -k reconfigure`) |


### Example NGINX config for `APP_PREFIX` deployment

```nginx
server {
    ...
    location = /config.json {
        default_type application/json;
        return 200 '{"prefix":"squid-manager"}';
    }
    location /squid-manager/api {
        proxy_hide_header Cache-Control;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        proxy_pass http://localhost:3000$request_uri;
    }
    location /squid-manager {
        proxy_hide_header Cache-Control;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        proxy_pass http://localhost:3000/;
    }
    ...
}
```