FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
RUN npm ci
RUN npm install -g prisma
COPY . .
RUN prisma generate
RUN npm run build
EXPOSE 3001
CMD ["sh", "-c", "prisma migrate deploy && node dist/index.js"]