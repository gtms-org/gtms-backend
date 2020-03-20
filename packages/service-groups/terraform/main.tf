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
    "DB_HOST=service-groups-${var.env}-db",
    "VERSION=${var.tag}",
    "PORT=80"
  ]
}

resource "docker_container" "service-groups-db" {
  name  = "service-groups-${var.env}-db"
  image = "mongo:4"
  restart = "always"

  networks_advanced {
      name = "kabala-net"
  }

  volumes {
    host_path      = "${var.mount_point}/${var.env}/service-groups-db"
    container_path = "/data/db"
  }
}
