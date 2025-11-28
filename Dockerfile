FROM node:24-alpine AS build-web

RUN corepack enable pnpm && corepack install -g pnpm@latest-10
RUN apk add --no-cache git

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm server:build

FROM oven/bun:alpine AS build

WORKDIR /app

COPY --from=build-web /app/apps/web/dist ./apps/web/dist
COPY --from=build-web /app/apps/server ./apps/server
COPY --from=build-web /app/packages ./packages
COPY --from=build-web /app/node_modules ./node_modules
COPY --from=build-web /app/package.json ./package.json

WORKDIR /app
RUN cat > apps/server/src/lib/db.ts << 'EOF'
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './prisma/client';

const adapterPg = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter: adapterPg });

export function getPrisma() {
  return prisma;
}
EOF

RUN bun build /app/apps/server/src/index.ts --outdir build --target bun

FROM oven/bun:alpine AS runtime

WORKDIR /app

ENV DIST_PATH=/app/dist

COPY --from=build /app/apps/server/prisma ./prisma

COPY --from=build /app/apps/web/dist ./dist
COPY --from=build /app/build/index.js ./index.js

RUN cat > ./prisma.config.ts << 'EOF'
export default {
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations'
  },
  datasource: {
    url: process.env.DATABASE_URL!
  }
};
EOF

EXPOSE 3000

RUN cat << 'EOF' > start-server.sh
#!/bin/sh
set -e
: "${DATABASE_URL:? Error: DATABASE_URL environment variable is not set.}"

echo -n "DATABASE_URL is set, starting migration..."
bunx prisma migrate deploy

echo -n "Starting the server..."
exec bun ./index.js
EOF

RUN chmod +x start-server.sh

ENTRYPOINT ["./start-server.sh"]