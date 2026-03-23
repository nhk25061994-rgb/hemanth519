# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: test (runs in CI, not shipped) ──────────────────
FROM node:20-alpine AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY test ./test
RUN npm test

# ── Stage 3: runtime ─────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Non-root user
RUN addgroup -S nitara && adduser -S nitara -G nitara

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json .

USER nitara
EXPOSE 8080

CMD ["node", "src/server.js"]
