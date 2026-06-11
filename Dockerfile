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

RUN apk add --no-cache bash

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY public/ public/

# Ensure /data directory is writable by node user
RUN mkdir -p /data && chown node:node /data

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
