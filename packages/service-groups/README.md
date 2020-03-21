# Groups service

## Run local DB instance

```
docker run -d -p 27017:27017 mongo
```

## Run app in dev mode

Before running the app locally please create local `.env` file, example can be find in `.env.example`

```
yarn workspace @gtms/service-groups dev
```

## Running unit tests

Please make sure that your local mongo instance is not working while running unit tests. In memory mongo instance is being used during tests runs

```
yarn workspace @gtms/service-groups test
```
