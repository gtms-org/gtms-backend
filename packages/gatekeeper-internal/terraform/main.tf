resource "docker_container" "service-gatekeeper-internal" {
  name  = "service-gatekeeper-internal-${var.env}"
  image = "docker-registry.kabala.tech/gtms/gatekeeperinternal:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "false"
  }

  env = [
    "VERSION=${var.tag}",
    "AUTH_SERVICE_URL=service-auth-${var.env}",
    "GROUPS_SERVICE_URL=service-groups-${var.env}",
    "AUTH_SERVICE_KEY=${var.AUTH_SERVICE_KEY}",
    "GROUPS_SERVICE_KEY=${var.GROUPS_SERVICE_KEY}",
    "TAGS_SERVICE_KEY=${var.TAGS_SERVICE_KEY}",
    "TAGS_WORKER_KEY=${var.TAGS_WORKER_KEY}",
    "PORT=80"
  ]
}
