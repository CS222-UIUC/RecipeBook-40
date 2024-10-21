# RecipeBook-40

### Running the application
As of now, RecipeBook only has the development env (we are in development, after all)

All server and frontend/backend setup is done through Docker. If you have docker-desktop, you don't need to install anything new (maybe just run docker desktop to start the docker engine). If you don't have docker desktop but have docker, start the docker daemon to be able to run the system.

#### One-command setup
```bash
$ docker-compose -f ./compose.yml up --build
```

This will start up three components, the frontend react server, backend flask server, and reverse proxy. If you want more granular control over the build and startup process, you can instead run these two commands sequentially (but with the same result)

```bash
$ docker-compose -f ./compose.yml build
$ docker-compose -f ./compose.yml up
```

Running these commands will build the docker image by installing the base images, all dependencies, and then running whatever entrypoint the system has.

### Reverse proxy
The proxy setup points all traffic to `localhost/`, redirecting traffic from `localhost:80/` to `localhost:3000/` and `localhost:80/api/*` to `localhost:443/*`. This has the effect of seamlessly allowing to make calls to `localhost/api` instead of to a separate server.

