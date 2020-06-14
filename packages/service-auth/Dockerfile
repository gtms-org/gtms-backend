FROM node:12.16.3-alpine3.10 AS build

COPY . /app

WORKDIR /app

RUN yarn

RUN yarn workspace @gtms/service-auth build

FROM node:12.16.3-alpine3.10

WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/service-auth/dist .
COPY --from=build /app/packages/service-auth/config /app/config
COPY --from=build /app/packages/service-auth/package.json /app/package.json

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

ENV PORT 80
ENV NODE_ENV "production"

EXPOSE 80

WORKDIR /app

CMD ["dumb-init", "node", "index"]
