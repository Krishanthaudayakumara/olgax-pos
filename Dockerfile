FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma
RUN pnpm_config_fetch_retries=5 \
    pnpm_config_fetch_retry_mintimeout=20000 \
    pnpm_config_fetch_retry_maxtimeout=120000 \
    pnpm_config_fetch_timeout=600000 \
    pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
ENV NEXT_STANDALONE=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN ./node_modules/.bin/prisma generate
RUN ./node_modules/.bin/next build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js standalone output (includes all server-side dependencies bundled)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + migrations (needed by the setup wizard at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Install Prisma CLI fresh using npm (NOT copied from pnpm builder).
# We install it in an isolated temporary directory because running npm install 
# directly inside /app would cause npm to destructively resolve or wipe the 
# existing Next.js standalone node_modules.
COPY --from=builder /app/package.json ./package.json
RUN PRISMA_VERSION=$(node -p "const p=require('./package.json'); p.devDependencies?.prisma ?? p.dependencies?.prisma ?? 'latest'") && \
    mkdir -p /tmp/prisma-install && \
    cd /tmp/prisma-install && \
    npm install --no-package-lock --no-save "prisma@${PRISMA_VERSION}" && \
    cp -a node_modules/. /app/node_modules/ && \
    chown -R nextjs:nodejs /app/node_modules && \
    rm -rf /tmp/prisma-install

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
