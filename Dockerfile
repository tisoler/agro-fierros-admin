# Stage 1: Building the code
FROM node:24.22.1-alpine AS builder

WORKDIR /agrofierros-admin

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Stage 2: Run the built code
FROM node:24.22.1-alpine AS runner
WORKDIR /agrofierros-admin

# Set to production
ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /agrofierros-admin/public ./public
COPY --from=builder /agrofierros-admin/package.json ./package.json
COPY --from=builder /agrofierros-admin/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy built assets
COPY --from=builder --chown=nextjs:nodejs /agrofierros-admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /agrofierros-admin/.next/static ./.next/static

# Set user
USER nextjs

# Expose and run - Puerto 3098 en producción
EXPOSE 3098
ENV PORT 3098

CMD ["node", "server.js"]
