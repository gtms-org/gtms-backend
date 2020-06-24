FROM node:12.16.3-alpine3.10 AS build

COPY . /app

WORKDIR /app

RUN yarn

RUN yarn workspace @gtms/worker-posts build

FROM node:12.16.3-alpine3.10

WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/worker-posts/dist .
COPY --from=build /app/packages/worker-posts/config /app/config
COPY --from=build /app/packages/worker-posts/package.json /app/package.json

ENV PORT 80
ENV NODE_ENV "production"

EXPOSE 80

WORKDIR /app

CMD ["node", "index"]
