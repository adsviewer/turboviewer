FROM node:20-alpine AS base
RUN apk update
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
# Set working directory
WORKDIR /app
RUN pnpm install turbo --global
COPY . .
RUN turbo prune --scope=server --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer

ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install

# Generate prisma client
COPY ./packages/database/prisma/schema.prisma ./packages/database/prisma/schema.prisma
RUN pnpm --filter=database prebuild

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=server

# Remove node_module and src folders
RUN rm -rf node_modules && pnpm recursive exec -- rm -rf ./node_modules ./src

FROM base AS stripper
WORKDIR /app

COPY --from=installer /app .
RUN pnpm install --prod --ignore-scripts
CMD ["pnpm", "-C", "apps/server", "run", "start"]
