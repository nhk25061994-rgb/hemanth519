# ── Stage 1: install production deps ─────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: final runtime image ─────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Non-root user (security best practice)
RUN addgroup -S nitara && adduser -S nitara -G nitara

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json .

USER nitara
EXPOSE 3000
CMD ["node", "src/server.js"]
