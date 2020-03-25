resource "docker_container" "service-notifications" {
  name  = "service-notifications-${var.env}"
  image = "docker-registry.kabala.tech/gtms/servicenotifications:${var.tag}"
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
    "DB_HOST=service-notifications-${var.env}-db",
    "VERSION=${var.tag}",
    "PORT=80",
    "SENDGRID_API_KEY=${var.SENDGRID_API_KEY}",
    "ADDRESS_EMAIL=${var.emailAddress}",
  ]
}

resource "docker_container" "service-notifications-db" {
  name  = "service-notifications-${var.env}-db"
  image = "mongo:4"
  restart = "always"

  networks_advanced {
      name = "kabala-net"
  }

  volumes {
    host_path      = "${var.mount_point}/${var.env}/service-notifications-db"
    container_path = "/data/db"
  }
}
