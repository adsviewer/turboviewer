FROM node:20-alpine AS base

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=server --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer

ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

RUN apk add --no-cache libc6-compat
RUN apk --no-cache add --virtual .builds-deps build-base python3
RUN apk update
WORKDIR /app
RUN yarn global add pnpm

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

FROM node:lts-alpine AS stripper
WORKDIR /app

COPY --from=installer /app .
RUN yarn global add pnpm
RUN pnpm install --prod --ignore-scripts

FROM base AS runner
WORKDIR /app
RUN yarn global add pnpm

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 serverjs
USER serverjs
COPY --from=stripper /app .

CMD pnpm -C apps/server run start
