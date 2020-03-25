# Notification service

The service sends all email notifications, it also exposes endpoints where users can register for web push notifications - and those notifications will be send from here as well

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
yarn workspace @gtms/service-notifications dev
```
