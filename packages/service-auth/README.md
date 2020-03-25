# Auth service

## Run local rabbitmq instance

```
docker run -p 5672:5672 rabbitmq:3
```

## Run local DB instance

```
docker run -p 27017:27017 mongo
```

## Run app in dev mode

Before running the app locally please create local `.env` file, example can be find in `.env.example`

```
yarn workspace @gtms/service-auth dev
```

## Running unit tests

Please make sure that your local mongo instance is not working while running unit tests. In memory mongo instance is being used during tests runs

But you still need your rabbitmq instance!

```
yarn workspace @gtms/service-auth test
```
