FROM node:20-alpine AS builder
RUN apk add --no-cache openssl tzdata
ENV TZ=America/Argentina/Cordoba
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl tzdata
ENV TZ=America/Argentina/Cordoba
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.seed.json ./tsconfig.seed.json
RUN npx prisma generate

EXPOSE 4000
CMD ["node", "dist/main.js"]
