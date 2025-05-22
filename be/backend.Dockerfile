# Use any Node version you prefer
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate


RUN npm run build


EXPOSE 5000

CMD ["npm", "run", "start"]
