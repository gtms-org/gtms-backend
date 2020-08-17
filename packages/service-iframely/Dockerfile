FROM alpine/git AS build

WORKDIR /app

RUN git clone https://github.com/itteco/iframely.git

FROM node:12-alpine AS runner

WORKDIR /app/

COPY --from=build /app/iframely .

RUN apk add --no-cache git 

RUN npm install && npm install consul && npm install uuid

COPY ./src/config.local.js ./config.local.js
COPY ./src/server.js ./server.js
COPY ./src/consul.js ./consul.js

CMD ["node", "server"]