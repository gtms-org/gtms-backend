FROM node:12-alpine

RUN apk add --no-cache bash

# copy app files
COPY . /app

WORKDIR /app

# enable env vars needed during testing
COPY ./packages/service-auth/.env.testing /app/packages/service-auth/.env
COPY ./packages/service-groups/.env.testing /app/packages/service-groups/.env

# install deps
RUN yarn install
RUN chmod +x /app/scripts/wait-for-it.sh

CMD ["yarn", "workspace", "@gtms/service-auth", "test"]
