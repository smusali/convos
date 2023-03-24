FROM node:16

WORKDIR /app

COPY package*.json ./
COPY lib/*.ts ./lib/
COPY src/*.ts ./src/
COPY tsconfig.json ./

RUN npm run clean
RUN npm ci --production

EXPOSE 3001

CMD [ "npm", "start" ]
