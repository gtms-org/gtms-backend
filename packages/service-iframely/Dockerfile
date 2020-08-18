FROM alpine/git AS build

WORKDIR /app

RUN git clone https://github.com/itteco/iframely.git

COPY ./src/config.local.js /app/iframely/config.local.js
COPY ./src/server.js /app/iframely/server.js
COPY ./src/consul.js /app/iframely/consul.js

FROM node:12-alpine AS runner

WORKDIR /app/

COPY --from=build /app/iframely .

RUN apk add --no-cache git 

RUN npm install && npm install consul && npm install uuid

CMD ["node", "server"]