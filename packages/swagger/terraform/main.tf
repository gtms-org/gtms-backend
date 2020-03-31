resource "docker_container" "swagger" {
  name  = "swagger-${var.env}"
  image = "docker-registry.kabala.tech/gtms/swagger:${var.tag}"
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
    value = "swagger-${var.env}"
  }

  labels {
    label = "traefik.frontend.rule"
    value = "PathPrefixStrip:/docs;Host:${var.app_domain}"
  }

  labels {
    label = "traefik.protocol"
    value = "http"
  }

  labels {
    label = "traefik.port"
    value = "80"
  }

  env = [
    "VERSION=${var.tag}",
    "PORT=80",
  ]
}
