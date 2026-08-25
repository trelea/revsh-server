# syntax=docker/dockerfile:1

# ---------- Stage 1: full deps (build toolchain) ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ---------- Stage 2: build ----------
FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
# Generate Prisma Client (goes to node_modules/.prisma) then compile
RUN yarn prisma generate \
    && yarn build

# ---------- Stage 3: production-only deps ----------
FROM node:22-alpine AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean
# Restore generated Prisma Client wiped/replaced by the prod install
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# ---------- Stage 4: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Run as unprivileged user
USER node

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
# Schema + migrations for `prisma migrate deploy`
COPY --chown=node:node prisma.config.ts ./
COPY --chown=node:node prisma ./prisma
# Package.json is required by Prisma CLI at runtime
COPY --chown=node:node package.json ./

EXPOSE 3000

# Apply migrations, then start the server (exec keeps node as PID 1 for proper signals)
ENTRYPOINT ["sh", "-c", "npx prisma migrate deploy && exec node dist/src/main.js"]
