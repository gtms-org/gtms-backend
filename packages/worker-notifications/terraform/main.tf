resource "docker_container" "worker-notifications" {
  name  = "worker-notifications-${var.env}"
  image = "${var.DOCKER_REGISTRY}/gtms/workernotifications:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "false"
  }

  labels {
    label = "gtms"
    value = "qa-master"
  }

  env = [
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "DB_NAME=${var.db_name}",
    "VERSION=${var.tag}",
    "SENDGRID_API_KEY=${var.SENDGRID_API_KEY}",
    "ADDRESS_EMAIL=${var.emailAddress}",
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
