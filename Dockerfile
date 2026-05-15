FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV DATABASE_URL="file:./prisma/dev.db"
ENV NODE_ENV=production

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "node scripts/setup-db.js && npm start"]
