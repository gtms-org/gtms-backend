resource "docker_container" "service-tags" {
  name  = "service-tags-${var.env}"
  image = "docker-registry.kabala.tech/gtms/servicetags:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "false"
  }

  env = [
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "VERSION=${var.tag}",
    "PORT=80",
    "APP_KEY=${var.APP_KEY}",
    "INTERNAL_GATEKEEPER=http://service-gatekeeper-internal-${var.env}/v1"
  ]
}
