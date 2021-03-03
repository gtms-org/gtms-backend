resource "docker_container" "swagger" {
  name  = "swagger-${var.env}"
  image = "${var.DOCKER_REGISTRY}/gtms/swagger:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "true"
  }

  labels {
    label = "traefik.http.routers.GTMSSwagger-${var.env}.rule"
    value = "Host(`${var.app_domain}`) && PathPrefix(`/docs`)"
  }

  labels {
    label = "traefik.http.services.GTMSSwagger-${var.env}.loadbalancer.server.port"
    value = "80"
  }

  labels {
    label = "gtms"
    value = "qa-master"
  }

  env = [
    "VERSION=${var.tag}",
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
