FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN yarn global add pnpm
RUN pnpm install
# RUN pnpm run db:generate

RUN pnpm run build

FROM node:22-alpine AS final
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/patches ./patches
COPY package.json .
RUN yarn global add pnpm
RUN pnpm install --production
