FROM node:25-alpine

WORKDIR /app

RUN npm install --global serve

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["serve", "-s", "dist", "-l", "80"]