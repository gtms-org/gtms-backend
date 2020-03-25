# gtms-backend

Its a monorepo project for all TS microservices, for details about microservice please read README.md in the package

### Install dependencies

This will install all needed dependencies, globally

```bash
yarn
```

# MONOREPO STRUCTURE
- service-* - working app, microservice
- lib-* - library to use with micoservice, for example logger, or express middlewares
- commons - shared: types, enums, interfaces etc
- client-* - mongodb, queue client, to be used with microservice

# Unit tests

Test coverage at level 80% is mandatory, to run unit tests for a microservice use

```bash
yarn workspace @gtms/service-ADD_NAME_HERE test
```

If you want to run all unit tests, for entire project (all packages) use:

```bash
yarn workspaces run test
```
Please note, that some microservices requires particular setup, like a queue instance in order to run unit tests. Please read README.md file in micoservice folder for details

# Run microservice locally

You can run any microservice locally, on you computer in the watch mode (autoreload) by using this command:

```bash
yarn workspace @gtms/service-ADD_NAME_HERE dev
```
To run service locally you need to setup env variables here, to do that create `.env` file in service folder - you can find there `.env.example` to base on. Read microservice readme for details 

# Build production version

To build prod version of service use:
```bash
yarn workspace @gtms/service-ADD_NAME_HERE build
```

# Run production version
To run prod version of service use:
```bash
yarn workspace @gtms/service-ADD_NAME_HERE start
```
Remember: you have to build it first

