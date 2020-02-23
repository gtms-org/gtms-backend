FROM node:11.13.0-alpine

ARG GIT_HASH

ENV GIT_HASH ${GIT_HASH}

COPY . /app

WORKDIR /app

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git && \
  npm i && \
  npm run build-ts

FROM node:11.13.0-alpine

COPY --from=0 /app/dist /app/dist
COPY --from=0 /app/node_modules /app/node_modules
COPY --from=0 /app/config /app/config
COPY --from=0 /app/package.json /app/package.json

ENV PORT 80
ENV NODE_ENV "production"

EXPOSE 80

WORKDIR /app

CMD ["node", "dist"]
