FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY apps/client/package.json ./apps/client/package.json
COPY apps/server/package.json ./apps/server/package.json

RUN npm install

COPY . .

RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

EXPOSE 4000

CMD ["npm", "run", "dev:server"]
