# Build stage
FROM node:20-bullseye AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY tsconfig.seed.json ./
COPY src ./src

RUN npm run build
RUN npx tsc -p tsconfig.seed.json

# Runtime stage
FROM node:20-bullseye-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy generated Prisma client and compiled app
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app/dist /app/dist
COPY --from=build /app/prisma /app/prisma
RUN mkdir -p /app/storage/uploads

EXPOSE 3010

CMD ["node", "dist/index.js", "--service=rest"]
