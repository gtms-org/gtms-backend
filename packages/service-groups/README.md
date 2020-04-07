# Groups service

## Run local DB instance

```
docker run -p 27017:27017 mongo
```

## Run local Elastic Search instance

```
docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.6.2
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
