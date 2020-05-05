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
    "DB_HOST=mongo-${var.env}-db",
    "VERSION=${var.tag}",
    "PORT=80",
    "SENDGRID_API_KEY=${var.SENDGRID_API_KEY}",
    "ADDRESS_EMAIL=${var.emailAddress}",
  ]
}