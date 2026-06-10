# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json .
RUN npm install
COPY tsconfig.json .
COPY src/ src/
RUN npm run build

# ── Stage 2: Runtime ────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache sudo

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY public/ public/

# Allow node user to run squid-reload.sh via sudo without password
RUN echo "node ALL=(ALL) NOPASSWD: /usr/local/bin/squid-reload.sh" >> /etc/sudoers

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
