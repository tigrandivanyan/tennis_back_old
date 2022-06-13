# syntax=docker/dockerfile:1

FROM node:14.17.0
RUN npm install --global nodemon
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

CMD [ "npm", "start" ]
