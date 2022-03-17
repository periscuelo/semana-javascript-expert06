FROM node:17-slim

RUN apt-get update \
 && apt-get install -y sox libsox-fmt-mp3

WORKDIR /data/app/

COPY package*.json ./

RUN npm ci --silent

COPY . .

CMD npm run live-reload
