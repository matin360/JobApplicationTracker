FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/client/package.json ./apps/client/package.json
COPY apps/server/package.json ./apps/server/package.json

RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev:server"]
