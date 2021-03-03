resource "docker_container" "gatekeeper-public" {
  name  = "gatekeeper-public-${var.env}"
  image = "${var.DOCKER_REGISTRY}/gtms/gatekeeperpublic:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "true"
  }

  labels {
    label = "traefik.http.routers.GTMSPublicAPI-${var.env}.rule"
    value = "Host(`${var.app_domain}`) && PathPrefix(`/api`)"
  }

  labels {
    label = "traefik.http.services.GTMSPublicAPI-${var.env}.loadbalancer.server.port"
    value = "80"
  }

  labels {
    label = "traefik.http.routers.GTMSPublicAPI-${var.env}.middlewares"
    value = "GTMSPublicAPI-${var.env}-stripprefix"
  }

  labels {
    label = "traefik.http.middlewares.GTMSPublicAPI-${var.env}-stripprefix.stripprefix.prefixes"
    value = "/api"
  }

  labels {
    label = "gtms"
    value = "qa-master"
  }

  env = [
    "RUN_ENV=${var.env}",
    "JWT_SECRET=${var.jwt_secret}",
    "VERSION=${var.tag}",
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
