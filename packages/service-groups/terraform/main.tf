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

  env = [
    "APP_DOMAIN=${var.app_domain}",
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "DB_NAME=${var.db_name}",
    "VERSION=${var.tag}",
    "PORT=80"
  ]
}