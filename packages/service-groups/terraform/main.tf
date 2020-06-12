resource "docker_container" "service-groups" {
  name  = "service-groups-${var.env}"
  image = "docker-registry.kabala.tech/gtms/servicegroups:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "false"
  }

  dns = [
    "172.18.0.100"
  ]

  env = [
    "APP_DOMAIN=${var.app_domain}",
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "DB_NAME=${var.db_name}",
    "VERSION=${var.tag}",
    "APP_KEY=${var.APP_KEY}",
    "PORT=80",
    "INTERNAL_GATEKEEPER=http://service-gatekeeper-internal-${var.env}/v1"
  ]
}
