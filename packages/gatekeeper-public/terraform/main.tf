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
    label = "traefik.backend"
    value = "gatekeeper-public-${var.env}"
  }

  labels {
    label = "traefik.frontend.rule"
    value = "PathPrefixStrip:/api;Host:${var.app_domain}"
  }

  labels {
    label = "traefik.protocol"
    value = "http"
  }

  labels {
    label = "traefik.port"
    value = "80"
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
