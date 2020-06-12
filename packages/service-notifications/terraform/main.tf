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

  dns = [
    "172.18.0.100"
  ]

  env = [
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "DB_NAME=${var.db_name}",
    "VERSION=${var.tag}",
    "PORT=80",
    "SENDGRID_API_KEY=${var.SENDGRID_API_KEY}",
    "ADDRESS_EMAIL=${var.emailAddress}",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
