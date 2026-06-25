FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts && npx prisma generate

COPY . .

RUN chmod +x node_modules/.bin/* && npx tsc

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node --trace-uncaught dist/index.js"]
