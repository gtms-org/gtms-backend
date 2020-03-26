FROM node:12.16.1-alpine3.10 AS build

ARG GIT_HASH

ENV GIT_HASH ${GIT_HASH}

COPY . /app

WORKDIR /app

RUN yarn

RUN yarn workspace @gtms/service-notifications build

FROM node:12.16.1-alpine3.10

WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/service-notifications/dist .
COPY --from=build /app/packages/service-notifications/config /app/config
COPY --from=build /app/packages/service-notifications/package.json /app/package.json

ENV PORT 80
ENV NODE_ENV "production"

EXPOSE 80

WORKDIR /app

CMD ["node", "index"]
