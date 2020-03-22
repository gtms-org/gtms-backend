FROM node:12-alpine

RUN apk add --no-cache bash

WORKDIR /app

# copy app files
COPY . .

# enable env vars needed during testing
COPY ./packages/service-auth/.env.testing /app/packages/service-auth/.env
COPY ./packages/service-groups/.env.testing /app/packages/service-groups/.env

# install deps
RUN yarn install